// ---------------------------------------------------------------------------
// Comment une ville bâtit.
//
// Une ville ne bâtit pas ce qui rapporte le plus. Elle bâtit ce qui lui manque,
// et quand rien ne manque, alors seulement elle regarde le rendement. Trois
// règles suffisent à décrire tout son comportement, et elles valent aussi bien
// pour un joueur — un joueur a simplement le droit de se tromper.
// ---------------------------------------------------------------------------

import { P, BAT, RES, facteurQualite, echelleDe, emploisRequis,
         PANIER, VIVRIERS } from './params.js';

// Qui produit quoi.
const PRODUCTEUR = {
  bois: 'coupe', argile: 'carriere', charbon: 'mineCharbon', minerai: 'mineFer',
  cereales: 'ferme', betail: 'ranch',
  planches: 'scierie', briques: 'briqueterie', pain: 'minoterie',
  viande: 'abattoir', acier: 'acierie',
  meubles: 'manufacture', papier: 'papeterie', outillage: 'forge',
  vaisselle: 'faiencerie', biere: 'brasserie', savon: 'savonnerie',
  etoffes: 'filature',
};

// Quelle boutique tient quel bien. Une ville qui manque d'un article secondaire
// n'a pas forcément besoin d'une usine de plus : il lui manque peut-être
// simplement le comptoir qui le vendrait.
const BOUTIQUE_DE = {};
for (const t of Object.keys(BAT)) {
  if (BAT[t].cat !== 'com' || t === 'grandMagasin') continue;
  for (const r of BAT[t].tient) BOUTIQUE_DE[r] = t;
}

// PREMIÈRE RÈGLE — on ne bâtit pas ce qui manque, on bâtit ce qui empêche de
// le faire. La ville prend son besoin le plus criant, puis remonte la filière
// jusqu'au premier maillon qui bloque. Il manque du pain ? Si les minoteries
// tournent à vide faute de blé, on bâtit une ferme, pas une minoterie.
function remonter(monde, ville, res, profondeur = 0) {
  if (profondeur > 4) return null;
  const type = PRODUCTEUR[res];
  if (!type) return null;
  const def = BAT[type];
  const intrants = Object.keys(def.intrants || {});
  if (!intrants.length) return type;

  // Le goulot se lit dans le PRIX, pas ailleurs. Une scierie ne souffre pas du
  // manque de bois en soi : si les planches étaient rares aussi, leur prix
  // monterait et sa marge tiendrait. Elle souffre parce que le bois est rare
  // alors que les planches ne le sont pas. C'est l'écart entre le prix d'entrée
  // et le prix de sortie qui désigne le maillon à bâtir.
  const m = ville.marche;
  let pire = null, pireIndice = 0;
  for (const r of intrants) {
    const indice = m.prix[r] / RES[r].prix;
    if (indice > pireIndice) { pireIndice = indice; pire = r; }
  }
  const indiceSortie = m.prix[res] / RES[res].prix;

  // Le prix ne dit pas tout. Sous la loi du minimum, un atelier rationné
  // produit à la mesure de son intrant le plus rare tout en payant ses salaires
  // en entier : à 50 % de régime, sa marge a disparu. Le manque se lit alors
  // dans le taux de service, pas dans le prix — et c'est cet intrant-là qu'il
  // faut aller chercher, même si son prix n'a pas bougé.
  let rare = null, pireService = 1;
  for (const r of intrants) {
    const s = m.service[r] === undefined ? 1 : m.service[r];
    if (s < pireService) { pireService = s; rare = r; }
  }

  // Si l'intrant est nettement plus tendu que le produit, c'est lui qu'il faut
  // aller chercher en amont. Sinon, c'est bien cet atelier-ci qui manque.
  //
  // La comparaison est RELATIVE, et c'est tout l'intérêt. Un seuil absolu —
  // « l'intrant dépasse 1,20 » — laissait passer le cas le plus courant : de
  // l'acier à 1,18 en face de produits à 0,92. La manufacture était bâtie et
  // rebâtie alors que le minerai criait à 1,81 et que les aciéries tournaient
  // à un tiers de régime.
  if (pireIndice > Math.max(1.05, indiceSortie * 1.10)) {
    return remonter(monde, ville, pire, profondeur + 1);
  }
  // LA FILIÈRE S'EST-ELLE DÉJÀ ENGAGÉE À CONSOMMER PLUS QU'ELLE NE PRODUIT ?
  //
  // C'est la question qui manquait, et son absence coûtait des villes entières.
  // On la posait à l'envers : on regardait si les ateliers existants tournaient
  // au ralenti DEPUIS TROIS MOIS, ce qui suppose qu'on les ait déjà bâtis pour
  // s'en apercevoir. Plaine-Dorée s'est ainsi couverte de 31 scieries pour 170
  // bois par mois — de quoi en nourrir quatre. Les 27 autres immobilisaient 54
  // bras dans une ville qui en comptait 208, ne produisaient pas une planche, et
  // les manufactures en aval n'ont jamais reçu un gramme de matière.
  //
  // On la pose désormais à l'endroit et par avance : ce que la filière SAIT
  // produire, rapporté à ce que le parc s'est déjà engagé à consommer, chantiers
  // compris. Sous 100 %, un atelier de plus ne produira pas un gramme de mieux —
  // il prendra des bras et du capital pour tourner à vide. On remonte.
  const cv = couverture(monde, ville, type);
  if (cv.rare && cv.taux < P.couvertureMinimale) {
    return remonter(monde, ville, cv.rare, profondeur + 1);
  }
  void rare;
  return type;
}

