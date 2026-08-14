// ---------------------------------------------------------------------------
// Les événements.
//
// Une économie qui ne connaît que sa propre mécanique finit par être prévisible :
// on trouve la bonne trajectoire, on la répète, et il n'y a plus rien à décider.
// Les événements sont ce qui casse la trajectoire — une sécheresse qui affame,
// une vague d'immigration qui remplit les logements qu'on avait bâtis en avance,
// un krach qui assèche la bourse au moment où l'on comptait dessus.
//
// PRINCIPE : un événement ne mute jamais l'état de façon irréversible. Il
// s'inscrit dans une liste, et la simulation LIT ses modificateurs là où ils
// s'appliquent. Quand il expire, il disparaît de la liste et tout revient de
// soi-même. Les seules exceptions sont les mouvements de population — une
// épidémie qui a emporté des gens ne les rend pas.
// ---------------------------------------------------------------------------

import { P } from './params.js';

// Le catalogue. `poids` est la fréquence relative : la somme n'a pas à faire 1.
export const EVENEMENTS = {
  secheresse: {
    nom: 'Sécheresse', signe: '☀', teinte: 'rouge',
    poids: 14, duree: [10, 30], portee: 'sol',
    texte: (e) => `${e.ville ? e.ville.nom + ' souffre de la sécheresse' : 'La sécheresse frappe toute la carte'}`
      + ` — les terres ne rendent que ${Math.round(e.ampleur * 100)} % de leur ordinaire`,
  },
  recolte: {
    nom: 'Récolte exceptionnelle', signe: '✿', teinte: 'vert',
    poids: 10, duree: [6, 14], portee: 'sol',
    texte: (e) => `${e.ville ? 'Récolte exceptionnelle à ' + e.ville.nom : 'Récolte exceptionnelle partout'}`
      + ` — les terres rendent ${Math.round(e.ampleur * 100)} % de leur ordinaire`,
  },
  immigration: {
    nom: 'Vague d\'immigration', signe: '⇥', teinte: 'vert',
    poids: 11, duree: [1, 1], portee: 'population',
    texte: (e) => `Une vague d'immigration afflue`
      + `${e.ville ? ' vers ' + e.ville.nom : ' sur toute la carte'}`
      + ` — les logements vacants se remplissent`,
  },
  grippe: {
    nom: 'Grippe espagnole', signe: '†', teinte: 'rouge',
    poids: 7, duree: [1, 1], portee: 'population',
    texte: (e) => `La grippe emporte ${Math.round((1 - e.ampleur) * 100)} % des habitants`
      + `${e.ville ? ' de ' + e.ville.nom : ' de chaque ville'}`,
  },
  greve: {
    nom: 'Grève', signe: '✊', teinte: 'rouge',
    poids: 13, duree: [4, 16], portee: 'travail',
    texte: (e) => `Grève ${e.secteur ? NOMS_SECTEUR[e.secteur] : 'générale'} à ${e.ville.nom}`
      + ` — les ateliers tournent au ralenti tant que le salaire n'aura pas atteint`
      + ` ${e.exige.toFixed(2)} $`,
  },
  krach: {
    nom: 'Krach boursier', signe: '↯', teinte: 'rouge',
    poids: 9, duree: [8, 20], portee: 'finance',
    texte: () => `Krach boursier — l'épargne des ménages déserte le marché,`
      + ` les capitaux se replient sur la brique`,
  },
  crise: {
    nom: 'Crise économique', signe: '▽', teinte: 'rouge',
    poids: 9, duree: [10, 26], portee: 'finance',
    texte: () => `Crise économique — l'épargne reste en banque : elle ne bâtit plus`
      + ` et n'achète plus de titres`,
  },
  boom: {
    nom: 'Boom économique', signe: '△', teinte: 'vert',
    poids: 10, duree: [10, 24], portee: 'finance',
    texte: (e) => `Boom économique — des capitaux venus du dehors gonflent l'épargne`
      + ` de ${Math.round((e.ampleur - 1) * 100)} %`,
  },
};

