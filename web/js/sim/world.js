// ---------------------------------------------------------------------------
// Le monde et la boucle mensuelle.
//
// Tout se résout au mois, et le mois dure dix secondes réelles. Rien ne se
// calcule en continu : la production, la consommation, les loyers, les
// salaires, les prix, les dividendes.
//
//   Seconde 0     la production est livrée, les prix recalculés, les comptes
//                 mis à jour
//   Secondes 0-3  fenêtre de priorité des joueurs : stocks au plus haut, prix
//                 au plus bas
//   Secondes 3-10 l'ordinateur consomme progressivement ; les stocks fondent
// ---------------------------------------------------------------------------

import { P, RES, RESSOURCES, BAT, NOURRITURES, materiaux, coutRef,
         niveauVille, prixTerrain } from './params.js';
import { genererCarte, caseAt, estAchetable } from './mapgen.js';
import { Marche } from './market.js';
import { Batiment } from './building.js';
import { Societe, Chantier } from './company.js';
import { piloterVille, piloterSociete } from './ai.js';

export class Monde {
  constructor({ nbVilles = 3, duree = 60, graine = Date.now() } = {}) {
    const carte = genererCarte(nbVilles, graine);
    this.villes = carte.villes;
    this.liaisons = carte.liaisons;
    this.graine = graine;
    this.mois = 0;
    this.duree = duree;                 // 60 mois = 10 ans = 20 minutes
    this.climat = 'normal';             // normal | euphorie | crise
    this.journal = [];

    this.societes = [];
    this.joueur = new Societe('Vous', '#d9a441', true);
    this.societes.push(this.joueur);
    const rivaux = [
      ['Ashcroft & Fils',    '#5b8fd9', 'logement'],
      ['Compagnie Meridian', '#c05a8a', 'produits'],
      ['Consortium Vale',    '#5fae7f', 'planches'],
    ];
    for (const [n, c, penchant] of rivaux) {
      const s = new Societe(n, c);
      s.penchant = penchant;              // son métier de prédilection
      this.societes.push(s);
    }

    this.recomposerMarches();
    this.amorcer();
  }

  get multiple() {
    return this.climat === 'crise' ? P.multipleCrise
         : this.climat === 'euphorie' ? P.multipleEuphorie : P.multipleNormal;
  }

  // --- Marchés --------------------------------------------------------------
  // Dès que deux villes sont reliées par une ligne achevée, elles n'ont plus
  // qu'un seul marché : leurs stocks se confondent et un prix unique s'établit.
  // Les besoins et les productions s'additionnent.

  recomposerMarches() {
    const parent = this.villes.map((_, i) => i);
    const find = (i) => parent[i] === i ? i : (parent[i] = find(parent[i]));
    for (const l of this.liaisons) if (l.achevee) parent[find(l.a)] = find(l.b);

    const groupes = new Map();
    this.villes.forEach((v, i) => {
      const r = find(i);
      if (!groupes.has(r)) groupes.set(r, []);
      groupes.get(r).push(v);
    });

    const anciens = this.marches || [];
    this.marches = [];
    for (const membres of groupes.values()) {
      const m = new Marche(membres);
      // On reprend les stocks et les prix des marchés d'origine : la fusion
      // additionne, elle ne remet pas à zéro.
      const sources = anciens.filter(a => a.villes.some(v => membres.includes(v)));
      if (sources.length) {
        for (const r of RESSOURCES) {
          m.stock[r] = sources.reduce((s, a) => s + a.stock[r], 0);
          m.prix[r] = sources.reduce((s, a) => s + a.prix[r], 0) / sources.length;
        }
      }
      this.marches.push(m);
      for (const v of membres) v.marche = m;
    }
  }

  // Correctif obligatoire du piège de l'amorçage : il faut des planches pour
  // construire une scierie, qui produit les planches. Chaque ville commence
  // donc avec un stock importé, jamais réapprovisionné. Il finance les premiers
  // bâtiments puis se raréfie, ce qui rend très rentable la première scierie et
  // la première briqueterie de chaque ville.
  amorcer() {
    for (const v of this.villes) {
      for (const [r, q] of Object.entries(P.stockAmorcage)) v.marche.stock[r] += q;
      v.niveau = niveauVille(v.menages);
      // Un parc de départ minimal, aux mains des indépendants : sans lui la
      // ville n'a rien à manger le premier mois.
      this.parcDeDepart(v);
    }
  }