// Ce que le parc debout RÉCLAME de cette ressource chaque mois, à plein régime —
// ateliers en service et chantiers en cours, sur tout le marché : une ville
// reliée puise dans le même panier que ses voisines.
export function reclame(monde, marche, res) {
  let q = 0;
  for (const v of marche.villes) {
    for (const b of monde.tousBatiments(v)) q += (b.def.intrants || {})[res] || 0;
    for (const c of monde.tousChantiers(v)) q += (BAT[c.type].intrants || {})[res] || 0;
  }
  return q;
}

// Ce que ce même parc en PRODUIT, à plein régime. Un chantier compte pour le
// débit nominal de ce qu'il deviendra : on ne connaît pas encore la qualité de
// sa terre, mais on sait qu'il arrive.
export function fournit(monde, marche, res) {
  let q = 0;
  for (const v of marche.villes) {
    for (const b of monde.tousBatiments(v)) if (b.def.sort === res) q += b.capacite;
    for (const c of monde.tousChantiers(v)) if (BAT[c.type].sort === res) q += BAT[c.type].debit;
  }
  return q;
}

// La couverture d'un atelier : pour chacun de ses intrants, ce que la filière
// produit rapporté à ce qu'elle s'est engagée à consommer. Le plus petit décide
// — c'est la loi du minimum, la même qui régit la production tous les mois.
function couverture(monde, ville, type) {
  const m = ville.marche;
  let taux = Infinity, rare = null;
  for (const r of Object.keys(BAT[type].intrants || {})) {
    const d = reclame(monde, m, r);
    if (d <= 0.001) continue;
    const c = fournit(monde, m, r) / d;
    if (c < taux) { taux = c; rare = r; }
  }
  return { taux, rare };
}

// TROISIÈME RÈGLE — le plafond de bras. On ne décide pas de bâtir ce qu'on ne
// pourra pas faire tourner. Une ville qui ignore cette règle se couvre d'usines
// vides et s'affame.
function brasDisponibles(monde, ville) {
  const bras = ville.menages * P.employesParMenage;
  let occupes = 0;
  // On plafonne sur les postes DEMANDÉS, chantiers compris : c'est la capacité
  // installée qui ne peut pas dépasser le nombre de bras. Se fier aux postes
  // pourvus mènerait à une spirale — des usines rationnées paraissent libérer
  // des bras, on bâtit davantage, on rationne encore plus, et la ville se
  // couvre d'usines vides en s'affamant.
  for (const b of monde.tousBatiments(ville)) occupes += b.postesDemandes;
  for (const c of monde.tousChantiers(ville)) occupes += c.postesDemandes;
  return bras - occupes;
}

// Le taux d'emploi au-dessous duquel on cesse de loger.
//
// C'est LE cadran du chômage, et c'est contre-intuitif : le chômage d'équilibre
// d'une ville n'est pas fixé par ses usines, il est fixé par ce seuil. Un ménage
// de plus, ce sont deux BRAS de plus et un panier de plus ; tant que la ville
// continue de loger, elle continue d'ajouter des bras, et l'emploi retombe
// aussitôt sur le seuil qui a autorisé la construction. L'emploi ne peut donc
// jamais s'établir durablement au-dessus de ce nombre — il s'y colle.
//
// La version précédente le calculait comme le point de bouclage du ménage —
// panier ÷ (2 × salaire). Le raisonnement se tenait, mais il était circulaire :
// le salaire de subsistance montait pour compenser le chômage, ce qui ABAISSAIT
// le seuil, ce qui autorisait plus de logements, ce qui aggravait le chômage.
// La ville s'installait à 70 % d'emploi et n'en bougeait plus, quelle que soit
// la taille de la carte.
//
// Le bon seuil est un objectif, pas un point mort : on ne fait venir des gens
// que dans une ville qui a du travail à leur donner.
export function emploiDeBouclage(ville) {
  return P.emploiPourLoger;
}

