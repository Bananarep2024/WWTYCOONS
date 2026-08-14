// ---------------------------------------------------------------------------
// La carte du monde. Une seule grille, cinq villes posées dessus.
//
// Le relief vient d'abord : c'est lui qui décide où sont les montagnes, donc où
// sont le minerai et le charbon, donc où passeront les voies. Les villes
// s'installent ensuite dans les creux, à bonne distance les unes des autres, et
// se découpent en quartiers de vocations différentes.
// ---------------------------------------------------------------------------

import { P, RELIEFS, QUALITES } from './params.js';

// PRNG déterministe (mulberry32) : même graine, même monde.
export function rng(graine) {
  let a = graine >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bruit de valeur lissé, sommé sur plusieurs octaves : des reliefs cohérents
// plutôt qu'un poivre aléatoire.
function bruit(rnd, echelle) {
  const g = 96;
  const pts = Array.from({ length: g * g }, () => rnd());
  const lisse = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x / echelle, fy = y / echelle;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = lisse(fx - x0), ty = lisse(fy - y0);
    const at = (i, j) => pts[((j % g) + g) % g * g + ((i % g) + g) % g];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  };
}

function fractal(rnd, echelles, poids) {
  const couches = echelles.map(e => bruit(rnd, e));
  const total = poids.reduce((a, b) => a + b, 0);
  return (x, y) => couches.reduce((s, f, i) => s + f(x, y) * poids[i], 0) / total;
}

const NOMS = ['Grands-Bois', 'Val-de-Fer', 'Plaine-Dorée', 'Terre-Rouge', 'Port-Neuf',
              'Bois-Perdu', 'Roche-Noire', 'Champs-Longs', 'Argilières', 'Confluent',
              'Fort-Union', 'Sainte-Agathe'];

// Chaque ville a une prédominance et deux raretés. Ce sont des biais sur la
// distribution des qualités, jamais une absence : le minerai existe partout, il
// est simplement médiocre là où il n'est pas la vocation du lieu.
const PROFILS = [
  { pred: 'bois',      rares: ['minerai', 'charbon'],  penteVoulue: 0.35 },
  { pred: 'minerai',   rares: ['fertilite', 'bois'],   penteVoulue: 0.80 },
  { pred: 'charbon',   rares: ['fertilite', 'argile'], penteVoulue: 0.65 },
  { pred: 'fertilite', rares: ['charbon', 'minerai'],  penteVoulue: 0.12 },
  { pred: 'argile',    rares: ['bois', 'minerai'],     penteVoulue: 0.20 },
];

// Le tempérament d'une ville de départ.
//
// Les cinq villes ne doivent pas ouvrir la partie dans le même état : sans quoi
// il n'y a rien à arbitrer, aucune raison d'aller là plutôt qu'ici, et le rail
// ne sert qu'à transporter des marchandises identiques entre des jumelles. On
// tire donc cinq ARCHÉTYPES distincts — jamais cinq tirages indépendants, qui
// se seraient ressemblés une fois sur deux — et on les mélange.
//
//   emploi     couverture des postes : 0,60 = un tiers de chômeurs au départ
//   vivres     couverture alimentaire
//   produits   couverture en produits manufacturés
//   bureaux    dotation en immeubles de bureaux, l'argent qui vient du dehors
//   surcapacite  ampleur de la ou des filières SURCONSTRUITES — trop d'offre,
//                donc un cours effondré, un stock qui s'entasse et des ateliers
//                déficitaires en bloc : de quoi ramasser une filière entière
//   taille     population de départ, en multiple de la base
// Les bornes ne sont pas libres : sous 50 % d'emploi ou 80 % de nourriture, un
// seuil critique est franchi et la ville se vide de 5 % par mois quoi qu'il
// arrive. Un tempérament qui descendrait là ne ferait pas une ville difficile,
// il ferait une ville condamnée — mesuré : deux des cinq passaient de 50 à 12
// habitants en cinq ans. L'emploi reste donc au-dessus de 0,68 et la nourriture
// au-dessus de 0,88. Les produits manufacturés, eux, ont un seuil critique à
// 20 % seulement : c'est là qu'on peut vraiment creuser l'écart.
const TEMPERAMENTS = [
  { nom: 'cité ouvrière',       emploi: 1.00, vivres: 0.90, produits: 0.60,
    bureaux: 0.45, surcapacite: 0.14, taille: 1.20 },
  { nom: 'ville de rentiers',   emploi: 0.72, vivres: 1.08, produits: 1.15,
    bureaux: 1.85, surcapacite: 0.04, taille: 0.95 },
  { nom: 'comptoir affamé',     emploi: 0.86, vivres: 0.88, produits: 0.55,
    bureaux: 0.80, surcapacite: 0.30, taille: 0.80 },
  { nom: 'bourg prospère',      emploi: 0.95, vivres: 1.12, produits: 1.10,
    bureaux: 1.25, surcapacite: 0.06, taille: 1.10 },
  { nom: 'friche industrielle', emploi: 0.68, vivres: 0.95, produits: 0.75,
    bureaux: 0.55, surcapacite: 0.42, taille: 0.90 },
];