  // Le parc de départ n'est pas posé au hasard : il est dimensionné sur les
  // besoins réels de la ville, filière par filière, en remontant depuis la
  // consommation.
  //
  // « La consommation d'un ménage appelle 0,90 case de production. Mais une
  //   ville n'en vit pas : il faut environ 1,45 fois ce chiffre pour fabriquer
  //   en plus les matériaux des chantiers et de l'entretien. Une ville dotée du
  //   strict nécessaire à la consommation ne peut employer que 45 % de ses bras
  //   et s'effondre. » (§20)
  parcDeDepart(v) {
    const M = v.menages;

    // Logement : un peu plus que la population, pour que l'occupation démarre
    // sous 100 % et laisse à la ville la place de croître.
    this.poserJusqua(v, 'maison', M / 0.85, b => b.def.menages);

    // Filière alimentaire : 1 ration par ménage et par mois.
    this.poserJusqua(v, 'minoterie', M, b => b.capacite);
    this.poserJusqua(v, 'ferme', M * 2, b => b.capacite);      // 2 céréales par pain

    // Filière manufacturée, remontée jusqu'aux mines.
    this.poserJusqua(v, 'manufacture', M * 1.08, b => b.capacite);
    const planchesManu = M * 1.08 * 1;                          // 6 planches pour 6 produits
    const acierManu = M * 1.08 / 3;                             // 2 aciers pour 6 produits
    this.poserJusqua(v, 'acierie', acierManu, b => b.capacite);
    this.poserJusqua(v, 'mineCharbon', acierManu * 4, b => b.capacite);
    this.poserJusqua(v, 'mineFer', acierManu * 4, b => b.capacite);

    // Matériaux : ce que réclament les manufactures, plus l'entretien du parc
    // et les chantiers à venir — c'est le facteur 1,45.
    const planches = planchesManu + M * 0.45;
    this.poserJusqua(v, 'scierie', planches, b => b.capacite);
    this.poserJusqua(v, 'coupe', planches * 2, b => b.capacite);
    this.poserJusqua(v, 'briqueterie', M * 0.40, b => b.capacite);
    this.poserJusqua(v, 'carriere', M * 0.80, b => b.capacite);

    // Filière élevage : pour l'instant un doublon de la filière céréalière,
    // pain et viande étant substituables 1 pour 1. Modeste au départ.
    this.poserJusqua(v, 'abattoir', M * 0.12, b => b.capacite);
    this.poserJusqua(v, 'ranch', M * 0.24, b => b.capacite);

    // Les bureaux sont le seul argent qui vienne du dehors : le nombre de
    // départ décide de la trajectoire d'une ville plus sûrement que la qualité
    // de ses terres. Un immeuble pour 78 ménages tient l'emploi à 78 %.
    const bureaux = Math.max(1, Math.round(M / 78) + (v.bonusBureaux || 0));
    for (let k = 0; k < bureaux; k++) {
      const cases = this.trouverEmplacement(v, 'bureaux', null);
      if (cases) this.poser('bureaux', v, cases, null);
    }

    v.occupation = Math.min(1, v.menages / Math.max(1, this.tousBatiments(v)
      .filter(b => b.def.cat === 'loge').reduce((s, b) => s + b.def.menages, 0)));
  }

  // Pose des bâtiments d'un type jusqu'à couvrir la cible. La capacité réelle
  // dépend de la qualité du sol : sur une mauvaise terre il en faut simplement
  // davantage — la ville cherche toujours à couvrir ses besoins, quel que soit
  // le sol. Ce qui change, c'est le prix de revient.
  poserJusqua(v, type, cible, mesure) {
    let total = 0, gardeFou = 0;
    while (total < cible && gardeFou++ < 400) {
      const cases = this.trouverEmplacement(v, type, null);
      if (!cases) break;
      const b = this.poser(type, v, cases, null);
      total += mesure(b);
    }
    return total;
  }

  // --- Foncier --------------------------------------------------------------

  prixCase(ville, c) {
    const base = prixTerrain(ville.niveau, c.distanceGare);
    return c.proprio === 'ind' ? base * P.surprixIndependants : base;
  }