// L'emploi tiendra-t-il si l'on ajoute ces ménages ? Deux bras chacun, et pas
// un poste de plus : c'est la question que doit se poser une ville avant de
// bâtir, et non celle de savoir si elle a du travail aujourd'hui.
function emploiTiendra(monde, ville, menagesAjoutes) {
  const bras = (ville.menages + menagesAjoutes) * P.employesParMenage;
  if (bras <= 0) return true;
  return Math.min(ville.postesDemandes || 0, bras) / bras >= P.emploiPourLoger;
}

// Les besoins de la ville, dans l'ordre où elle les ressent.
function besoinsClasses(monde, ville, penchant) {
  const b = ville.barometres;
  const m = ville.marche;

  const candidats = [];

  // La nourriture passe avant tout le reste. Elle est le seul baromètre dont la
  // chute vide la ville, et le seul dont la correction prend des années : il
  // faut une ferme, puis une minoterie, puis des bras pour les deux.
  if (b.nourriture < 0.995) candidats.push({ score: 5 - b.nourriture * 2, res: 'pain' });

  // DEUXIÈME RÈGLE — on loge tant qu'on peut nourrir.
  //
  // Le logement ne compte pas dans le plafond de bras, et pour une raison qui
  // change tout : un ménage de plus, ce sont deux BRAS de plus. Le logement est
  // le seul bâtiment qui produise du travail au lieu d'en consommer.
  //
  // C'est pourquoi la condition portait à l'envers. On exigeait auparavant du
  // mou sur le marché du travail — « une ville au plein emploi ne peut plus
  // bâtir la ferme qui la sauverait » — mais l'effet était de geler net la
  // croissance de toute ville qui réussissait : plein emploi, donc pas de mou,
  // donc pas de maisons, donc pas de population, et une ville prospère restait
  // à cent cinquante ménages pendant vingt ans. Le plein emploi est justement
  // le moment où il faut loger davantage.
  //
  // La vraie borne, c'est la nourriture : on ne fait pas venir des gens qu'on
  // ne pourra pas nourrir.
  if (ville.occupation > 0.86 && b.nourriture > 0.95 && b.emploi > emploiDeBouclage(ville)) {
    candidats.push({ score: 2.2 + ville.occupation, res: null, type: 'logement' });
  }

  // LE PANIER SECONDAIRE, ARTICLE PAR ARTICLE.
  //
  // Ce n'était qu'une ligne — « il manque des produits » — et la ville bâtissait
  // une manufacture de plus. Elle regarde maintenant CE QUI manque, et distingue
  // les deux raisons de manquer : ou bien la ville n'en fabrique pas, ou bien
  // elle en fabrique et n'a personne pour le vendre. Dans le second cas il faut
  // une boutique, et un atelier de plus n'y changerait rien.
  for (const a of PANIER) {
    const voulu = a.qte * ville.menages;
    if (voulu <= 0.01) continue;
    const obtenu = (ville.obtenu && ville.obtenu[a.res]) || 0;
    const satisfaction = obtenu / voulu;
    if (satisfaction >= P.cibleProduits) continue;

    // L'étalage suffit-il ? La comparaison porte sur le SOUHAIT — ce que le
    // budget des ménages supporte — et non sur le désir absolu. Une ville trop
    // pauvre pour s'acheter des meubles n'a pas besoin d'un magasin de meubles :
    // c'est de salaire qu'elle manque, pas de comptoir.
    const souhait = (ville.souhaits && ville.souhaits[a.res]) || 0;
    if (souhait <= 0.01) continue;
    const etal = (ville.etalage && ville.etalage[a.res]) || 0;
    const valeurVoulue = souhait * m.prix[a.res] * (1 + P.margeCommerce);
    const bride = etal < valeurVoulue * 0.95;

    // LA PRIORITÉ EST CELLE DU MANQUE, PAS CELLE DU POIDS DANS LE PANIER.
    //
    // Le score était pondéré par la part du bien dans le budget des ménages. La
    // règle se contredisait alors elle-même : la CIBLE est fixée par bien —
    // quatre-vingt-dix pour cent chacun — mais la priorité de construction était
    // proportionnelle à la valeur, si bien que la ville visait l'uniformité tout
    // en bâtissant en proportion du prix. Cela ne pouvait pas converger, et cela
    // ne convergeait pas : mesuré à 240 mois, le nombre d'ateliers suivait
    // exactement le poids du panier —
    //
    //   savon      17,1 % du panier  →  67 savonneries  →  75 % servi
    //   étoffes    12,0 %            →  31 filatures    →  49 %
    //   vaisselle   8,6 %            →  19 faïenceries  →  43 %
    //
    // — alors que ni le budget ni les boutiques ne bornaient quoi que ce soit.
    // C'était la ville qui refusait de bâtir, et rien d'autre.
    //
    // Le manque seul décide désormais. Un bien à 40 % de satisfaction passe
    // devant un bien à 70 %, qu'il pèse deux dollars ou six dans le panier.
    if (bride && BOUTIQUE_DE[a.res]) {
      candidats.push({ score: 1.6 - satisfaction, res: null, type: BOUTIQUE_DE[a.res] });
    } else {
      candidats.push({ score: 1.4 - satisfaction, res: a.res });
    }
  }

  // Les bureaux — le seul argent qui vienne du dehors.
  //
  // Ils n'étaient bâtis qu'à la création du monde. Une ville qui doublait de
  // population gardait son unique immeuble : la part de revenu venue de
  // l'extérieur était divisée par deux à mesure qu'elle grandissait, et avec
  // elle le taux d'emploi. Or l'arithmétique du ménage est sans appel — panier
  // 34 $, revenu 2 × salaire × emploi — et le salaire est plafonné à 20 $ par ce
  // qu'une exploitation peut payer. Sous 85 % d'emploi, le ménage ne boucle
  // plus, n'épargne rien, et la ville cesse de bâtir. L'emploi n'est pas un
  // symptôme : c'est la seule variable qui reste.
  const bureaux = monde.tousBatiments(ville)
    .filter(x => x.def.cat === 'bur').reduce((s, x) => s + x.def.postes, 0);
  const voulus = ville.menages / P.menagesParBureaux * BAT.bureaux.postes;

  // Un bureau prend vingt bras et ne nourrit personne. Poussée trop loin, la
  // densité de bureaux tue la ville : les bras partent tous au tertiaire, plus
  // personne ne bâtit de ferme, le seuil critique de nourriture est franchi et
  // la population s'évapore à 5 % par mois. Mesuré : à un bureau pour seize
  // ménages, les cinq villes tombent à ZÉRO habitant en moins de vingt ans.
  //
  // On ne bâtit donc de bureau que le ventre plein, et qu'à condition de garder
  // de quoi armer la filière alimentaire.
  const ventrePlein = b.nourriture > 0.98;
  const marge = brasDisponibles(monde, ville) - BAT.bureaux.postes;
  if (bureaux < voulus && ventrePlein && marge > ville.menages * P.brasReservesAuxVivres) {
    candidats.push({ score: 2.4 + (voulus - bureaux) / Math.max(1, voulus),
                     res: null, type: 'bureaux' });
  }

  // Les matériaux : une ville à court de briques finit par se donner une
  // briqueterie, parce que ses chantiers en font monter le prix.
  //
  // Et les matières premières avec eux. Les laisser hors de ce tableau était
  // une erreur : le charbon et le minerai n'avaient aucun chemin direct vers
  // le carnet de chantiers — on n'y arrivait qu'en remontant depuis les
  // produits finis, à travers deux étages de filière. Une pénurie de minerai
  // devait donc d'abord faire souffrir la manufacture pour être seulement
  // remarquée, et les mines ont passé vingt ans à encaisser 80 % de rendement
  // sans que personne n'en ouvre une de plus.
  for (const r of ['planches', 'briques', 'bois', 'argile', 'charbon', 'minerai',
                   'cereales', 'betail']) {
    const indice = m.prix[r] / RES[r].prix;
    if (indice > 1.10) candidats.push({ score: 0.9 + indice, res: r });
  }

  // Le penchant ne rend pas aveugle : il déclasse les occasions, il ne les
  // supprime pas. Une pénurie criante reste criante pour tout le monde.
  if (penchant) for (const c of candidats) {
    if (c.type === penchant || c.res === penchant) c.score *= 1.5;
  }
  candidats.sort((a, b2) => b2.score - a.score);
  return candidats;
}

