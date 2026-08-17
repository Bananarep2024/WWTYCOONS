// ---------------------------------------------------------------------------
// Le bâtiment.
//
//   résultat mensuel = taux d'activité × marge brute − entretien
//
// Les trois lignes se contractent ensemble : un atelier à moitié achète la
// moitié de ses intrants, paie la moitié de ses salaires et vend la moitié de
// sa production. Seul l'entretien ne bouge jamais — c'est lui qui borne les
// pertes et qui fixe le seuil d'activité.
// ---------------------------------------------------------------------------

import { P, BAT, materiaux, coutRef, loyer, prixTerrain, rendementVise,
         facteurQualite, qualiteMax, echelleDe } from './params.js';

let _idBatiment = 1;

export class Batiment {
  constructor(type, ville, cases, societe) {
    this.id = _idBatiment++;
    this.type = type;
    this.def = BAT[type];
    this.ville = ville;
    this.cases = cases;                 // les cases occupées
    this.societe = societe;
    this.activite = 1.0;                // curseur 0 → 1, réglable par le joueur
    this.versEntrepot = false;          // affecter la production à son entrepôt
    this.age = 0;
    this.moisVide = 0;
    this.moisDeficit = 0;

    // La facture a été établie au prix du marché du jour où le chantier a été
    // ouvert : un bâtiment ne coûte jamais deux fois la même chose.
    this.valeurBatie = coutRef(type);
    this.terrain = cases.reduce((s, c) => s + (c.prixPaye || 0), 0);

    // Qualité du sol : la sortie d'une exploitation vaut base × qualité ÷ 3.
    // Elle ne joue jamais sur la transformation.
    this.qualite = 1;
    if (this.def.qual) {
      this.qualite = cases.reduce((s, c) => s + c.q[this.def.qual], 0) / cases.length;
    }

    this.production = 0;
    this.tauxReel = 0;
    this.resultat = 0;
    this.margeUnitaire = 0;
    this.histo = [];                    // résultats des 12 derniers mois
    this.alerte = null;                 // 'matieres' | 'bras' | 'invendus' | 'perte'
    this.recu = {};
  }

  get n() { return this.def.cases; }
  get enSommeil() { return this.activite <= 0.001; }

  // Le loyer d'un bâtiment plein. Il ne découle pas d'un barème mais du
  // foncier : loyer = rendement × (terrain + construction) ÷ 12 + entretien.
  // C'est ce qui fait qu'acheter tôt paie deux fois — le loyer monte avec la
  // ville, mais le rendement du joueur se calcule sur le prix qu'il a payé.
  get loyerPlein() {
    if (this.def.cat === 'loge') {
      return loyer(this.type, this.terrainCourant, this.valeurBatie);
    }
    if (this.def.cat === 'bur') {
      const rdtParNiveau = [0.12, 0.14, 0.16, 0.18, 0.20];
      const rdt = rdtParNiveau[this.ville.niveau - 1];
      return rdt * (this.terrainCourant + this.valeurBatie) / 12 + this.entretien;
    }
    return 0;
  }

  // Valeur actuelle du terrain sous le bâtiment : elle suit le niveau de la
  // ville. Une usine sans profit implantée dans une ville qui a grandi prend
  // malgré tout de la valeur.
  get terrainCourant() {
    return this.cases.reduce((s, c) =>
      s + prixTerrain(this.ville.niveau, c.distanceGare, qualiteMax(c)), 0);
  }