  // Cherche la meilleure emprise libre de la bonne forme. Les exploitations
  // vont là où le sol est bon — une ferme sur une terre de qualité 5 sort une
  // fois et demie ce que sort la même ferme sur une qualité 3 ; le reste se
  // serre autour de la gare, là où le foncier est cher mais la ville dense.
  trouverEmplacement(ville, type, societe) {
    const def = BAT[type];
    const N = ville.N;
    let meilleur = null, meilleurScore = -Infinity;

    for (let y = 0; y + def.h <= N; y++) for (let x = 0; x + def.w <= N; x++) {
      const cases = [];
      let ok = true;
      for (let dy = 0; dy < def.h && ok; dy++) for (let dx = 0; dx < def.w && ok; dx++) {
        const c = caseAt(ville, x + dx, y + dy);
        if (!c || c.voie || c.rue || c.bat || c.chantier) { ok = false; break; }
        // Une société doit posséder toutes les cases de l'emprise ; le parc de
        // l'ordinateur s'installe sur les terres restées aux indépendants.
        if (societe && c.proprio !== societe.id) { ok = false; break; }
        if (!societe && c.proprio && c.proprio !== 'ind') { ok = false; break; }
        cases.push(c);
      }
      if (!ok || cases.length !== def.cases) continue;

      // Le foncier est d'autant plus recherché qu'il est proche de la gare,
      // mais une exploitation préfère toujours la bonne terre.
      let score = -cases[0].distanceGare;
      if (def.qual) {
        const q = cases.reduce((s, c) => s + c.q[def.qual], 0) / cases.length;
        score = q * 40 - cases[0].distanceGare * 0.5;
      }
      if (score > meilleurScore) { meilleurScore = score; meilleur = cases; }
    }
    return meilleur;
  }

  // Pose immédiate (parc de départ et constructions des indépendants).
  poser(type, ville, cases, societe) {
    for (const c of cases) {
      c.vendue = true;
      if (!societe && !c.proprio) c.proprio = 'ind';
      c.prixPaye = this.prixCase(ville, c);
    }
    const b = new Batiment(type, ville, cases, societe);
    for (const c of cases) c.bat = b;
    if (societe) societe.batiments.push(b);
    else (ville.batIndependants ||= []).push(b);
    return b;
  }

  // Ouvre un chantier. Le cash part immédiatement — terrain compris — et le
  // chantier entre au carnet. Il ne sortira de terre que le mois où la dernière
  // brique sera livrée.
  ouvrirChantier(type, ville, cases, societe) {
    const coutTerrain = cases.reduce((s, c) =>
      s + (c.proprio === societe.id ? 0 : this.prixCase(ville, c)), 0);
    if (!societe.peutPayer(coutTerrain)) return null;
    societe.payer(coutTerrain);
    for (const c of cases) {
      c.proprio = societe.id;
      c.vendue = true;
      c.prixPaye = this.prixCase(ville, c);
    }
    const ch = new Chantier(type, ville, cases, societe, coutTerrain);
    ch.ouvertLe = this.mois;
    for (const c of cases) c.chantier = ch;
    societe.chantiers.push(ch);
    return ch;
  }

  acheterTerrain(ville, c, societe) {
    if (!estAchetable(ville, c) && c.proprio !== 'ind') return false;
    const prix = this.prixCase(ville, c);
    if (!societe.peutPayer(prix)) return false;
    societe.payer(prix);
    c.proprio = societe.id;
    c.vendue = true;
    c.prixPaye = prix;
    return true;
  }

  demolir(b) {
    // La société conserve le terrain, ne récupère aucun matériau, et la case
    // est libre le mois suivant. Sans cette règle, une ville couverte de
    // maisons ne pourrait plus jamais se densifier.
    for (const c of b.cases) c.bat = null;
    if (b.societe) b.societe.batiments = b.societe.batiments.filter(x => x !== b);
    else b.ville.batIndependants = b.ville.batIndependants.filter(x => x !== b);
  }

  tousBatiments(ville) {
    const out = ville.batIndependants ? ville.batIndependants.slice() : [];
    for (const s of this.societes) for (const b of s.batiments) if (b.ville === ville) out.push(b);
    return out;
  }

  tousChantiers(ville) {
    const out = [];
    for (const s of this.societes) for (const c of s.chantiers) if (c.ville === ville) out.push(c);
    return out;
  }

  // =========================================================================
  //  LE MOIS
  // =========================================================================