// Le besoin le plus criant — un seul, pour qui n'en veut qu'un.
function besoinLePlusCriant(monde, ville, penchant) {
  const candidats = besoinsClasses(monde, ville, penchant);
  if (!candidats.length) return null;
  // Parmi les occasions qui se valent à peu près, on ne prend pas toujours la
  // première : deux sociétés qui lisent le même marché ne doivent pas fatalement
  // ouvrir le même chantier le même mois.
  const seuil = candidats[0].score * 0.75;
  const bonnes = candidats.filter(c => c.score >= seuil);
  return bonnes[Math.floor(monde.hasard() * bonnes.length)];
}

// L'épargne des ménages bâtit la ville. Les habitants construisent ce qui
// manque le plus, et ces bâtiments appartiennent aux propriétaires
// indépendants — donc rachetables par les joueurs.
export function piloterVille(monde, ville) {
  // CINQUIÈME RÈGLE — une affaire qui saigne deux ans ferme, et sa fermeture
  // rend à la ville le terrain et surtout les BRAS. C'est la seule chose qui
  // ramène le nombre d'aciéries au nombre de mines capables de les nourrir :
  // sans sortie de marché, une filière mal proportionnée le reste pour
  // toujours. On n'en ferme qu'une par mois — une ville ne se vide pas d'un
  // coup, et le joueur doit avoir le temps de racheter.
  // UN BÂTIMENT DÉFICITAIRE RESTE DEBOUT. Il était démoli au bout de deux ans de
  // pertes ; depuis que les marges sont calibrées au salaire de référence alors
  // que les villes en pénurie paient le salaire plafond, la quasi-totalité de
  // l'économie est déficitaire — 124 bâtiments sur 152 dans une ville mesurée —
  // et la règle rasait la ville entière en deux ans.
  //
  // Elle ne disparaît pas pour autant du modèle : la faillite est une décision
  // de propriétaire, pas une loi de la nature. Un atelier qui perd de l'argent
  // continue de tourner, de payer ses ouvriers et de fournir sa ville ; c'est au
  // joueur de le fermer ou de le racheter.
  void P.moisAvantFaillite;

  // Une ville ne bâtit pas un chantier par mois par décret : elle bâtit tant
  // qu'elle a de l'argent, des bras et un besoin. Le plafond d'un seul chantier
  // mensuel laissait s'accumuler des centaines de milliers de dollars d'épargne
  // inutilisée pendant que la population stagnait faute de logements.
  for (let k = 0; k < P.chantiersVilleParMois; k++) {
    if (!unChantierDeVille(monde, ville)) break;
  }
}