  get entretien() { return this.valeurBatie * P.entretienAnnuel / 12; }
  // Le salaire est celui de la ville, pas une constante.
  //
  // Il l'était : le bâtiment payait 20 $ par case pendant que le ménage n'en
  // recevait que 14. Les six dollars manquants ne partaient nulle part — ils
  // n'existaient tout simplement pas des deux côtés du même livre de comptes.
  // Le ménage ne pouvait plus s'offrir son panier, le baromètre des produits
  // tombait à 59 % sans qu'aucun produit ne manque sur les étals, et la ville
  // s'installait sur le pivot pour vingt ans.
  // Combien d'ouvriers le bâtiment porte.
  //
  // Une case n'est plus un poste : l'échelle industrielle en met plusieurs, et
  // sur une exploitation la qualité du sol multiplie encore — un filon de
  // niveau 5 fait vivre cinq fois plus de monde qu'un sol de niveau 1, sur la
  // même surface. C'est ce qui rend une bonne case précieuse : non pas plus
  // rentable à l'ouvrier, mais capable d'en porter beaucoup plus.
  // L'emploi NE SUIT PLUS LE SOL. Une concession se travaille par une équipe
  // fixe — quatre bras à la case, que le filon soit maigre ou gras — et c'est le
  // filon qui décide de ce qu'elle en tire. C'est la condition pour que la
  // qualité se voie sur la MARGE : tant que l'emploi suivait la production en
  // proportion exacte, la recette par ouvrier valait débit × prix, une constante,
  // et la bonne terre ne rapportait pas un sou de plus par ouvrier que la
  // mauvaise. Elle ajoutait des ouvriers, elle n'enrichissait personne.
  // L'EFFECTIF EST ÉCRIT, PLUS CALCULÉ. Il valait « cases × échelle », si bien
  // qu'une ferme de deux cases faisait travailler huit personnes quand une mine
  // d'une case en faisait travailler quatre — pour le même métier. Tous les
  // bâtiments de production portent désormais quatre ouvriers, quelle que soit
  // leur emprise au sol.
  get emplois() {
    if (this.def.cat === 'bur') return this.def.postes;
    if (this.def.cat === 'loge') return 0;
    return this.def.employes;
  }

  get masseSalarialePleine() {
    return this.emplois * (this.ville ? this.ville.salaire : P.salaireCase);
  }

  // Capacité de production, qualité du sol comprise.
  get capacite() {
    if (!this.def.sort) return 0;
    // Le facteur de sol du mois — sécheresse, récolte exceptionnelle — ne joue
    // que sur ce qui pousse. Une mine ne connaît pas la pluie.
    const meteo = (this.def.qual === 'fertilite' && this.ville && this.ville.facteurSol)
      ? this.ville.facteurSol : 1;
    // La production suit l'échelle du sol : 0 · 1 · 1,09 · 2,13. À qualité zéro
    // elle est nulle — pas de gisement, rien à extraire — et le bâtiment ne
    // devrait de toute façon jamais avoir pu s'y ouvrir.
    const k = echelleDe(this.type);
    const sol = this.def.qual ? facteurQualite(this.qualite) : 1;
    return this.def.debit * this.n * k * sol * meteo;
  }

  besoinsIntrants() {
    const out = {};
    const k = echelleDe(this.type);
    for (const [r, q] of Object.entries(this.def.intrants || {})) {
      out[r] = q * this.n * k * this.activite;
    }
    return out;
  }

  // Marge brute unitaire aux prix du marché du jour. C'est le seul chiffre qui
  // compte : le danger vient toujours de l'ÉCART entre le prix d'entrée et le
  // prix de sortie, jamais d'un prix seul.
  margeBrute(marche) {
    if (!this.def.sort) return 0;
    const recette = this.capacite * marche.prix[this.def.sort];
    let couts = this.masseSalarialePleine;
    const k = echelleDe(this.type);
    for (const [r, q] of Object.entries(this.def.intrants || {})) {
      couts += q * this.n * k * marche.prix[r];
    }
    return recette - couts;
  }

  // Le taux d'activité sous lequel la marge ne couvre plus l'entretien.
  seuilActivite(marche) {
    const mb = this.margeBrute(marche);
    return mb <= 0 ? Infinity : this.entretien / mb;
  }

  // --- Le mois -------------------------------------------------------------