// Les vocations de quartier. Un quartier est une tache de Voronoï à l'intérieur
// du territoire d'une ville : c'est ce qui empêche les ateliers de cerner les
// maisons, et ce qui donne à chaque ville un plan différent.
export const VOCATIONS = ['residentiel', 'industriel', 'negoce', 'agricole'];

export function genererMonde(nbVilles, graine) {
  const rnd = rng(graine);
  const L = P.largeurMonde, H = P.hauteurMonde;

  // --- 1. Le relief -------------------------------------------------------
  const fAlt = fractal(rnd, [38, 17, 7], [1, 0.5, 0.22]);
  const fHum = fractal(rnd, [29, 11], [1, 0.4]);
  const bQ = {}; for (const q of QUALITES) bQ[q] = fractal(rnd, [21, 9], [1, 0.45]);

  const cases = new Array(L * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    // On abaisse les bords pour que le continent ne soit pas coupé net.
    const bordX = Math.min(1, Math.min(x, L - 1 - x) / 14);
    const bordY = Math.min(1, Math.min(y, H - 1 - y) / 12);
    const alt = Math.max(0, Math.min(1, fAlt(x, y) * (0.35 + 0.65 * bordX * bordY)));
    const hum = fHum(x, y);

    let relief;
    if (alt > 0.70) relief = 'montagne';
    else if (alt > 0.56) relief = 'colline';
    else if (hum > 0.58 && alt > 0.30) relief = 'foret';
    else relief = 'plaine';

    cases[y * L + x] = {
      x, y, alt, relief,
      q: null,                  // rempli juste après
      ville: null, distanceGare: 0, quartier: null,
      rue: false, voie: false,
      proprio: null, bat: null, chantier: null, vendue: false,
    };
  }

  // Pente locale : elle sert à l'ombrage du relief et au choix des sites.
  for (const c of cases) {
    const e = (x, y) => (cases[Math.max(0, Math.min(H - 1, y)) * L
                             + Math.max(0, Math.min(L - 1, x))]).alt;
    c.pente = (e(c.x + 1, c.y) - e(c.x - 1, c.y)) * 0.5;
    c.penteY = (e(c.x, c.y + 1) - e(c.x, c.y - 1)) * 0.5;
  }

  // --- 2. Les qualités, gouvernées par le relief --------------------------
  // Le minerai et le charbon sont dans la roche, la fertilité dans les
  // plaines : ce n'est pas décoratif, c'est ce qui oblige à relier les villes.
  for (const c of cases) {
    const biais = RELIEFS[c.relief].biais;
    const q = {};
    for (const nom of QUALITES) {
      let v = bQ[nom](c.x, c.y) * 4.2 + 0.9;
      v *= biais[nom];
      q[nom] = Math.max(1, Math.min(5, Math.round(v)));
    }
    c.q = q;
  }

  // --- 3. Les sites de ville ----------------------------------------------
  // On tire des candidats et on ne garde que ceux qui respectent la distance
  // minimale : sans elle, deux villes se recouvrent et le rail n'a plus de sens.
  const profils = melanger(PROFILS.slice(), rnd).slice(0, nbVilles);
  const temperaments = melanger(TEMPERAMENTS.slice(), rnd);
  const noms = melanger(NOMS.slice(), rnd);
  const sites = [];

  for (const profil of profils) {
    let meilleur = null, meilleurScore = -Infinity;
    for (let essai = 0; essai < 900; essai++) {
      const x = P.margeMonde + Math.floor(rnd() * (L - 2 * P.margeMonde));
      const y = P.margeMonde + Math.floor(rnd() * (H - 2 * P.margeMonde));
      const c = cases[y * L + x];
      if (c.alt > 0.66) continue;                       // on ne fonde pas sur un sommet
      let tropPres = false;
      for (const s of sites) {
        if (Math.hypot(s.x - x, s.y - y) < P.distanceMinVilles) { tropPres = true; break; }
      }
      if (tropPres) continue;

      // On note le voisinage : la ville veut la ressource de sa vocation à
      // portée, et un terrain à peu près plat pour s'étendre.
      let score = 0, n = 0;
      for (let dy = -9; dy <= 9; dy += 3) for (let dx = -9; dx <= 9; dx += 3) {
        const v = cases[Math.max(0, Math.min(H - 1, y + dy)) * L
                      + Math.max(0, Math.min(L - 1, x + dx))];
        score += v.q[profil.pred]; n++;
      }
      score = score / n - Math.abs(c.alt - profil.penteVoulue) * 4;
      if (score > meilleurScore) { meilleurScore = score; meilleur = { x, y }; }
    }
    if (meilleur) sites.push(meilleur);
  }

  // --- 4. Les territoires, les quartiers ----------------------------------
  const villes = sites.map((site, i) => {
    const profil = profils[i];
    // Un rayon propre à chaque ville et une déformation directionnelle : sans
    // cela, les cinq villes auraient exactement le même plan.
    // Un rayon plus large et plus dispersé : une ville de départ ne doit pas
    // être un pâté compact, mais un semis de hameaux à relier.
    const rayon = P.rayonVille * (0.80 + rnd() * 0.45);
    const orientation = rnd() * Math.PI;
    const aplatissement = 0.62 + rnd() * 0.5;
    const fLisiere = fractal(rnd, [7, 3], [1, 0.5]);

    const temperament = temperaments[i % temperaments.length];
    const v = {
      id: i, nom: noms[i], profil, temperament, gare: { x: site.x, y: site.y },
      rayon, cases: [],
      menages: Math.round(P.menagesInitiaux * temperament.taille),
      occupation: 0.85, salaire: P.salaireCase, niveau: 1,
      barometres: { nourriture: 1, emploi: 0.78, produits: 0.6 },
      epargne: 0, marche: null, histo: [],
    };

    // Les germes de quartiers. La vocation résidentielle est la plus fréquente
    // et occupe le centre ; l'industrie et le négoce se posent en couronne.
    const germes = [];
    const nbGermes = 6 + Math.floor(rnd() * 4);
    germes.push({ x: site.x, y: site.y, vocation: 'residentiel' });
    for (let k = 1; k < nbGermes; k++) {
      const a = rnd() * Math.PI * 2, d = rayon * (0.30 + rnd() * 0.72);
      const vocation = k <= 2 ? 'residentiel'
                     : k <= 4 ? 'industriel'
                     : k === 5 ? 'negoce' : 'agricole';
      germes.push({ x: site.x + Math.cos(a) * d, y: site.y + Math.sin(a) * d, vocation });
    }
    v.germes = germes;

    const port = Math.ceil(rayon * 2);
    for (let dy = -port; dy <= port; dy++) {
      for (let dx = -port; dx <= port; dx++) {
        const x = site.x + dx, y = site.y + dy;
        if (x < 0 || y < 0 || x >= L || y >= H) continue;
        const c = cases[y * L + x];
        if (c.ville) continue;                     // premier arrivé, premier servi

        // Une ellipse orientée, dont la lisière est brouillée par du bruit :
        // les villes cessent d'être des losanges identiques.
        const ca = Math.cos(orientation), sa = Math.sin(orientation);
        const u = (dx * ca + dy * sa), w = (-dx * sa + dy * ca) / aplatissement;
        const d = Math.hypot(u, w) / rayon;
        if (d > 0.55 + fLisiere(x, y) * 0.62) continue;

        c.ville = v;
        c.distanceGare = Math.round(Math.hypot(dx, dy));
        // Le quartier le plus proche donne sa vocation à la case.
        let meilleur = germes[0], best = Infinity;
        for (const g of germes) {
          const dd = Math.hypot(g.x - x, g.y - y);
          if (dd < best) { best = dd; meilleur = g; }
        }
        c.quartier = meilleur.vocation;
        v.cases.push(c);
      }
    }


    cases[site.y * L + site.x].voie = true;

    // 30 % des cases exploitables appartiennent d'emblée à des indépendants.
    for (const c of v.cases) {
      if (!c.voie && rnd() < P.partIndependants) c.proprio = 'ind';
      if (c.distanceGare <= 4 && !c.voie) c.vendue = true;
    }

    return v;
  });

  // --- 5. Le réseau ferroviaire -------------------------------------------
  // On relie les villes en arbre couvrant minimal, plus une boucle si la carte
  // s'y prête. Deux villes reliées par une chaîne d'autres villes sont reliées :
  // A–B et B–C valent A–C, sans troisième ligne à construire.
  const liaisons = construireReseau(villes, rnd);
  // L'emprise de chaque liaison est conservée : réservée dès la première
  // seconde, inconstructible, et dessinée en train de se poser.
  for (const l of liaisons) {
    l.emprise = tracerVoie(cases, L, H, villes[l.a].gare, villes[l.b].gare);
  }

  return { L, H, cases, villes, liaisons, graine };
}