// Renvoie vrai si la ville a effectivement bâti quelque chose.
//
// QUATRIÈME RÈGLE — on ne bâtit pas ce qui ne paiera pas. Le besoin dit quoi
// bâtir ; le calcul dit si ça vaut la peine ICI, sur CE sol, à CES prix. Et si
// le premier besoin mène à un chantier qui perdrait de l'argent, la ville passe
// au suivant plutôt que de ne rien faire — c'est ainsi que le capital finit par
// aller là où il manque, au lieu de s'entêter là où il ne sert à rien.
function unChantierDeVille(monde, ville) {
  // LA VILLE INVESTIT DEUX ARGENTS À LA FOIS : l'épargne de ses ménages et les
  // bénéfices que ses filières ont mis de côté. Une filière en déficit vient en
  // déduction — c'est ainsi qu'une industrie qui saigne fige la construction de
  // toute sa ville, et pas seulement la sienne.
  const budget = monde.capaciteInvestissement(ville).total;
  if (budget < 200) return false;

  const besoins = besoinsClasses(monde, ville);
  if (!besoins.length) return false;

  // On ne prend pas toujours le premier : deux villes qui lisent le même marché
  // ne doivent pas fatalement ouvrir le même chantier le même mois.
  const seuil = besoins[0].score * 0.75;
  const tete = besoins.filter(c => c.score >= seuil);
  const ordre = [tete[Math.floor(monde.hasard() * tete.length)],
                 ...besoins].slice(0, 5);

  const essayes = new Set();
  for (const besoin of ordre) {
    let type;
    if (besoin.type && BAT[besoin.type] && BAT[besoin.type].cat === 'com') {
      type = besoin.type;                       // une boutique, pas une usine
    } else if (besoin.type === 'bureaux') {
      type = 'bureaux';
    } else if (besoin.type === 'logement') {
      // La maison est un petit pas prudent, l'immeuble un pari sur l'avenir.
      // Une ville sans acier ne peut pas bâtir en hauteur.
      //
      // La disponibilité se lit au TAUX DE SERVICE, jamais au stock. Sur un
      // marché en juste-à-temps, l'acier est consommé le mois même où il sort
      // de l'aciérie : le stock y est structurellement nul, même quand la
      // filière tourne à plein. La condition « stock > 200 » n'était donc
      // jamais vraie — la ville n'a jamais densifié, elle a couvert son
      // territoire de maisons à un ménage la case jusqu'à ce qu'il n'y ait
      // plus un pouce de terre, et s'est arrêtée là avec quatre millions de
      // dollars d'épargne dont elle ne savait que faire.
      const acierDispo = (ville.marche.service.acier ?? 1) > 0.75;
      // Et l'on densifie d'autant plus volontiers que la place manque. La
      // mesure porte sur le QUARTIER D'HABITATION, pas sur le territoire :
      // c'est là que le logement va, et une ville peut avoir des hectares
      // agricoles en friche tout en n'ayant plus où loger personne.
      let res = 0, resLibres = 0;
      for (const c of ville.cases) {
        if (c.quartier !== 'residentiel') continue;
        res++;
        if (!c.bat && !c.chantier && !c.voie) resLibres++;
      }
      const serre = res > 0 && resLibres < res * P.densifierSous;
      const grande = ville.menages > 260 || serre;
      const peutImmeuble = acierDispo && budget > 4500;
      if (serre && !peutImmeuble) {
        // Ville à l'étroit et pas les moyens de bâtir en hauteur : on ne pose
        // SURTOUT pas une maison de plus. Chaque pavillon posé sur les dernières
        // cases libres est un ménage gagné aujourd'hui et vingt perdus demain —
        // c'est ainsi qu'une ville se condamnait à quatre cents habitants.
        // On attend l'acier et l'argent, et on va voir le besoin suivant.
        continue;
      }
      type = (peutImmeuble && grande) ? 'immeuble' : 'maison';
    } else {
      type = remonter(monde, ville, besoin.res);
    }
    if (!type || essayes.has(type)) continue;
    essayes.add(type);

    const def = BAT[type];

    // Dernier garde-fou, celui qu'aucun chemin ne contourne : on ne pose pas un
    // atelier dont les intrants sont déjà retenus par d'autres. `remonter` s'en
    // charge d'ordinaire, mais il abandonne au bout de quatre étages de filière
    // et rend alors le type demandé sans l'avoir vérifié.
    if (Object.keys(def.intrants || {}).length
        && couverture(monde, ville, type).taux < P.couvertureMinimale) continue;

    // Un immeuble de bureaux réclame vingt bras, pas quatre : c'est le nombre de
    // POSTES qu'il faut pouvoir pourvoir, pas la surface qu'il couvre.
    const brasRequis = def.cat === 'bur' ? def.postes : def.cases;
    if (def.cat !== 'loge' && brasDisponibles(monde, ville) < brasRequis) continue;

    // Un logement s'apprécie sur l'emploi qu'il y AURA, pas sur celui qu'il y a.
    // Un immeuble amène vingt ménages d'un seul coup — quarante bras — et une
    // ville qui vérifie son taux d'emploi avant de le poser le verra s'effondrer
    // juste après. On regarde donc l'état d'après.
    if (def.cat === 'loge' && !emploiTiendra(monde, ville, def.menages)) continue;

    const cout = coutEstime(monde, ville, type);
    if (budget < cout) continue;

    let cases = monde.trouverEmplacement(ville, type, null);

    // Une ville pleine ne s'arrête pas de grandir : elle se reconstruit sur
    // elle-même. Quand il ne reste plus un carré de quatre cases libres, on
    // rase quatre maisons d'indépendants pour dresser un immeuble à leur place
    // — vingt ménages là où il y en avait quatre. C'est le seul chemin vers la
    // Grandeville et la Métropole, et c'est très exactement ce qu'a fait
    // l'Amérique de 1900 : sans cela une ville se couvre de pavillons jusqu'au
    // dernier pouce de terre et s'arrête là, avec des millions de dollars
    // d'épargne dont elle ne sait que faire.
    if (!cases && type === 'immeuble') cases = raserPourDensifier(monde, ville);
    if (!cases) continue;

    // LA VILLE QUI A FAIM SÈME, MÊME À PERTE.
    //
    // Le seuil de rendement est celui d'un INVESTISSEUR : sous 5 % attendu, on
    // ne place pas son argent. Mais une ville dont la nourriture passe sous son
    // seuil critique ne fait pas un placement, elle survit — et sur une terre de
    // qualité 1, qui rend −10 % par construction, aucune ferme ne s'ouvrirait
    // jamais. Une ville sans bonne terre mourait donc de faim en regardant ses
    // champs vides.
    //
    // Le seuil ne vaut donc que pour ce qui n'est pas vital. Nourrir passe
    // avant, et c'est ce qui donne son sens à la case de qualité 1 : un droit de
    // produire à prix coûtant, qu'on exerce parce qu'on n'a pas le choix.
    const vital = VIVRIER.has(type)
      && ville.barometres.nourriture < P.seuilsCritiques.nourriture;

    // ET L'EXPLOITATION NÉCESSAIRE SÈME AUSSI, MÊME À PERTE.
    //
    // Une mine, une coupe, une carrière posée sur une case 1 rend −5 % au prix
    // de référence : aucun investisseur ne l'ouvrirait. Mais tant que les
    // ateliers en aval réclament plus de matière que la filière n'en sort, cette
    // mine n'est pas un placement, elle est la condition d'existence de tout ce
    // qui la suit. La marge, elle, se retrouve un cran plus haut — chez la
    // scierie, la minoterie, l'aciérie — qui ne dégagent la leur que si la
    // matière arrive.
    //
    // Sans cette exemption, la règle du rendement fabriquait exactement la
    // pathologie qu'elle prétendait éviter : les ateliers se bâtissaient parce
    // qu'ils affichent une belle marge sur le papier, et les exploitations qui
    // devaient les nourrir n'étaient jamais ouvertes parce qu'elles rendent −5 %.
    const necessaire = def.sort && !Object.keys(def.intrants || {}).length
      && fournit(monde, ville.marche, def.sort) < reclame(monde, ville.marche, def.sort);

    if (def.cat !== 'loge' && !vital && !necessaire
        && rendementAttendu(monde, ville, type, cases) < P.rendementMinimalPourBatir) continue;

    // Le bâtiment naît chez la filière de son métier, qui le paie sur ses
    // propres bénéfices avant d'appeler l'épargne des ménages. Seul le logement
    // reste aux habitants : une maison ne se possède pas, elle s'habite.
    const proprietaire = monde.financerLocal(ville, type, cout);
    monde.poser(type, ville, cases, proprietaire);
    return true;
  }
  return false;
}