  tick() {
    if (this.mois >= this.duree) return false;
    this.mois++;

    for (const m of this.marches) m.reinitialiser();

    // --- 1. Tout le monde déclare ses besoins ------------------------------
    for (const v of this.villes) {
      const m = v.marche;
      const bats = this.tousBatiments(v);

      for (const b of bats) b.declarer(m);

      // Les ménages. Le budget est contraint : la nourriture et le loyer sont
      // incompressibles, c'est l'achat de produits manufacturés qui encaisse
      // tout le chômage.
      const revenu = P.employesParMenage * v.salaire * v.barometres.emploi;
      const prixNourr = Math.min(m.prix.pain, m.prix.viande);
      const dispo = Math.max(0, revenu - 5);            // hors loyer approximé
      const partNourr = Math.min(1, dispo / Math.max(0.01, prixNourr));
      const reste = Math.max(0, dispo - partNourr * prixNourr);
      const partProd = Math.min(1, reste / Math.max(0.01, m.prix.produits));

      v.demandeNourriture = v.menages * partNourr;
      v.demandeProduits = v.menages * partProd;

      // Pain et viande sont substituables 1 pour 1 : le ménage veut une ration
      // par mois, pas une demi-ration de chaque. Il mange ce qu'il y a, en
      // commençant par le moins cher. Une ville de blé se passe donc d'élevage
      // et une ville d'herbe se passe de blé, sans que ni l'une ni l'autre soit
      // punie pour ce que son sol ne donne pas.
      // La répartition se fait sur ce que chaque filière est CAPABLE de livrer —
      // sa production du mois écoulé plus son stock — et non sur le stock seul.
      // Sur un marché où le pain se consomme en juste-à-temps, le stock est nul
      // en début de mois : répartir là-dessus enverrait toute la demande sur la
      // viande, et la ville mourrait de faim avec du pain sur les étals.
      const moinsCher = m.prix.pain <= m.prix.viande ? 'pain' : 'viande';
      const autre = moinsCher === 'pain' ? 'viande' : 'pain';
      v.repas = {};
      const capaciteA = m.offreAttendue(moinsCher) * (v.menages / totalMenages(m));
      v.repas[moinsCher] = Math.min(v.demandeNourriture, capaciteA);
      v.repas[autre] = v.demandeNourriture - v.repas[moinsCher];
      m.demander(moinsCher, v.repas[moinsCher]);
      m.demander(autre, v.repas[autre]);
      m.demander('produits', v.demandeProduits);

      // Les chantiers. Cette commande n'est pas une intention : c'est une
      // demande réelle sur le marché, au même titre que le pain d'un ménage.
      // C'est ainsi qu'une ville à court de briques finit par se donner une
      // briqueterie.
      for (const ch of this.tousChantiers(v)) {
        for (const [r, q] of Object.entries(ch.restant)) if (q > 0) m.demander(r, q);
      }

      // L'entretien du bâti : une demande permanente de matériaux, qui donne
      // aux scieries et briqueteries leur débouché de régime de croisière.
      for (const b of bats) {
        for (const [r, q] of Object.entries(materiaux(b.type))) {
          m.demander(r, q * P.entretienAnnuel / 12);
        }
      }
    }

    // --- 2. On ouvre le guichet ---------------------------------------------
    // Les prix ne sont PAS recalculés ici : la production du mois doit d'abord
    // être livrée aux marchés (§2, seconde 0). Ils le seront en fin de mois,
    // sur le rapport entre les besoins et les entrées réellement constatés.
    for (const m of this.marches) m.ouvrirGuichet();

    // --- 3. Main-d'œuvre ----------------------------------------------------
    for (const v of this.villes) {
      const bras = v.menages * P.employesParMenage;
      const bats = this.tousBatiments(v);
      let postes = 0;
      for (const b of bats) postes += b.postesDemandes;
      for (const ch of this.tousChantiers(v)) postes += ch.postesDemandes;
      v.postesDemandes = postes;
      v.bras = bras;
      v.partBras = postes > 0 ? Math.min(1, bras / postes) : 1;
    }

    // --- 4. On produit, dans l'ordre de la filière --------------------------
    // Le service se recalcule avant chaque vague : sans quoi une scierie serait
    // rationnée sur un stock de bois qui ne contient pas encore la coupe du
    // mois. À l'intérieur d'une vague, chacun est servi au même prorata.
    const VAGUES = [
      ['coupe', 'carriere', 'mineCharbon', 'mineFer', 'ferme', 'ranch'],
      ['scierie', 'briqueterie', 'minoterie', 'abattoir', 'acierie'],
      ['manufacture'],
    ];

    for (const v of this.villes) v.__bats = this.tousBatiments(v);

    for (let i = 0; i < VAGUES.length; i++) {
      for (const m of this.marches) m.calculerService();
      for (const v of this.villes) {
        for (const b of v.__bats) {
          if (!VAGUES[i].includes(b.type)) continue;
          b.produire(v.marche, v.partBras);
          if (b.societe) b.societe.encaisser(b.resultat);
          else v.epargne += Math.max(0, b.resultat);
        }
      }

      // Après la première transformation, les chantiers et l'entretien se
      // présentent au même guichet que les usines : le chantier compte comme un
      // consommateur d'intrants, temporaire mais réel. Il n'est ni prioritaire,
      // ni sacrifié.
      if (i === 1) {
        for (const m of this.marches) m.calculerService();

        // L'entretien ne se contracte jamais, pas même en sommeil.
        for (const v of this.villes) {
          for (const b of v.__bats) {
            for (const [r, q] of Object.entries(materiaux(b.type))) {
              v.marche.prendre(r, q * P.entretienAnnuel / 12);
            }
          }
        }

        // Entre chantiers, priorité au plus ancien : un chantier ouvert il y a
        // dix mois ne cède jamais sa place à un chantier ouvert hier. C'est ce
        // qui garantit qu'aucun chantier ne reste ouvert pour toujours.
        for (const v of this.villes) {
          const m = v.marche;
          const chs = this.tousChantiers(v).sort((a, b) => a.ouvertLe - b.ouvertLe);
          for (const ch of chs) {
            for (const [r, q] of Object.entries(ch.restant)) {
              if (q <= 0) continue;
              const servi = m.prendre(r, q);
              ch.restant[r] = Math.max(0, q - servi);
              ch.recu[r] = (ch.recu[r] || 0) + servi;
              if (ch.societe) ch.societe.payer(servi * m.prix[r]);
            }
          }
        }
      }
    }

    // --- 5. Loyers, bureaux, entrepôts --------------------------------------
    // Ils ne prennent rien au marché : leur recette est un loyer, pas une
    // marchandise.
    for (const v of this.villes) {
      for (const b of v.__bats) {
        if (b.def.sort) continue;
        b.produire(v.marche, v.partBras);
        if (b.societe) b.societe.encaisser(b.resultat);
        else v.epargne += Math.max(0, b.resultat);
      }
    }

    // --- 6. Les ménages consomment ------------------------------------------
    // En deux passes. D'abord chacun prend sa part au prorata sur chaque
    // nourriture ; ensuite seulement joue la substitution, elle aussi au
    // prorata du reliquat. Servir la substitution hors quota donnerait tout le
    // stock à la première ville servie et affamerait les suivantes — sur un
    // marché fusionné, c'est la mort assurée des villes de la fin de liste.
    for (const m of this.marches) m.calculerService();

    for (const v of this.villes) {
      const m = v.marche;
      v.nourrObtenue = 0;
      for (const r of NOURRITURES) v.nourrObtenue += m.prendre(r, v.repas[r] || 0);
      v.prodObtenue = m.prendre('produits', v.demandeProduits);
    }

    for (const m of this.marches) {
      const manque = m.villes.reduce((s, v) =>
        s + Math.max(0, v.demandeNourriture - v.nourrObtenue), 0);
      const dispo = NOURRITURES.reduce((s, r) => s + m.stock[r], 0);
      m.partSubstitution = manque > 0.001 ? Math.min(1, dispo / manque) : 0;
    }

    for (const v of this.villes) {
      const m = v.marche;
      let reste = Math.max(0, v.demandeNourriture - v.nourrObtenue) * m.partSubstitution;
      for (const r of NOURRITURES) {
        if (reste <= 0.001) break;
        const pris = m.rafler(r, reste);
        v.nourrObtenue += pris;
        reste -= pris;
      }
    }

    for (const v of this.villes) {
      const m = v.marche;
      v.barometres.nourriture = clamp01(v.nourrObtenue / Math.max(1, v.menages));
      v.barometres.produits = clamp01(v.prodObtenue / Math.max(1, v.menages));
      v.barometres.emploi = clamp01(
        Math.min(v.postesDemandes, v.bras) / Math.max(1, v.bras));

      // L'épargne des ménages n'est ni perdue ni thésaurisée : elle bâtit la
      // ville. Une fois son panier et son loyer payés, ce qui reste au ménage
      // est investi sur place.
      const revenu = P.employesParMenage * v.salaire * v.barometres.emploi;
      const depense = v.nourrObtenue / Math.max(1, v.menages)
                        * Math.min(m.prix.pain, m.prix.viande)
                    + v.prodObtenue / Math.max(1, v.menages) * m.prix.produits + 5;
      v.epargne += Math.max(0, revenu - depense) * v.menages;
    }

    // --- 7. Les prix du mois suivant ----------------------------------------
    // Maintenant seulement, sur le rapport entre les besoins réels du mois et ce
    // qui est entré sur le marché. Le stock n'entre pas dans ce calcul : il
    // protège l'approvisionnement, pas le cours.
    for (const m of this.marches) m.fixerPrix();

    // --- 8. Le salaire, variable d'ajustement de la ville -------------------
    for (const v of this.villes) this.ajusterSalaire(v);

    // --- 9. Démographie -----------------------------------------------------
    for (const v of this.villes) this.demographie(v);

    // --- 10. Les chantiers achevés sortent de terre --------------------------
    for (const s of this.societes) {
      const restants = [];
      for (const ch of s.chantiers) {
        if (ch.complet) {
          for (const c of ch.cases) c.chantier = null;
          const b = new Batiment(ch.type, ch.ville, ch.cases, s);
          for (const c of ch.cases) c.bat = b;
          s.batiments.push(b);
          this.journal.push(`${this.mois} · ${s.nom} achève ${BAT[ch.type].nom} à ${ch.ville.nom}`);
        } else restants.push(ch);
      }
      s.chantiers = restants;
    }

    // --- 11. Fermeture des cases mortes -------------------------------------
    // Une case qui reste vide un an ferme. Sans cette porte de sortie, une ville
    // qui a bâti au mauvais endroit reste prisonnière de son parc : elle a
    // atteint son plafond, ne peut plus rien bâtir d'autre, et décline en
    // regardant ses ateliers déserts.
    //
    // La règle ne vaut que pour le parc des indépendants — c'est la ville qui
    // ferme ses propres cases mortes. Le bâtiment d'une société lui appartient :
    // à elle de le mettre en sommeil, de le vendre ou de le démolir. On ne
    // détruit pas le capital d'un joueur à sa place.
    for (const v of this.villes) {
      const morts = (v.batIndependants || []).filter(b =>
        b.moisVide >= P.moisAvantFermeture && b.def.cat !== 'loge');
      if (morts.length) this.demolir(morts[0]);       // une seule par mois
    }

    // --- 12. Le rail ---------------------------------------------------------
    this.avancerRail();

    // --- 13. L'ordinateur et les rivaux bâtissent ---------------------------
    for (const v of this.villes) piloterVille(this, v);
    for (const s of this.societes) if (!s.estJoueur) piloterSociete(this, s);

    // --- 14. Finance --------------------------------------------------------
    for (const s of this.societes) s.enregistrerCours(this.multiple);
    for (const v of this.villes) {
      v.niveau = niveauVille(v.menages);
      v.histo.push({ mois: this.mois, menages: v.menages, salaire: v.salaire,
                     ...v.barometres });
      if (v.histo.length > 400) v.histo.shift();
    }

    return true;
  }