  // 1. Déclarer ses besoins au marché et à la ville.
  declarer(marche) {
    if (this.def.cat === 'loge' || this.def.cat === 'bur' || this.def.cat === 'neg') {
      return;
    }
    // Un atelier dont la marge brute est négative — la valeur de ce qu'il
    // produit tombe sous le coût de ce qu'il consomme — arrête sa production de
    // lui-même et retombe à son seul entretien.
    if (this.margeBrute(marche) < 0 && !this.forcer) {
      this.activiteEffective = 0;
      this.alerte = 'perte';
      return;
    }
    this.activiteEffective = this.activite;
    for (const [r, q] of Object.entries(this.besoinsIntrants())) marche.demander(r, q, this.ville);

    // Le prix de revient réel fait plancher sur ce marché.
    if (this.def.sort && this.capacite > 0) {
      let c = this.masseSalarialePleine + this.entretien;
      for (const [r, q] of Object.entries(this.def.intrants || {})) c += q * this.n * marche.prix[r];
      marche.declarerRevient(this.def.sort, c / this.capacite);
    }
  }

  // 2. Recevoir intrants et main-d'œuvre, produire, tenir ses comptes.
  produire(marche, partBras) {
    this.age++;
    this.alerte = null;
    const ent = this.entretien;

    // Logement : n'est exposé que du côté du coût. Il achète — ses matériaux au
    // chantier, puis son entretien — mais ne vend jamais de marchandise. Sa
    // recette est un loyer, fixé par le développement de la ville, pas par la
    // bourse. Le taux d'occupation est celui de la ville entière, partagé par
    // tous les propriétaires.
    if (this.def.cat === 'loge') {
      this.production = 0;
      this.tauxReel = this.vacantePenurie ? 0 : this.ville.occupation;
      this.resultat = this.loyerPlein * this.tauxReel - ent;
      if (this.tauxReel < 0.3) this.alerte = 'invendus';
      return this.cloturer();
    }

    // Bureaux : le seul argent qui entre du dehors. Ils louent 20 postes à des
    // sociétés extérieures à la carte, dont les salaires financent une
    // consommation que la ville n'a pas eu à produire. Un poste vide ne
    // rapporte rien — c'est ce qui les borne.
    if (this.def.cat === 'bur') {
      const occ = Math.max(0, Math.min(1, partBras));
      this.production = 0;
      this.tauxReel = occ;
      this.resultat = this.loyerPlein * occ - ent;
      if (occ < 0.5) this.alerte = 'bras';
      return this.cloturer();
    }

    // Entrepôt : ne rapporte rien, coûte ses salaires et son entretien. C'est
    // cette charge fixe qui rend le stockage massif coûteux, donc risqué.
    if (this.def.cat === 'neg') {
      this.production = 0;
      this.tauxReel = 1;
      this.resultat = -(this.masseSalarialePleine + ent);
      return this.cloturer();
    }

    // Mise en sommeil : plus de matières, plus de salaires, plus de production.
    // Le bâtiment reste debout moyennant un entretien réduit et se rallume
    // quand le marché repart.
    if (this.enSommeil || this.activiteEffective <= 0) {
      this.production = 0;
      this.tauxReel = 0;
      this.resultat = -(ent + this.masseSalarialePleine * P.entretienSommeil);
      return this.cloturer();
    }

    // Loi du minimum stricte : une scierie qui ne reçoit qu'un tiers de son bois
    // tourne à un tiers, quel que soit le nombre d'ouvriers disponibles. On ne
    // scie pas du bois qu'on n'a pas.
    let ratioMat = 1;
    const besoins = this.besoinsIntrants();
    this.recu = {};
    for (const [r, q] of Object.entries(besoins)) {
      const obtenu = marche.prendre(r, q, this.ville);
      this.recu[r] = obtenu;
      if (q > 0) ratioMat = Math.min(ratioMat, obtenu / q);
    }

    // Sous 15 % de ses besoins en matières, un bâtiment s'arrête complètement
    // et ne paie plus que son entretien : on ne rallume pas une scierie pour
    // produire trois planches par mois.
    if (Object.keys(besoins).length && ratioMat < P.seuilMatieres) {
      for (const [r, o] of Object.entries(this.recu)) marche.offrir(r, o, this.ville); // on rend
      this.production = 0; this.tauxReel = 0;
      this.resultat = -ent;
      this.alerte = 'matieres';
      return this.cloturer();
    }

    // Une grève ne renvoie pas les ouvriers chez eux : ils sont là, ils ne
    // travaillent pas. L'atelier tourne au ralenti et continue de payer son
    // entretien — c'est ce qui rend la grève coûteuse pour tout le monde.
    const greve = this.ville && this.ville.greveDe ? this.ville.greveDe(this.def.cat) : 1;
    const taux = this.activiteEffective * Math.min(ratioMat, partBras) * greve;
    this.tauxReel = taux;
    this.production = this.capacite * taux;

    // On ne consomme — et on ne paie — que ce qui entre réellement dans le
    // produit. Le reste retourne au marché.
    //
    // C'est la loi du minimum vue depuis la caisse. Une aciérie qui reçoit tout
    // son charbon et deux tiers de son minerai ne fait pas d'acier avec le
    // charbon en trop : il ne sert à rien, et le lui facturer revenait à lui
    // faire porter la pénurie deux fois. C'était assez pour rendre toutes les
    // aciéries déficitaires — et, dans le même mouvement, pour retirer du
    // marché un charbon dont personne ne se servait, ce qui en gonflait le prix
    // et enrichissait les mines de la pénurie qu'elles causaient.
    const part = this.activiteEffective > 0 ? taux / this.activiteEffective : 0;
    let achats = 0;
    for (const [r, o] of Object.entries(this.recu)) {
      const utilise = Math.min(o, (besoins[r] || 0) * part);
      const rendu = o - utilise;
      if (rendu > 0) marche.offrir(r, rendu, this.ville);
      this.recu[r] = utilise;
      achats += utilise * marche.prix[r];
    }

    const prixSortie = marche.prix[this.def.sort];
    const brut = this.production * prixSortie;
    // Le péage ferroviaire se prélève à la vente, comme un frais de port. Il ne
    // pèse que sur les marchés desservis par une ligne — un marché isolé n'a
    // rien à payer, mais il n'a rien non plus à vendre au-dehors.
    const peage = brut * (marche.peage || 0);
    marche.peageCollecte += peage;
    const recette = brut - peage;
    const salaires = this.masseSalarialePleine * taux;

    this.resultat = recette - achats - salaires - ent;
    this.margeUnitaire = this.production > 0
      ? (recette - achats - salaires) / this.production : 0;

    // La production part sur le marché — sauf si le joueur l'affecte à son
    // entrepôt, ce qui réduit directement les entrées et fait monter le prix.
    if (this.versEntrepot && this.societe && this.societe.entrepotDans(this.ville)) {
      this.societe.stocker(this.ville, this.def.sort, this.production);
    } else {
      marche.offrir(this.def.sort, this.production, this.ville);
    }

    if (ratioMat < 0.9) this.alerte = 'matieres';
    else if (partBras < 0.9) this.alerte = 'bras';
    else if (this.resultat < 0) this.alerte = 'perte';

    return this.cloturer();
  }