// Ce que rapporterait ce bâtiment, sur ces cases, aux prix d'aujourd'hui —
// avant qu'il n'existe. C'est le calcul que ferait n'importe quel investisseur.
// Ce qui nourrit. La liste était écrite à la main ici ; elle est désormais
// DÉRIVÉE de la filière dans params.js, et partagée avec la répartition des bras
// — les deux règles doivent parler de la même chose.
const VIVRIER = VIVRIERS;

export function rendementAttendu(monde, ville, type, cases) {
  const def = BAT[type];
  const m = ville.marche;

  // LE COMMERCE SE CALCULE, LUI AUSSI. Sa recette est une marge sur ce qu'il
  // écoulera, et ce qu'il écoulera est borné par deux choses : son propre débit,
  // et ce que la ville n'arrive pas encore à acheter. Une septième épicerie dans
  // une ville qui en a six de trop ne vendra rien, et le chiffre doit le dire.
  if (def.cat === 'com') {
    const etal = monde.etalage(ville);
    let place = 0;
    for (const r of def.tient) {
      const a = PANIER.find(x => x.res === r);
      if (!a) continue;
      // Ce que la ville peut PAYER, moins ce que les comptoirs existants
      // écoulent déjà : c'est là, et nulle part ailleurs, qu'il reste de la
      // place pour une boutique de plus.
      const souhait = (ville.souhaits && ville.souhaits[r] !== undefined)
        ? ville.souhaits[r] : a.qte * ville.menages;
      const voulu = souhait * m.prix[r] * (1 + P.margeCommerce);
      place += Math.max(0, voulu - (etal[r] || 0));
    }
    const ecoule = Math.min(def.debit, place);
    const mensuel = ecoule * P.margeCommerce / (1 + P.margeCommerce)
                  - P.salaireCase * def.employes;
    let bati = 0;
    for (const [r, qte] of Object.entries(def.mat)) bati += qte * m.prix[r];
    const terrain = cases.reduce((s, c) => s + monde.prixCase(ville, c), 0);
    const revient = terrain + bati;
    if (revient <= 0) return 0;
    return (mensuel * 12 - bati * P.entretienAnnuel) / revient;
  }

  if (!def.sort) return Infinity;   // bureaux, entrepôt : hors de ce calcul

  const q = def.qual
    ? cases.reduce((s, c) => s + c.q[def.qual], 0) / cases.length
    : 1;
  // LE DÉBIT EST PAR BÂTIMENT, PAS PAR CASE — depuis la base propre. Ce calcul
  // multipliait encore par le nombre de cases : il prêtait 40 planches à une
  // scierie qui en fait 20, et 120 produits à une manufacture qui en fait 30.
  // Le rendement affiché n'avait plus aucun rapport avec ce que le bâtiment
  // ferait une fois debout, et c'est sur ce chiffre que la ville décidait.
  const production = def.debit * echelleDe(type) * (def.qual ? facteurQualite(q) : 1);

  // On ne calcule pas au prix d'aujourd'hui, mais à celui qu'aura fait la
  // production déjà en chantier.
  //
  // Sans cela, tout le monde lit le même prix élevé, tout le monde ouvre le
  // même atelier le même mois, et la vague arrive ensemble : le prix s'effondre
  // et personne ne gagne rien. C'est exactement ce qui arrivait aux
  // manufactures — bâties tant que le baromètre des produits restait sous sa
  // cible, laquelle est hors d'atteinte par construction, jusqu'à ce que le
  // rendement de TOUTES tombe à zéro.
  let enChantier = 0, installe = 0;
  for (const v of m.villes) {
    for (const b of monde.tousBatiments(v)) if (b.def.sort === def.sort) installe += b.capacite;
    for (const c of monde.tousChantiers(v)) {
      if (BAT[c.type].sort === def.sort) enChantier += BAT[c.type].debit;
    }
  }
  enChantier += production;   // le nôtre en fait partie
  const dilution = installe > 0
    ? Math.pow(installe / (installe + enChantier), P.exposantPrix) : 1;

  let mensuel = production * m.prix[def.sort] * dilution
              - P.salaireCase * emploisRequis(type);
  for (const [r, qte] of Object.entries(def.intrants || {})) {
    mensuel -= qte * m.prix[r];
  }

  let bati = 0;
  for (const [r, qte] of Object.entries(def.mat)) bati += qte * m.prix[r];
  const terrain = cases.reduce((s, c) => s + monde.prixCase(ville, c), 0);
  const revient = terrain + bati;
  if (revient <= 0) return 0;

  return (mensuel * 12 - bati * P.entretienAnnuel) / revient;
}