const NOMS_SECTEUR = {
  expl: 'des exploitations', trans: 'des ateliers',
  manu: 'des manufactures', bur: 'des bureaux',
};

const SECTEURS = ['expl', 'trans', 'manu'];

// ---------------------------------------------------------------------------

function entre(rng, [a, b]) { return a + Math.floor(rng() * (b - a + 1)); }

function tirerType(rng) {
  const noms = Object.keys(EVENEMENTS);
  const total = noms.reduce((s, n) => s + EVENEMENTS[n].poids, 0);
  let r = rng() * total;
  for (const n of noms) { r -= EVENEMENTS[n].poids; if (r <= 0) return n; }
  return noms[0];
}

// Fabrique un événement du type demandé. `monde` sert à choisir une ville et à
// lire l'état courant — un salaire exigé n'a de sens que rapporté au salaire du
// jour.
export function creerEvenement(monde, type, rng = Math.random) {
  const def = EVENEMENTS[type];
  const e = {
    type, def, debut: monde.mois,
    fin: monde.mois + entre(rng, def.duree),
    ville: null, secteur: null, ampleur: 1,
  };

  // Local ou général ? Une sécheresse générale est rare et brutale ; une
  // sécheresse locale est la règle, et c'est elle qui rend le rail précieux —
  // on achète le pain de la ville d'à côté.
  //
  // La finance, elle, n'est jamais locale : il n'y a qu'une bourse et qu'une
  // épargne, et un krach qui ne frapperait qu'une ville n'aurait nulle part où
  // s'appliquer. Une grève, à l'inverse, est toujours celle d'une ville — on ne
  // fait pas grève « en général » contre un salaire qui se fixe ville par ville.
  const local = def.portee !== 'finance'
    && (type === 'greve' || rng() < P.partEvenementsLocaux);
  if (local) e.ville = monde.villes[Math.floor(rng() * monde.villes.length)];

  switch (type) {
    case 'secheresse':
      e.ampleur = P.secheresseMin + rng() * (P.secheresseMax - P.secheresseMin);
      break;
    case 'recolte':
      e.ampleur = P.recolteMin + rng() * (P.recolteMax - P.recolteMin);
      break;
    case 'immigration':
      e.ampleur = 1 + P.immigrationMin + rng() * (P.immigrationMax - P.immigrationMin);
      break;
    case 'grippe':
      e.ampleur = 1 - (P.grippeMin + rng() * (P.grippeMax - P.grippeMin));
      break;
    case 'greve':
      // Une grève générale une fois sur trois ; sinon un secteur seulement.
      e.secteur = rng() < 0.34 ? null : SECTEURS[Math.floor(rng() * SECTEURS.length)];
      e.exige = e.ville.salaire * (1 + P.hausseExigee);
      break;
    case 'boom':
      e.ampleur = 1 + P.boomMin + rng() * (P.boomMax - P.boomMin);
      break;
  }
  return e;
}

// ---------------------------------------------------------------------------
// Le moteur, appelé une fois par mois.
// ---------------------------------------------------------------------------