// Arbre couvrant minimal sur les distances, puis une arête supplémentaire prise
// parmi les plus courtes restantes : le réseau n'est ni une simple ligne ni un
// graphe complet.
function construireReseau(villes, rnd) {
  const aretes = [];
  for (let a = 0; a < villes.length; a++) for (let b = a + 1; b < villes.length; b++) {
    aretes.push({ a, b, d: Math.hypot(villes[a].gare.x - villes[b].gare.x,
                                      villes[a].gare.y - villes[b].gare.y) });
  }
  aretes.sort((p, q) => p.d - q.d);

  const parent = villes.map((_, i) => i);
  const find = (i) => parent[i] === i ? i : (parent[i] = find(parent[i]));
  const retenues = [], rejetees = [];
  for (const e of aretes) {
    if (find(e.a) !== find(e.b)) { parent[find(e.a)] = find(e.b); retenues.push(e); }
    else rejetees.push(e);
  }
  if (rejetees.length && villes.length >= 4) retenues.push(rejetees[0]);

  return retenues.map(e => {
    // La date d'achèvement est proportionnelle à la longueur : une ligne longue
    // demande plus de travail, et le joueur le voit dès la première seconde.
    const mois = Math.round(8 + e.d * P.moisParCaseDeVoie + rnd() * 6);
    return {
      a: e.a, b: e.b, longueur: Math.round(e.d),
      nom: `${villes[e.a].nom} — ${villes[e.b].nom}`,
      dateInitiale: mois, date: mois,
      capital: 0, achevee: false, cotee: false, parts: {},
    };
  });
}

