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
  }

  get nom() { return this.villes.map(v => v.nom).join(' + '); }

  // --- Phase 1 : on déclare ------------------------------------------------

  demander(res, qte) { this.besoins[res] += qte; }
  offrir(res, qte) { this.entrees[res] += qte; this.stock[res] += qte; }

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
  }

  calculerService() {
    for (const r of RESSOURCES) {
      this.service[r] = this.restants[r] <= 0.001 ? 1
        : Math.max(0, Math.min(1, this.stock[r] / this.restants[r]));
    }
  }

  // Retire du stock au prorata du service. Renvoie la quantité réellement
  // obtenue. C'est le seul point de sortie régulier du marché.
  prendre(res, qte) {
    const servi = Math.min(qte * this.service[res], this.stock[res]);
    this.stock[res] -= servi;
    this.restants[res] = Math.max(0, this.restants[res] - qte);
    return servi;
  }

  // Achat spéculatif : ne compte pas dans les besoins, donc ne bouge pas le
  // prix. Il vide en revanche le matelas — au premier accroc de production, les
  // usines s'arrêtent faute d'intrants.
  rafler(res, qte) {
    const pris = Math.min(qte, this.stock[res]);
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
  }

  // Ce qu'une ressource peut raisonnablement fournir ce mois-ci : ce qu'elle a
  // livré le mois dernier, plus ce qui dort en stock.
  offreAttendue(res) {
    return (this.entreesPrec ? this.entreesPrec[res] || 0 : 0) + this.stock[res];
  }

  // Rapport prix / référence, pour l'affichage.
  indice(res) { return this.prix[res] / RES[res].prix; }
}