  cloturer() {
    this.histo.push(this.resultat);
    if (this.histo.length > P.fenetreProfit) this.histo.shift();
    // Une case qui reste vide un an ferme : la fermeture libère les bras, le
    // foncier et le droit de rebâtir ailleurs.
    if (this.tauxReel <= 0.01) this.moisVide++; else this.moisVide = 0;
    // Une affaire qui saigne finit par fermer. Sans ce compteur, une aciérie
    // rationnée depuis dix ans reste debout : sa marge brute à pleine capacité
    // est positive, donc l'arrêt automatique ne se déclenche jamais, et rien ne
    // ramène jamais le nombre d'aciéries au nombre de mines qui peuvent les
    // nourrir.
    if (this.resultat < 0) this.moisDeficit++; else this.moisDeficit = 0;
    return this.resultat;
  }

  // Ce que le bâtiment rapporte, rapporté à ce qu'il a coûté — terrain et
  // matériaux au prix du jour.
  //
  // Surtout pas rapporté à sa VALEUR : celle-ci vaut « base + 10 × profit », si
  // bien que profit ÷ valeur tend vers 1/10 quel que soit le profit et ne peut
  // jamais dépasser 10 %. Un rendement mesuré ainsi ne dit rien — il mesure le
  // multiple de valorisation, pas la performance du bâtiment.
  get prixDeRevient() { return this.terrainCourant + this.valeurBatie; }

