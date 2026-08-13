// ---------------------------------------------------------------------------
// Comment une ville bâtit.
//
// Une ville ne bâtit pas ce qui rapporte le plus. Elle bâtit ce qui lui manque,
// et quand rien ne manque, alors seulement elle regarde le rendement. Trois
// règles suffisent à décrire tout son comportement, et elles valent aussi bien
// pour un joueur — un joueur a simplement le droit de se tromper.
// ---------------------------------------------------------------------------

import { P, BAT, RES } from './params.js';

// Qui produit quoi.
const PRODUCTEUR = {
  bois: 'coupe', argile: 'carriere', charbon: 'mineCharbon', minerai: 'mineFer',
  cereales: 'ferme', betail: 'ranch',
  planches: 'scierie', briques: 'briqueterie', pain: 'minoterie',
  viande: 'abattoir', acier: 'acierie', produits: 'manufacture',
};

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

  // Si l'intrant est nettement plus tendu que le produit, c'est lui qu'il faut
  // aller chercher en amont. Sinon, c'est bien cet atelier-ci qui manque.
  if (pireIndice > 1.20 && pireIndice > indiceSortie * 0.95) {
    return remonter(monde, ville, pire, profondeur + 1);
  }
  return type;
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

// Une filière est saturée quand ses ateliers existants tournent déjà au ralenti
// faute d'intrants : en bâtir un de plus n'ajoute pas un gramme de production.
function sature(monde, ville, type) {
  const intrants = Object.keys(BAT[type].intrants || {});
  if (!intrants.length) return false;
  const miens = monde.tousBatiments(ville).filter(b => b.type === type && b.age > 3);
  if (miens.length < 2) return false;
  const taux = miens.reduce((s, b) => s + b.tauxReel, 0) / miens.length;
  if (taux >= 0.55) return false;
  // Ils tournent au ralenti — mais est-ce faute d'intrants, ou faute de
  // débouchés ? Dans le second cas, en bâtir un de plus serait absurde ; dans
  // le premier, c'est en amont qu'il faut aller, ce dont `remonter` s'occupe.
  return true;
}

// Le besoin le plus criant de la ville, dans l'ordre où elle le ressent.
function besoinLePlusCriant(monde, ville, penchant) {
  const b = ville.barometres;
  const m = ville.marche;

  const candidats = [];

  // La nourriture passe avant tout le reste. Elle est le seul baromètre dont la
  // chute vide la ville, et le seul dont la correction prend des années : il
  // faut une ferme, puis une minoterie, puis des bras pour les deux.
  if (b.nourriture < 0.995) candidats.push({ score: 5 - b.nourriture * 2, res: 'pain' });

  // Le logement ne compte pas dans le plafond de bras : une maison n'emploie
  // personne, et la bloquer parce que la ville est pleine, c'est l'empêcher de
  // grandir précisément au moment où elle le pourrait.
  //
  // Mais on ne loge pas des gens qu'on ne pourra pas nourrir. La ville garde
  // toujours un peu de mou sur le marché du travail : « la main-d'œuvre
  // disponible est l'amortisseur de la ville », et une ville au plein emploi ne
  // peut plus bâtir la ferme qui la sauverait. Un plein-emploi durable n'est
  // pas une réussite, c'est une fragilité.
  const mou = brasDisponibles(monde, ville) / Math.max(1, ville.menages * P.employesParMenage);
  if (ville.occupation > 0.86 && mou > 0.10) {
    candidats.push({ score: 2.2 + ville.occupation, res: null, type: 'logement' });
  }

  if (b.produits < 0.90) candidats.push({ score: 2 - b.produits, res: 'produits' });

  // Les matériaux : une ville à court de briques finit par se donner une
  // briqueterie, parce que ses chantiers en font monter le prix.
  for (const r of ['planches', 'briques']) {
    const indice = m.prix[r] / RES[r].prix;
    if (indice > 1.15) candidats.push({ score: indice, res: r });
  }

  // Le penchant ne rend pas aveugle : il déclasse les occasions, il ne les
  // supprime pas. Une pénurie criante reste criante pour tout le monde.
  if (penchant) for (const c of candidats) {
    if (c.type === penchant || c.res === penchant) c.score *= 1.5;
  }
  candidats.sort((a, b2) => b2.score - a.score);
  if (!candidats.length) return null;
  // Parmi les occasions qui se valent à peu près, on ne prend pas toujours la
  // première : deux sociétés qui lisent le même marché ne doivent pas fatalement
  // ouvrir le même chantier le même mois.
  const seuil = candidats[0].score * 0.75;
  const bonnes = candidats.filter(c => c.score >= seuil);
  return bonnes[Math.floor(Math.random() * bonnes.length)];
}

// L'épargne des ménages bâtit la ville. Les habitants construisent ce qui
// manque le plus, et ces bâtiments appartiennent aux propriétaires
// indépendants — donc rachetables par les joueurs.
export function piloterVille(monde, ville) {
  const budget = ville.epargne;
  if (budget < 200) return;

  const besoin = besoinLePlusCriant(monde, ville);
  if (!besoin) return;

  let type;
  if (besoin.type === 'logement') {
    // La maison est un petit pas prudent, l'immeuble un pari sur l'avenir.
    // Une ville sans acier ne peut pas bâtir en hauteur.
    const acierDispo = ville.marche.stock.acier > 200;
    type = (acierDispo && ville.menages > 260 && budget > 4500) ? 'immeuble' : 'maison';
  } else {
    type = remonter(monde, ville, besoin.res);
  }
  if (!type) return;

  const def = BAT[type];
  if (def.cat !== 'loge' && brasDisponibles(monde, ville) < def.cases) return;

  const cout = coutEstime(monde, ville, type);
  if (budget < cout) return;

  const cases = monde.trouverEmplacement(ville, type, null);
  if (!cases) return;

  ville.epargne -= cout;
  monde.poser(type, ville, cases, null);
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
    // On n'ajoute pas un atelier de plus à une filière déjà à l'arrêt : ce
    // serait payer un bâtiment pour le mettre aussitôt en sommeil.
    if (sature(monde, v, type)) continue;
    const score = besoin.score;
    if (!meilleur || score > meilleur.score) meilleur = { ville: v, type, score };
  }

  // Les bureaux sont le seul argent qui vienne du dehors : une ville qui en
  // manque s'étiole. C'est un placement lent mais qui ne dépend d'aucun marché.
  if (!meilleur || meilleur.score < 1.2) {
    const v = monde.villes[Math.floor(Math.random() * monde.villes.length)];
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