export function tirerEvenements(monde, rng = Math.random) {
  // Les événements à effet immédiat sont appliqués puis retirés ; les autres
  // vivent jusqu'à leur date de fin, ou jusqu'à ce que leur condition de sortie
  // soit remplie — c'est le cas de la grève, qui s'arrête quand elle a obtenu
  // ce qu'elle demandait.
  monde.evenements = monde.evenements.filter(e => {
    if (e.type === 'greve' && e.ville.salaire >= e.exige) {
      monde.journal.push(`${monde.mois} · ✊ La grève de ${e.ville.nom} prend fin`
        + ` — le salaire a atteint ${e.ville.salaire.toFixed(2)} $`);
      return false;
    }
    if (monde.mois >= e.fin) {
      monde.journal.push(`${monde.mois} · ${e.def.signe} ${e.def.nom} : c'est fini`);
      return false;
    }
    return true;
  });

  // On ne surcharge pas : deux événements simultanés au plus, et jamais deux du
  // même type. Une partie qui empile les catastrophes ne se joue plus, elle se
  // subit.
  if (monde.mois < P.graceEvenements) return;
  if (monde.evenements.length >= P.evenementsSimultanes) return;
  if (rng() > 1 / P.moisEntreEvenements) return;

  const type = tirerType(rng);
  if (monde.evenements.some(e => e.type === type)) return;

  const e = creerEvenement(monde, type, rng);
  monde.journal.push(`${monde.mois} · ${e.def.signe} ${e.def.texte(e)}`);

  // Les événements de population frappent une fois et disparaissent.
  if (e.def.portee === 'population') {
    appliquerPopulation(monde, e);
    return;
  }
  monde.evenements.push(e);
}

function appliquerPopulation(monde, e) {
  const cibles = e.ville ? [e.ville] : monde.villes;
  for (const v of cibles) {
    const avant = v.menages;
    // Une vague d'immigration ne crée pas de logements : elle remplit ceux qui
    // sont vides. Qui a bâti en avance encaisse la vague, qui a bâti juste ce
    // qu'il fallait la regarde passer.
    v.menages = Math.max(4, Math.min(v.capaciteLogement || Infinity, v.menages * e.ampleur));
    v.occupation = v.capaciteLogement > 0
      ? Math.max(0, Math.min(1, v.menages / v.capaciteLogement)) : 0;
    const delta = Math.round(v.menages - avant);
    if (delta !== 0) {
      monde.journal.push(`${monde.mois} ·    ${v.nom} : ${delta > 0 ? '+' : ''}${delta} ménages`);
    }
  }
}

// ---------------------------------------------------------------------------
// Les modificateurs. C'est par ici que la simulation lit les événements.
// ---------------------------------------------------------------------------

// Ce que rend la terre, rapporté à son ordinaire. Sécheresse et récolte se
// multiplient : une récolte exceptionnelle pendant une sécheresse générale, ce
// sont deux nouvelles qui se compensent en partie, et c'est très bien ainsi.
export function facteurSol(monde, ville) {
  let f = 1;
  for (const e of monde.evenements) {
    if (e.def.portee !== 'sol') continue;
    if (e.ville && e.ville !== ville) continue;
    f *= e.ampleur;
  }
  return f;
}

// Le régime auquel tourne un atelier. Une grève ne renvoie pas les ouvriers chez
// eux : ils sont là, ils ne travaillent pas.
export function facteurGreve(monde, ville, categorie) {
  for (const e of monde.evenements) {
    if (e.type !== 'greve' || e.ville !== ville) continue;
    if (e.secteur && e.secteur !== categorie) continue;
    return P.regimeDeGreve;
  }
  return 1;
}

// Ce que devient l'épargne des ménages : ce qui bâtit, ce qui achète des titres.
// En crise, elle ne fait ni l'un ni l'autre — elle dort.
export function orientationEpargne(monde) {
  let versBourse = P.partEnBourse, versVille = 1 - P.partEnBourse, apport = 1;
  for (const e of monde.evenements) {
    if (e.type === 'krach') { versVille += versBourse; versBourse = 0; }
    if (e.type === 'crise') { versBourse = 0; versVille = 0; }
    if (e.type === 'boom') apport *= e.ampleur;
  }
  return { versBourse, versVille, apport };
}

// La grève tire le salaire vers le haut : c'est sa raison d'être.
export function salaireExige(monde, ville) {
  let s = 0;
  for (const e of monde.evenements) {
    if (e.type === 'greve' && e.ville === ville) s = Math.max(s, e.exige);
  }
  return s;
}
