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
         niveauVille, prixTerrain, qualiteMax, devisGare, QUALITES } from './params.js';
import { genererMonde, estAchetable, rng } from './mapgen.js';
import { Marche } from './market.js';
import { Batiment } from './building.js';
import { Societe, Chantier } from './company.js';
import { piloterVille, piloterSociete } from './ai.js';
import { tirerEvenements, facteurSol, facteurGreve, orientationEpargne,
         salaireExige } from './evenements.js';

export class Monde {
  // duree : nombre de mois, ou null pour une partie sans fin.
  constructor({ nbVilles = 5, duree = null, graine = Date.now() } = {}) {
    const carte = genererMonde(nbVilles, graine);
    this.L = carte.L; this.H = carte.H;
    this.cases = carte.cases;              // une seule grille pour tout le monde
    this.villes = carte.villes;
    this.liaisons = carte.liaisons;      // le réseau PLANIFIÉ, posé une ligne à la fois
    // UNE seule compagnie de chemin de fer, et un seul chantier à la fois.
    //
    // Il y en avait une par liaison, toutes en travaux simultanément dès le
    // premier mois. Quatre introductions en bourse la même année, quatre lignes
    // qui s'ouvraient presque ensemble : le rail n'était pas une aventure qu'on
    // suit, c'était un décor qui se déployait tout seul. Une compagnie unique
    // qui pose ses lignes l'une après l'autre donne au joueur un objet à suivre,
    // à financer et à posséder sur toute la durée de la partie.
    //
    // Elle porte les mêmes champs qu'une liaison d'autrefois — `parts`, `cours`,
    // `actions` — pour que la société et les panneaux la lisent sans rien
    // changer.
    this.compagnie = {
      nom: 'Compagnie Générale des Chemins de Fer',
      capital: 0, actions: 0, parts: {}, cotee: false,
      cours: P.prixNominalAction, introduiteLe: null,
      recette: 0, charges: 0, resultat: 0,
      histoResultat: [], histoCours: [],
      lignes: [],                        // les liaisons achevées
    };
    this.graine = graine;
    this.mois = 0;
    this.duree = duree;                 // null = la partie ne s'arrête jamais
    this.climat = 'normal';             // normal | euphorie | crise
    this.per = P.perReference;          // le multiple de marché, endogène
    this.histoPER = [];
    this.capitauxBourse = 0;            // épargne dirigée vers la bourse ce mois
    this.tensionBourse = 1;
    this.evenements = [];               // ce qui casse la trajectoire
    // Le hasard du déroulement — chronique des événements, choix des filières
    // surconstruites, dispersion des implantations — a sa propre source, tirée
    // de la graine. Tant qu'il restait des Math.random() ici, deux parties de
    // même graine divergeaient : le banc d'essai mesurait alors le bruit et non
    // l'effet qu'on cherchait, ce qui a coûté une demi-journée à comprendre.
    this.hasard = rng((graine ^ 0x5EED9) >>> 0);
    this.journal = [];
    this.offresDuMois = new Map();

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

  caseAt(x, y) {
    if (x < 0 || y < 0 || x >= this.L || y >= this.H) return null;
    return this.cases[y * this.L + x];
  }

  // Le multiple de marché — le PER. Voir `fixerPER`.
  get multiple() { return this.per; }

  // Le PER se forme comme un prix : par une tension entre les capitaux qui
  // cherchent un placement et les bénéfices qu'on peut acheter.
  //
  //   tension = capitaux annuels ÷ bénéfices annuels des sociétés COTÉES
  //
  // Les deux côtés sont bornés aux sociétés cotées : compter des bénéfices qu'on
  // ne peut pas acheter fausserait le rapport.
  //
  // Le cycle en découle sans qu'on ait rien à forcer. L'épargne des ménages est
  // la grandeur la plus volatile du modèle — mesurée entre 0 et 21 % du revenu
  // selon la conjoncture — parce qu'elle est un RÉSIDU : ce qui reste une fois
  // le panier payé. Elle monte donc bien plus vite que les bénéfices en haut de
  // cycle, et s'évapore bien plus vite en bas. Le multiple suit.
  fixerPER() {
    let benefices = 0;
    for (const s of this.societes) if (s.cotee !== false) benefices += Math.max(0, s.profitAnnuel);
    if (this.compagnie.cotee) benefices += Math.max(0, this.beneficeAnnuelRail());
    benefices = Math.max(P.beneficePlancher, benefices);

    const capitaux = this.capitauxBourse * 12;      // le flux du mois, annualisé
    const tension = Math.max(P.tensionMin, Math.min(P.tensionMax, capitaux / benefices));
    const cible = P.perReference * Math.pow(tension, P.exposantPrix);

    this.per += P.lissageBourse * (cible - this.per);
    this.per = Math.max(P.perPlancher, Math.min(P.perPlafond, this.per));

    this.tensionBourse = tension;
    this.beneficesCotes = benefices;
    this.histoPER.push(this.per);
    if (this.histoPER.length > P.histoireDesCours) this.histoPER.shift();
  }

  // --- Fonder une gare ------------------------------------------------------
  //
  // Poser une gare, ce n'est pas poser un bâtiment : c'est fonder une localité.
  // Elle naît avec ses colons, ses matériaux, et deux ans de vivres. Elle a son
  // propre marché, ISOLÉ — c'est tout l'enjeu : ou elle monte sa filière avant
  // que les vivres ne s'épuisent, ou une voie la relie, ou elle s'éteint.
  //
  // Renvoie la ville créée, ou une chaîne expliquant le refus.
  peutFonderGare(x, y) {
    const c = this.caseAt(x, y);
    if (!c) return 'hors carte';
    if (c.ville) return 'déjà dans un territoire';
    if (c.relief === 'montagne') return 'on ne bâtit pas de gare en montagne';
    for (const v of this.villes) {
      const d = Math.hypot(v.gare.x - x, v.gare.y - y);
      if (d < P.distanceMinGare) return `trop près de ${v.nom} (${Math.round(d)} cases)`;
    }
    return null;
  }

  fonderGare(x, y, societe) {
    const refus = this.peutFonderGare(x, y);
    if (refus) return refus;
    const devis = devisGare();
    if (!societe.peutPayer(devis.cout)) return 'trésorerie insuffisante';

    const v = {
      id: this.villes.length, nom: this.nomDeGare(), profil: null,
      temperament: { taille: 1, nom: 'colonie' },
      gare: { x, y }, rayon: P.rayonGare, cases: [],
      menages: P.colonsGare,
      occupation: 0.85, salaire: P.salaireCase, niveau: 1,
      barometres: { nourriture: 1, emploi: 0.78, produits: 1 },
      epargne: 0, marche: null, histo: [], fondee: this.mois,
      // Les vivres de fondation sont datés : la freinte ne les touche pas tant
      // qu'ils durent, sinon les deux ans promis n'en font que dix-huit.
      vivresJusqua: this.mois + P.moisDeVivres,
      // Les mêmes collections que les villes de la génération : sans elles, le
      // pilote de ville tombe au premier mois sur un champ qui n'existe pas.
      batIndependants: [], chantiersInd: [], germes: [],
    };

    // Le territoire. Premier arrivé, premier servi, comme à la génération.
    for (let dy = -P.rayonGare; dy <= P.rayonGare; dy++) {
      for (let dx = -P.rayonGare; dx <= P.rayonGare; dx++) {
        const c = this.caseAt(x + dx, y + dy);
        if (!c || c.ville) continue;
        const d = Math.hypot(dx, dy);
        if (d > P.rayonGare) continue;
        c.ville = v;
        c.distanceGare = Math.round(d);
        // Un hameau n'a pas de plan d'urbanisme : le centre se loge, la
        // couronne travaille, et la terre qui donne quelque chose est agricole.
        c.quartier = d <= 4 ? 'residentiel'
          : (c.q.fertilite >= 1 ? 'agricole' : 'industriel');
        v.cases.push(c);
      }
    }
    if (v.cases.length < 40) return 'pas assez de terrain libre autour';

    this.caseAt(x, y).voie = true;
    societe.payer(devis.cout);
    this.villes.push(v);
    this.recomposerMarches();

    // La cargaison est déposée dans le livre de la ville, pas dans un tas
    // commun : elle lui appartient, et la règle du service local la lui garde.
    const livre = v.marche.livre(v);
    for (const [r, q] of Object.entries(devis.mat)) livre.stock[r] += q;
    for (const [r, q] of Object.entries(devis.vivres)) livre.stock[r] += q;
    v.marche.recomposerStock();

    // LES COLONS ARRIVENT AVEC LEUR TOIT, PAS SEULEMENT AVEC LES PLANCHES.
    //
    // Livrer les matériaux et laisser le hameau se construire ne marche pas :
    // dix ménages sans logement ne s'installent pas, la ville est vide au
    // premier mois, et personne ne bâtit jamais rien parce qu'il n'y a personne.
    // Mesuré : population à zéro au sixième mois, aucun bâtiment, et les vivres
    // qui pourrissent tout seuls. Les maisons font donc partie de la cargaison
    // et sont montées le jour même ; le reste des matériaux dort en réserve pour
    // que les colons ouvrent leurs exploitations eux-mêmes.
    let logees = 0;
    for (let i = 0; i < P.colonsGare; i++) {
      const site = this.trouverEmplacement(v, 'maison', null, 2);
      if (!site) break;
      this.poser('maison', v, site, null);
      logees++;
    }
    for (const [r, q] of Object.entries(materiaux('maison'))) {
      livre.stock[r] = Math.max(0, livre.stock[r] - q * logees);
    }

    // ET AVEC LEUR TRAVAIL. Loger les colons ne suffit pas non plus : sans
    // emploi ils n'ont aucun revenu, donc ils n'achètent pas les vivres qu'on
    // vient pourtant de leur livrer. Mesuré : 6 % d'emploi, nourriture à 0 %
    // avec cent vingt-cinq pains en réserve, et le hameau s'éteint quand même.
    //
    // Les exploitations font donc partie de la cargaison au même titre que les
    // maisons. Elles reviennent à la société fondatrice — c'est le filon qu'elle
    // est venue chercher, et c'est ce qui paie la gare.
    let ouvertes = 0;
    const parRessource = {};
    for (const c of v.cases) for (const n of QUALITES) {
      if (c.q[n] > (parRessource[n] || 0)) parRessource[n] = c.q[n];
    }
    // On ouvre sur ce que le sol donne de mieux, en commençant par le plus riche.
    const ordre = Object.entries(parRessource).sort((a, b) => b[1] - a[1]);
    const TYPE = { fertilite: 'ferme', bois: 'coupe', argile: 'carriere',
                   charbon: 'mineCharbon', minerai: 'mineFer' };
    for (const [ressource, q] of ordre) {
      if (ouvertes >= P.exploitationsFournies || q < 1) break;
      const type = TYPE[ressource];
      while (ouvertes < P.exploitationsFournies) {
        // On cherche l'emplacement sous les règles de la terre libre — la
        // société ne possède encore aucune case de sa colonie — puis on lui
        // attribue le bâtiment. Chercher en son nom ne trouvait jamais rien.
        const site = this.trouverEmplacement(v, type, null, 2);
        if (!site) break;
        this.poser(type, v, site, societe);
        ouvertes++;
        break;   // une seule par ressource au premier tour : on diversifie
      }
    }
    for (const [r, q] of Object.entries(materiaux('coupe'))) {
      livre.stock[r] = Math.max(0, livre.stock[r] - q * ouvertes);
    }
    v.marche.recomposerStock();

    this.journal.push(`${this.mois} · ⚑ ${societe.nom} fonde ${v.nom}`
      + ` — ${logees} logements, ${ouvertes} exploitations,`
      + ` ${P.moisDeVivres} mois de vivres, ${Math.round(devis.cout)} $`);
    return v;
  }

  // Un nom pour la nouvelle gare : on emprunte à la géographie plutôt que de
  // numéroter, sinon la carte se lit comme un inventaire.
  nomDeGare() {
    const tetes = ['Fort', 'Camp', 'Poste', 'Halte', 'Terminus', 'Jonction', 'Relais'];
    const queues = ['du Filon', 'des Cèdres', 'de l\'Aigle', 'du Ravin', 'des Sources',
                    'de la Mesa', 'du Grand Nord', 'des Coyotes', 'de la Faille', 'du Cuivre'];
    for (let essai = 0; essai < 60; essai++) {
      const n = `${tetes[Math.floor(this.hasard() * tetes.length)]} `
        + `${queues[Math.floor(this.hasard() * queues.length)]}`;
      if (!this.villes.some(v => v.nom === n)) return n;
    }
    return `Gare ${this.villes.length + 1}`;
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
        // Le stock suit sa VILLE, pas son marché : à la fusion, chacune arrive
        // avec ses propres réserves. Les additionner en un tas commun aurait
        // dépossédé le producteur de sa récolte au moment même où la ligne
        // s'ouvre — c'est-à-dire à l'instant précis où la priorité locale
        // devrait compter le plus.
        for (const a of sources) {
          for (const [v, l] of a.parVille) {
            if (!membres.includes(v)) continue;
            const dest = m.livre(v);
            for (const r of RESSOURCES) dest.stock[r] += l.stock[r];
          }
        }
        for (const r of RESSOURCES) {
          m.prix[r] = sources.reduce((s, a) => s + a.prix[r], 0) / sources.length;
        }
        m.recomposerStock();
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
      for (const [r, q] of Object.entries(P.stockAmorcage)) {
        v.marche.livre(v).stock[r] += q;
      }
      v.marche.recomposerStock();
      v.niveau = niveauVille(v.menages);
      // Un parc de départ minimal, aux mains des indépendants : sans lui la
      // ville n'a rien à manger le premier mois.
      this.parcDeDepart(v);
    }
    this.calibrerPrixInitiaux();
  }