  // Chaque mois le salaire tend vers le plus petit de deux nombres : ce dont le
  // ménage a besoin pour couvrir son panier au prix du jour, et ce que les
  // employeurs peuvent payer sans passer sous leur seuil d'activité. Le
  // rattrapage prend quelques mois, et c'est dans cette fenêtre que les
  // baromètres plongent.
  ajusterSalaire(v) {
    const m = v.marche;
    const panier = Math.min(m.prix.pain, m.prix.viande) + m.prix.produits + 5;
    const besoin = panier / P.employesParMenage;

    let capaciteTotale = 0, cases = 0;
    for (const b of this.tousBatiments(v)) {
      if (!b.def.sort || b.tauxReel <= 0.01) continue;
      let recette = b.production * m.prix[b.def.sort];
      for (const [r, q] of Object.entries(b.recu || {})) recette -= q * m.prix[r];
      recette -= b.entretien;
      capaciteTotale += Math.max(0, recette);
      cases += b.n * b.tauxReel;
    }
    const capacite = cases > 0 ? capaciteTotale / cases : P.salaireCase;

    const cible = Math.max(8, Math.min(besoin, capacite));
    v.salaire += 0.25 * (cible - v.salaire);
  }

  // Hors seuil critique, c'est la moyenne des trois baromètres qui décide.
  // Au-dessus du pivot la ville attire, en dessous elle repousse. La cadence
  // est proportionnelle à l'écart.
  demographie(v) {
    const b = v.barometres;
    const moyenne = (b.nourriture + b.emploi + b.produits) / 3;
    v.moyenne = moyenne;

    let taux;
    const critique = b.nourriture < P.seuilsCritiques.nourriture
                  || b.emploi < P.seuilsCritiques.emploi
                  || b.produits < P.seuilsCritiques.produits;
    if (critique) {
      // Un seul seuil franchi vers le bas suffit à vider la ville, quels que
      // soient les autres.
      taux = -P.exodeCritique;
      v.enCrise = true;
    } else {
      taux = 0.2 * (moyenne - P.pivot);
      taux = Math.max(-P.cadenceMax, Math.min(P.cadenceMax, taux));
      v.enCrise = false;
    }

    // La capacité de logement borne l'afflux : la croissance s'arrête même à
    // 95 % de satisfaction si personne n'a bâti. C'est ce qui pousse à
    // construire.
    const capacite = this.tousBatiments(v)
      .filter(x => x.def.cat === 'loge')
      .reduce((s, x) => s + x.def.menages, 0);

    let nouveau = v.menages * (1 + taux);
    nouveau = Math.max(0, Math.min(nouveau, capacite));
    v.menages = nouveau;
    v.capaciteLogement = capacite;
    // Le taux d'occupation est commun à toute la ville, partagé par tous les
    // propriétaires : ajouter des logements augmente la capacité ; si la
    // population ne suit pas, l'occupation baisse pour tout le monde.
    v.occupation = capacite > 0 ? clamp01(v.menages / capacite) : 0;
  }

