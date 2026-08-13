// ---------------------------------------------------------------------------
// Le barème de référence, en code. Voir docs/00-BAREME.md — ce fichier en est
// la transcription littérale. Aucune valeur numérique du jeu ne doit exister
// ailleurs que dans ce fichier.
// ---------------------------------------------------------------------------

export const P = {
  moisParSeconde: 10,          // 1 mois = 10 s réelles
  salaireCase: 20,             // $ / mois, l'unité de compte de tout le jeu
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
  pivot: 0.80,                 // moyenne des baromètres au-dessus de laquelle on croît
  cadenceDemo: 0.002,          // 0,2 % de la population par mois et par point d'écart
  cadenceMax: 0.05,            // plafond ±5 % / mois
  exodeCritique: 0.05,         // seuil critique franchi -> -5 % / mois
  seuilsCritiques: { nourriture: 0.80, emploi: 0.50, produits: 0.20 },
  employesParMenage: 2,
  coefChantiers: 1.45,         // au-delà de la consommation : matériaux et entretien

  // Bâtiments
  seuilMatieres: 0.15,         // sous 15 % de ses besoins, un bâtiment s'arrête
  entretienSommeil: 0.10,      // 10 % de la masse salariale en sommeil
  moisAvantFermeture: 12,      // une case vide un an ferme

  // Société
  apportJoueur: 1500,
  partFondateur: 0.10,
  actionsInitiales: 15000,
  multipleNormal: 10,
  multipleEuphorie: 15,
  multipleCrise: 5,
  malusPerte: 3,               // une perte se répare : -3 × perte annuelle
  fenetreProfit: 12,           // mois glissants

  // Foncier
  facteurNiveau: [1.0, 1.3, 1.8, 2.6, 4.0],
  seuilsNiveau: [100, 250, 500, 1000, 2000],   // en ménages
  nomsNiveau: ['Comptoir', 'Bourg', 'Ville', 'Grandeville', 'Métropole'],
  attenuationDistance: 0.04,   // 1 / (1 + 0,04 × cases)
  partIndependants: 0.30,
  surprixIndependants: 1.20,

  // Amorçage
  stockAmorcage: { planches: 800, briques: 400 },

  // Carte
  tailleVille: 48,             // 48 × 48 pour la démo (64 en production)
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
  coupe:       { nom: 'Coupe forestière', cases: 1, w: 1, h: 1, sort: 'bois',     debit: 24, intrants: {}, cout: 130, mat: { planches: 26 }, qual: 'bois',      cat: 'expl' },
  carriere:    { nom: 'Carrière',         cases: 1, w: 1, h: 1, sort: 'argile',   debit: 24, intrants: {}, cout: 130, mat: { planches: 26 }, qual: 'argile',    cat: 'expl' },
  mineCharbon: { nom: 'Mine de charbon',  cases: 1, w: 1, h: 1, sort: 'charbon',  debit: 24, intrants: {}, cout: 130, mat: { planches: 26 }, qual: 'charbon',   cat: 'expl' },
  mineFer:     { nom: 'Mine de fer',      cases: 1, w: 1, h: 1, sort: 'minerai',  debit: 24, intrants: {}, cout: 130, mat: { planches: 26 }, qual: 'minerai',   cat: 'expl' },
  ferme:       { nom: 'Ferme céréalière', cases: 2, w: 2, h: 1, sort: 'cereales', debit: 10, intrants: {}, cout: 130, mat: { planches: 26 }, qual: 'fertilite', cat: 'expl' },
  ranch:       { nom: 'Ranch',            cases: 2, w: 2, h: 1, sort: 'betail',   debit: 10, intrants: {}, cout: 130, mat: { planches: 26 }, qual: 'fertilite', cat: 'expl' },

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

// --- Terrain ----------------------------------------------------------------

export const RELIEFS = {
  plaine:   { nom: 'Plaine',   couleur: '#8fa361', biais: { fertilite: 2.0, argile: 1.5, bois: 0.6, charbon: 0.3, minerai: 0.2 } },
  foret:    { nom: 'Forêt',    couleur: '#4f7042', biais: { fertilite: 0.9, argile: 0.6, bois: 2.4, charbon: 0.4, minerai: 0.3 } },
  colline:  { nom: 'Colline',  couleur: '#9c8f6a', biais: { fertilite: 0.7, argile: 1.0, bois: 0.9, charbon: 2.0, minerai: 1.1 } },
  montagne: { nom: 'Montagne', couleur: '#8a8a92', biais: { fertilite: 0.2, argile: 0.5, bois: 0.4, charbon: 1.3, minerai: 2.4 } },
};

export const QUALITES = ['fertilite', 'argile', 'bois', 'charbon', 'minerai'];

// Le niveau d'une ville, d'après son nombre de ménages.
export function niveauVille(menages) {
  let n = 1;
  for (let i = 0; i < P.seuilsNiveau.length; i++) if (menages >= P.seuilsNiveau[i]) n = i + 1;
  return Math.min(n, 5);
}

// Prix d'une case de terrain : 100 $ × facteur de niveau × facteur de distance.
export function prixTerrain(niveau, distanceGare) {
  const fn = P.facteurNiveau[niveau - 1];
  const fd = 1 / (1 + P.attenuationDistance * distanceGare);
  return P.terrainRef * fn * fd;
}

// Loyer mensuel d'un logement plein : il découle du foncier, pas d'un barème.
// loyer = rendement × (terrain + construction) ÷ 12 + entretien
export function loyer(type, terrain, construction) {
  const rdt = type === 'maison' ? 0.15 : 0.20;
  return rdt * (terrain + construction) / 12 + construction * P.entretienAnnuel / 12;
}