  // Une partie ne commence pas à l'équilibre parfait. Chaque ville a hérité
  // d'un sol, donc d'un parc et de rendements qui lui sont propres : le blé
  // d'une plaine grasse ne vaut pas celui d'une terre ingrate, et le charbon
  // d'un pays de collines ne vaut pas celui d'une plaine.
  //
  // On établit donc les prix de départ comme le fera la simulation ensuite —
  // sur le rapport entre ce que la ville peut produire et ce qu'elle réclame.
  // Sinon les cinq villes s'ouvrent avec exactement les mêmes cours, et le
  // premier écart n'apparaît qu'après plusieurs années.
  calibrerPrixInitiaux() {
    for (const m of this.marches) {
      const offre = {}, besoin = {};
      for (const r of RESSOURCES) { offre[r] = 0; besoin[r] = 0; }

      for (const v of m.villes) {
        for (const b of this.tousBatiments(v)) {
          if (b.def.sort) offre[b.def.sort] += b.capacite;
          for (const [r, q] of Object.entries(b.def.intrants || {})) besoin[r] += q * b.n;
          // L'entretien du bâti est une demande permanente de matériaux.
          for (const [r, q] of Object.entries(materiaux(b.type))) {
            besoin[r] += q * P.entretienAnnuel / 12;
          }
        }
        // Ce que mangent et achètent les ménages. Pain et viande étant
        // substituables, la ration se répartit au prorata de ce que chaque
        // filière peut livrer — un ménage mange ce qu'il y a.
        v.__ration = v.menages;
        besoin.produits += v.menages;
      }

      const rations = m.villes.reduce((s, v) => s + (v.__ration || 0), 0);
      const nourr = offre.pain + offre.viande;
      for (const r of NOURRITURES) {
        besoin[r] += nourr > 0.001 ? rations * offre[r] / nourr : rations / 2;
      }

      for (const r of RESSOURCES) {
        const ref = RES[r].prix;
        let tension = offre[r] > 0.001 ? besoin[r] / offre[r]
                    : (besoin[r] > 0 ? P.tensionMax : 1);
        tension = Math.max(P.tensionMin, Math.min(P.tensionMax, tension));
        const prix = ref * Math.pow(tension, P.exposantPrix);
        m.prix[r] = Math.max(ref * P.prixPlancher, Math.min(ref * P.prixPlafond, prix));
      }
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
  // Ce qu'une ville sait faire au premier jour. Une ville forestière ouvre avec
  // un excédent de bois et un manque de minerai ; une ville minière l'inverse.
  //
  // « Chaque ville peut donc tout produire un peu, mais aucune ne peut se
  //   suffire à elle-même. C'est ce qui rend le chemin de fer indispensable
  //   plutôt que confortable. » (§5)
  //
  // La filière alimentaire fait exception : le générateur doit garantir
  // qu'aucune ville ne démarre sous son seuil de survie, sinon elle meurt avant
  // que quiconque ait eu le temps de lui poser une voie.
  dotation(v, ressource, plancher = 0) {
    const r = v.__tirage || (v.__tirage = rng(this.graine + v.id * 7919));
    let k;
    if (v.profil.pred === ressource) k = 1.35 + r() * 0.30;
    else if (v.profil.rares.includes(ressource)) k = 0.32 + r() * 0.28;
    else k = 0.82 + r() * 0.26;
    return Math.max(plancher, k);
  }

  // Surconstruire une filière, délibérément.
  //
  // C'est ainsi qu'on fabrique des bâtiments déficitaires — pas en les plantant
  // sur de la caillasse. Trop de scieries pour la demande, et le prix des
  // planches tombe au plancher pendant que le stock s'entasse : les scieries
  // perdent toutes de l'argent à la fois, alors qu'aucune n'est mal placée.
  // C'est une crise de surproduction, et elle se lit sur le marché — le cours
  // s'effondre, la jauge passe au vert vif, le stock enfle — au lieu de rester
  // une propriété cachée du sol que rien n'annonçait.
  //
  // Le joueur y trouve un vrai gisement : une scierie déficitaire dans une ville
  // qui en compte deux fois trop vaut le prix de sa terre, et redevient
  // excellente le jour où le rail la relie à une ville qui manque de planches.
  surconstruire(v, filiere, facteur) {
    const AMONT = {
      planches: ['scierie', 'coupe'],
      briques:  ['briqueterie', 'carriere'],
      pain:     ['minoterie', 'ferme'],
      viande:   ['abattoir', 'ranch'],
      acier:    ['acierie', 'mineCharbon', 'mineFer'],
      produits: ['manufacture'],
    };
    const chaine = AMONT[filiere];
    if (!chaine) return;
    for (const type of chaine) {
      const def = BAT[type];
      // Le surplus se mesure en cases installées : on ajoute de quoi porter la
      // filière à `facteur` fois ce qu'elle produit déjà.
      const enPlace = this.tousBatiments(v).filter(b => b.type === type)
        .reduce((s2, b) => s2 + b.n, 0);
      const aAjouter = Math.round(enPlace * (facteur - 1) / def.cases);
      for (let k = 0; k < aAjouter; k++) {
        const cases = this.trouverEmplacement(v, type, null, P.dispersionDepart);
        if (!cases) break;
        this.poser(type, v, cases, null);
      }
    }
  }

  parcDeDepart(v) {
    const M = v.menages;
    const t = v.temperament
      || { emploi: 1, vivres: 1, produits: 1, bureaux: 1, surcapacite: 0 };

    // On donne d'emblée à la ville le rayon de ce qu'elle va devenir.
    //
    // Le rayon utile se calcule sur la population, et la population n'est fixée
    // qu'À LA FIN — une fois les postes comptés. Le parc de départ se serait donc
    // bâti dans le rayon d'un hameau : la surcapacité voulue ne trouvait pas un
    // pouce de terre libre et ne se posait tout simplement pas. On amorce donc
    // le rayon sur ce que la ville va peser, surcapacité comprise.
    v.rayonAtteint = Math.max(6, Math.min(v.rayon * 1.15,
      Math.sqrt(Math.max(40, M * P.casesParMenage * P.margeFondation) / Math.PI)
        * P.aisanceUrbaine));
    const dBois = this.dotation(v, 'bois');
    const dArgile = this.dotation(v, 'argile');
    const dCharbon = this.dotation(v, 'charbon');
    const dFer = this.dotation(v, 'minerai');
    const dTerre = this.dotation(v, 'fertilite', 0.90);   // on ne laisse pas une ville affamée

    // Filière alimentaire : 1 ration par ménage et par mois — pondérée par le
    // tempérament. Un comptoir affamé ouvre à 70 % de couverture, et devra
    // acheter son pain au dehors ou bâtir vite.
    this.poserJusqua(v, 'minoterie', M * dTerre * t.vivres, b => b.capacite);
    this.poserJusqua(v, 'ferme', M * 2 * dTerre * t.vivres, b => b.capacite);

    // Filière manufacturée, remontée jusqu'aux mines.
    const manu = M * 1.08 * t.produits;
    this.poserJusqua(v, 'manufacture', manu, b => b.capacite);
    const planchesManu = manu;                                  // 6 planches pour 6 produits
    const acierManu = manu / 3;                                 // 2 aciers pour 6 produits
    this.poserJusqua(v, 'acierie', acierManu * Math.min(dCharbon, dFer), b => b.capacite);
    this.poserJusqua(v, 'mineCharbon', acierManu * 4 * dCharbon, b => b.capacite);
    this.poserJusqua(v, 'mineFer', acierManu * 4 * dFer, b => b.capacite);

    // Matériaux : ce que réclament les manufactures, plus l'entretien du parc
    // et les chantiers à venir — c'est le facteur 1,45.
    const planches = planchesManu + M * 0.45;
    this.poserJusqua(v, 'scierie', planches * dBois * t.emploi, b => b.capacite);
    this.poserJusqua(v, 'coupe', planches * 2 * dBois * t.emploi, b => b.capacite);
    this.poserJusqua(v, 'briqueterie', M * 0.40 * dArgile * t.emploi, b => b.capacite);
    this.poserJusqua(v, 'carriere', M * 0.80 * dArgile * t.emploi, b => b.capacite);

    // Filière élevage : pour l'instant un doublon de la filière céréalière,
    // pain et viande étant substituables 1 pour 1. Modeste au départ.
    this.poserJusqua(v, 'abattoir', M * 0.12 * dTerre, b => b.capacite);
    this.poserJusqua(v, 'ranch', M * 0.24 * dTerre, b => b.capacite);

    // Les bureaux sont le seul argent qui vienne du dehors : le nombre de
    // départ décide de la trajectoire d'une ville plus sûrement que la qualité
    // de ses terres. Un immeuble pour 78 ménages tient l'emploi à 78 %.
    const bureaux = Math.max(t.bureaux >= 1 ? 1 : 0,
      Math.round(M / P.menagesParBureaux * t.bureaux) + (v.bonusBureaux || 0));
    for (let k = 0; k < bureaux; k++) {
      const cases = this.trouverEmplacement(v, 'bureaux', null, P.dispersionDepart);
      if (cases) this.poser('bureaux', v, cases, null);
    }

    // L'EMPLOI, en dernier et directement.
    //
    // Le tempérament ne peut pas se contenter de pondérer les filières : le taux
    // d'emploi est un rapport entre les postes installés et les bras, et le
    // moduler indirectement donnait cinq villes à 69-79 %, c'est-à-dire cinq
    // villes identiques. On compte donc les postes une fois le parc posé, et on
    // ajuste jusqu'à la cible. Une friche industrielle ouvre à 58 % — un tiers
    // de chômeurs dès la première seconde — une cité ouvrière au plein emploi.
    // La ou les filières surconstruites, avant le recensement des postes : leurs
    // ateliers travailleront — ils demandent donc des bras — mais à un prix
    // effondré, donc à perte. C'est la crise de surproduction, et c'est ce qui
    // met sur le marché les affaires que le joueur viendra ramasser.
    const FILIERES = ['planches', 'briques', 'pain', 'viande', 'acier', 'produits'];
    const combien = t.surcapacite >= 0.30 ? 2 : t.surcapacite >= 0.12 ? 1 : 0;
    const tirees = [];
    for (let k = 0; k < combien; k++) {
      const libres = FILIERES.filter(f => !tirees.includes(f));
      const f = libres[Math.floor(this.hasard() * libres.length)];
      tirees.push(f);
      this.surconstruire(v, f, 1 + t.surcapacite * P.ampleurSurcapacite);
    }
    v.filieresEngorgees = tirees;

    // LE CHÔMAGE, en dernier — et par la population, jamais par la démolition.
    //
    // La première version ajustait les POSTES à la cible : elle rasait des
    // exploitations jusqu'à ce que l'emploi tombe où il fallait. C'était une
    // catastrophe silencieuse — une ville de rentiers se retrouvait avec vingt
    // bâtiments productifs, donc sans filière, donc tout en déficit, et passait
    // de 49 à 2 ménages en cinq ans. On ne fabrique pas du chômage en détruisant
    // l'économie.
    //
    // On fait l'inverse : le parc est ce qu'il est, et c'est le nombre de
    // ménages qu'on ajuste. Une ville qui a attiré plus de monde que son
    // industrie n'en peut employer, voilà ce qu'est une ville au chômage — et
    // c'est exactement l'Amérique de 1900.
    const postes = this.tousBatiments(v).reduce((s, b) => s + b.postesDemandes, 0);
    v.menages = Math.max(12, Math.round(postes / (P.employesParMenage * t.emploi)));

    // Le logement vient donc en dernier, une fois la population connue. Un peu
    // plus que la population : l'occupation démarre sous 100 % et la ville a la
    // place de croître.
    this.poserJusqua(v, 'maison', v.menages / 0.85, b => b.def.menages);

    v.occupation = Math.min(1, v.menages / Math.max(1, this.tousBatiments(v)
      .filter(b => b.def.cat === 'loge').reduce((s, b) => s + b.def.menages, 0)));
  }

  // Pose des bâtiments d'un type jusqu'à couvrir la cible. La capacité réelle
  // dépend de la qualité du sol : sur une mauvaise terre il en faut simplement
  // davantage — la ville cherche toujours à couvrir ses besoins, quel que soit
  // le sol. Ce qui change, c'est le prix de revient.
  poserJusqua(v, type, cible, mesure, dispersion = P.dispersionDepart) {
    let total = 0, gardeFou = 0;
    while (total < cible && gardeFou++ < 400) {
      const cases = this.trouverEmplacement(v, type, null, dispersion);
      if (!cases) break;
      const b = this.poser(type, v, cases, null);
      total += mesure(b);
    }
    return total;
  }

  // --- Foncier --------------------------------------------------------------

  prixCase(ville, c) {
    const base = prixTerrain((c.ville || ville).niveau, c.distanceGare, qualiteMax(c));
    return c.proprio === 'ind' ? base * P.surprixIndependants : base;
  }

  // Où va quel bâtiment. Les quartiers ne sont pas décoratifs : ils empêchent
  // les ateliers de cerner les maisons, et donnent à chaque ville un plan qui
  // lui est propre.
  static VOCATION_PREFEREE = {
    loge: 'residentiel', bur: 'residentiel', neg: 'negoce',
    trans: 'industriel', manu: 'industriel', expl: 'agricole',
  };

  // Cherche la meilleure emprise libre de la bonne forme. Les exploitations
  // vont là où le sol est bon — une ferme sur une terre de qualité 5 sort une
  // fois et demie ce que sort la même ferme sur une qualité 3 ; le logement se
  // serre autour de la gare, là où le foncier est cher mais la ville dense.
  // `dispersion` : au lieu de toujours prendre le meilleur emplacement, on tire
  // au sort parmi ceux qui s'en approchent à ce nombre de points près.
  //
  // Sans elle, chaque bâtiment va exactement à l'optimum, et comme l'optimum
  // récompense la proximité de la gare, la ville sort de terre en pâté compact
  // et concentrique, sans un pouce de vide. Avec elle, il reste des trous — des
  // terrains libres au milieu de l'habitation, que le joueur peut acheter et où
  // la ville densifiera plus tard. C'est aussi ce qui donne à deux parties la
  // même carte des plans de ville différents.
  // Le rayon UTILE d'une ville : celui qu'elle occupe réellement, et non celui
  // qu'elle revendique.
  //
  // Le territoire est taillé pour une Métropole — quatre mille cases. Y lâcher
  // un comptoir de cinquante ménages donnait une confiture : des fermes à trente
  // cases de la gare dès le premier mois, un cœur rempli à 17 %, et rien qui
  // ressemble à une ville. Une agglomération naissante est DENSE et petite ;
  // elle s'étale en grandissant, elle ne naît pas étalée.
  //
  // Compter environ trois cases par ménage — le logement, plus les postes qui le
  // font vivre — et prendre le rayon du disque correspondant, avec de la marge.
  // Il ne RÉTRÉCIT jamais. Une ville qui perd des habitants verrait sinon son
  // rayon se resserrer sur un tissu déjà bâti, ne trouverait plus où bâtir, et
  // s'enfoncerait — mesuré : une ville passait de 58 à 34 ménages avec son
  // rayon utile rempli à 97 %, incapable d'ouvrir le moindre atelier. Une ville
  // qui décline garde ses rues ; elle les laisse se vider.
  rayonUtile(ville) {
    const besoin = Math.max(40, ville.menages * P.casesParMenage);
    const r = Math.sqrt(besoin / Math.PI) * P.aisanceUrbaine;
    const borne = Math.max(6, Math.min(ville.rayon * 1.15, r));
    ville.rayonAtteint = Math.max(ville.rayonAtteint || 0, borne);
    return ville.rayonAtteint;
  }

  trouverEmplacement(ville, type, societe, dispersion = 0) {
    const def = BAT[type];
    const voulu = Monde.VOCATION_PREFEREE[def.cat];
    let meilleur = null, meilleurScore = -Infinity;
    const proches = [];        // les emplacements à `dispersion` points du meilleur

    // Une exploitation suit la ressource et a donc le droit de s'éloigner ;
    // le reste tient dans l'agglomération.
    const portee = this.rayonUtile(ville) * (def.cat === 'expl' ? P.porteeExploitations : 1);
    let secours = null, secoursScore = -Infinity;

    for (const depart of ville.cases) {
      const cases = [];
      let ok = true;
      for (let dy = 0; dy < def.h && ok; dy++) for (let dx = 0; dx < def.w && ok; dx++) {
        const c = this.caseAt(depart.x + dx, depart.y + dy);
        if (!c || c.ville !== ville || c.voie || c.bat || c.chantier) { ok = false; break; }
        // Une société doit posséder toutes les cases de l'emprise ; le parc de
        // l'ordinateur s'installe sur les terres restées aux indépendants.
        if (societe && c.proprio !== societe.id) { ok = false; break; }
        if (!societe && c.proprio && c.proprio !== 'ind') { ok = false; break; }
        cases.push(c);
      }
      if (!ok || cases.length !== def.cases) continue;

      let score = 0;

      // Le quartier d'abord. On n'interdit rien — une ville doit toujours
      // pouvoir bâtir quelque part — mais on décourage franchement.
      const q = cases[0].quartier;
      if (q === voulu) score += 90;
      else if (voulu === 'residentiel' && q === 'negoce') score += 30;
      else if (voulu === 'industriel' && q === 'negoce') score += 30;
      else if (voulu === 'agricole' && q === 'industriel') score += 25;
      // Une usine dans un quartier d'habitation est le seul cas vraiment banni.
      else if (q === 'residentiel' && (def.cat === 'trans' || def.cat === 'manu')) score -= 70;

      if (def.qual) {
        // Une exploitation suit la ressource : c'est la seule chose qui compte.
        // Et une case stérile est INTERDITE, pas seulement découragée : il n'y a
        // rien dessous. Une exploitation à cheval sur une case à zéro produirait
        // déjà moitié moins pour le même capital et les mêmes salaires.
        const moy = cases.reduce((s, c) => s + c.q[def.qual], 0) / cases.length;
        if (cases.some(c => c.q[def.qual] < 1)) continue;
        score += moy * 45 - cases[0].distanceGare * 0.4;
      } else {
        // Le reste se rapproche de la gare, où la ville est dense.
        score += -cases[0].distanceGare * 1.4;
      }

      // Hors de portée : on le garde en secours, au cas où rien ne tiendrait
      // dedans — une ville ne doit jamais se retrouver incapable de bâtir.
      if (cases[0].distanceGare > portee) {
        if (score > secoursScore) { secoursScore = score; secours = cases; }
        continue;
      }

      if (score > meilleurScore) { meilleurScore = score; meilleur = cases; }
      if (dispersion > 0) {
        proches.push({ cases, score });
        // On borne la liste : sur quatre mille cases, tout garder coûterait
        // plus cher que le reste de la génération réunie.
        if (proches.length > 400) {
          proches.sort((a, b) => b.score - a.score);
          proches.length = 120;
        }
      }
    }
    if (dispersion > 0 && proches.length) {
      const bons = proches.filter(x => x.score >= meilleurScore - dispersion);
      if (bons.length) return bons[Math.floor(this.hasard() * bons.length)].cases;
    }
    return meilleur || secours;
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
    if (!estAchetable(this, c) && c.proprio !== 'ind') return false;
    const prix = this.prixCase(ville, c);
    if (!societe.peutPayer(prix)) return false;
    societe.payer(prix);
    c.proprio = societe.id;
    c.vendue = true;
    c.prixPaye = prix;
    return true;
  }

  // --- Acquérir le bien d'autrui -------------------------------------------

  // Un propriétaire indépendant vend à qui le demande, au prix du marché majoré
  // de 20 %, sans limite de fréquence. C'est le raccourci payant : on n'attend
  // pas d'avoir bâti, on rachète — plus cher.
  // Le prix d'un bâtiment tenu par un indépendant — et, au centime près, celui
  // qu'on en tire quand on le revend.
  //
  //   prix = terrain au cours du jour + 3 années de profit
  //
  // Le profit est celui des douze derniers mois réellement écoulés : on n'achète
  // pas une promesse, on achète un compte d'exploitation. Trois ans, c'est le
  // délai qu'un acheteur accepte de payer d'avance — au-delà il préfère bâtir.
  //
  // Le sol vaut toujours ce qu'il vaut : c'est le PLANCHER, et il est absolu.
  //
  // Une décote sous la valeur du terrain ouvrait une machine à billets, et le
  // joueur l'a vue avant moi : on rachetait une ferme déficitaire 507 $ alors
  // que ses 725 $ de terrain restaient intacts, on la démolissait — la démolition
  // conserve le sol — et l'on revendait le terrain 725 $. Deux cent dix-huit
  // dollars sortis de nulle part, à répéter autant de fois qu'il y avait
  // d'affaires en difficulté sur la carte.
  //
  // Le raisonnement était faux à la racine : une exploitation déficitaire ne
  // rend pas son terrain moins précieux. Elle ne vaut simplement RIEN de plus
  // que lui. Les trois années de profit ne s'ajoutent donc que lorsqu'elles sont
  // positives — et une affaire ruinée se paie au prix de sa terre, ni plus, ni
  // moins. L'intérêt de la ramasser reste entier : on prend le bâtiment pour
  // rien, à charge de le redresser.
  prixRachatIndependant(b) { return b.valeurDeCession; }

  // Le même prix, vu du vendeur. C'est délibérément la même formule : un marché
  // où l'on achèterait cher pour revendre bon marché ne serait pas un marché,
  // ce serait une taxe.
  prixDeCession(b) { return this.prixRachatIndependant(b); }

  // Vendre un bâtiment. Il repasse aux indépendants — quelqu'un le reprend
  // toujours, au prix que dit le compte d'exploitation — et les cases avec lui.
  vendreBatiment(b, societe) {
    if (b.societe !== societe) return false;
    const prix = this.prixDeCession(b);
    societe.encaisser(prix);
    societe.batiments = societe.batiments.filter(x => x !== b);
    b.societe = null;
    b.versEntrepot = false;
    (b.ville.batIndependants ||= []).push(b);
    for (const c of b.cases) c.proprio = 'ind';
    this.journal.push(`${this.mois} · ${societe.nom} cède ${BAT[b.type].nom} à ${b.ville.nom} — ${Math.round(prix)} $`);
    return true;
  }

  // Vendre une case nue. On la reprend au prix du marché, sans la majoration de
  // 20 % : ce surprix est ce qu'un indépendant fait payer pour vendre hors de
  // son tour, et l'on ne se le verse pas à soi-même.
  prixCessionTerrain(ville, c) {
    return prixTerrain((c.ville || ville).niveau, c.distanceGare, qualiteMax(c));
  }

  vendreTerrain(ville, c, societe) {
    if (c.proprio !== societe.id || c.bat || c.chantier) return false;
    const prix = this.prixCessionTerrain(ville, c);
    societe.encaisser(prix);
    c.proprio = 'ind';
    c.prixPaye = prix;
    return true;
  }

  acheterBatiment(b, societe) {
    if (b.societe) return false;                       // pas à un indépendant
    const prix = this.prixRachatIndependant(b);
    if (!societe.peutPayer(prix)) return false;
    societe.payer(prix);
    b.ville.batIndependants = b.ville.batIndependants.filter(x => x !== b);
    b.societe = societe;
    societe.batiments.push(b);
    for (const c of b.cases) { c.proprio = societe.id; c.vendue = true; }
    this.journal.push(`${this.mois} · ${societe.nom} rachète ${BAT[b.type].nom} à ${b.ville.nom}`);
    return true;
  }

  // Une offre sur le bien d'un rival. « Il n'y a rien à négocier, il n'y a
  // qu'un curseur et une réponse en un clic. »
  //
  //   bâtiment rentable   → un multiple de 5 à 15 du profit des 12 derniers mois
  //   bâtiment déficitaire → de 80 % à 120 % du plancher, terrain et matériaux
  //
  // Une seule offre par mois et par adversaire : cela interdit le harcèlement
  // et, surtout, cela force à choisir. Vous ne pouvez pas rafler tout ce qui
  // vous intéresse chez un rival — vous devez désigner ce qui compte vraiment.
  offrePossible(b, societe) {
    if (!b.societe || b.societe === societe) return false;
    const faites = this.offresDuMois.get(societe.id);
    return !faites || !faites.has(b.societe.id);
  }

  prixOffre(b, curseur) {
    const profit = b.profitAnnuel;
    if (profit > 0) return profit * curseur;           // curseur de 5 à 15
    // Sur un bâtiment qui ne gagne rien, l'offre porte sur le plancher.
    const plancher = b.terrainCourant + b.valeurBatie;
    return plancher * (0.8 + (curseur - 5) / 10 * 0.4);
  }

  faireOffre(b, societe, curseur) {
    if (!this.offrePossible(b, societe)) return { fait: false, motif: 'déjà une offre ce mois' };
    const prix = this.prixOffre(b, curseur);
    if (!societe.peutPayer(prix)) return { fait: false, motif: 'trésorerie insuffisante' };

    if (!this.offresDuMois.has(societe.id)) this.offresDuMois.set(societe.id, new Set());
    this.offresDuMois.get(societe.id).add(b.societe.id);

    // La cible refuse librement, donc une offre sous le marché n'est jamais
    // acceptée — sauf par quelqu'un qui a besoin d'argent. Le système devient
    // ainsi un mécanisme de prédation contre les sociétés en difficulté.
    const cible = b.societe;
    const valeur = b.valeurDeCession;
    const auxAbois = cible.tresorerie < 800 || cible.faillite;
    const seuil = auxAbois ? valeur * 0.85 : valeur * 1.08;

    if (prix < seuil) return { fait: true, accepte: false, prix, motif: 'offre refusée' };

    societe.payer(prix);
    cible.encaisser(prix);
    cible.batiments = cible.batiments.filter(x => x !== b);
    b.societe = societe;
    societe.batiments.push(b);
    for (const c of b.cases) c.proprio = societe.id;
    this.journal.push(`${this.mois} · ${societe.nom} rachète ${BAT[b.type].nom} `
      + `à ${cible.nom} pour ${Math.round(prix)} $`);
    return { fait: true, accepte: true, prix };
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
    if (this.duree && this.mois >= this.duree) return false;
    this.mois++;
    this.offresDuMois.clear();   // une offre par mois et par adversaire
    tirerEvenements(this, this.hasard);   // sécheresse, grève, krach…
    this.capitauxBourse = 0;     // l'épargne dirigée vers la bourse se recompte

    for (const m of this.marches) {
      m.reinitialiser();
      // Un marché fusionné est desservi par au moins une ligne : c'est elle qui
      // le rend possible, et c'est elle qui se fait payer.
      m.peage = m.villes.length > 1 ? P.peageRail : 0;
    }

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
      // Le loyer se prélève avant tout le reste, et c'est celui qu'on paie
      // vraiment — pas un forfait.
      v.loyer = this.loyerMoyen(v);
      const dispo = Math.max(0, revenu - v.loyer);
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
      m.demander(moinsCher, v.repas[moinsCher], v);
      m.demander(autre, v.repas[autre], v);
      m.demander('produits', v.demandeProduits, v);

      // Les chantiers. Cette commande n'est pas une intention : c'est une
      // demande réelle sur le marché, au même titre que le pain d'un ménage.
      // C'est ainsi qu'une ville à court de briques finit par se donner une
      // briqueterie.
      for (const ch of this.tousChantiers(v)) {
        for (const [r, q] of Object.entries(ch.restant)) if (q > 0) m.demander(r, q, v);
      }

      // L'entretien du bâti : une demande permanente de matériaux, qui donne
      // aux scieries et briqueteries leur débouché de régime de croisière.
      for (const b of bats) {
        for (const [r, q] of Object.entries(materiaux(b.type))) {
          m.demander(r, q * P.entretienAnnuel / 12, v);
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

    for (const v of this.villes) {
      v.__bats = this.tousBatiments(v);
      // Le rendement des terres du mois : sécheresse, récolte exceptionnelle.
      v.facteurSol = facteurSol(this, v);
      v.greveDe = (cat) => facteurGreve(this, v, cat);
    }

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
              v.marche.prendre(r, q * P.entretienAnnuel / 12, v);
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
              const servi = m.prendre(r, q, v);
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
      for (const r of NOURRITURES) v.nourrObtenue += m.prendre(r, v.repas[r] || 0, v);
      v.prodObtenue = m.prendre('produits', v.demandeProduits, v);
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
        const pris = m.rafler(r, reste, v);
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
                    + v.prodObtenue / Math.max(1, v.menages) * m.prix.produits
                    + (v.loyer === undefined ? P.loyerBase : v.loyer);
      // L'épargne se partage entre la brique et le titre. Ce qui part en bourse
      // ne bâtit plus la ville — c'est le prix à payer pour avoir un marché, et
      // c'est aux sociétés des joueurs de prendre le relais de la construction.
      //
      // Les événements financiers agissent ICI, et nulle part ailleurs : un
      // krach renvoie les capitaux vers la brique, une crise les fait dormir en
      // banque, un boom les gonfle d'un apport venu du dehors.
      const o = orientationEpargne(this);
      const surplus = Math.max(0, revenu - depense) * v.menages * o.apport;
      v.epargne += surplus * o.versVille;
      this.capitauxBourse += surplus * o.versBourse;
      v.epargneDormante = surplus * (1 - o.versVille - o.versBourse);

      // Ce que le ménage gagne, ce qu'il dépense, ce qu'il met de côté. Trois
      // chiffres que le joueur doit pouvoir lire depuis n'importe quel logement :
      // un immeuble ne vaut que par le pouvoir d'achat de ceux qui l'habitent.
      v.revenuMenage = revenu;
      v.depenseMenage = depense;
      v.tauxEpargne = revenu > 0 ? Math.max(0, revenu - depense) / revenu : 0;
    }

    // --- 7. Les prix du mois suivant ----------------------------------------
    // Maintenant seulement, sur le rapport entre les besoins réels du mois et ce
    // qui est entré sur le marché — augmentés de ce qu'il faut acheter, ou
    // cesser d'acheter, pour ramener la cave au matelas de sécurité.
    //
    // La freinte passe AVANT, pour que le prix soit fixé sur le stock qui
    // restera réellement en cave le mois prochain.
    for (const m of this.marches) { m.perimer(this.mois); m.fixerPrix(); }

    // --- 8. Le salaire, variable d'ajustement de la ville -------------------
    for (const v of this.villes) this.ajusterSalaire(v);

    // --- 9. Démographie -----------------------------------------------------
    for (const v of this.villes) this.demographie(v);
    this.migrations();

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
    this.exploiterRail();
    this.fixerPER();
    for (const s of this.societes) s.enregistrerCours(this.per);
    for (const v of this.villes) {
      v.niveau = niveauVille(v.menages);
      v.histo.push({ mois: this.mois, menages: v.menages, salaire: v.salaire,
                     ...v.barometres });
      if (v.histo.length > 400) v.histo.shift();
    }

    // Une partie sans fin ne doit rien accumuler sans limite : le journal ne
    // garde que ce qui est encore lisible.
    if (this.journal.length > 200) this.journal.splice(0, this.journal.length - 200);

    return true;
  }

  // Le salaire est ancré sur le barème — 20 $ la case — et ne s'en écarte que
  // sous la tension du marché du travail : des bras rares le poussent en haut,
  // du chômage le pousse en bas. Il reste borné des deux côtés, et c'est
  // délibéré.
  //
  // La version précédente le tirait vers « le panier au prix du jour », plafonné
  // par ce que les employeurs pouvaient payer. Cela fabriquait une trappe :
  // moins d'emploi, moins de revenu, moins de demande, prix plus bas, salaire
  // plus bas — et l'économie s'installait à 14 $ dans une déflation dont rien ne
  // la sortait. Un salaire ancré casse la boucle, et laisse à la rareté des bras
  // le soin de le faire vivre.
  ajusterSalaire(v) {
    const m = v.marche;

    // Tension du marché du travail : postes demandés rapportés aux bras.
    const tension = v.bras > 0 ? v.postesDemandes / v.bras : 1;
    let cible = P.salaireCase * Math.pow(Math.max(0.2, tension), P.elasticiteSalaire);

    // Le salaire de subsistance : celui qui permet au ménage de boucler son
    // mois — panier compris — ET de mettre de côté de quoi bâtir.
    //
    // C'est le plancher qui manquait, et son absence était fatale. La règle de
    // tension seule fait baisser le salaire quand il y a du chômage ; le ménage
    // s'appauvrit, n'achète plus de produits manufacturés, les prix tombent, les
    // ateliers ferment, le chômage augmente. La boucle est complète et rien n'en
    // sort. Or l'épargne des ménages est le SEUL capital qui bâtisse la ville :
    // un salaire trop bas ne fait pas des entreprises rentables, il fait une
    // ville qui ne se construit jamais.
    const panier = this.panier(v);   // loyer réel compris
    const emploi = Math.max(0.4, v.barometres.emploi);
    const subsistance = panier * (1 + P.epargneVisee) / (P.employesParMenage * emploi);
    cible = Math.max(cible, subsistance);

    cible = Math.max(P.salaireCase * P.salairePlancher,
                     Math.min(P.salaireCase * P.salairePlafond, cible));

    // Un employeur ne paie pas au-delà de ce qu'il encaisse : le salaire ne peut
    // pas dépasser durablement la valeur ajoutée par case.
    let capaciteTotale = 0, cases = 0;
    for (const b of this.tousBatiments(v)) {
      if (!b.def.sort || b.tauxReel <= 0.01) continue;
      let recette = b.production * m.prix[b.def.sort];
      for (const [r, q] of Object.entries(b.recu || {})) recette -= q * m.prix[r];
      recette -= b.entretien;
      capaciteTotale += Math.max(0, recette + b.masseSalarialePleine * b.tauxReel);
      cases += b.n * b.tauxReel;
    }
    if (cases > 0) cible = Math.min(cible, capaciteTotale / cases);

    // Une grève tire le salaire vers le haut : c'est sa raison d'être, et c'est
    // aussi sa condition de sortie. Elle ne peut pas forcer un employeur à payer
    // ce qu'il n'encaisse pas — le plafond de capacité tient toujours.
    const exige = salaireExige(this, v);
    if (exige > 0) cible = Math.max(cible, Math.min(exige, P.salaireCase * P.salairePlafond));

    cible = Math.max(P.salaireCase * P.salairePlancher, cible);
    v.salaire += 0.25 * (cible - v.salaire);
  }

  // Hors seuil critique, c'est la moyenne des trois baromètres qui décide.
  // Au-dessus du pivot la ville attire, en dessous elle repousse. La cadence
  // est proportionnelle à l'écart.
  // --- L'attractivité -------------------------------------------------------
  //
  // Ce qu'on vient chercher dans une ville : de quoi manger, du travail, de quoi
  // s'équiper — et de quoi vivre au-dessus du strict nécessaire. Les trois
  // baromètres disent si les biens sont LÀ ; l'aisance dit si le ménage a les
  // moyens de les prendre. Une ville peut avoir des étals pleins et ne rien
  // valoir : c'est exactement ce qui arrivait quand le salaire tombait sous le
  // panier.
  //
  //   attractivité = moyenne des trois baromètres × aisance
  //   aisance      = revenu du ménage ÷ panier local, bornée à [0,70 ; 1,20]
  //
  // L'aisance vaut 1,00 quand le ménage boucle son mois au centime près. Elle
  // monte au-dessus quand il lui reste de quoi épargner — et l'épargne est ce
  // qui bâtit la ville, si bien qu'une ville aisée s'équipe, donc attire encore.
  // Le loyer moyen effectivement pratiqué dans la ville.
  //
  // Le budget du ménage provisionnait 5 $ forfaitaires alors que le loyer suit
  // le foncier — jusqu'à 8,75 $ au centre d'une Métropole. Tant que le gradient
  // était plat l'écart restait anecdotique ; avec une atténuation qui se durcit
  // par palier, il devient matériel, et un ménage paierait un loyer que son
  // panier n'a pas prévu. Le pouvoir d'achat, donc l'attractivité, donc la
  // démographie s'en trouveraient faussés sans que rien ne le signale.
  // Mémorisé au mois : il parcourt tout le parc, et il est demandé cinq fois par
  // ville et par mois — panier, aisance, attractivité, migrations, salaire —
  // plus une fois par image quand le volet des villes est ouvert. Sans ce cache
  // le coût d'un mois simulé doublait, de 9,8 à 18,6 ms.
  loyerMoyen(v) {
    if (v._loyerMois === this.mois) return v._loyerCache;
    let total = 0, foyers = 0;
    for (const b of this.tousBatiments(v)) {
      if (b.def.cat !== 'loge') continue;
      total += b.loyerPlein;
      foyers += b.def.menages;
    }
    v._loyerMois = this.mois;
    v._loyerCache = foyers > 0 ? total / foyers : P.loyerBase;
    return v._loyerCache;
  }

  panier(v) {
    const m = v.marche;
    return Math.min(m.prix.pain, m.prix.viande) + m.prix.produits + this.loyerMoyen(v);
  }

  aisance(v) {
    const panier = this.panier(v);
    if (panier <= 0) return 1;
    const revenu = P.employesParMenage * v.salaire * v.barometres.emploi;
    return Math.max(P.aisanceMin, Math.min(P.aisanceMax, revenu / panier));
  }

  attractivite(v) {
    const b = v.barometres;
    const moyenne = (b.nourriture + b.emploi + b.produits) / 3;
    return moyenne * this.aisance(v);
  }

  // --- Les migrations entre villes reliées ----------------------------------
  //
  // L'appoint, jamais le moteur. Une part très faible de la population est
  // mobile chaque mois et se redistribue entre les villes qu'un rail achevé
  // relie, au prorata de leur attractivité. C'est un jeu à somme nulle — la
  // vraie croissance vient du dehors — mais c'est ce qui donne au rail un
  // second visage : une ligne n'apporte pas que des marchandises, elle ouvre
  // aussi la porte aux gens, dans les deux sens.
  migrations() {
    for (const marche of this.marches) {
      const villes = marche.villes.filter(v => !v.enCrise);
      if (villes.length < 2) continue;

      const attrait = villes.map(v => Math.max(0.01, this.attractivite(v)));
      const total = attrait.reduce((s, a) => s + a, 0);
      const mobiles = villes.reduce((s, v) => s + v.menages * P.partMobile, 0);

      villes.forEach((v, i) => {
        const recus = mobiles * (attrait[i] / total);
        const partis = v.menages * P.partMobile;
        v.migration = recus - partis;                 // pour la fiche de la ville
        v.menages = Math.max(0, Math.min(v.menages + v.migration,
                                         v.capaciteLogement || Infinity));
      });
      for (const v of villes) {
        v.occupation = v.capaciteLogement > 0
          ? clamp01(v.menages / v.capaciteLogement) : 0;
      }
    }
  }

  demographie(v) {
    const b = v.barometres;
    const moyenne = this.attractivite(v);
    v.moyenne = moyenne;
    v.aisanceMenage = this.aisance(v);

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
      // La cadence était écrite en dur ici, et P.cadenceDemo ne servait à
      // personne. Elle vaut « tant de pour-cent de la population par mois et
      // par point d'écart au pivot » : c'est le seul cadran qui décide de la
      // vitesse à laquelle une partie se déploie.
      taux = P.cadenceDemo * 100 * (moyenne - P.pivot);
      taux = Math.max(-P.cadenceMax, Math.min(P.cadenceMax, taux));
      v.enCrise = false;
    }

    // La capacité de logement BORNE l'afflux ; elle ne l'appelle pas. Bâtir un
    // immeuble ne fait venir personne : il ouvre vingt logements que
    // l'attractivité de la ville remplira, ou pas. Une ville sans attrait qui
    // bâtit n'obtient que des logements vides — et le taux d'occupation, commun
    // à tous les propriétaires, tombe pour tout le monde.
    const capacite = this.tousBatiments(v)
      .filter(x => x.def.cat === 'loge')
      .reduce((s, x) => s + x.def.menages, 0);

    let nouveau = v.menages * (1 + taux);
    nouveau = Math.max(0, Math.min(nouveau, capacite));
    v.immigration = nouveau - v.menages;      // ce qui est venu du dehors
    v.tauxCroissance = taux;
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
  // La ligne en travaux, ou null quand tout le réseau est posé.
  get chantierRail() {
    return this.liaisons.find(l => !l.achevee) || null;
  }

  // --- La voie, payée au fur et à mesure ------------------------------------
  //
  // On choisit deux gares, ce qui donne un devis global. La voie se pose ensuite
  // toute seule, quelques mois durant, en prélevant chaque mois sa part sur la
  // trésorerie. Si la caisse est vide, LE CHANTIER S'ARRÊTE OÙ IL EN EST et
  // reprend dès qu'il y a de quoi payer — on ne perd rien de ce qui est posé.
  //
  // C'est ce qui fait du rail un engagement et non un achat : on peut se lancer
  // trop grand et se retrouver avec quarante cases de ballast au milieu de nulle
  // part, à regarder ses mines attendre.

  devisVoie(iA, iB) {
    const a = this.villes[iA], b = this.villes[iB];
    if (!a || !b || a === b) return null;
    const longueur = Math.round(Math.hypot(a.gare.x - b.gare.x, a.gare.y - b.gare.y));
    return {
      a: iA, b: iB, longueur,
      cout: longueur * P.coutVoieParCase,
      mois: Math.max(1, Math.ceil(longueur * P.moisParCaseDeVoie)),
      nom: `${a.nom} – ${b.nom}`,
    };
  }

  // Deux gares déjà reliées, fût-ce par une chaîne d'autres, n'ont pas besoin
  // d'une seconde ligne : leurs marchés n'en font déjà qu'un.
  dejaReliees(iA, iB) {
    return this.villes[iA] && this.villes[iA].marche === this.villes[iB].marche;
  }

  lancerVoie(iA, iB, societe) {
    const devis = this.devisVoie(iA, iB);
    if (!devis) return 'gares invalides';
    if (this.dejaReliees(iA, iB)) return 'ces deux gares partagent déjà un marché';
    if (this.liaisons.some(l => !l.achevee && l.societe
        && ((l.a === iA && l.b === iB) || (l.a === iB && l.b === iA)))) {
      return 'chantier déjà ouvert sur cette ligne';
    }
    const l = {
      ...devis, pose: 0, depense: 0, societe, debut: this.mois, achevee: false,
      // La voie part de la gare A et va vers B : c'est ce que le tracé affiche.
      depuisB: false, arret: false,
    };
    this.liaisons.push(l);
    this.journal.push(`${this.mois} · ⚒ ${societe.nom} ouvre le chantier ${l.nom}`
      + ` — ${l.longueur} cases, ${Math.round(l.cout)} $, ${l.mois} mois`);
    return l;
  }

  avancerRail() {
    let fusionner = false;
    for (const l of this.liaisons) {
      if (l.achevee || !l.societe) continue;      // les routes non lancées attendent

      // Ce qu'on poserait ce mois-ci si la caisse suivait, et ce que ça coûte.
      const cadence = l.longueur / l.mois;
      const reste = l.longueur - l.pose;
      const vise = Math.min(cadence, reste);
      const facture = vise * P.coutVoieParCase;

      // On paie ce qu'on peut. Le chantier avance au prorata — pas d'à-valoir,
      // pas de dette cachée : trente pour cent payés, trente pour cent posés.
      const dispo = Math.max(0, l.societe.tresorerie);
      const paye = Math.min(facture, dispo);
      if (paye <= 0.01) {
        if (!l.arret) {
          l.arret = true;
          this.journal.push(`${this.mois} · ⏸ ${l.nom} — chantier suspendu,`
            + ` trésorerie épuisée à ${Math.round(l.pose)}/${l.longueur} cases`);
        }
        continue;
      }
      if (l.arret) {
        l.arret = false;
        this.journal.push(`${this.mois} · ▶ ${l.nom} — le chantier repart`);
      }
      l.societe.payer(paye);
      l.depense += paye;
      l.pose += vise * (paye / facture);

      if (l.pose >= l.longueur - 0.001) {
        l.pose = l.longueur;
        l.achevee = true;
        fusionner = true;
        this.compagnie.lignes.push(l);
        this.journal.push(`${this.mois} · ✔ ${l.nom} est ouverte à l'exploitation`
          + ` — ${Math.round(l.depense)} $ dépensés`);
      }
    }
    if (fusionner) this.recomposerMarches();
  }

  capitalNominal() {
    return this.compagnie.lignes.reduce((s, l) => s + l.longueur, 0) * P.capitalParCaseDeVoie;
  }

  // Le mois de la compagnie : elle encaisse ses péages, paie ses voies, et verse
  // le reste à ses porteurs.
  //
  // Le péage a été prélevé sur les producteurs au moment de la vente : on ne
  // fait ici que le collecter. Rien n'est créé. Il n'y a plus de répartition au
  // prorata de la longueur entre compagnies concurrentes — il n'y en a qu'une.
  exploiterRail() {
    const c = this.compagnie;
    c.recette = 0; c.charges = 0; c.resultat = 0;
    if (!c.lignes.length) return;

    for (const m of this.marches) {
      if (m.villes.length > 1) c.recette += m.peageCollecte || 0;
    }
    c.charges = this.capitalNominal() * P.entretienVoie / 12;
    c.resultat = c.recette - c.charges;
    c.histoResultat.push(c.resultat);
    if (c.histoResultat.length > P.fenetreProfit) c.histoResultat.shift();

    // Le dividende part à ceux qui ont souscrit. La part du consortium sort du
    // modèle, comme les salaires que les bureaux reçoivent du dehors.
    if (c.resultat > 0 && c.actions > 0) {
      for (const s of this.societes) {
        const n = c.parts[s.id] || 0;
        if (n > 0) s.encaisser(c.resultat * n / c.actions);
      }
    }
    c.cours = this.coursRail();        // mémorisé : la société le lit pour son actif
    c.histoCours.push(c.cours);
    if (c.histoCours.length > P.histoireDesCours) c.histoCours.shift();
  }

  beneficeAnnuelRail() {
    const h = this.compagnie.histoResultat;
    return h.length ? h.reduce((a, b) => a + b, 0) * 12 / h.length : 0;
  }

  // Non cotée : la part vaut ce qu'on a souscrit, au franc le franc.
  // Cotée : capital nominal + PER × bénéfice, divisé par les actions.
  coursRail() {
    const c = this.compagnie;
    if (!c.actions || !c.cotee) return P.prixNominalAction;
    const b = Math.max(0, this.beneficeAnnuelRail());
    return Math.max(0.01, (this.capitalNominal() + b * this.per) / c.actions);
  }

  capitalisationRail() { return this.coursRail() * this.compagnie.actions; }

  valeurPartRail(societe) {
    return (this.compagnie.parts[societe.id] || 0) * this.coursRail();
  }

  // Souscrire au chantier en cours. Il n'y a plus de ligne à choisir : la
  // compagnie n'en pose qu'une à la fois, et c'est celle-là qu'on finance.
  investirRail(societe, montant) {
    const l = this.chantierRail;
    if (!l || l.date === null || !societe.peutPayer(montant)) return false;
    const c = this.compagnie;
    societe.payer(montant);
    c.capital += montant;
    // La souscription se compte en ACTIONS, pas en dollars : c'est ce qui permet
    // à la part de valoir autre chose que son prix d'achat une fois la compagnie
    // introduite en bourse.
    const titres = montant / P.prixNominalAction;
    c.parts[societe.id] = (c.parts[societe.id] || 0) + titres;
    c.actions += titres;
    if (!societe.rails) societe.rails = [];
    if (!societe.rails.includes(c)) societe.rails.push(c);
    // Une tranche = un mois d'avance, dans la limite de 40 % du délai initial.
    const tranche = 800;
    const avanceMax = Math.floor(l.dateInitiale * 0.40);
    const dejaAvance = (l.debut + l.dateInitiale) - l.date;
    const gain = Math.min(Math.floor(montant / tranche), avanceMax - dejaAvance);
    l.date = Math.max(this.mois + 1, l.date - Math.max(0, gain));
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
