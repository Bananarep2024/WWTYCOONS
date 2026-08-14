// ---------------------------------------------------------------------------
// Le marché : formation des prix, rationnement.
//
// Règle centrale (§20) : le prix suit les FLUX, jamais le stock.
//   tension = besoins réels du mois ÷ production mise en vente
// Acheter pour stocker n'est pas un besoin et n'entre pas dans le calcul.
// Le matelas de stock protège l'approvisionnement, pas le cours.
// ---------------------------------------------------------------------------

import { P, RES, RESSOURCES } from './params.js';

export class Marche {
  constructor(villes) {
    this.villes = villes;               // les villes qui partagent ce marché
    this.stock = {};
    this.prix = {};
    this.besoins = {};                  // demande réelle du mois en cours
    this.entrees = {};                  // production mise en vente ce mois
    this.restants = {};                 // ce qui n'a pas encore été présenté au guichet
    this.service = {};                  // fraction du besoin réellement servie
    this.prixRevient = {};              // plancher local : le coût du meilleur
    for (const r of RESSOURCES) {
      this.stock[r] = 0;
      this.prix[r] = RES[r].prix;
      this.besoins[r] = 0;
      this.entrees[r] = 0;
      this.restants[r] = 0;
      this.service[r] = 1;
      this.prixRevient[r] = Infinity;
    }
    // Le péage ferroviaire : nul sur un marché d'une seule ville, puisque
    // aucune ligne ne le dessert. Il est prélevé sur les producteurs au moment
    // de la vente et reversé aux compagnies — rien n'est créé.
    this.peage = 0;
    this.peageCollecte = 0;
    // L'historique des cours : sans lui, le joueur ne voit qu'un instantané et
    // ne peut pas distinguer une pénurie qui s'installe d'un accident d'un mois.
    this.histoPrix = {};
    for (const r of RESSOURCES) this.histoPrix[r] = [];

    // LE GRAND LIVRE PAR VILLE.
    //
    // Un marché fusionné n'est pas un entrepôt unique où tout le monde puise au
    // même prorata. Ce qu'une ville produit alimente d'abord SES propres
    // besoins ; seul le surplus part chez la voisine. Sans cette règle, une
    // ville qui produit tout le blé se retrouvait rationnée à 60 % comme celle
    // qui n'en produit pas un grain — le rail ne reliait pas deux économies, il
    // les fondait en une seule bouillie.
    //
    // Le PRIX, lui, reste celui du marché entier : un marché relié a un cours,
    // c'est ce qui le définit. La priorité locale décide de qui obtient la
    // marchandise, jamais de ce qu'elle coûte.
    this.parVille = new Map();
    for (const v of villes) this.parVille.set(v, this.livreNeuf());
    this.serviceCommun = {};
    for (const r of RESSOURCES) this.serviceCommun[r] = 1;
  }

  livreNeuf() {
    const l = { stock: {}, besoins: {}, restants: {}, entrees: {}, serviceLocal: {} };
    for (const r of RESSOURCES) {
      l.stock[r] = 0; l.besoins[r] = 0; l.restants[r] = 0;
      l.entrees[r] = 0; l.serviceLocal[r] = 1;
    }
    return l;
  }

  // Le livre d'une ville. Une ville absente — cas des appels sans contexte —
  // retombe sur un livre commun, ce qui rend la priorité locale inopérante pour
  // elle plutôt que de lever une exception.
  livre(ville) {
    if (!ville) {
      if (!this._orphelin) this._orphelin = this.livreNeuf();
      return this._orphelin;
    }
    let l = this.parVille.get(ville);
    if (!l) { l = this.livreNeuf(); this.parVille.set(ville, l); }
    return l;
  }

  // Le stock total, recomposé depuis les livres : c'est lui qu'on affiche.
  recomposerStock() {
    for (const r of RESSOURCES) {
      let t = 0;
      for (const l of this.parVille.values()) t += l.stock[r];
      if (this._orphelin) t += this._orphelin.stock[r];
      this.stock[r] = t;
    }
  }

  get nom() { return this.villes.map(v => v.nom).join(' + '); }

  // --- Phase 1 : on déclare ------------------------------------------------

  demander(res, qte, ville) {
    this.besoins[res] += qte;
    this.livre(ville).besoins[res] += qte;
  }

