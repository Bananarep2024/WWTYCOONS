// ---------------------------------------------------------------------------
// Le marché : formation des prix, rationnement.
//
// Règle centrale (§20) : le prix suit les FLUX.
//   tension = besoins effectifs du mois ÷ production mise en vente
// Acheter pour stocker n'est toujours pas un besoin et n'entre pas dans le
// calcul. Mais les besoins effectifs comprennent le rattrapage du matelas de
// sécurité (§4.2 bis) : le marché veut tenir un mois de consommation en cave,
// et l'écart à ce mois-là, étalé sur six, s'ajoute ou se retranche.
//
// Sans ce terme, un tas une fois constitué devenait INVISIBLE : les flux se
// rééquilibraient autour de lui, la tension revenait à 1, et plus rien ne le
// mangeait ni ne le faisait grossir.
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
    // LA COMMISSION DE FRET : nulle sur un marché d'une seule ville, puisque
    // aucune ligne ne le dessert.
    //
    // Elle ENTRE DANS LE PRIX. Un marché relié cote son prix RENDU, port
    // compris : la référence autour de laquelle le cours se forme est majorée de
    // la commission, si bien que l'acheteur paie l'acheminement et que le
    // producteur encaisse toujours son prix départ. Le rail ne prend rien au
    // producteur — il facture un service à celui qui en profite.
    this.fret = 0;
    this.peageCollecte = 0;
    // Ce qui a réellement franchi une frontière de ville ce mois-ci, en valeur :
    // sert à montrer le trafic, jamais à calculer la recette.
    this.tonnageTransporte = 0;
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
    const l = { stock: {}, besoins: {}, restants: {}, entrees: {}, serviceLocal: {}, debit: {} };
    for (const r of RESSOURCES) {
      l.stock[r] = 0; l.besoins[r] = 0; l.restants[r] = 0;
      l.entrees[r] = 0; l.serviceLocal[r] = 1; l.debit[r] = 0;
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

  // Le matelas que le marché cherche à tenir sur une ressource : un mois de la
  // consommation qu'il vient de constater.
  matelasVise(res) { return P.matelasMois * this.besoins[res]; }

  fixerPrix() {
    for (const r of RESSOURCES) {
      // LE PRIX D'UN MARCHÉ RELIÉ EST UN PRIX RENDU. La référence autour de
      // laquelle il se forme porte la commission de fret : c'est ainsi que le
      // port entre dans le cours, et non dans la poche du producteur.
      const ref = RES[r].prix * (1 + this.fret);

      // Le besoin qui fait le prix n'est plus la seule consommation du mois :
      // c'est elle plus ce qu'il faut acheter pour ramener la cave au matelas.
      // À la cave pleine ce terme est négatif et fait tomber le prix — c'est
      // par là qu'un tas cesse d'être invisible.
      //
      // Il est BORNÉ à une fraction de la consommation, et cette borne n'est pas
      // un garde-fou de confort : sans elle, une ville neuve se fait tuer par
      // son propre amorçage. Elle démarre avec 3 000 planches et des besoins
      // minuscules — des dizaines de mois de couverture — si bien que le terme
      // de rattrapage annulait ses besoins effectifs, écrasait le prix des
      // planches, et personne n'y bâtissait de scierie. L'amorçage épuisé, la
      // ville n'avait aucune industrie du bois et s'éteignait. Sur la graine 7,
      // deux villes sur cinq y sont mortes avant le mois 60.
      //
      // Le matelas MODULE le signal de prix, il ne le remplace pas. Et la borne
      // doit être serrée : à ±0,50 il restait deux villes mortes sur quarante,
      // à ±0,80 une. Un quart de la consommation est déjà assez de latitude
      // pour effacer une ville jeune du marché.
      const brut = (this.matelasVise(r) - this.stock[r]) / P.moisDeRestockage;
      const borne = P.correctionMatelas * this.besoins[r];
      const ecart = Math.max(-borne, Math.min(borne, brut));
      const besoinsEff = Math.max(0, this.besoins[r] + ecart);

      let tension;
      if (this.entrees[r] <= 0.0001) {
        tension = besoinsEff > 0 ? P.tensionMax : 1;
      } else {
        tension = besoinsEff / this.entrees[r];
      }
      tension = Math.max(P.tensionMin, Math.min(P.tensionMax, tension));

      const cible = ref * Math.pow(tension, P.exposantPrix);
      // Le lissage est ce qui fait que les stocks « absorbent le coup » pendant
      // quelques mois avant que le prix ne s'envole.
      this.prix[r] += P.lissagePrix * (cible - this.prix[r]);

      // Le plancher au prix de revient du producteur le plus efficace reste
      // intact. Le retirer sur un marché engorgé a été essayé — c'est ce qui
      // achève le plus vite un troupeau invendable — mais il ne protège pas
      // que l'éleveur : il tient toute la filière lourde. Sans lui, le
      // baromètre des produits tombait de 97 % à 57 %. Ce n'est pas le prix à
      // payer pour vider une cave.
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
      const venuDAilleurs = this.puiserAilleurs(res, manque * this.serviceCommun[res], l);
      servi += venuDAilleurs;
      // Ce qui a franchi une frontière de ville : le vrai trafic marchandises.
      this.tonnageTransporte += venuDAilleurs * this.prix[res];
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

  // --- Phase 6 : la garde ---------------------------------------------------
  // Ce qui dort au-dessus du matelas s'abîme. La marchandise pourrit là où elle
  // est : la perte se calcule donc livre par livre, sur le stock de chaque
  // ville.
  //
  // Le matelas d'une ville est un mois de son DÉBIT, pas de sa consommation :
  // le plus grand des deux entre ce qu'elle consomme et ce qu'elle sort. C'est
  // la seule mesure juste sous la règle du service local. Une ville minière
  // garde dans son propre livre le charbon qu'elle destine à l'export ; ses
  // besoins locaux sont nuls, et un matelas calé sur eux ferait pourrir chaque
  // mois la totalité de ce qu'elle allait vendre à la voisine — mesuré : 1 065
  // ménages au lieu de 1 889 et sept villes sur vingt en crise.
  //
  // Un matelas commun au marché entier n'allait pas non plus : la perte y était
  // répartie au prorata sur tous les livres, si bien que la ville qui n'avait
  // rien en trop payait pour le tas de la voisine. Sur la graine 12345, deux
  // villes sur cinq y sont mortes pendant qu'une sixième doublait.
  // `mois` sert à épargner les réserves d'une colonie neuve : les vivres livrés
  // avec une gare doivent tenir les deux ans promis, or la freinte les mangeait
  // en dix-huit mois — un tas de deux ans de couverture est par définition un
  // excédent. Une cargaison de fondation n'est pas un tas oublié, c'est une
  // provision datée.
  perimer(mois = Infinity) {
    const livres = [];
    for (const [ville, l] of this.parVille) {
      if (ville && ville.vivresJusqua > mois) continue;
      livres.push(l);
    }
    if (this._orphelin) livres.push(this._orphelin);
    for (const r of RESSOURCES) {
      let total = 0;
      for (const l of this.parVille.values()) total += l.stock[r];
      if (this._orphelin) total += this._orphelin.stock[r];
      this.stock[r] = total;
      total = 0;
      for (const l of livres) {
        // Le débit est une enveloppe qui redescend lentement, pas la mesure du
        // mois. Sans mémoire, une scierie mise en sommeil un mois ramène le
        // débit de sa ville à zéro et fait pourrir d'un coup tout ce qu'elle
        // gardait pour l'export ; le mois suivant elle repart sans matelas.
        l.debit[r] = Math.max(l.besoins[r], l.entrees[r], l.debit[r] * P.memoireDebit);
        const exces = l.stock[r] - P.matelasMois * l.debit[r];
        if (exces > 0) l.stock[r] -= exces * P.freinteExcedent;
        total += exces > 0 ? exces * P.freinteExcedent : 0;
      }
      this.stock[r] -= total;
    }
  }

  reinitialiser() {
    // On garde la trace des entrées du mois écoulé : c'est le seul indicateur
    // fiable de ce qu'une filière est capable de livrer, le stock de début de
    // mois ne disant rien quand la consommation se fait en juste-à-temps.
    this.entreesPrec = { ...this.entrees };
    this.peageCollecte = 0;
    this.tonnageTransporte = 0;
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
  // L'indice se lit contre la référence RENDUE, port compris. Sinon un marché
  // relié afficherait 1,02 en permanence et le joueur lirait une tension qui
  // n'existe pas : le port n'est pas de la rareté, c'est un service facturé.
  indice(res) { return this.prix[res] / (RES[res].prix * (1 + this.fret)); }

  // Le prix départ, celui que le producteur encaisse réellement.
  prixDepart(res) { return this.prix[res] / (1 + this.fret); }
}