  get rendement() {
    const base = this.prixDeRevient;
    return base > 0 ? this.profitAnnuel / base : 0;
  }

  // Tient-il sa promesse ? De 0 (rien, ou perte) à 1 (il atteint son rendement
  // visé) et au-delà. C'est cette mesure-là, et non le rendement brut, qui
  // permet de comparer une coupe forestière à une manufacture : les deux n'ont
  // jamais eu la même promesse à tenir.
  tenue() {
    const vise = rendementVise(this.type);
    if (vise <= 0) return 0;
    return this.rendement / vise;
  }

  // Ce qu'il a demandé, ce qu'il a reçu. Un atelier ne souffre jamais d'un prix
  // seul : il souffre de ce qui lui manque, et c'est ce manque qu'il faut voir.
  intrants() {
    const out = [];
    for (const [r, q] of Object.entries(this.def.intrants || {})) {
      const demande = q * this.n * (this.activiteEffective ?? this.activite);
      const recu = (this.recu && this.recu[r]) || 0;
      out.push({ res: r, demande, recu, part: demande > 0 ? recu / demande : 1 });
    }
    return out;
  }

  get profitAnnuel() {
    const s = this.histo.reduce((a, b) => a + b, 0);
    return this.histo.length ? s * 12 / this.histo.length : 0;
  }

  // Valeur : un profit se projette sur la durée, une perte se répare — les deux
  // multiplicateurs ne sont pas les mêmes, et ce n'est pas arbitraire.
  // Ce que ce bâtiment vaut à la vente : son terrain, plus trois années de profit
  // lorsqu'il en fait. C'est exactement le prix auquel un indépendant le cède et
  // celui auquel on le lui rachète — voir Monde.prixRachatIndependant.
  //
  // Le multiple de marché ne s'applique plus ici. Il s'appliquait bâtiment par
  // bâtiment, ce qui empilait autant de goodwills qu'il y avait de murs ; il
  // s'applique désormais une seule fois, au niveau de la société. Un bâtiment,
  // lui, ne se cote pas : il se vend.
  get valeurDeCession() {
    return this.terrainCourant + Math.max(0, P.anneesDeProfit * this.profitAnnuel);
  }

  // Ce que le bâtiment demande au marché du travail ce mois-ci.
  get postesDemandes() {
    if (this.def.cat === 'loge') return 0;                  // une maison n'emploie personne
    if (this.def.cat === 'bur') return this.def.postes;
    if (this.def.cat === 'neg') return this.n;
    return this.emplois * (this.activiteEffective ?? this.activite);
  }

  // Ce qu'il emploie RÉELLEMENT, une fois le mois écoulé. C'est ce chiffre — et
  // jamais la capacité installée — qui dit s'il reste de la main-d'œuvre pour un
  // nouveau chantier : une usine à l'arrêt ne mobilise personne. En comptant les
  // postes théoriques, la simulation refusait de construire une minoterie alors
  // qu'un travailleur sur cinq était sans emploi, et la ville restait bloquée
  // pendant des années sans qu'on comprenne pourquoi.
  get postesPourvus() {
    if (this.def.cat === 'loge') return 0;
    if (this.def.cat === 'bur') return this.def.postes * (this.tauxReel || 0);
    if (this.def.cat === 'neg') return this.n;
    return this.n * (this.tauxReel || 0);
  }
}