  offrir(res, qte, ville) {
    this.entrees[res] += qte;
    this.stock[res] += qte;
    const l = this.livre(ville);
    l.entrees[res] += qte;
    l.stock[res] += qte;         // la marchandise appartient à la ville qui l'a sortie
  }

  // Le plancher, c'est le coût du MEILLEUR producteur — pas du pire.
  //
  // L'inverse a été essayé et c'était une catastrophe silencieuse : sur un
  // marché continental, la mine la plus misérable du continent tirait vers le
  // haut le prix du charbon partout. Ce prix devenait une rente pour toutes les
  // bonnes mines, qui atteignaient 90 % de rendement ; il ne descendait jamais,
  // donc la mine misérable survivait à l'équilibre exact et une mine de plus
  // s'ouvrait chaque mois — 890 mines de charbon en vingt ans. Et en aval,
  // l'aciérie payait cette rente sans pouvoir la répercuter.
  //
  // Le plancher juste est celui sous lequel même le producteur le plus efficace
  // vendrait à perte : là, l'offre s'effondrerait pour de bon. Au-dessus, c'est
  // à la tension de décider — et aux exploitations mal placées de s'arrêter,
  // ce que le seuil de marge négative fait déjà.
  declarerRevient(res, coutUnitaire) {
    this.prixRevient[res] = Math.min(this.prixRevient[res], coutUnitaire);
  }

  // --- Phase 2 : on fixe les prix ------------------------------------------

  fixerPrix() {
    for (const r of RESSOURCES) {
      const ref = RES[r].prix;
      let tension;
      if (this.entrees[r] <= 0.0001) {
        tension = this.besoins[r] > 0 ? P.tensionMax : 1;
      } else {
        tension = this.besoins[r] / this.entrees[r];
      }
      tension = Math.max(P.tensionMin, Math.min(P.tensionMax, tension));

      const cible = ref * Math.pow(tension, P.exposantPrix);
      // Le lissage est ce qui fait que les stocks « absorbent le coup » pendant
      // quelques mois avant que le prix ne s'envole.
      this.prix[r] += P.lissagePrix * (cible - this.prix[r]);

      const revient = Number.isFinite(this.prixRevient[r]) ? this.prixRevient[r] : 0;
      const bas = Math.max(ref * P.prixPlancher, revient);
      this.prix[r] = Math.max(bas, Math.min(ref * P.prixPlafond, this.prix[r]));
      this.prixRevient[r] = Infinity;

      const h = this.histoPrix[r];
      h.push(this.prix[r] / ref);
      if (h.length > P.histoireDesCours) h.shift();
    }
  }

  // --- Phase 3 : on sert ----------------------------------------------------
  // Quand les entrées plus le stock ne couvrent pas les besoins, chacun est
  // servi au prorata : usines, chantiers et entretien reçoivent la même
  // fraction de ce qu'ils demandent.
  //
  // Le service se recalcule avant chaque vague de la filière, sur le stock du
  // moment et sur ce qui n'a pas encore été présenté au guichet. Sans quoi les
  // ateliers du premier étage seraient servis sur un stock qui ne contient pas
  // encore la production du mois.

  ouvrirGuichet() {
    for (const r of RESSOURCES) this.restants[r] = this.besoins[r];
    for (const l of this.parVille.values()) {
      for (const r of RESSOURCES) l.restants[r] = l.besoins[r];
    }
    if (this._orphelin) for (const r of RESSOURCES) {
      this._orphelin.restants[r] = this._orphelin.besoins[r];
    }
  }

  // Deux taux au lieu d'un.
  //
  //   serviceLocal   ce qu'une ville tire de sa PROPRE production
  //   serviceCommun  ce que les villes en manque tirent du surplus des autres
  //
  // La ville qui produit assez est servie à 100 % quoi qu'il arrive ailleurs.
  // Celles qui manquent se partagent au prorata ce que les excédentaires n'ont
  // pas consommé.
  calculerService() {
    const livres = [...this.parVille.values()];
    if (this._orphelin) livres.push(this._orphelin);

    for (const r of RESSOURCES) {
      let surplus = 0, deficit = 0;
      for (const l of livres) {
        const besoin = l.restants[r], stock = l.stock[r];
        l.serviceLocal[r] = besoin <= 0.001 ? 1 : Math.max(0, Math.min(1, stock / besoin));
        surplus += Math.max(0, stock - besoin);
        deficit += Math.max(0, besoin - stock);
      }
      this.serviceCommun[r] = deficit <= 0.001 ? 1 : Math.max(0, Math.min(1, surplus / deficit));
      // Le taux du marché entier reste calculé : c'est lui qu'on affiche, et
      // c'est lui qui décrit la tension globale.
      this.service[r] = this.restants[r] <= 0.001 ? 1
        : Math.max(0, Math.min(1, this.stock[r] / this.restants[r]));
    }
  }