  // Le rail est entièrement conduit par l'ordinateur ; le joueur n'y intervient
  // que comme actionnaire. Chaque tranche de capital avance la date d'un mois,
  // dans la limite de 40 % du délai initial : le joueur peut avancer la date,
  // pas la faire disparaître.
  avancerRail() {
    for (const l of this.liaisons) {
      if (l.achevee) continue;
      if (this.mois >= l.date) {
        l.achevee = true;
        l.cotee = true;
        l.actions = Math.max(1000, l.capital);
        this.journal.push(`${this.mois} · ★ Liaison ouverte : ${l.nom} — les marchés fusionnent`);
        this.recomposerMarches();
      }
    }
  }

  investirRail(liaison, societe, montant) {
    if (liaison.achevee || !societe.peutPayer(montant)) return false;
    societe.payer(montant);
    liaison.capital += montant;
    liaison.parts[societe.id] = (liaison.parts[societe.id] || 0) + montant;
    // Une tranche = un mois d'avance, dans la limite de 40 % du délai initial.
    const tranche = 800;
    const avanceMax = Math.floor(liaison.dateInitiale * 0.40);
    const dejaAvance = liaison.dateInitiale - liaison.date;
    const gain = Math.min(Math.floor(montant / tranche), avanceMax - dejaAvance);
    liaison.date = Math.max(this.mois + 1, liaison.date - Math.max(0, gain));
    return true;
  }

  // Fortune finale = argent liquide + actions détenues × cours, le cours retenu
  // étant la moyenne des douze derniers mois.
  classement() {
    return this.societes.map(s => ({
      societe: s,
      fortune: s.coursMoyen() * s.actions * P.partFondateur,
    })).sort((a, b) => b.fortune - a.fortune);
  }
}

function clamp01(x) { return Math.max(0, Math.min(1, isFinite(x) ? x : 0)); }

// Sur un marché fusionné, chaque ville ne peut compter que sur sa part de
// l'offre commune, au prorata de sa population.
function totalMenages(marche) {
  return Math.max(1, marche.villes.reduce((s, v) => s + v.menages, 0));
}