// Cherche un carré de quatre maisons d'indépendants contiguës et le libère.
// On ne touche jamais au bien d'un joueur : à lui de démolir s'il le veut.
function raserPourDensifier(monde, ville) {
  const def = BAT.immeuble;
  for (const depart of ville.cases) {
    if (depart.quartier !== 'residentiel') continue;
    const lot = [];
    let ok = true;
    for (let dy = 0; dy < def.h && ok; dy++) for (let dx = 0; dx < def.w && ok; dx++) {
      const c = monde.caseAt(depart.x + dx, depart.y + dy);
      if (!c || c.ville !== ville || c.voie || c.chantier) { ok = false; break; }
      // Case libre, ou maison appartenant à un indépendant : les deux conviennent.
      if (c.bat && !(c.bat.type === 'maison' && !c.bat.societe)) { ok = false; break; }
      if (!c.bat && c.proprio && c.proprio !== 'ind') { ok = false; break; }
      lot.push(c);
    }
    if (!ok || lot.length !== def.cases) continue;
    // On ne rase que si l'opération gagne réellement des ménages.
    const perdus = lot.filter(c => c.bat).length;
    if (perdus === 0) continue;                       // trouverEmplacement l'aurait vu
    if (def.menages <= perdus) continue;
    for (const c of lot) if (c.bat) monde.demolir(c.bat);
    return lot;
  }
  return null;
}

