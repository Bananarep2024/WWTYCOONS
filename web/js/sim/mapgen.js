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
  const bQ = {}; for (const q of QUALITES) bQ[q] = fractal(rnd, P.echellesQualite, [1, 0.45]);

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
  // On garde ici la valeur CONTINUE, sans l'arrondir : le champ de vocation
  // (étape 3 bis) va la remodeler, et arrondir deux fois de suite écraserait les
  // nuances qu'on vient de calculer.
  // On calcule d'abord le score brut de chaque case, puis on CLASSE : les seuils
  // sont les quantiles de la distribution réelle, ce qui rend la rareté exacte.
  const score = {};
  for (const nom of QUALITES) {
    const t = new Float64Array(cases.length);
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      t[i] = bQ[nom](c.x, c.y) * RELIEFS[c.relief].biais[nom];
    }
    score[nom] = t;
  }

  const seuils = {};
  for (const nom of QUALITES) {
    const tri = Float64Array.from(score[nom]).sort();
    seuils[nom] = [];
    let cumul = 0;
    for (let k = 0; k < P.partQualite.length - 1; k++) {
      cumul += P.partQualite[k];
      seuils[nom].push(tri[Math.min(tri.length - 1, Math.floor(cumul * tri.length))]);
    }
  }

  for (let i = 0; i < cases.length; i++) {
    const brut = {};
    for (const nom of QUALITES) {
      const v = score[nom][i];
      // partQualite est indexée depuis ZÉRO : la première part est celle des
      // cases stériles. Le sommet de l'échelle est donc length − 1.
      let q = P.partQualite.length - 1;             // le sommet par défaut
      for (let k = 0; k < seuils[nom].length; k++) {
        if (v < seuils[nom][k]) { q = k; break; }
      }
      brut[nom] = q;
    }
    cases[i].qBrut = brut;
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
        score += v.qBrut[profil.pred]; n++;
      }
      score = score / n - Math.abs(c.alt - profil.penteVoulue) * 4;
      if (score > meilleurScore) { meilleurScore = score; meilleur = { x, y }; }
    }
    if (meilleur) sites.push(meilleur);
  }

  // --- 3 bis. Les vocations : ce qui fait des ZONES ------------------------
  //
  // Jusqu'ici la vocation d'une ville ne servait qu'à CHOISIR SON SITE. Le sol,
  // lui, sortait du même bruit fractal partout, et le champ `rares` des profils
  // était déclaré sans être lu une seule fois. Résultat mesuré sur 200 villes :
  // 81 % d'entre elles avaient au moins une case excellente dans les cinq
  // ressources à la fois. Aucune ne manquait de rien, donc aucune n'avait de
  // raison d'échanger — et le rail ne transportait que des marchandises que
  // l'autre bout produisait déjà.
  //
  // Chaque ville reçoit maintenant un PLAFOND par ressource : deux à 5, une à 3
  // ou 4, deux à 1 ou 2. La prédominance du profil prend l'un des deux 5, et les
  // `rares` — enfin employées — prennent les deux plafonds bas.
  //
  // Le plafond lui-même est appliqué plus bas (étape 4 bis), une fois les
  // territoires découpés : c'est l'appartenance qui décide, pas la distance.
  // La prédominance donne le premier plafond riche : comme les cinq profils ont
  // cinq prédominances distinctes, chaque ressource est déjà riche quelque part.
  // Le SECOND emplacement riche, lui, se choisissait ville par ville et
  // indépendamment — et c'est ce qui affamait des cartes entières.
  //
  // Mesuré : les villes en pénurie de vivres avaient exactement le même sol et
  // le même nombre de fermes que les autres (fertilité 3,2 contre 3,3, 149
  // fermes contre 144). Ce n'était donc pas la ville qui manquait de terre,
  // c'était la CARTE : quand aucune des deux villes libres de leur second choix
  // ne le donnait à la fertilité, le continent entier ne comptait qu'une seule
  // ville nourricière, et il ne pouvait pas se nourrir.
  //
  // On répartit donc les seconds emplacements de sorte que chaque ressource soit
  // riche dans exactement deux villes. Cinq villes à deux emplacements font dix
  // places pour cinq ressources : le compte tombe juste, et un couplage existe
  // toujours sur les profils du jeu.
  const seconds = repartirSeconds(profils, rnd);

  const vocations = profils.map((profil, i) => {
    const autres = QUALITES.filter(q => q !== profil.pred && !profil.rares.includes(q));
    const plafond = {};
    plafond[profil.pred] = P.vocationRiche;
    if (seconds[i]) plafond[seconds[i]] = P.vocationRiche;
    for (const q of autres) {
      if (q === seconds[i]) continue;
      plafond[q] = P.vocationMoyenMin
        + Math.floor(rnd() * (P.vocationMoyenMax - P.vocationMoyenMin + 1));
    }
    for (const q of profil.rares) {
      plafond[q] = P.vocationPauvreMin
        + Math.floor(rnd() * (P.vocationPauvreMax - P.vocationPauvreMin + 1));
    }
    return plafond;
  });

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

  // --- 4 bis. Le sol prend la vocation de sa ville --------------------------
  //
  // Le plafond s'applique par APPARTENANCE, et non par distance. Essayé d'abord
  // en pondérant les cinq villes par l'inverse de la distance, puis par une
  // gaussienne : dans les deux cas la voisine pesait encore assez en lisière
  // pour remonter les plafonds bas, et une ville sur dix seulement respectait sa
  // vocation. Le territoire est déjà découpé à ce stade — autant s'en servir.
  //
  // Il ne reste à mélanger que la terre vierge, celle de l'entre-deux que les
  // villes atteindront en grandissant : elle vaut la moyenne de ses voisines,
  // pondérée par la distance, ce qui donne le dégradé entre deux zones.
  const s2 = P.porteeVocation * P.porteeVocation;
  const parId = new Map(villes.map((v, i) => [v.id, vocations[i]]));

  for (const c of cases) {
    const sienne = c.ville ? parId.get(c.ville.id) : null;

    let plafonds = sienne;
    if (!plafonds) {
      let dmin2 = Infinity;
      const d2 = sites.map(s => {
        const v = (s.x - c.x) * (s.x - c.x) + (s.y - c.y) * (s.y - c.y);
        if (v < dmin2) dmin2 = v;
        return v;
      });
      // On retranche le carré de la plus courte distance avant d'exponentier :
      // le résultat est le même après normalisation, mais la plus proche vaut 1
      // au lieu d'un nombre minuscule, et rien ne s'annule au loin.
      let somme = 0;
      const poids = d2.map(v => { const p = Math.exp(-(v - dmin2) / s2); somme += p; return p; });
      plafonds = {};
      for (const nom of QUALITES) {
        let t = 0;
        for (let i = 0; i < vocations.length; i++) t += poids[i] * vocations[i][nom];
        plafonds[nom] = somme > 0 ? t / somme : P.vocationRiche;
      }
    }

    const q = {};
    for (const nom of QUALITES) {
      // On ÉTIRE la valeur brute sous son plafond au lieu de la couper : une case
      // stérile le reste, une case excellente atteint tout juste le plafond, et
      // le relief continue de se lire à l'intérieur de la zone. L'étirement part
      // de zéro : une carte pauvre en charbon n'a pas des mines médiocres, elle
      // n'a pas de charbon.
      const v = c.qBrut[nom] * plafonds[nom] / P.vocationRiche;
      // Le filon est toujours hors les murs : sur un territoire de ville, on
      // plafonne à 2. La qualité 3 n'existe que sur la terre libre, et c'est ce
      // qui oblige à fonder une gare pour l'atteindre.
      // Le plafond tient à deux choses : appartenir à un territoire, et être
      // trop près d'une ville fondatrice. La seconde est ce qui oblige à
      // s'éloigner vraiment — sans elle, un filon de lisière se cueille en
      // posant une gare juste derrière la frontière, sans rien risquer.
      let haut = c.ville ? P.plafondEnVille : P.qualiteSommet;
      if (haut > P.plafondEnVille) {
        for (const s of sites) {
          if (Math.hypot(s.x - c.x, s.y - c.y) < P.distanceMinFilon) {
            haut = P.plafondEnVille; break;
          }
        }
      }
      q[nom] = Math.max(0, Math.min(haut, Math.round(v)));
    }
    c.q = q;
    // On garde la valeur brute : le plancher ci-dessous s'en sert pour choisir
    // les cases à promouvoir.
  }

  // --- 4 ter. Le plancher : chaque ville produit tout, fût-ce à perte --------
  //
  // Une ville dont la vocation ne retient ni charbon ni minerai n'en a pas une
  // case, et rien ne s'y ouvre avant que le rail n'arrive — vingt ans plus tard.
  // Elle passe la moitié de la partie à ne pas exister. On lui garantit donc un
  // nombre plancher de cases de qualité 1 sur CHACUNE des cinq ressources : de
  // quoi produire, au rendement nul, ce que son sol ne lui donne pas.
  //
  // Ce n'est pas une faveur, c'est ce qui rend le rail désirable au lieu d'être
  // vital : la ville survit sans lui, elle ne prospère qu'avec.
  for (const v of villes) {
    for (const nom of QUALITES) {
      const manquantes = v.cases.filter(c => c.q[nom] < 1);
      const deja = v.cases.length - manquantes.length;
      const aPromouvoir = P.minCasesParRessource - deja;
      if (aPromouvoir <= 0) continue;
      // Les meilleures d'abord — celles que le relief désignait déjà, pour que
      // le filon promu reste au bon endroit plutôt que d'être saupoudré.
      manquantes.sort((a, b) => b.qBrut[nom] - a.qBrut[nom]);
      for (let i = 0; i < aPromouvoir && i < manquantes.length; i++) {
        manquantes[i].q[nom] = 1;
      }
    }
  }
  for (const c of cases) c.qBrut = null;

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

  return retenues.map((e) => {
    // La date d'achèvement est proportionnelle à la longueur : une ligne longue
    // demande plus de travail, et le joueur le voit dès la première seconde.
    const mois = Math.round(8 + e.d * P.moisParCaseDeVoie + rnd() * 6);
    // Une liaison n'est plus une société : il n'y a qu'UNE compagnie de chemin
    // de fer, et elle pose ses lignes l'une après l'autre. La liaison ne porte
    // donc plus que sa géométrie et son calendrier. `date` reste nulle tant que
    // le chantier n'a pas commencé — on ne date pas des travaux qui n'ont pas
    // d'ouvriers.
    return {
      a: e.a, b: e.b, longueur: Math.round(e.d),
      nom: `${villes[e.a].nom} — ${villes[e.b].nom}`,
      dateInitiale: mois, date: null, debut: null, achevee: false,
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

// Attribue à chaque ville sa seconde ressource riche, de sorte qu'aucune
// ressource n'en reçoive deux tant qu'une autre n'en a pas reçu une.
//
// C'est un couplage : chaque ville ne peut prendre que l'une des deux ressources
// qui ne sont ni sa prédominance ni ses raretés. On explore en profondeur, dans
// un ordre tiré au sort pour que deux cartes ne se ressemblent pas, et on se
// rabat sur un choix libre si aucun couplage complet n'existe — ce qui arrive
// dès que la partie compte moins de cinq villes.
function repartirSeconds(profils, rnd) {
  const choix = profils.map(p =>
    melanger(QUALITES.filter(q => q !== p.pred && !p.rares.includes(q)), rnd));

  const pris = new Set();
  const sortie = new Array(profils.length).fill(null);

  const poser = (i) => {
    if (i >= profils.length) return true;
    for (const q of choix[i]) {
      if (pris.has(q)) continue;
      pris.add(q); sortie[i] = q;
      if (poser(i + 1)) return true;
      pris.delete(q); sortie[i] = null;
    }
    return false;
  };

  if (poser(0)) return sortie;
  // Pas de couplage complet : chacun prend son premier choix disponible.
  return choix.map(c => c[0] || null);
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