// Trace l'emprise de la voie, en escalier doux entre deux gares. Elle est
// réservée et visible dès la première seconde : le joueur sait où la ligne
// aboutira, et peut acheter autour.
// L'emprise est renvoyée DANS L'ORDRE, de la gare de départ à celle d'arrivée :
// c'est ce qui permet de la dessiner en train de se construire, gare après gare,
// au lieu d'un simple trait entre deux points.
function tracerVoie(cases, L, H, d, f) {
  const emprise = [];
  let x = d.x, y = d.y;
  const poser = () => {
    const c = cases[Math.max(0, Math.min(H - 1, y)) * L + Math.max(0, Math.min(L - 1, x))];
    c.voie = true;
    emprise.push(c);
  };
  poser();
  let garde = 0;
  while ((x !== f.x || y !== f.y) && garde++ < 4000) {
    const dx = Math.sign(f.x - x), dy = Math.sign(f.y - y);
    // On avance en diagonale douce : deux pas horizontaux pour un pas vertical
    // quand l'écart horizontal domine, et l'inverse sinon.
    if (Math.abs(f.x - x) > Math.abs(f.y - y)) x += dx;
    else y += dy;
    poser();
  }
  return emprise;
}

function melanger(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Règle de contiguïté : on ne peut acheter une terre vierge que si elle touche
// une terre déjà vendue ou bâtie. La ville s'étend en anneaux depuis sa gare, et
// il existe à chaque instant une frontière étroite et disputée.
export function estAchetable(monde, c) {
  if (!c || c.voie || c.vendue || !c.ville) return false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const v = monde.caseAt(c.x + dx, c.y + dy);
    if (v && (v.vendue || v.voie)) return true;
  }
  return false;
}
