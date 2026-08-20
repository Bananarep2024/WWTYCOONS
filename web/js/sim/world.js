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
         niveauVille, prixTerrain, qualiteMax, devisGare, QUALITES,
         FILIERES_LOCALES, RATTACHEMENTS, PANIER, POIDS_PANIER,
         BIENS_SECONDAIRES, VAGUES } from './params.js';
import { genererMonde, estAchetable, rng, tracerVoie,
         rayonConstructible, dansLeCarre } from './mapgen.js';
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
      recette: 0, charges: 0, resultat: 0, fret: 0, voyageurs: 0, tonnage: 0,
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
    // DEUX CARRÉS MAXIMAUX NE SE RECOUPENT JAMAIS.
    //
    // C'est la seule condition, et elle est géométrique : une ville qui atteint
    // la Métropole occupe un carré de 69 cases de côté, et il ne doit pas
    // empiéter sur celui de sa voisine — même si ni l'une ni l'autre n'y
    // parviendra jamais. On fonde en pensant à ce que la ville pourra devenir,
    // pas à ce qu'elle est le premier jour.
    //
    // La distance est celle de Chebyshev, comme les carrés qu'elle sépare.
    for (const v of this.villes) {
      const d = Math.max(Math.abs(v.gare.x - x), Math.abs(v.gare.y - y));
      if (d < P.ecartMinimalGares) {
        return `trop près de ${v.nom} — ${d} cases, il en faut ${P.ecartMinimalGares}`;
      }
    }
    return null;
  }

  fonderGare(x, y, societe, nom = null) {
    const refus = this.peutFonderGare(x, y);
    if (refus) return refus;
    const devis = devisGare(this, x, y);
    if (!societe.peutPayer(devis.cout)) return 'trésorerie insuffisante';

    const v = {
      id: this.villes.length, nom: (nom || '').trim() || this.nomDeGare(), profil: null,
      temperament: { taille: 1, nom: 'colonie' },
      // Le territoire s'ouvre d'emblée jusqu'au carré MAXIMAL : c'est le sol que
      // la ville pourra un jour bâtir, et il lui est réservé dès la fondation —
      // c'est très exactement ce que la règle d'écartement garantit. Ce qu'elle
      // peut bâtir AUJOURD'HUI reste le carré de son palier.
      gare: { x, y }, rayon: P.rayonPalier[P.rayonPalier.length - 1], cases: [],
      menages: 0,
      // UNE VILLE QU'ON FONDE EST UN HAMEAU — niveau 0. Quelques baraques
      // autour d'un quai, un carré de dix-sept cases de côté, et une terre qui
      // vaut sept dixièmes de celle d'un Comptoir. C'est à CINQUANTE MÉNAGES
      // qu'elle devient Comptoir, que son carré double et que son sol se
      // revalorise — le moment où le fondateur réalise sa plus-value.
      occupation: 0.85, salaire: P.salaireCase, niveau: 0,
      barometres: { nourriture: 1, emploi: 0.78, produits: 1 },
      epargne: 0, marche: null, histo: [], fondee: this.mois,
      // Les vivres de fondation sont datés : la freinte ne les touche pas tant
      // qu'ils durent, sinon les deux ans promis n'en font que dix-huit.
      vivresJusqua: this.mois + P.moisDeVivres,
      // Les mêmes collections que les villes de la génération : sans elles, le
      // pilote de ville tombe au premier mois sur un champ qui n'existe pas.
      batIndependants: [], chantiersInd: [], germes: [], batiments: [],
    };

    // Le territoire. Premier arrivé, premier servi, comme à la génération.
    const rMax = P.rayonPalier[P.rayonPalier.length - 1];
    for (let dy = -rMax; dy <= rMax; dy++) {
      for (let dx = -rMax; dx <= rMax; dx++) {
        const c = this.caseAt(x + dx, y + dy);
        if (!c || c.ville) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        c.ville = v;
        c.distanceGare = d;
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

    // LE FONDATEUR EST PROPRIÉTAIRE DE SON CARRÉ.
    //
    // Il vient de payer la terre — remisée, mais payée — et elle est à lui :
    // tout le carré du Comptoir, moins le quai. C'est ce qui fait de la
    // fondation un acte de propriétaire et non un don à la collectivité. Il n'a
    // plus rien à acheter pour bâtir chez lui, et la valeur de ce sol montera à
    // chaque palier que sa ville franchira.
    //
    // Au-delà du carré du Comptoir, le territoire reste vierge : ce sera à
    // acheter, palier après palier, comme partout ailleurs.
    const r0 = P.rayonPalier[0];
    for (const c of v.cases) {
      if (c.voie || c.distanceGare > r0) continue;
      c.proprio = societe.id;
      c.vendue = true;
      c.prixPaye = this.prixCase(v, c);
    }
    this.villes.push(v);
    this.recomposerMarches();

    // La cargaison est déposée dans le livre de la ville, pas dans un tas
    // commun : elle lui appartient, et la règle du service local la lui garde.
    const livre = v.marche.livre(v);
    for (const [r, q] of Object.entries(devis.mat)) livre.stock[r] += q;
    for (const [r, q] of Object.entries(devis.vivres)) livre.stock[r] += q;
    v.marche.recomposerStock();

    v.marche.recomposerStock();

    this.journal.push(`${this.mois} · ⚑ ${societe.nom} fonde ${v.nom}`
      + ` — ${P.moisDePain} mois de pain pour ${P.menagesNourris} ménages,`
      + ` ${Math.round(devis.cout)} $`);
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
      // Les cinq villes de la carte sont des bourgades établies, pas des
      // hameaux : elles s'ouvrent au Comptoir même si le tempérament les a
      // taillées sous cinquante ménages. Le niveau 0 est réservé à ce que le
      // joueur fonde lui-même.
      v.niveau = Math.max(1, niveauVille(v.menages));
      // Un parc de départ minimal, aux mains des indépendants : sans lui la
      // ville n'a rien à manger le premier mois.
      this.parcDeDepart(v);
      this.constituerFilieres(v);
    }
    this.calibrerPrixInitiaux();
  }

  // ==========================================================================
  //  LES SOCIÉTÉS LOCALES
  // ==========================================================================
  //
  // Le parc d'une ville passe des « indépendants » — un propriétaire anonyme et
  // sans compte — à des sociétés de filière qui portent le nom de la ville. Ce
  // n'est pas un habillage : une filière a une trésorerie, un résultat, un
  // cours, et elle se prend en bourse. Le joueur ne peut plus ramasser une
  // scierie isolée en payant trois ans de profit ; il doit prendre la Forestière
  // entière, ou s'en passer.
  //
  // Le logement reste dehors. Une maison ne se possède pas, elle s'habite, et
  // c'est le seul bien que le joueur puisse encore acheter case par case.
  constituerFilieres(v) {
    v.filieres = {};
    for (const def of FILIERES_LOCALES) this.creerFiliere(v, def);

    // L'aciérie et la manufacture n'ont pas de filière à elles : elles vont à
    // celle qui leur fournit un intrant ET qui gagne le plus. C'est la logique
    // d'une intégration verticale — on remonte la chaîne depuis ce qu'on tient
    // déjà, et c'est le plus riche qui rachète.
    const acierie = this.plusProfitable(v, RATTACHEMENTS.acierie);
    if (acierie) acierie.types.push('acierie');
    v.filieres.acier = acierie;

    const candidatsManu = ['bois', acierie ? acierie.locale : null].filter(Boolean);
    const manu = this.plusProfitable(v, candidatsManu);
    if (manu) manu.types.push('manufacture');

    // Et l'on distribue le parc déjà debout.
    for (const b of this.tousBatiments(v)) {
      if (b.societe) continue;
      const s = this.societeLocale(v, b.type);
      if (!s) continue;
      v.batIndependants = v.batIndependants.filter(x => x !== b);
      b.societe = s;
      s.batiments.push(b);
      for (const c of b.cases) c.proprio = s.id;
    }
  }

  // La marge brute d'une filière au prix de référence : ce que ses bâtiments
  // sortent, moins ce qu'ils paient en salaires. On la mesure au barème et non
  // au cours du jour, parce qu'au premier mois les cours ne veulent encore rien
  // dire — et parce que c'est la vocation de la ville qu'on cherche à lire, pas
  // sa conjoncture.
  margeDeReference(societe) {
    let m = 0;
    for (const b of societe.batiments) {
      if (b.def.sort) m += b.capacite * RES[b.def.sort].prix;
      m -= b.emplois * P.salaireCase;
    }
    return m;
  }

  plusProfitable(v, cles) {
    let meilleur = null, mieux = -Infinity;
    for (const cle of cles) {
      const s = v.filieres[cle];
      if (!s || !s.batiments.length) continue;      // pas d'intrant, pas de titre
      const m = this.margeDeReference(s);
      if (m > mieux) { mieux = m; meilleur = s; }
    }
    return meilleur;
  }

  creerFiliere(v, def) {
    const s = new Societe(`${def.nom} de ${v.nom}`, def.couleur, false,
                          { cle: def.cle, nom: def.nom, ville: v });
    s.types = def.types.slice();
    this.societes.push(s);
    v.filieres[def.cle] = s;
    return s;
  }

  // À quelle filière appartient ce métier, dans cette ville ? Le logement n'en a
  // aucune, et c'est voulu.
  //
  // Si la filière manque — parce qu'un joueur l'a prise en bourse et l'a absorbée
  // — elle SE REFONDE. Une ville ne reste pas sans meunier parce qu'on lui a
  // racheté le sien : quelqu'un d'autre monte la minoterie suivante, sous le
  // même nom, et il faudra la reprendre à son tour. C'est ce qui empêche une OPA
  // d'être un gain définitif et sans suite.
  societeLocale(ville, type) {
    if (!ville.filieres || BAT[type].cat === 'loge') return null;
    for (const s of Object.values(ville.filieres)) {
      if (s && s.types && s.types.includes(type)) return s;
    }
    const def = FILIERES_LOCALES.find(d => d.types.includes(type));
    if (def) return this.creerFiliere(ville, def);

    // L'aciérie et la manufacture n'ont pas de filière à elles : on les rattache
    // à nouveau, comme au premier jour, à celle qui leur donne un intrant.
    const cles = type === 'acierie' ? RATTACHEMENTS.acierie
               : type === 'manufacture' ? ['bois', 'charbon', 'fer'] : null;
    if (!cles) return null;
    let hote = this.plusProfitable(ville, cles);
    if (!hote) {
      const d = FILIERES_LOCALES.find(x => x.cle === cles[0]);
      hote = ville.filieres[cles[0]] || (d ? this.creerFiliere(ville, d) : null);
    }
    if (hote && !hote.types.includes(type)) hote.types.push(type);
    return hote;
  }

  // ------------------------------------------------------------------------
  //  L'OFFRE PUBLIQUE D'ACHAT
  //
  // On ne rachète pas une filière bâtiment par bâtiment — c'est justement ce
  // qu'elle interdit. On la prend en bourse, d'un bloc, en payant sa
  // capitalisation majorée d'une prime. Le public vend au-dessus de la prime
  // minimale et refuse en dessous : il n'y a rien à négocier, il y a un curseur
  // et une réponse.
  //
  // Ce qui passe : les murs, les terres, la trésorerie. La société absorbée
  // disparaît, et la ville se refonde une filière du même nom dès qu'elle en
  // rebâtit le premier atelier — une OPA prend un patrimoine, elle n'achète pas
  // un monopole perpétuel.
  capitalisationDe(societe) { return societe.cours(this.per) * societe.actions; }

  prixOPA(societe, prime) { return this.capitalisationDe(societe) * (1 + prime); }

  opaPossible(societe, acquereur) {
    return !!societe && societe.locale && societe !== acquereur
      && societe.batiments.length > 0;
  }

  lancerOPA(cible, acquereur, prime) {
    if (!this.opaPossible(cible, acquereur)) return { fait: false, motif: 'cible impossible' };
    const prix = this.prixOPA(cible, prime);
    if (!acquereur.peutPayer(prix)) return { fait: false, motif: 'trésorerie insuffisante' };
    if (prime < P.primeOPA) {
      return { fait: true, accepte: false, prix,
               motif: `le public refuse sous ${Math.round(P.primeOPA * 100)} % de prime` };
    }

    acquereur.payer(prix);
    const v = cible.ville;
    for (const b of cible.batiments.slice()) {
      b.societe = acquereur;
      acquereur.batiments.push(b);
      for (const c of b.cases) c.proprio = acquereur.id;
    }
    cible.batiments = [];
    acquereur.encaisser(cible.tresorerie);
    cible.tresorerie = 0;

    // La société sort du monde : plus de cours, plus de titres, plus de place
    // dans la ville. Son métier redeviendra vacant, et la ville s'en redonnera
    // une le jour où elle rebâtira.
    this.societes = this.societes.filter(x => x !== cible);
    if (v && v.filieres) {
      for (const [cle, x] of Object.entries(v.filieres)) if (x === cible) delete v.filieres[cle];
    }
    this.journal.push(`${this.mois} · ⚑ ${acquereur.nom} prend ${cible.nom}`
      + ` pour ${Math.round(prix)} $ — prime de ${Math.round(prime * 100)} %`);
    return { fait: true, accepte: true, prix };
  }

  // L'ÉTALAGE D'UNE VILLE : pour chaque bien secondaire, la VALEUR que ses
  // boutiques savent écouler dans le mois.
  //
  // Le débit d'un commerce se compte en dollars et non en unités — c'est la
  // seule mesure juste pour un détaillant, une unité de meubles pesant cinq
  // unités de savon — et il se répartit entre les articles qu'il tient au
  // prorata de ce que la ville en demande. Une épicerie dans une ville qui boit
  // beaucoup et se lave peu vendra surtout de la bière, sans qu'on ait à le lui
  // dire.
  etalage(ville) {
    const cap = {};
    const m = ville.marche;
    for (const b of this.tousBatiments(ville)) {
      if (b.def.cat !== 'com' || b.enSommeil) continue;
      let total = 0;
      const part = {};
      for (const r of b.def.tient) {
        const a = PANIER.find(x => x.res === r);
        // Au prorata de ce que la ville souhaite acheter — ce que son budget
        // supporte — et non de ce qu'elle voudrait dans l'absolu.
        const voulu = ville.souhaits && ville.souhaits[r] !== undefined
          ? ville.souhaits[r] : (a ? a.qte : 0) * ville.menages;
        part[r] = voulu * m.prix[r];
        total += part[r];
      }
      if (total <= 0.0001) continue;
      for (const r of b.def.tient) {
        cap[r] = (cap[r] || 0) + b.def.debit * (part[r] / total);
      }
    }
    return cap;
  }

  // ------------------------------------------------------------------------
  //  CE QUE LA VILLE PEUT INVESTIR
  //
  //   capacité = épargne des ménages + trésorerie des filières locales
  //
  // Les deux termes se comportent différemment et c'est tout l'intérêt de les
  // afficher séparément. L'épargne des ménages est un RÉSIDU — ce qui reste une
  // fois le panier payé — donc volatile et sensible aux prix. La trésorerie des
  // filières est un profit accumulé, donc sensible aux marges. Une ville peut
  // avoir des ménages à l'aise et des entreprises qui saignent, ou l'inverse.
  //
  // Et une filière en déficit vient EN DÉDUCTION : sa trésorerie passe sous
  // zéro, elle entre dans la somme avec son signe, et la ville bâtit moins.
  // C'est ce qui fait qu'une filière ruinée pèse sur toute sa ville et pas
  // seulement sur elle-même.
  capaciteInvestissement(ville) {
    const societes = this.filieresDe(ville).reduce((s, f) => s + f.tresorerie, 0);
    return {
      menages: ville.epargne,
      societes,
      total: ville.epargne + societes,
      pertes: this.filieresDe(ville)
        .reduce((s, f) => s + Math.min(0, f.tresorerie), 0),
    };
  }

  // Financer un chantier de ville. La filière paie sur sa propre trésorerie, et
  // l'épargne des ménages complète — c'est l'ordre naturel : une entreprise
  // investit d'abord ses bénéfices, et n'appelle l'épargne du public qu'ensuite.
  // Renvoie la société qui portera le bâtiment, ou null pour un logement, qui
  // reste aux habitants.
  financerLocal(ville, type, cout) {
    const s = this.societeLocale(ville, type);
    if (!s) { ville.epargne -= cout; return null; }
    const surLaSociete = Math.max(0, Math.min(cout, s.tresorerie));
    s.tresorerie -= surLaSociete;
    ville.epargne -= cout - surLaSociete;
    return s;
  }

  filieresDe(ville) {
    if (!ville.filieres) return [];
    const vues = new Set(), out = [];
    for (const s of Object.values(ville.filieres)) {
      if (s && !vues.has(s.id)) { vues.add(s.id); out.push(s); }
    }
    return out;
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
        for (const a of PANIER) besoin[a.res] += a.qte * v.menages;
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
      // La manufacture ne se surconstruit pas seule : sans planches ni acier en
      // face, ce ne serait pas une crise de surproduction mais une rangée
      // d'ateliers vides, qui immobilisent des bras et ne produisent rien.
      meubles:  ['manufacture', 'scierie', 'coupe', 'acierie', 'mineCharbon', 'mineFer'],
      papier:   ['papeterie', 'coupe', 'mineCharbon'],
      outillage:['forge', 'acierie', 'mineCharbon', 'mineFer'],
      biere:    ['brasserie', 'ferme'],
      savon:    ['savonnerie', 'ranch'],
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
    // Le rayon constructible ne s'amorce plus : c'est celui du palier, et une
    // ville neuve est au Comptoir. Le parc de départ tient donc serré autour de
    // la gare, ce qui est justement ce qu'on cherchait — une agglomération
    // naissante est dense et petite, elle s'étale en grandissant.
    v.rayonAtteint = rayonConstructible(v);
    const dBois = this.dotation(v, 'bois');
    const dArgile = this.dotation(v, 'argile');
    const dCharbon = this.dotation(v, 'charbon');
    const dFer = this.dotation(v, 'minerai');
    const dTerre = this.dotation(v, 'fertilite', 0.90);   // on ne laisse pas une ville affamée

    // ON POSE L'AMONT D'ABORD, ET L'AVAL SE MESURE SUR L'AMONT.
    //
    // C'est l'ordre qui compte, et l'ancien était l'inverse. Chaque étage était
    // dimensionné séparément sur la consommation théorique de la ville, et les
    // deux étages ne se parlaient pas. Or un atelier est un GROS morceau — une
    // minoterie, c'est 20 unités d'un coup — tandis qu'une exploitation en pose
    // 10, ou 20, ou 50 selon la case. L'atelier dépassait donc largement sa
    // cible pendant que l'exploitation tombait juste dessus, et le rapport
    // voulu se perdait dans l'arrondi. Mesuré sur les cinq villes de la graine
    // 12345 : bois 0,75 à 0,94, argile 0,75, céréales 0,75 à 0,92, bétail 0,50
    // partout, planches 0,22 à Plaine-Dorée. Toutes les villes s'ouvraient avec
    // plus d'ateliers que leurs mines et leurs champs ne pouvaient en nourrir.
    //
    // Désormais l'exploitation se pose sur la consommation — c'est là que vit
    // la dotation, c'est-à-dire le sol, c'est-à-dire ce qui distingue les villes
    // entre elles — et l'atelier se compte sur ce que l'exploitation produit
    // VRAIMENT, une fois posée. La filière est équilibrée par construction, dans
    // chaque ville, au premier jour.

    // Combien d'ateliers, en nombre entier. C'est ici que vit la dotation,
    // c'est-à-dire le sol : une ville sans forêt ouvre avec deux scieries
    // quand sa voisine en a treize, et devra acheter ses planches au dehors.
    const atelier = (cible, def) => Math.max(0, Math.round(cible / BAT[def].debit));
    const nManu   = atelier(M * 1.08 * t.produits * Math.min(dBois, dFer), 'manufacture');
    const nScie   = atelier(nManu * BAT.manufacture.intrants.planches + M * 0.45 * dBois * t.emploi,
                            'scierie');
    const nBriq   = atelier(M * 0.40 * dArgile * t.emploi, 'briqueterie');
    const nAcier  = atelier(nManu * BAT.manufacture.intrants.acier, 'acierie');

    // La filière alimentaire n'est PAS ici : elle vient tout à la fin, une fois
    // la population connue. La population, dans ce modèle, se déduit du nombre
    // de postes installés — poser le pain avant les emplois, c'est nourrir une
    // ville qui n'existe pas encore. Mesuré avant correction : Roche-Noire
    // ouvrait avec 40 pains pour 116 ménages.
    // Les ateliers de biens courants et les boutiques : une ville n'ouvre pas la
    // partie sans savoir se laver ni où acheter son savon. On les dimensionne
    // sur la population provisoire, l'amont suivra comme le reste.
    const nFaie = atelier(M * PANIER.find(a => a.res === 'vaisselle').qte * dArgile, 'faiencerie');
    const nBras = atelier(M * PANIER.find(a => a.res === 'biere').qte * dTerre, 'brasserie');
    const nSavo = atelier(M * PANIER.find(a => a.res === 'savon').qte * dTerre, 'savonnerie');
    const nFila = atelier(M * PANIER.find(a => a.res === 'etoffes').qte * dTerre, 'filature');
    const nPape = atelier(M * PANIER.find(a => a.res === 'papier').qte * dBois, 'papeterie');
    const nForg = atelier(M * PANIER.find(a => a.res === 'outillage').qte * dFer, 'forge');

    const nb = { scierie: nScie, briqueterie: nBriq,
                 acierie: nAcier, manufacture: nManu,
                 faiencerie: nFaie, brasserie: nBras, savonnerie: nSavo,
                 filature: nFila, papeterie: nPape, forge: nForg };
    for (const [type, n] of Object.entries(nb)) {
      for (let k = 0; k < n; k++) {
        const cases = this.trouverEmplacement(v, type, null, P.dispersionDepart);
        if (!cases) break;
        this.poser(type, v, cases, null);
      }
    }

    // ET LES BOUTIQUES. Une par tranche de valeur écoulée : on compte ce que la
    // ville voudra acheter de ce que chaque comptoir tient, et l'on divise par
    // son débit. Sans elles, la ville produirait des étoffes que personne ne
    // pourrait lui vendre.
    // L'ameublement n'est PAS du parc de départ : le meuble est un bien de rang 2
    // qu'aucun ménage de comptoir ne peut s'offrir, et la boutique ouvrirait pour
    // ne rien vendre. La ville s'en donnera une le jour où elle en aura les moyens.
    for (const type of ['epicerie', 'nouveautes', 'quincaillerie']) {
      let valeur = 0;
      for (const r of BAT[type].tient) {
        const a = PANIER.find(x => x.res === r);
        if (a) valeur += a.qte * M * RES[r].prix * (1 + P.margeCommerce);
      }
      const n = Math.round(valeur / BAT[type].debit);
      for (let k = 0; k < n; k++) {
        const cases = this.trouverEmplacement(v, type, null, P.dispersionDepart);
        if (!cases) break;
        this.poser(type, v, cases, null);
      }
    }

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
    const FILIERES = ['planches', 'briques', 'pain', 'viande', 'acier',
                      'meubles', 'papier', 'outillage', 'biere', 'savon'];
    const combien = t.surcapacite >= 0.30 ? 2 : t.surcapacite >= 0.12 ? 1 : 0;
    const tirees = [];
    for (let k = 0; k < combien; k++) {
      const libres = FILIERES.filter(f => !tirees.includes(f));
      const f = libres[Math.floor(this.hasard() * libres.length)];
      tirees.push(f);
      this.surconstruire(v, f, 1 + t.surcapacite * P.ampleurSurcapacite);
    }
    v.filieresEngorgees = tirees;

    // Et l'amont exactement dessous, surconstruction comprise : ce que les
    // ateliers réclament, ni plus ni moins. Sur une mauvaise terre il en faut
    // simplement DAVANTAGE pour le même atelier — quatre coupes par scierie sur
    // des cases 1, deux sur des cases 2. C'est là que la pauvreté du sol se
    // paie : en bras, et en bras seulement.
    this.completerAmont(v);

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

    // ET MAINTENANT SEULEMENT, LE PAIN.
    //
    // La ration se partage entre le blé et la viande — un ménage mange une
    // ration par mois, peu importe laquelle. On vise un peu au-dessus du compte
    // pour que la ville ne s'ouvre pas à la limite de la disette, et l'amont
    // suit, comme partout ailleurs.
    // Et il faut y revenir deux ou trois fois, parce que nourrir crée des
    // emplois, et que les emplois créent des ménages, qu'il faut nourrir. Le
    // point fixe s'atteint en trois passes — la filière alimentaire ne pèse
    // qu'une fraction des postes, la boucle converge vite.
    for (let passe = 0; passe < 3; passe++) {
      let pain = 0;
      for (const b of this.tousBatiments(v)) {
        if (b.def.sort === 'pain' || b.def.sort === 'viande') pain += b.capacite;
      }
      const manque = v.menages * 1.05 - pain;
      if (manque <= 0) break;

      // ARRONDI AU-DESSUS, ici et nulle part ailleurs. Un surplus de pain se
      // vend, se stocke ou se perd ; une ration manquante vide la ville. Le
      // demi-atelier qu'on tolère partout ailleurs, on ne le tolère pas sur le
      // pain — Bois-Perdu ouvrait avec 20 pains pour 30 ménages.
      const nMino = Math.ceil(manque * 0.75 * t.vivres / BAT.minoterie.debit);
      const nAbat = Math.ceil(manque * 0.35 / BAT.abattoir.debit);
      let pose = 0;
      for (const [type, n] of Object.entries({ minoterie: nMino, abattoir: nAbat })) {
        for (let k = 0; k < n; k++) {
          const cases = this.trouverEmplacement(v, type, null, P.dispersionDepart);
          if (!cases) break;
          this.poser(type, v, cases, null);
          pose++;
        }
      }
      this.completerAmont(v);
      if (!pose) break;

      // Les bras que la filière alimentaire vient d'ajouter comptent eux aussi :
      // sans ce recensement, la ville s'ouvrirait avec un taux d'emploi au-dessus
      // de sa cible et des champs que personne n'habite.
      const postesNourris = this.tousBatiments(v).reduce((s, b) => s + b.postesDemandes, 0);
      v.menages = Math.max(12, Math.round(postesNourris / (P.employesParMenage * t.emploi)));
    }

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

  // Pose les exploitations qui manquent pour nourrir les ateliers debout.
  //
  // On compare, ressource par ressource, ce que le parc PRODUIT à ce qu'il
  // RÉCLAME, et l'on comble l'écart. Appelée après les ateliers et après la
  // surconstruction délibérée, elle garantit qu'aucune ville ne s'ouvre avec un
  // atelier qui n'aura jamais rien à traiter — un atelier vide n'est pas une
  // affaire déficitaire, c'est un bâtiment qui immobilise des bras pour rien.
  //
  // La surproduction volontaire, elle, survit : elle se lit alors où elle doit
  // se lire, dans un cours effondré et un stock qui enfle, et non dans des
  // chaînes de montage à l'arrêt.
  completerAmont(v) {
    // L'ordre est celui de la filière, de l'aval vers l'amont : combler les
    // planches crée des scieries, qui réclament du bois ; combler l'acier crée
    // des aciéries, qui réclament du charbon et du minerai. Les intermédiaires
    // passent donc avant les matières premières, sans quoi le bois serait compté
    // avant que les scieries manquantes n'existent.
    const AMONT = {
      planches: 'scierie', acier: 'acierie',
      bois: 'coupe', charbon: 'mineCharbon', minerai: 'mineFer',
      cereales: 'ferme', betail: 'ranch', argile: 'carriere',
    };
    for (const [res, type] of Object.entries(AMONT)) {
      let sort = 0, mange = 0;
      for (const b of this.tousBatiments(v)) {
        if (b.def.sort === res) sort += b.capacite;
        mange += (b.def.intrants || {})[res] || 0;
      }
      if (mange > sort) {
        this.poserJusqua(v, type, mange - sort, b => b.capacite);
      }
    }
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
  // LE RAYON CONSTRUCTIBLE EST CELUI DU PALIER, ET RIEN D'AUTRE.
  //
  // Il se déduisait de la population — un disque dimensionné sur trois cases par
  // ménage, qui ne rétrécissait jamais. C'était une bonne idée pour éviter la
  // confiture au départ, mais elle rendait le territoire illisible : le joueur
  // ne pouvait pas savoir où il avait le droit de bâtir avant d'essayer.
  //
  // Le carré du palier remplace tout cela. Il est visible, il est prévisible, et
  // il ne rétrécit jamais non plus — une ville qui décline garde ses rues.
  rayonUtile(ville) {
    const r = rayonConstructible(ville);
    ville.rayonAtteint = Math.max(ville.rayonAtteint || 0, r);
    return ville.rayonAtteint;
  }

  trouverEmplacement(ville, type, societe, dispersion = 0) {
    const def = BAT[type];
    const voulu = Monde.VOCATION_PREFEREE[def.cat];
    let meilleur = null, meilleurScore = -Infinity;
    const proches = [];        // les emplacements à `dispersion` points du meilleur

    // Le carré du palier est une BORNE DURE : rien ne se pose dehors, pas même
    // une exploitation qui suivrait un filon. C'est ce qui donne son prix au
    // passage de palier — et sa raison d'être à la gare qu'on va fonder plus
    // loin pour aller chercher ce filon.
    const portee = this.rayonUtile(ville);
    void 0;   // plus de secours hors carré : la borne est dure

    for (const depart of ville.cases) {
      if (depart.distanceGare > portee) continue;
      const cases = [];
      let ok = true;
      for (let dy = 0; dy < def.h && ok; dy++) for (let dx = 0; dx < def.w && ok; dx++) {
        const c = this.caseAt(depart.x + dx, depart.y + dy);
        if (!c || c.ville !== ville || c.voie || c.bat || c.chantier) { ok = false; break; }
        if (c.distanceGare > portee) { ok = false; break; }
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
    return meilleur;
  }

  // Pose immédiate (parc de départ et constructions des indépendants).
  poser(type, ville, cases, societe) {
    for (const c of cases) {
      c.vendue = true;
      if (societe) c.proprio = societe.id;
      else if (!c.proprio) c.proprio = 'ind';
      c.prixPaye = this.prixCase(ville, c);
    }
    const b = new Batiment(type, ville, cases, societe);
    for (const c of cases) c.bat = b;
    if (societe) societe.batiments.push(b);
    else (ville.batIndependants ||= []).push(b);
    (ville.batiments ||= []).push(b);
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
    // Le bien d'une filière locale ne se rachète pas au coup par coup : on prend
    // la société entière en bourse, ou l'on n'a rien.
    if (b.societe.locale) return false;
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
    if (b.ville.batiments) b.ville.batiments = b.ville.batiments.filter(x => x !== b);
  }

  // LE PARC D'UNE VILLE, LU SUR PLACE.
  //
  // Cette méthode est appelée des dizaines de fois par ville et par mois. Elle
  // parcourait toutes les sociétés en filtrant sur la ville : tant que le parc
  // appartenait à des indépendants rangés par ville, cela ne coûtait rien.
  // Depuis que chaque filière est une société, il y en a une quarantaine, et le
  // coût devenait celui du parc mondial entier à chaque appel. La ville tient
  // donc son propre index, et c'est lui qui fait foi.
  tousBatiments(ville) {
    return ville.batiments || (ville.batiments = []);
  }

  // LE MARCHÉ QUI APPROVISIONNE UN CHANTIER.
  //
  // Une colonie neuve n'a ni scierie ni briqueterie, et son marché est isolé :
  // ses chantiers n'y trouveraient jamais une planche et resteraient ouverts
  // pour toujours. Les matériaux viennent donc de la VILLE LA PLUS PROCHE qui en
  // ait un marché à elle — c'est le convoi de ravitaillement, et il explique le
  // délai d'acheminement que paie tout chantier d'une ville non reliée.
  //
  // Une ville reliée au rail n'a pas ce problème : son marché est déjà celui de
  // ses voisines.
  marcheFournisseur(ville) {
    if (ville.marche && ville.marche.villes.length > 1) return ville.marche;
    let meilleure = null, best = Infinity;
    for (const v of this.villes) {
      if (v === ville || v.fondee !== undefined) continue;   // on se fournit chez les fondatrices
      const d = Math.hypot(v.gare.x - ville.gare.x, v.gare.y - ville.gare.y);
      if (d < best) { best = d; meilleure = v; }
    }
    return meilleure ? meilleure.marche : ville.marche;
  }

  // Le temps qu'il faut de plus pour bâtir au bout du monde. Un chantier isolé
  // n'attend pas des ouvriers, il attend un convoi : tant que ce délai n'est pas
  // écoulé, rien ne lui est livré.
  chantierAcheminant(ch, ville) {
    if (ville.fondee === undefined) return false;
    if (ville.marche && ville.marche.villes.length > 1) return false;
    return this.mois - ch.ouvertLe < P.moisAcheminement;
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
      m.fret = m.villes.length > 1 ? P.commissionFret : 0;
    }

    // --- 1. Tout le monde déclare ses besoins ------------------------------
    for (const v of this.villes) {
      const m = v.marche;
      const bats = this.tousBatiments(v);

      for (const b of bats) b.declarer(m);

      // Les ménages. L'ORDRE DES DÉPENSES EST UNE RÈGLE DU JEU, pas un détail
      // d'implémentation : le loyer d'abord, la nourriture ensuite, et les
      // produits manufacturés avec ce qui reste — s'il reste quelque chose.
      //
      // C'est de cet ordre que sort l'effet de rareté. Une ville dont le sol ne
      // donne que du minerai de qualité 1 paie son minerai cher ; l'acier suit,
      // la manufacture suit, et le produit manufacturé arrive sur l'étal à un
      // prix qui, rapporté à un salaire identique partout, en fait un article de
      // luxe. Le ménage mange quand même — il mange d'abord — mais il n'achète
      // plus. La manufacture ne vend pas. Rien n'a besoin d'être codé en dur
      // pour cela : il suffit que la nourriture passe devant.
      const revenu = P.employesParMenage * v.salaire * v.barometres.emploi;
      // Le loyer se prélève avant tout le reste, et c'est celui qu'on paie
      // vraiment — pas un forfait.
      v.loyer = this.loyerMoyen(v);
      const dispo = Math.max(0, revenu - v.loyer);

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
      const capaciteA = m.offreAttendue(moinsCher) * (v.menages / totalMenages(m));

      // Le mélange que la ville va manger si elle mange à sa faim, et ce qu'il
      // coûte réellement. Le budget se mesure sur CE prix-là, et non sur le
      // moins cher des deux : une ville où le pain manque paie de la viande, et
      // c'est la viande qui grève son budget.
      const rationA = Math.min(1, v.menages > 0 ? capaciteA / v.menages : 1);
      const prixRation = rationA * m.prix[moinsCher] + (1 - rationA) * m.prix[autre];

      const partNourr = Math.min(1, dispo / Math.max(0.01, prixRation));
      let reste = Math.max(0, dispo - partNourr * prixRation);

      v.demandeNourriture = v.menages * partNourr;
      v.prixRation = prixRation;

      v.repas = {};
      v.repas[moinsCher] = v.demandeNourriture * rationA;
      v.repas[autre] = v.demandeNourriture * (1 - rationA);
      m.demander(moinsCher, v.repas[moinsCher], v);
      m.demander(autre, v.repas[autre], v);

      // LE PANIER SECONDAIRE, ET LES BOUTIQUES QUI EN GARDENT LA PORTE.
      //
      // Deux verrous, et il faut passer les deux. Le budget dit ce que le ménage
      // peut payer ; l'étalage dit ce que sa ville sait lui vendre. Une ville
      // peut fabriquer des meubles et n'en vendre aucun à ses habitants faute
      // d'un magasin — la marchandise part alors chez la voisine, ou dort.
      //
      // L'ordre est celui du RANG, puis du prix. Sans le rang, le ménage
      // achèterait de la vaisselle avant du savon puisqu'ils coûtent le même
      // prix, et la hiérarchie de nécessité se perdrait.
      const etal = this.etalage(v);
      v.etalage = etal;
      v.demandes = {};
      // LE SOUHAIT, distinct de la demande. C'est ce que le ménage achèterait si
      // sa ville savait le lui vendre — le budget seul, sans le verrou des
      // boutiques. Il faut le garder : sans lui, on ne peut pas savoir si un
      // article manque parce que la ville n'en fabrique pas ou parce qu'elle n'a
      // pas de comptoir pour l'écouler, et la ville bâtit alors des boutiques
      // qui ne vendront jamais rien. Mesuré avant correction : 123 commerces,
      // tous déficitaires, à la moitié de leur débit.
      v.souhaits = {};
      v.budgetSecondaire = reste;
      for (const rang of [1, 2]) {
        const biens = PANIER.filter(a => a.rang === rang)
          .sort((a, b2) => m.prix[a.res] - m.prix[b2.res]);
        for (const a of biens) {
          const prixDetail = m.prix[a.res] * (1 + P.margeCommerce);
          const abordable = Math.min(a.qte, reste / Math.max(0.01, prixDetail));
          v.souhaits[a.res] = abordable * v.menages;
          // Ce que les boutiques savent écouler, ramené au ménage.
          const plafond = (etal[a.res] || 0)
            / Math.max(0.01, prixDetail) / Math.max(1, v.menages);
          const q = Math.max(0, Math.min(abordable, plafond));
          v.demandes[a.res] = q * v.menages;
          // Le budget se consomme sur ce qu'on ACHÈTE, pas sur ce qu'on voulait :
          // un article que la ville ne sait pas vendre laisse son argent au
          // ménage, qui le reporte sur le suivant.
          reste = Math.max(0, reste - q * prixDetail);
          m.demander(a.res, v.demandes[a.res], v);
        }
      }

      // Les chantiers. Cette commande n'est pas une intention : c'est une
      // demande réelle sur le marché, au même titre que le pain d'un ménage.
      // C'est ainsi qu'une ville à court de briques finit par se donner une
      // briqueterie.
      for (const ch of this.tousChantiers(v)) {
        if (this.chantierAcheminant(ch, v)) continue;   // le convoi n'est pas arrivé
        const mf = this.marcheFournisseur(v);
        for (const [r, q] of Object.entries(ch.restant)) if (q > 0) mf.demander(r, q, mf === m ? v : null);
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
    // Les vagues sont DÉRIVÉES de la filière, plus écrites à la main : voir
    // params.js. Une usine qu'on ajoute prend sa place toute seule.

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
            if (this.chantierAcheminant(ch, v)) continue;
            const mf = this.marcheFournisseur(v);
            for (const [r, q] of Object.entries(ch.restant)) {
              if (q <= 0) continue;
              const servi = mf.prendre(r, q, mf === m ? v : null);
              ch.restant[r] = Math.max(0, q - servi);
              ch.recu[r] = (ch.recu[r] || 0) + servi;
              if (ch.societe) ch.societe.payer(servi * mf.prix[r]);
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
        if (b.def.sort || b.def.cat === 'com') continue;   // le commerce ferme plus tard
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
      // Le panier secondaire. On garde ce que chaque bien a rapporté : c'est de
      // là que sort le confort, et c'est de là que les boutiques se paient.
      v.obtenu = {};
      v.valeurDetail = 0;
      for (const r of BIENS_SECONDAIRES) {
        const q = m.prendre(r, v.demandes[r] || 0, v);
        v.obtenu[r] = q;
        v.valeurDetail += q * m.prix[r] * (1 + P.margeCommerce);
      }

      // ET MAINTENANT LES BOUTIQUES FERMENT. Chacune reçoit sa part de ce qui
      // est réellement passé au comptoir, au prorata de ce qu'elle savait
      // écouler. Une boutique de la seule ville où le bien manque n'encaisse
      // rien : elle a ouvert pour rien ce mois-ci, et elle paie quand même ses
      // deux commis.
      const boutiques = this.tousBatiments(v).filter(b => b.def.cat === 'com');
      if (boutiques.length) {
        const ecoule = {};
        for (const r of BIENS_SECONDAIRES) {
          ecoule[r] = (v.obtenu[r] || 0) * m.prix[r] * (1 + P.margeCommerce);
        }
        for (const b of boutiques) b.valeurEcoulee = 0;
        for (const r of BIENS_SECONDAIRES) {
          if (ecoule[r] <= 0.0001) continue;
          const tiennent = boutiques.filter(b => b.def.tient.includes(r));
          const offre = tiennent.reduce((sm, b) => sm + (v.etalage[r] ? b.def.debit : 0), 0);
          if (offre <= 0) continue;
          for (const b of tiennent) b.valeurEcoulee += ecoule[r] * (b.def.debit / offre);
        }
        for (const b of boutiques) {
          b.produire(m, v.partBras);
          if (b.societe) b.societe.encaisser(b.resultat);
          else v.epargne += Math.max(0, b.resultat);
        }
      }
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
      v.barometres.emploi = clamp01(
        Math.min(v.postesDemandes, v.bras) / Math.max(1, v.bras));

      // LE CONFORT : la part du panier secondaire réellement obtenue, pondérée
      // par le poids de chaque article. Il ne peut PAS vider une ville — ce
      // n'est pas un besoin primaire — mais il pèse sur son attractivité.
      let confort = 0;
      for (const a of PANIER) {
        const voulu = a.qte * v.menages;
        if (voulu <= 0.0001) continue;
        confort += POIDS_PANIER[a.res] * clamp01((v.obtenu[a.res] || 0) / voulu);
      }
      v.barometres.confort = confort;
      // Conservé sous son ancien nom pour les panneaux et le banc d'essai : le
      // baromètre « produits » est désormais celui du panier entier.
      v.barometres.produits = confort;

      // L'épargne des ménages n'est ni perdue ni thésaurisée : elle bâtit la
      // ville. Une fois son panier et son loyer payés, ce qui reste au ménage
      // est investi sur place.
      const revenu = P.employesParMenage * v.salaire * v.barometres.emploi;
      const depense = v.nourrObtenue / Math.max(1, v.menages)
                        * (v.prixRation || Math.min(m.prix.pain, m.prix.viande))
                    + v.valeurDetail / Math.max(1, v.menages)
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

    // --- 6 bis. Les filières placent une part de leur bénéfice ---------------
    //
    // La capacité d'investissement d'une ville ne sert pas qu'à bâtir : elle
    // s'emploie aussi en titres. Ce que les ménages font depuis toujours, les
    // filières le font maintenant aussi — une part de ce qu'elles gagnent part
    // en bourse au lieu de devenir des murs, et nourrit le multiple de marché
    // comme le reste de l'épargne. Une perte, elle, ne se place pas : elle
    // s'encaisse, et la ville bâtit moins le mois suivant.
    for (const v of this.villes) {
      for (const f of this.filieresDe(v)) {
        const gain = f.resultatMensuel;
        if (gain <= 0) continue;
        const place = gain * P.partProfitLocalEnBourse;
        f.tresorerie -= place;
        this.capitauxBourse += place;
      }
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
          (ch.ville.batiments ||= []).push(b);
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
    // Une filière locale ne joue pas la partie : elle exploite son métier et
    // réinvestit sur place, ce dont `piloterVille` s'est déjà chargé.
    for (const s of this.societes) if (!s.estJoueur && !s.locale) piloterSociete(this, s);

    // --- 14. Finance --------------------------------------------------------
    this.exploiterRail();
    this.fixerPER();
    for (const s of this.societes) s.enregistrerCours(this.per);
    for (const v of this.villes) {
      // Le palier suit la population DANS LES DEUX SENS, et le prix du sol avec
      // lui : la terre d'une ville qui se vide vaut moins, c'est juste. Ce qui
      // ne rétrécit jamais, c'est le PÉRIMÈTRE — voir `rayonConstructible`.
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

    // SALAIRE FIGÉ. Le même partout, à la case du barème, tant que ce drapeau
    // est levé. Tout ce qui suit reste écrit et reste juste : c'est la machine
    // du salaire endogène, mise en sommeil et non démontée, prête à reprendre du
    // service en abaissant `salaireFixe`.
    //
    // Pourquoi la couper : le salaire endogène remboursait la rareté. Une ville
    // aux mauvaises cases payait ses produits cher, donc son panier cher, donc
    // son salaire de subsistance montait, donc le ménage rachetait des produits
    // — et la pauvreté du sol ne se voyait nulle part. À salaire identique
    // partout, la même ville a le même revenu qu'ailleurs et des prix plus
    // hauts : le produit manufacturé y devient un luxe, et le sol se lit enfin
    // dans le budget des ménages.
    if (P.salaireFixe) { v.salaire = P.salaireCase; return; }

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

  // Ce que coûte un mois de vie complet : la ration, le panier secondaire entier
  // marge de détail comprise, et le loyer réellement pratiqué.
  panier(v) {
    const m = v.marche;
    let secondaire = 0;
    for (const a of PANIER) secondaire += a.qte * m.prix[a.res] * (1 + P.margeCommerce);
    return Math.min(m.prix.pain, m.prix.viande) + secondaire + this.loyerMoyen(v);
  }

  aisance(v) {
    const panier = this.panier(v);
    if (panier <= 0) return 1;
    const revenu = P.employesParMenage * v.salaire * v.barometres.emploi;
    return Math.max(P.aisanceMin, Math.min(P.aisanceMax, revenu / panier));
  }

  // Ce que vaut une ville aux yeux de qui cherche où vivre. En crise, elle ne
  // vaut rien : les besoins primaires ne sont pas satisfaits, et aucun confort
  // ne rachète cela. Sinon, c'est l'attrait — emploi, épargne, confort — celui-là
  // même qui règle sa croissance.
  attractivite(v) {
    if (v.enCrise) return 0;
    return v.attrait === undefined ? 0.5 : v.attrait;
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

    // BESOINS PRIMAIRES, PUIS BESOINS SECONDAIRES. Deux étages, et ils ne
    // jouent pas du tout le même rôle.
    //
    // LES PRIMAIRES — l'emploi et la nourriture — ne se négocient pas. Sous le
    // seuil, la ville se vide, et rien d'autre ne compte : ni le confort, ni
    // l'épargne, ni la beauté des boutiques. C'est un interrupteur, pas un
    // curseur.
    //
    //   chômage au-dessus de 15 %, OU nourriture sous 85 %  →  −5 % par mois
    //
    // LES SECONDAIRES — le panier — ne peuvent JAMAIS vider une ville. On ne
    // quitte pas une ville parce qu'on n'y trouve pas de savon ; on y vit moins
    // bien, et l'on choisit la ville d'à côté quand on a le choix. Ils règlent
    // donc la CADENCE de la croissance, jamais son signe.
    //
    //   attrait = ( marge d'emploi + capacité d'épargne + confort ) / 3
    //   croissance = cadence maximale × attrait
    //
    // Les trois termes sont bornés à [0, 1] et pèsent pareil. Une ville au plein
    // emploi, qui épargne et qui a ses sept boutiques croît à 5 % par mois ; une
    // ville qui tient tout juste ses seuils primaires et n'offre rien d'autre
    // stagne. C'est ce qui manquait : la croissance était un plateau — on
    // franchissait les seuils ou non — et deux villes également nourries
    // grandissaient au même rythme quelle que fût la vie qu'on y menait.
    const critique = b.emploi < P.seuilsCritiques.emploi
                  || b.nourriture < P.seuilsCritiques.nourriture;
    v.enCrise = critique;

    const margeEmploi = clamp01((b.emploi - P.seuilsCritiques.emploi)
                                / (1 - P.seuilsCritiques.emploi));
    const epargne = clamp01((v.tauxEpargne || 0) / P.epargneVisee);
    const confort = clamp01(b.confort || 0);
    v.attrait = (margeEmploi + epargne + confort) / 3;

    const taux = critique ? -P.exodeCritique : P.cadenceMax * v.attrait;

    // LA MIGRATION DE FRONTIÈRE.
    //
    // Le taux ci-dessus est un POURCENTAGE de la population présente : il ne
    // peuple jamais un endroit vide, puisque zéro pour cent de zéro fait zéro.
    // Une gare qu'on vient de fonder n'a personne, et n'aurait donc jamais
    // personne — on serait obligé de lui livrer ses habitants avec sa
    // cargaison, ce qui n'a pas de sens : on n'achète pas des colons.
    //
    // On ajoute donc un flux ABSOLU, en ménages et non en pourcentage : tant
    // qu'un endroit a du travail, de quoi manger, de quoi s'équiper et un toit
    // libre, il arrive des gens du dehors de la carte. C'est ce qui fait qu'une
    // gare posée au milieu de nulle part se peuple — et c'est aussi ce qui rend
    // les vivres de fondation utiles, puisqu'ils tiennent les baromètres au vert
    // le temps que la filière locale se monte.
    //
    // Un endroit VIDE ne se juge pas sur ses baromètres : ceux-ci mesurent une
    // consommation qui n'a pas lieu, et valent donc zéro — ce qui interdirait à
    // quiconque de jamais s'y installer. On regarde alors ce qu'il OFFRE :
    // du travail à prendre, de quoi manger, de quoi s'équiper. C'est exactement
    // ce que regarde un migrant qui n'y est pas encore.
    let frontiere = 0;
    if (v.menages < 1) {
      const mk = v.marche, l = mk.livre(v);
      const postes = this.tousBatiments(v)
        .reduce((s, b) => s + (b.def.cat === 'loge' ? 0 : b.emplois), 0);
      const mange = NOURRITURES.reduce((s, r) => s + l.stock[r], 0);
      // Du travail et du pain suffisent. Exiger en plus des produits
      // manufacturés condamnait toute colonie neuve : sa manufacture est à
      // trois étages de la mine, elle ne peut pas exister le premier mois.
      if (postes > 0 && mange > 0) frontiere = P.immigrationFrontiere;
    } else if (!critique && moyenne > P.pivot) {
      frontiere = P.immigrationFrontiere * (moyenne - P.pivot) / (1 - P.pivot);
    }

    // La capacité de logement BORNE l'afflux ; elle ne l'appelle pas. Bâtir un
    // immeuble ne fait venir personne : il ouvre vingt logements que
    // l'attractivité de la ville remplira, ou pas. Une ville sans attrait qui
    // bâtit n'obtient que des logements vides — et le taux d'occupation, commun
    // à tous les propriétaires, tombe pour tout le monde.
    const capacite = this.tousBatiments(v)
      .filter(x => x.def.cat === 'loge')
      .reduce((s, x) => s + x.def.menages, 0);

    let nouveau = v.menages * (1 + taux) + frontiere;
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
    const a = this.villes[iA], b = this.villes[iB];
    if (this.dejaReliees(iA, iB)) return 'ces deux gares partagent déjà un marché';
    if (this.liaisons.some(l => !l.achevee && l.societe
        && ((l.a === iA && l.b === iB) || (l.a === iB && l.b === iA)))) {
      return 'chantier déjà ouvert sur cette ligne';
    }
    const l = {
      ...devis, pose: 0, depense: 0, societe, debut: this.mois, achevee: false,
      // La voie part de la gare A et va vers B : c'est ce que le tracé affiche.
      depuisB: false, arret: false, date: null,
      // L'EMPRISE, tracée tout de suite, comme celle des lignes de la carte.
      //
      // Elle manquait, et deux choses en découlaient qu'on ne voyait pas : la
      // ligne n'était dessinée NULLE PART — `dessinerVoies` saute ce qui n'a pas
      // d'emprise — et ses cases n'étaient pas réservées, si bien qu'on pouvait
      // bâtir en travers du rail qu'on venait de payer. Toutes les voies vers
      // les villes fondées étaient dans ce cas.
      emprise: tracerVoie(this.cases, this.L, this.H, a.gare, b.gare),
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

    // DEUX RECETTES, ET IL FAUT LES DEUX.
    //
    // Le fret suit les cours et les volumes : il triple en haut de cycle et fond
    // en bas. Le voyageur et le courrier ne dépendent de rien — ni d'un prix, ni
    // d'une récolte — ils ne dépendent que du nombre de gens reliés. C'est la
    // part qui ne s'effondre pas, et c'est elle qui fait du rail une valeur de
    // croissance plutôt qu'un pari sur la conjoncture.
    c.fret = 0; c.voyageurs = 0; c.tonnage = 0;
    for (const m of this.marches) {
      if (m.villes.length < 2) continue;
      c.fret += m.peageCollecte || 0;
      c.tonnage += m.tonnageTransporte || 0;
      for (const v of m.villes) c.voyageurs += v.menages * P.voyageursParMenage;
    }
    c.recette = c.fret + c.voyageurs;
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
    return this.societes.filter(s => !s.locale).map(s => ({
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
