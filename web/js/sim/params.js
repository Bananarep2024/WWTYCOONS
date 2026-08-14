// ---------------------------------------------------------------------------
// Le barème de référence, en code. Voir docs/00-BAREME.md — ce fichier en est
// la transcription littérale. Aucune valeur numérique du jeu ne doit exister
// ailleurs que dans ce fichier.
// ---------------------------------------------------------------------------

export const P = {
  moisParSeconde: 10,          // 1 mois = 10 s réelles
  salaireCase: 20,             // $ / mois, l'unité de compte de tout le jeu
  elasticiteSalaire: 0.50,     // le salaire suit la tension du marché du travail
  salairePlancher: 0.80,       // sans jamais tomber sous 16 $
  salairePlafond: 1.50,        // ni monter au-dessus de 30 $
  epargneVisee: 0.06,          // ce que le ménage doit pouvoir mettre de côté
  terrainRef: 100,             // $ la case, avant facteurs
  entretienAnnuel: 0.10,       // 10 % / an de la valeur bâtie, foncier exclu
  loyerBase: 5,                // $ / mois pour une maison au niveau 1

  // Marché
  exposantPrix: 0.60,          // tension^0,6
  lissagePrix: 0.28,           // calibré : 30 % de production retenue -> +19 % en 5 mois
  prixPlancher: 0.50,          // du prix de référence
  prixPlafond: 2.50,
  tensionMin: 0.20,
  tensionMax: 6.00,

  // Ville
  cibleProduits: 0.90,         // au-dessus, la ville cesse d'ajouter des manufactures
  // Un immeuble de bureaux pour tant de ménages.
  //
  // C'est le cadran de la croissance, et il est brutal. Les bureaux sont le seul
  // argent qui vienne du dehors — vingt postes qu'aucune entreprise locale ne
  // paie — donc le seul moyen d'employer une population que l'industrie locale
  // ne peut pas absorber. Mesuré sur six cartes et cent ans :
  //
  //   1/40  →   349 ménages · 18 % de chômage · Bourgs et Villes
  //   1/34  →   591 ménages · 16 % · quelques Grandevilles
  //   1/30  →  1 300 ménages · 15 % · Villes, Grandevilles, Métropoles
  //   1/26  →  2 944 ménages · 15 % · mais 158 cases libres : tout est saturé
  //   1/22  →  l'économie décroche — 30 % de chômage, 80 % de nourriture
  //
  // À 1/30 les Métropoles deviennent atteignables et le chômage BAISSE — les
  // bureaux emploient plus de bras qu'ils n'en amènent. Mesuré depuis, avec les
  // départs hétérogènes : 612 ménages par ville à vingt ans, 814 à quarante,
  // 874 à soixante, 16 % de chômage, nourriture à 100 %, et encore 2 538 cases
  // libres par territoire — la partie n'est pas finie.
  menagesParBureaux: 30,
  brasReservesAuxVivres: 0.15, // bras qu'on garde pour nourrir avant tout bureau
  emploiPourLoger: 0.86,       // on ne loge que dans une ville qui a du travail
  densifierSous: 0.25,         // quartier d'habitation rempli au 3/4 : on bâtit haut
  pivot: 0.80,                 // attractivité au-dessus de laquelle la ville attire

  // L'attractivité
  // attractivité = moyenne des trois baromètres × facteur d'aisance
  // aisance = revenu du ménage ÷ panier local — 1,00 = il boucle tout juste
  aisanceMin: 0.70,            // une ville où l'on ne boucle pas repousse
  aisanceMax: 1.20,            // une ville où l'on met de côté attire
  partMobile: 0.006,           // ce qui bouge chaque mois entre villes reliées
  cadenceDemo: 0.0035,         // % de population par mois et par point d'attractivité
  cadenceMax: 0.05,            // plafond ±5 % / mois
  exodeCritique: 0.05,         // seuil critique franchi -> -5 % / mois
  seuilsCritiques: { nourriture: 0.80, emploi: 0.50, produits: 0.20 },
  employesParMenage: 2,
  coefChantiers: 1.45,         // au-delà de la consommation : matériaux et entretien

  // Bâtiments
  seuilMatieres: 0.15,         // sous 15 % de ses besoins, un bâtiment s'arrête
  entretienSommeil: 0.10,      // 10 % de la masse salariale en sommeil
  moisAvantFermeture: 12,      // une case vide un an ferme
  moisAvantFaillite: 24,       // une affaire qui saigne deux ans ferme

  // Société
  apportJoueur: 1500,
  partFondateur: 0.10,
  actionsInitiales: 15000,
  // --- La bourse ---
  //
  // Le PER n'est pas un réglage, c'est un PRIX — et il se forme comme tous les
  // autres prix du jeu, par une tension entre une demande et une offre :
  //
  //   tension = capitaux cherchant un placement ÷ bénéfices annuels offerts
  //   PER ← PER + lissage × ( PER de référence × tension^exposant − PER )
  //
  // Il était jusqu'ici une fonction en escalier sur un `climat` qui n'était
  // jamais réassigné : une constante déguisée. Désormais le cycle ÉMERGE —
  // beaucoup de cash et peu de bénéfices à acheter, le multiple monte et les
  // cours montent plus vite que les profits ; économie molle, l'épargne
  // s'évapore et le multiple s'effondre.
  perReference: 10,
  perPlancher: 4,
  perPlafond: 22,
  lissageBourse: 0.04,         // un multiple de marché se déplace en années, pas en mois
  partEnBourse: 0.30,          // part de l'épargne des ménages dirigée vers la bourse
  beneficePlancher: 4000,      // sous ce total, la tension divergerait — et au premier
                               // mois aucune société n'a encore douze mois d'historique

  // --- Les compagnies de chemin de fer ---
  //
  // Une liaison EST une société : on y souscrit pendant les travaux, elle entre
  // en bourse le jour où la ligne s'ouvre, et elle vit ensuite d'un péage sur le
  // trafic qu'elle porte. C'est la valeur de croissance du jeu : son bénéfice
  // monte mécaniquement avec les villes qu'elle dessert.
  capitalParCaseDeVoie: 150,   // capital nominal d'une ligne, par case de longueur
  prixNominalAction: 10,       // une action de compagnie ferroviaire
  peageRail: 0.010,            // 1 % du chiffre d'affaires du marché desservi
  entretienVoie: 0.04,         // 4 % / an du capital nominal

  multipleNormal: 10,
  multipleEuphorie: 15,
  multipleCrise: 5,
  malusPerte: 3,               // une perte se répare : -3 × perte annuelle
  fenetreProfit: 12,           // mois glissants
  histoireDesCours: 180,       // mois de cours conservés par marchandise

  // Foncier
  facteurNiveau: [1.0, 1.3, 1.8, 2.6, 4.0],
  seuilsNiveau: [100, 250, 500, 1000, 2000],   // en ménages
  nomsNiveau: ['Comptoir', 'Bourg', 'Ville', 'Grandeville', 'Métropole'],
  // L'atténuation du prix du sol avec la distance à la gare, PAR NIVEAU.
  //
  // C'était une constante, et c'était l'erreur : le rapport centre / périphérie
  // restait alors figé pour toujours, et quand la ville montait d'un palier tout
  // le monde était multiplié par le même nombre. Or dans un hameau le centre ne
  // vaut guère plus que la lisière, tandis que dans une métropole il vaut vingt
  // fois plus. L'atténuation doit donc se DURCIR avec le niveau.
  //
  // Elle est PROPORTIONNELLE au facteur de niveau, et ce n'est pas un détail :
  // c'est la seule progression qui garantisse qu'aucune case ne perde jamais de
  // valeur quand la ville grandit. Une première version montait plus vite —
  // 0,020 à 0,130 — et une case de lisière passait alors de 271 à 257 $ au
  // passage au Bourg. « Mon terrain vaut moins parce que la ville a grandi » est
  // exactement ce qu'un joueur ne doit jamais lire.
  //
  //   attenuation[n] = 0,028 × facteurNiveau[n]
  //
  // Le potentiel de valorisation va alors de ×4,00 contre la gare à ×1,49 à
  // quarante-cinq cases, en croissant à chaque palier partout. Et c'est de là
  // que vient tout le reste : une résidence encaisse la hausse du sol par son
  // loyer, un atelier ne fait que la subir dans son prix de revient. L'économie
  // range la ville toute seule.
  attenuationDistance: [0.0280, 0.0364, 0.0504, 0.0728, 0.1120],
  partIndependants: 0.30,
  surprixIndependants: 1.20,   // ce qu'un indépendant fait payer sur une CASE
  anneesDeProfit: 3,           // un bâtiment vaut son terrain + 3 ans de profit
  // — le plancher est le terrain lui-même : voir prixRachatIndependant

  chantiersVilleParMois: 6,       // ce qu'une ville peut lancer en un mois
  dispersionDepart: 12,        // points d'écart tolérés à la pose initiale
  casesParMenage: 3.0,         // logement + postes : ce qu'un ménage occupe
  aisanceUrbaine: 1.20,        // marge sur le rayon utile — d'où les trous
  porteeExploitations: 2.2,    // une ferme a le droit de s'éloigner
  margeFondation: 2.4,         // le rayon de fondation anticipe le parc complet
  ampleurSurcapacite: 4.0,     // ×4 la surcapacité du tempérament, en excès d'offre
  dispersionVille: 18,         // et ensuite, quand la ville bâtit d'elle-même
  rendementMinimalPourBatir: 0.05,  // sous ce rendement attendu, on ne bâtit pas

  // Le sol
  // sortie d'une exploitation = débit de base × (solPlancher + solPente × qualité)
  // calibré pour valoir 1,00 à la qualité 3, comme le barème le suppose
  solPlancher: 0.46,
  solPente: 0.18,              // q1 = 0,64 · q3 = 1,00 · q5 = 1,36

  // --- Les événements ---
  //
  // Une économie qui ne connaît que sa propre mécanique devient prévisible : on
  // trouve la bonne trajectoire, on la répète, il n'y a plus rien à décider. Les
  // événements sont ce qui la casse.
  graceEvenements: 24,         // on laisse la partie s'installer avant le premier
  moisEntreEvenements: 30,     // un mois sur trente en déclenche un
  evenementsSimultanes: 2,     // empiler les catastrophes ne se joue plus, ça se subit
  partEvenementsLocaux: 0.62,  // le local est la règle — c'est lui qui rend le rail précieux

  secheresseMin: 0.45, secheresseMax: 0.78,   // ce que rend la terre pendant
  recolteMin: 1.20,    recolteMax: 1.55,
  immigrationMin: 0.12, immigrationMax: 0.35, // ménages en plus, si les logements suivent
  grippeMin: 0.06,     grippeMax: 0.18,       // ménages emportés
  regimeDeGreve: 0.35,         // à quel régime tourne un atelier en grève
  hausseExigee: 0.14,          // ce que la grève réclame sur le salaire
  boomMin: 0.35,       boomMax: 0.90,         // l'épargne gonflée par des capitaux du dehors

  // Les vocations : ce qui fait des zones plutôt qu'une carte uniforme
  //
  // Chaque ville reçoit un plafond de qualité par ressource. Deux ressources
  // montent à 5, une à 3 ou 4, deux plafonnent à 1 ou 2 — de sorte qu'aucune
  // ville ne se suffit à elle-même et que le rail transporte enfin autre chose
  // que des marchandises que l'autre bout produisait déjà.
  vocationRiche: 5,
  vocationMoyenMin: 3, vocationMoyenMax: 4,
  vocationPauvreMin: 1, vocationPauvreMax: 2,
  // La portée de la vocation, en cases : l'écart-type de la gaussienne qui
  // mélange les plafonds de deux villes voisines. À peu près le rayon d'une
  // ville, de sorte qu'un territoire lit sa propre vocation presque pure et que
  // le dégradé se joue dans l'entre-deux, sur la terre que personne n'occupe
  // encore.
  porteeVocation: 30,

  // Amorçage
  stockAmorcage: { planches: 800, briques: 400 },

  // Carte — une seule grille pour tout le monde
  //
  // La taille n'est pas décorative : elle décide du dernier palier atteignable.
  // Une Métropole, c'est 2 000 ménages ; au plein emploi chacun réclame deux
  // postes, un poste occupe une case — cinq pour un bureau — et le logement en
  // prend une de plus. Il faut donc de l'ordre de 3 800 cases par territoire, et
  // les paliers de 1 000 et 2 000 ménages restaient décoratifs sur l'ancienne
  // grille de 190 × 130, où une ville saturait vers 400.
  largeurMonde: 380,
  hauteurMonde: 265,
  margeMonde: 22,              // on ne fonde pas une ville au bord de la carte
  rayonVille: 44,              // rayon moyen d'un territoire, dévié par ville
  distanceMinVilles: 94,       // de centre à centre : sans quoi le rail n'a pas de sens
  moisParCaseDeVoie: 0.24,     // durée d'un chantier, à la case de longueur
  // Elle valait 0,42 quand les cinq lignes se construisaient EN PARALLÈLE. La
  // compagnie n'en pose plus qu'une à la fois, si bien que les durées
  // s'additionnent au lieu de se recouvrir : le réseau ne s'achevait qu'au mois
  // 312 à 366, et une ville sur deux mourait d'être restée isolée vingt-cinq
  // ans. Elle est ensuite passée de 0,12 à 0,24 quand la voie a cessé d'être
  // posée par ses deux bouts : une équipe qui part d'une seule gare met deux
  // fois plus longtemps à rejoindre l'autre, et le chiffre doit le dire.     // une ligne longue demande plus de travail
  menagesInitiaux: 55,         // avant le tempérament, qui l'étire de 0,80 à 1,20
};

