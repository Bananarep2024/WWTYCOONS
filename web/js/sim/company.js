// ---------------------------------------------------------------------------
// La société.
//
// Un joueur ne possède presque rien en propre. Il possède 10 % d'une société
// qu'il dirige, et cette société possède tout le reste. Sa fortune, celle qui
// décide de la victoire, c'est son argent liquide plus la valeur en bourse des
// actions qu'il détient.
// ---------------------------------------------------------------------------

import { P, RESSOURCES, materiaux } from './params.js';

let _id = 1;

export class Societe {
  constructor(nom, couleur, estJoueur = false) {
    this.id = `S${_id++}`;
    this.nom = nom;
    this.couleur = couleur;
    this.estJoueur = estJoueur;

    this.tresorerie = P.apportJoueur / P.partFondateur;   // 15 000 $
    this.actions = P.actionsInitiales;
    this.dette = 0;
    this.batiments = [];
    this.chantiers = [];
    this.stocks = {};                 // par ville : { ressource: quantité }
    this.histoCours = [];
    this.faillite = false;

    // Le porteur détient 10 % ; les 90 % restants sont au public.
    this.parts = { [this.id + ':fondateur']: P.actionsInitiales * P.partFondateur };
  }

  partDe(qui) { return (this.parts[qui] || 0) / this.actions; }

  // --- Patrimoine ----------------------------------------------------------

  actifNet(multiple) {
    let v = this.tresorerie - this.dette;
    for (const b of this.batiments) v += b.valeur(multiple);
    for (const c of this.chantiers) v += c.engage;   // le cash immobilisé dans les trous
    return v;
  }

  cours(multiple) { return Math.max(0.01, this.actifNet(multiple) / this.actions); }

  // Le cours retenu pour le décompte final est la moyenne des douze derniers
  // mois, jamais celui de la dernière seconde : sans cette précaution la partie
  // se déciderait sur une manipulation de dernière minute.
  coursMoyen() {
    if (!this.histoCours.length) return 1;
    return this.histoCours.reduce((a, b) => a + b, 0) / this.histoCours.length;
  }

  enregistrerCours(multiple) {
    this.histoCours.push(this.cours(multiple));
    if (this.histoCours.length > P.fenetreProfit) this.histoCours.shift();
  }

  // --- Entrepôts et stocks -------------------------------------------------
  // L'entrepôt est le droit d'entrée sur un marché : sans entrepôt sur place,
  // une société ne peut ni acheter ni stocker dans cette ville.

  entrepotDans(ville) {
    return this.batiments.some(b => b.ville === ville && b.def.cat === 'neg');
  }

  capaciteDans(ville) {
    return this.batiments
      .filter(b => b.ville === ville && b.def.cat === 'neg')
      .reduce((s, b) => s + b.def.capacite, 0);
  }

  stockDe(ville) {
    if (!this.stocks[ville.id]) this.stocks[ville.id] = {};
    return this.stocks[ville.id];
  }

  stocker(ville, res, qte) {
    const s = this.stockDe(ville);
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    const place = Math.max(0, this.capaciteDans(ville) - total);
    const mis = Math.min(qte, place);
    s[res] = (s[res] || 0) + mis;
    return qte - mis;                 // ce qui n'a pas pu entrer
  }

  // --- Comptes -------------------------------------------------------------

  encaisser(m) { this.tresorerie += m; }

  peutPayer(m) { return this.tresorerie >= m; }

  payer(m) {
    this.tresorerie -= m;
    if (this.tresorerie < 0) this.faillite = true;
    return true;
  }

  get resultatMensuel() {
    return this.batiments.reduce((s, b) => s + b.resultat, 0);
  }

  get masseSalariale() {
    return this.batiments.reduce((s, b) =>
      s + b.masseSalarialePleine * (b.tauxReel || 0), 0);
  }
}

// ---------------------------------------------------------------------------
// Le chantier.
//
// On lance un chantier dès qu'on a le cash — rien n'oblige à attendre les
// planches. Le cash part immédiatement, le chantier entre au carnet, et il
// reste un trou dans le sol tant que la totalité des matériaux n'est pas
// arrivée. Cette commande n'est pas une intention : c'est une demande réelle
// sur le marché, au même titre que le pain d'un ménage.
// ---------------------------------------------------------------------------

let _cid = 1;

export class Chantier {
  constructor(type, ville, cases, societe, coutTerrain) {
    this.id = _cid++;
    this.type = type;
    this.ville = ville;
    this.cases = cases;
    this.societe = societe;
    this.ouvertLe = 0;
    this.engage = coutTerrain;
    this.restant = materiaux(type);          // ce qu'il attend encore
    this.recu = {};
    for (const r of Object.keys(this.restant)) this.recu[r] = 0;
  }

  // Un chantier est achevé quand il ne lui manque plus rien d'utile. La
  // tolérance n'est pas une facilité : le rationnement au prorata fait décroître
  // le reliquat géométriquement, si bien qu'il resterait éternellement un
  // millième de brique et que le chantier ne sortirait jamais de terre.
  get complet() {
    return Object.values(this.restant).every(q => q < 0.5);
  }

  // Part de main-d'œuvre mobilisée : les bras suivent les matériaux, pas le
  // calendrier. Un chantier à l'arrêt ne mobilise personne.
  get postesDemandes() {
    const tot = Object.values(materiaux(this.type)).reduce((a, b) => a + b, 0);
    const res = Object.values(this.restant).reduce((a, b) => a + b, 0);
    return (1 - res / tot) > 0 ? this.cases.length * 0.5 : 0;
  }

  progression() {
    if (this.complet) return 1;
    const tot = Object.values(materiaux(this.type)).reduce((a, b) => a + b, 0);
    const res = Object.values(this.restant).reduce((a, b) => a + b, 0);
    return Math.min(0.99, 1 - res / tot);
  }
}
