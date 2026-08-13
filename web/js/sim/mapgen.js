// ---------------------------------------------------------------------------
// Génération de carte. Une carte neuve à chaque partie.
//
// Principe (§CQ14) : toutes les ressources sont présentes dans toutes les
// villes, mais chacune a une prédominance et deux ou trois ressources
// nettement plus rares. Aucune ville ne peut se suffire à elle-même, aucune
// n'est privée de quoi que ce soit.
// ---------------------------------------------------------------------------

import { P, RELIEFS, QUALITES } from './params.js';

// PRNG déterministe (mulberry32) : même graine, même carte.
export function rng(graine) {
  let a = graine >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bruit de valeur lissé : des taches cohérentes plutôt qu'un poivre aléatoire.
function bruit(rnd, taille, echelle) {
  const g = Math.ceil(taille / echelle) + 2;
  const pts = Array.from({ length: g * g }, () => rnd());
  const lisse = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x / echelle, fy = y / echelle;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = lisse(fx - x0), ty = lisse(fy - y0);
    const at = (i, j) => pts[Math.min(j, g - 1) * g + Math.min(i, g - 1)];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  };
}

const NOMS = ['Grands-Bois', 'Val-de-Fer', 'Plaine-Dorée', 'Terre-Rouge', 'Port-Neuf',
              'Bois-Perdu', 'Roche-Noire', 'Champs-Longs', 'Argilières', 'Confluent'];

// Chaque ville reçoit une prédominance et deux raretés. Ce sont des biais sur
// la distribution des qualités, jamais une absence : le minerai existe partout,
// il est simplement médiocre là où il n'est pas la vocation du lieu.
const PROFILS = [
  { pred: 'bois',      rares: ['minerai', 'charbon'],  relief: 'foret'    },
  { pred: 'minerai',   rares: ['fertilite', 'bois'],   relief: 'montagne' },
  { pred: 'fertilite', rares: ['charbon', 'minerai'],  relief: 'plaine'   },
  { pred: 'argile',    rares: ['bois', 'minerai'],     relief: 'plaine'   },
  { pred: 'charbon',   rares: ['fertilite', 'argile'], relief: 'colline'  },
];

export function genererCarte(nbVilles, graine) {
  const rnd = rng(graine);
  const N = P.tailleVille;
  const profils = melanger(PROFILS.slice(), rnd).slice(0, nbVilles);
  const noms = melanger(NOMS.slice(), rnd);

  const villes = profils.map((profil, i) => {
    const bReliefA = bruit(rnd, N, 11), bReliefB = bruit(rnd, N, 5);
    const bQ = {}; for (const q of QUALITES) bQ[q] = bruit(rnd, N, 8);

    const gare = { x: N >> 1, y: N >> 1 };
    const cases = new Array(N * N);

    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const h = bReliefA(x, y) * 0.7 + bReliefB(x, y) * 0.3;
      // Le relief dominant du profil est sur-représenté sans être exclusif.
      let relief;
      if (h > 0.72) relief = 'montagne';
      else if (h > 0.56) relief = 'colline';
      else if (h > 0.40) relief = 'foret';
      else relief = 'plaine';
      if (rnd() < 0.28) relief = profil.relief;

      const biais = RELIEFS[relief].biais;
      const q = {};
      for (const nom of QUALITES) {
        // base 1-5 tirée du bruit, modulée par le relief puis par le profil
        let v = bQ[nom](x, y) * 4 + 1;
        v *= biais[nom];
        if (nom === profil.pred) v *= 1.45;
        if (profil.rares.includes(nom)) v *= 0.55;
        q[nom] = Math.max(1, Math.min(5, Math.round(v)));
      }

      const d = Math.abs(x - gare.x) + Math.abs(y - gare.y);
      cases[y * N + x] = {
        x, y, relief, q, distanceGare: d,
        rue: false,
        proprio: null,      // null = vierge ; 'ind' = indépendant ; sinon id de société
        bat: null,          // référence vers le bâtiment posé
        chantier: null,
        voie: false,
        vendue: false,
      };
    }

    // La gare, et les emprises de voie qui en partent — réservées, non
    // constructibles, visibles dès la première seconde.
    cases[gare.y * N + gare.x].voie = true;
    for (let x = 0; x < N; x++) cases[gare.y * N + x].voie = true;

    // La trame des rues. « La densité des rues fait la hiérarchie urbaine. Un
    // bâtiment seul dans sa parcelle, entouré de rue sur quatre côtés, met la
    // moitié de la surface en gris : parfait pour un bourg, désastreux pour une
    // métropole qui doit paraître dense. Une rue toutes les trois ou quatre
    // cases avec des îlots mitoyens au centre, des parcelles isolées en
    // périphérie. » (§21)
    const RAYON_URBAIN = Math.round(N * 0.38);
    for (const c of cases) {
      const dx = c.x - gare.x, dy = c.y - gare.y;
      if (Math.abs(dx) + Math.abs(dy) > RAYON_URBAIN) continue;   // la campagne n'a pas de rues
      if (dx % 5 === 0 || dy % 5 === 0) c.rue = true;
    }

    // 30 % des cases exploitables appartiennent à des indépendants. Ils vendent
    // au prix du marché majoré de 20 % : le raccourci payant.
    for (const c of cases) if (!c.voie && !c.rue && rnd() < P.partIndependants) c.proprio = 'ind';

    // Les cases autour de la gare sont ouvertes d'emblée, sans quoi la règle de
    // contiguïté n'aurait aucun point de départ.
    for (const c of cases) if (c.distanceGare <= 4 && !c.voie && !c.rue) c.vendue = true;

    return {
      id: i, nom: noms[i], profil, N, gare, cases,
      menages: 200,               // 200 ménages = 400 employés au départ
      occupation: 0.85,
      salaire: P.salaireCase,
      niveau: 1,
      barometres: { nourriture: 1, emploi: 0.78, produits: 0.6 },
      epargne: 0,
      marche: null,               // affecté par world.js
      histo: [],
    };
  });

  // Les liaisons : toutes les paires de villes, dates d'achèvement échelonnées
  // et annoncées dès le début de la partie.
  const liaisons = [];
  for (let a = 0; a < nbVilles; a++) for (let b = a + 1; b < nbVilles; b++) {
    liaisons.push({
      a, b,
      nom: `${villes[a].nom} — ${villes[b].nom}`,
      dateInitiale: 14 + Math.floor(rnd() * 22),   // mois
      date: 0, capital: 0, achevee: false, cotee: false,
      actions: 0, tresorerie: 0, parts: {},
    });
  }
  for (const l of liaisons) l.date = l.dateInitiale;

  return { villes, liaisons, graine };
}

function melanger(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function caseAt(ville, x, y) {
  if (x < 0 || y < 0 || x >= ville.N || y >= ville.N) return null;
  return ville.cases[y * ville.N + x];
}

// Règle de contiguïté : on ne peut acheter une terre vierge que si elle touche
// une terre déjà vendue ou bâtie. La ville s'étend en anneaux depuis sa gare, et
// il existe à chaque instant une frontière étroite et disputée.
export function estAchetable(ville, c) {
  if (!c || c.voie || c.rue || c.vendue) return false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const v = caseAt(ville, c.x + dx, c.y + dy);
    if (v && (v.vendue || v.voie)) return true;
  }
  return false;
}