// --- Ressources -------------------------------------------------------------
// prix = prix de référence, celui qui s'établit quand la demande égale l'offre.

export const RES = {
  bois:      { nom: 'Bois',      prix: 1,    couleur: '#7a6a4f', extractible: true  },
  argile:    { nom: 'Argile',    prix: 1,    couleur: '#a56b4a', extractible: true  },
  charbon:   { nom: 'Charbon',   prix: 1,    couleur: '#3d3d42', extractible: true  },
  minerai:   { nom: 'Minerai',   prix: 1,    couleur: '#6b5b73', extractible: true  },
  cereales:  { nom: 'Céréales',  prix: 2.40, couleur: '#c9a227', extractible: true  },
  betail:    { nom: 'Bétail',    prix: 2.40, couleur: '#b08968', extractible: true  },
  planches:  { nom: 'Planches',  prix: 5,    couleur: '#b5894f', extractible: false },
  briques:   { nom: 'Briques',   prix: 5,    couleur: '#9c4a35', extractible: false },
  acier:     { nom: 'Acier',     prix: 15,   couleur: '#5a7d8c', extractible: false },
  pain:      { nom: 'Pain',      prix: 12,   couleur: '#d9a441', extractible: false },
  viande:    { nom: 'Viande',    prix: 12,   couleur: '#a83f3f', extractible: false },
  produits:  { nom: 'Produits',  prix: 17,   couleur: '#4f7d5a', extractible: false },
};