function coutEstime(monde, ville, type) {
  const m = ville.marche;
  let c = 0;
  const def = BAT[type];
  for (const [r, q] of Object.entries(def.mat)) c += q * def.cases * m.prix[r];
  return c + def.cases * monde.prixCase(ville, { distanceGare: 8, proprio: 'ind' });
}

// ---------------------------------------------------------------------------
// Les sociétés rivales.
//
// Elles jouent le même jeu que le joueur, avec les mêmes règles : elles
// achètent de la terre, ouvrent des chantiers, règlent l'activité de leurs
// bâtiments. Elles n'ont accès à aucune information cachée.
// ---------------------------------------------------------------------------

export function piloterSociete(monde, s) {
  if (s.faillite) return;

  // On surveille d'abord ce qu'on possède : un atelier qui perd de l'argent
  // depuis trois mois passe en sommeil plutôt que de saigner.
  for (const b of s.batiments) {
    if (!b.def.sort) continue;
    const pertes = b.histo.slice(-3);
    if (pertes.length === 3 && pertes.every(x => x < 0)) b.activite = 0;
    else if (b.activite === 0 && b.margeBrute(b.ville.marche) > b.entretien * 2) b.activite = 1;
  }

  // Ouvrir trop de chantiers à la fois, c'est immobiliser son cash dans des
  // trous. C'est le principal piège de trésorerie du jeu.
  if (s.chantiers.length >= 2) return;
  if (s.tresorerie < 1200) return;

  // Où bâtir : la ville où l'occasion est la plus nette. Chaque société a un
  // métier de prédilection, sans quoi les trois rivales bâtiraient exactement
  // la même chose au même moment.
  let meilleur = null;
  for (const v of monde.villes) {
    const besoin = besoinLePlusCriant(monde, v, s.penchant);
    if (!besoin) continue;
    let type = besoin.type === 'logement'
      ? (v.marche.stock.acier > 300 && s.tresorerie > 6000 ? 'immeuble' : 'maison')
      : remonter(monde, v, besoin.res);
    if (!type) continue;
    const def = BAT[type];
    if (def.cat !== 'loge' && brasDisponibles(monde, v) < def.cases) continue;
    // On n'ajoute pas un atelier de plus à une filière dont l'amont ne suit
    // pas : ce serait payer un bâtiment pour le mettre aussitôt en sommeil.
    if (Object.keys(def.intrants || {}).length
        && couverture(monde, v, type).taux < P.couvertureMinimale) continue;
    const score = besoin.score;
    if (!meilleur || score > meilleur.score) meilleur = { ville: v, type, score };
  }

  // Les bureaux sont le seul argent qui vienne du dehors : une ville qui en
  // manque s'étiole. C'est un placement lent mais qui ne dépend d'aucun marché.
  if (!meilleur || meilleur.score < 1.2) {
    const v = monde.villes[Math.floor(monde.hasard() * monde.villes.length)];
    const bureaux = monde.tousBatiments(v).filter(b => b.def.cat === 'bur').length;
    if (bureaux < Math.ceil(v.menages / 78) && brasDisponibles(monde, v) > 25) {
      meilleur = { ville: v, type: 'bureaux', score: 1 };
    }
  }
  if (!meilleur) return;

  const cases = monde.trouverEmplacement(meilleur.ville, meilleur.type, null)
             || monde.trouverEmplacement(meilleur.ville, meilleur.type, s);
  if (!cases) return;
  const cout = coutEstime(monde, meilleur.ville, meilleur.type);
  if (s.tresorerie < cout * 1.3) return;

  monde.ouvrirChantier(meilleur.type, meilleur.ville, cases, s);
}