  // Retire du stock au prorata du service. Renvoie la quantité réellement
  // obtenue. C'est le seul point de sortie régulier du marché.
  prendre(res, qte, ville) {
    const l = this.livre(ville);

    // 1. Sa propre production, servie en priorité.
    const local = Math.min(qte * l.serviceLocal[res], l.stock[res]);
    l.stock[res] -= local;
    let servi = local;

    // 2. Ce qui manque va chercher le surplus des villes reliées, au prorata.
    const manque = qte - local;
    if (manque > 0.0001 && this.serviceCommun[res] > 0) {
      servi += this.puiserAilleurs(res, manque * this.serviceCommun[res], l);
    }

    l.restants[res] = Math.max(0, l.restants[res] - qte);
    this.restants[res] = Math.max(0, this.restants[res] - qte);
    // Le total suit la sortie réelle : `servi` est exactement ce qui a quitté
    // les livres, local et puisé confondus. Recomposer la somme à chaque prise
    // coûtait le double du temps de simulation pour le même résultat.
    this.stock[res] -= servi;
    return servi;
  }

  // Puise dans l'excédent des AUTRES villes, au prorata de ce que chacune a de
  // trop. Une ville ne cède jamais ce dont elle a encore besoin : c'est toute la
  // règle, et elle tient en cette soustraction.
  puiserAilleurs(res, veut, sauf) {
    const autres = [];
    let dispo = 0;
    for (const l of this.parVille.values()) {
      if (l === sauf) continue;
      const s = Math.max(0, l.stock[res] - l.restants[res]);
      if (s > 0) { autres.push([l, s]); dispo += s; }
    }
    if (this._orphelin && this._orphelin !== sauf) {
      const s = Math.max(0, this._orphelin.stock[res] - this._orphelin.restants[res]);
      if (s > 0) { autres.push([this._orphelin, s]); dispo += s; }
    }
    if (dispo <= 0.0001) return 0;

    const pris = Math.min(veut, dispo);
    for (const [l, s] of autres) l.stock[res] -= pris * (s / dispo);
    return pris;
  }

  // Achat spéculatif : ne compte pas dans les besoins, donc ne bouge pas le
  // prix. Il vide en revanche le matelas — au premier accroc de production, les
  // usines s'arrêtent faute d'intrants.
  rafler(res, qte, ville) {
    const l = this.livre(ville);
    let pris = Math.min(qte, l.stock[res]);
    l.stock[res] -= pris;
    if (pris < qte) pris += this.puiserAilleurs(res, qte - pris, l);
    this.stock[res] -= pris;
    return pris;
  }

  reinitialiser() {
    // On garde la trace des entrées du mois écoulé : c'est le seul indicateur
    // fiable de ce qu'une filière est capable de livrer, le stock de début de
    // mois ne disant rien quand la consommation se fait en juste-à-temps.
    this.entreesPrec = { ...this.entrees };
    this.peageCollecte = 0;
    for (const r of RESSOURCES) { this.besoins[r] = 0; this.entrees[r] = 0; }
    for (const l of this.parVille.values()) {
      for (const r of RESSOURCES) { l.besoins[r] = 0; l.entrees[r] = 0; }
    }
    if (this._orphelin) for (const r of RESSOURCES) {
      this._orphelin.besoins[r] = 0; this._orphelin.entrees[r] = 0;
    }
  }

  // Ce qu'une ressource peut raisonnablement fournir ce mois-ci : ce qu'elle a
  // livré le mois dernier, plus ce qui dort en stock.
  offreAttendue(res) {
    return (this.entreesPrec ? this.entreesPrec[res] || 0 : 0) + this.stock[res];
  }

  // Rapport prix / référence, pour l'affichage.
  indice(res) { return this.prix[res] / RES[res].prix; }
}