export const RESSOURCES = Object.keys(RES);

// Les deux nourritures sont substituables 1 pour 1 : le ménage veut une ration
// par mois, pas une demi-ration de chaque. Il mange ce qu'il y a.
export const NOURRITURES = ['pain', 'viande'];

// --- Bâtiments --------------------------------------------------------------
// cases : emprise. w × h : forme posée sur la carte.
// Les débits sont donnés PAR CASE : un bâtiment de n cases a n employés et
// produit n fois ces quantités. (§20 : « une case, un employé, une production »)

export const BAT = {
  coupe:       { nom: 'Coupe forestière', cases: 1, w: 1, h: 1, sort: 'bois',     debit: 24, intrants: {}, cout: 260, mat: { planches: 52 }, qual: 'bois',      cat: 'expl' },
  carriere:    { nom: 'Carrière',         cases: 1, w: 1, h: 1, sort: 'argile',   debit: 24, intrants: {}, cout: 260, mat: { planches: 52 }, qual: 'argile',    cat: 'expl' },
  mineCharbon: { nom: 'Mine de charbon',  cases: 1, w: 1, h: 1, sort: 'charbon',  debit: 24, intrants: {}, cout: 260, mat: { planches: 52 }, qual: 'charbon',   cat: 'expl' },
  mineFer:     { nom: 'Mine de fer',      cases: 1, w: 1, h: 1, sort: 'minerai',  debit: 24, intrants: {}, cout: 260, mat: { planches: 52 }, qual: 'minerai',   cat: 'expl' },
  ferme:       { nom: 'Ferme céréalière', cases: 2, w: 2, h: 1, sort: 'cereales', debit: 10, intrants: {}, cout: 260, mat: { planches: 52 }, qual: 'fertilite', cat: 'expl' },
  ranch:       { nom: 'Ranch',            cases: 2, w: 2, h: 1, sort: 'betail',   debit: 10, intrants: {}, cout: 260, mat: { planches: 52 }, qual: 'fertilite', cat: 'expl' },

  scierie:     { nom: 'Scierie',      cases: 2, w: 2, h: 1, sort: 'planches', debit: 12, intrants: { bois: 24 },              cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  briqueterie: { nom: 'Briqueterie',  cases: 2, w: 2, h: 1, sort: 'briques',  debit: 12, intrants: { argile: 24 },            cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  minoterie:   { nom: 'Minoterie',    cases: 2, w: 2, h: 1, sort: 'pain',     debit: 5,  intrants: { cereales: 10 },          cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  abattoir:    { nom: 'Abattoir',     cases: 2, w: 2, h: 1, sort: 'viande',   debit: 5,  intrants: { betail: 10 },            cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  acierie:     { nom: 'Aciérie',      cases: 4, w: 2, h: 2, sort: 'acier',    debit: 6,  intrants: { charbon: 24, minerai: 24 }, cout: 810, mat: { planches: 30, briques: 42, acier: 30 }, cat: 'trans' },
  manufacture: { nom: 'Manufacture',  cases: 4, w: 2, h: 2, sort: 'produits', debit: 6,  intrants: { planches: 6, acier: 2 }, cout: 680, mat: { planches: 40, briques: 36, acier: 20 }, cat: 'manu' },

  maison:    { nom: 'Maison',              cases: 1, w: 1, h: 1, menages: 1,  cout: 180, mat: { planches: 24, briques: 12 }, cat: 'loge' },
  immeuble:  { nom: 'Immeuble',            cases: 4, w: 2, h: 2, menages: 20, cout: 925, mat: { briques: 65, acier: 40 },    cat: 'loge' },
  bureaux:   { nom: 'Immeuble de bureaux', cases: 4, w: 2, h: 2, postes: 20,  cout: 500, mat: { briques: 40, acier: 20 },    cat: 'bur'  },
  entrepot:  { nom: 'Entrepôt',            cases: 4, w: 2, h: 2, capacite: 2000, cout: 100, mat: { planches: 20 },           cat: 'neg'  },
};

export const TYPES_BAT = Object.keys(BAT);

// Coût total de construction d'un bâtiment, en quantités de matériaux.
export function materiaux(type) {
  const b = BAT[type], out = {};
  for (const [r, q] of Object.entries(b.mat)) out[r] = q * b.cases;
  return out;
}

// Valeur des matériaux au prix de référence (sert de repère, pas de facture :
// la facture réelle est établie au prix du marché local du jour).
export function coutRef(type) {
  let t = 0;
  for (const [r, q] of Object.entries(materiaux(type))) t += q * RES[r].prix;
  return t;
}

// Entretien mensuel : 10 % / an de la valeur bâtie, foncier exclu.
// Il ne se contracte jamais — c'est lui qui borne les pertes.
export function entretien(type, valeurBatie) {
  return (valeurBatie ?? coutRef(type)) * P.entretienAnnuel / 12;
}

// Le rendement annuel que chaque palier est censé rendre, à cent pour cent
// d'utilisation et aux prix de référence, entretien déduit. C'est de lui que le
// barème déduit les coûts de construction — et c'est la seule référence qui
// permette de dire si un bâtiment tient sa promesse.
export const RENDEMENT_VISE = {
  expl: 0.15, trans: 0.20, manu: 0.25, bur: 0.12, neg: 0,
};

export function rendementVise(type) {
  const b = BAT[type];
  if (b.cat === 'loge') return type === 'maison' ? 0.15 : 0.20;
  return RENDEMENT_VISE[b.cat] ?? 0.15;
}

// --- Terrain ----------------------------------------------------------------

export const RELIEFS = {
  plaine:   { nom: 'Plaine',   couleur: '#7f9455', biais: { fertilite: 2.1, argile: 1.6, bois: 0.5, charbon: 0.20, minerai: 0.15 } },
  foret:    { nom: 'Forêt',    couleur: '#3f6238', biais: { fertilite: 0.9, argile: 0.6, bois: 2.5, charbon: 0.35, minerai: 0.25 } },
  colline:  { nom: 'Colline',  couleur: '#8d8055', biais: { fertilite: 0.6, argile: 1.0, bois: 0.9, charbon: 2.3, minerai: 1.0 } },
  montagne: { nom: 'Montagne', couleur: '#7d7a80', biais: { fertilite: 0.15, argile: 0.4, bois: 0.3, charbon: 1.2, minerai: 2.6 } },
};

export const QUALITES = ['fertilite', 'argile', 'bois', 'charbon', 'minerai'];

// Le niveau d'une ville, d'après son nombre de ménages.
export function niveauVille(menages) {
  let n = 1;
  for (let i = 0; i < P.seuilsNiveau.length; i++) if (menages >= P.seuilsNiveau[i]) n = i + 1;
  return Math.min(n, 5);
}

// Ce qu'une case de sol rend, rapporté à une terre moyenne.
//
// Le barème est calibré sur la qualité 3. Une proportionnalité stricte —
// sortie = base × q ÷ 3 — donnerait de 0,33 à 1,67, mais comme le salaire est
// un coût FIXE, ce facteur 5 sur l'écart de production devient un facteur 5
// sur la MARGE : une coupe forestière rapporterait 99 % l'an sur qualité 5 et
// perdrait 68 % sur qualité 1. La courbe est donc resserrée.
export function facteurQualite(q) {
  return P.solPlancher + P.solPente * q;
}

// Prix d'une case de terrain.
//
//   100 $ × facteur de niveau × facteur de distance × facteur de richesse
//
// Le dernier terme est ce qui empêche la bonne terre d'être une rente gratuite :
// une case qui rend davantage vaut davantage, et la rente se capitalise dans le
// prix du sol au lieu de tomber dans la poche du premier arrivé. C'est aussi ce
// qui donne son sel à l'achat précoce — la terre est chère AVANT qu'on ait bâti.
export function prixTerrain(niveau, distanceGare, richesse = 3) {
  const fn = P.facteurNiveau[niveau - 1];
  const fd = 1 / (1 + P.attenuationDistance[niveau - 1] * distanceGare);
  // Le sol se paie EXACTEMENT ce qu'il rend : le facteur de richesse est la loi
  // de rendement elle-même, et non un barème séparé.
  //
  // Il y en avait un, réglé à 0,35 de plancher et 4 d'exposant, qui étalait le
  // prix de la terre sur un rapport de 15 entre la pire et la meilleure — quand
  // le rendement, lui, ne varie que d'un rapport de 2,1. La prime foncière valait
  // donc sept fois la rente qu'elle prétendait capitaliser.
  //
  // Tant que le sol était excellent presque partout, cela ne se voyait pas :
  // le terme était une quasi-constante. Depuis que les villes ont des vocations
  // tranchées, il domine tout — mesuré, 58 % du prix venait de la richesse et
  // 42 % seulement de la distance, si bien qu'une case de lisière sur un bon
  // filon coûtait plus cher qu'une case du centre sur une terre pauvre. La carte
  // du prix du sol montrait alors des villes au centre bon marché.
  const fq = facteurQualite(richesse);
  return P.terrainRef * fn * fd * fq;
}

// Ce que cette case vaudra si la ville va au bout, rapporté à ce qu'elle vaut
// aujourd'hui.
//
// C'est le seul chiffre qui distingue le centre de la périphérie, puisque le
// rendement, lui, est le même partout à tout instant — le loyer étant indexé sur
// le foncier, il s'ajuste et le taux ne bouge pas. Ce qui diffère, c'est la
// PENTE : bâtir au centre en début de partie, c'est acheter un loyer qui
// quadruplera ; bâtir en lisière, c'est acheter un loyer qui gagnera 11 %.
export function potentielTerrain(niveau, distanceGare, richesse = 3) {
  const ici = prixTerrain(niveau, distanceGare, richesse);
  if (ici <= 0) return 1;
  return prixTerrain(P.facteurNiveau.length, distanceGare, richesse) / ici;
}

// La meilleure ressource d'une case décide de ce qu'elle vaut : le sol se paie
// à son meilleur usage, pas à celui qu'on en fait. Une case fictive — celle des
// devis, qui n'a pas encore de coordonnées — vaut la terre moyenne.
export function qualiteMax(c) {
  if (!c || !c.q) return 3;
  let m = 1;
  for (const q of QUALITES) if (c.q[q] > m) m = c.q[q];
  return m;
}

// Loyer mensuel d'un logement plein : il découle du foncier, pas d'un barème.
// loyer = rendement × (terrain + construction) ÷ 12 + entretien
export function loyer(type, terrain, construction) {
  const rdt = type === 'maison' ? 0.15 : 0.20;
  return rdt * (terrain + construction) / 12 + construction * P.entretienAnnuel / 12;
}
