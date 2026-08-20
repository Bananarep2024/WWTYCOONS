// ---------------------------------------------------------------------------
// Les bâtiments, dessinés.
//
// Vus de très haut, on ne voit d'un bâtiment que son toit. C'est donc là que
// doit vivre son identité : une cheminée fumante pour l'aciérie, des piles de
// grumes pour la scierie, des silos pour la minoterie. La teinte dit la
// famille, le toit dit le métier.
//
// Chaque type est pré-rendu une fois par palier de zoom dans un petit canvas,
// puis recopié : dessiner cinq cents toits au trait à chaque image mettrait un
// téléphone à genoux.
// ---------------------------------------------------------------------------

import { BAT } from '../sim/params.js';

// La teinte porte la famille industrielle. On ne la dépense jamais pour
// distinguer deux bâtiments du même métier — cette information-là passe par la
// forme du toit.
export const COULEURS = {
  coupe: '#5d7f45', carriere: '#a8724a', mineCharbon: '#43434b', mineFer: '#6e5f78',
  ferme: '#c2a340', ranch: '#a8804f',
  scierie: '#a87c46', briqueterie: '#9c4a35', minoterie: '#cfae47',
  abattoir: '#a04040', acierie: '#54798a', manufacture: '#4a8763',
  // Les biens courants et leurs comptoirs. Chaque atelier porte la teinte de sa
  // marchandise, et chaque boutique celle du rayon qu'elle tient : on doit lire
  // la vocation d'un quartier sans ouvrir une seule fiche.
  faiencerie: '#c98f6a', brasserie: '#c9832b', savonnerie: '#bdb497',
  filature: '#8a6f9e', papeterie: '#b9b39d', forge: '#7c8ba0',
  epicerie: '#c47f9a', nouveautes: '#a8709c', quincaillerie: '#8090a8',
  ameublement: '#5a9a75', grandMagasin: '#d0a05c',
  maison: '#9b8f78', immeuble: '#bcae93', bureaux: '#6f96ba', entrepot: '#6d675a',
};

const cache = new Map();

// Éclaircit ou assombrit une couleur — le seul usage autorisé de la valeur.
function ton(hex, k) {
  const p = (i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.substr(i, 2), 16) * k)));
  const h = (v) => v.toString(16).padStart(2, '0');
  return `#${h(p(1))}${h(p(3))}${h(p(5))}`;
}

export function videCache() { cache.clear(); }

// Renvoie le canvas du bâtiment à la taille de case demandée.
export function sprite(type, pas) {
  const cle = type + '@' + pas;
  if (cache.has(cle)) return cache.get(cle);

  const def = BAT[type];
  const w = Math.round(def.w * pas), h = Math.round(def.h * pas);
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, w); cv.height = Math.max(1, h);
  const ctx = cv.getContext('2d');
  const base = COULEURS[type];

  DESSINS[type](ctx, w, h, base, pas);

  cache.set(cle, cv);
  return cv;
}

// --- Briques de dessin ------------------------------------------------------

// Un bâtiment posé : un corps, un liseré d'ombre à droite et en bas. C'est ce
// liseré, et non un dégradé, qui détache le bâtiment du sol à toutes les
// distances.
function corps(ctx, x, y, w, h, couleur) {
  ctx.fillStyle = couleur;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  ctx.fillRect(x, y + h - Math.max(1, h * 0.13), w, Math.max(1, h * 0.13));
  ctx.fillRect(x + w - Math.max(1, w * 0.11), y, Math.max(1, w * 0.11), h);
}

// Un toit à deux pentes vu de dessus : deux bandes, l'une éclairée, l'autre à
// l'ombre, séparées par la ligne de faîte.
function toitDeuxPentes(ctx, x, y, w, h, couleur) {
  ctx.fillStyle = ton(couleur, 1.18);
  ctx.fillRect(x, y, w, h / 2);
  ctx.fillStyle = ton(couleur, 0.74);
  ctx.fillRect(x, y + h / 2, w, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(x, y + h / 2 - 0.5, w, 1);
}

// Le toit en dents de scie de l'atelier : des verrières orientées au nord.
function dentsDeScie(ctx, x, y, w, h, couleur, n) {
  const pas = w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = ton(couleur, 1.10);
    ctx.fillRect(x + i * pas, y, pas * 0.55, h);
    ctx.fillStyle = ton(couleur, 0.70);
    ctx.fillRect(x + i * pas + pas * 0.55, y, pas * 0.45, h);
  }
}

function cheminee(ctx, cx, cy, r, sombre = '#2e2a26') {
  ctx.fillStyle = sombre;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
}

function pastille(ctx, cx, cy, r, couleur) {
  ctx.fillStyle = couleur;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
}

// --- Un dessin par bâtiment -------------------------------------------------

const DESSINS = {
  // Le logement : un toit, une cheminée. Rien de plus, et c'est voulu — il y en
  // aura des centaines.
  maison(ctx, w, h, c) {
    const m = w * 0.10;
    toitDeuxPentes(ctx, m, m, w - 2 * m, h - 2 * m, c);
    if (w >= 11) cheminee(ctx, w * 0.72, h * 0.30, Math.max(1, w * 0.07));
  },

  // L'immeuble : toit plat, édicule d'escalier, et une emprise qui va jusqu'aux
  // bords — c'est la densité qui doit se lire.
  immeuble(ctx, w, h, c) {
    corps(ctx, 1, 1, w - 2, h - 2, c);
    ctx.fillStyle = ton(c, 0.62);
    ctx.fillRect(w * 0.36, h * 0.36, w * 0.26, h * 0.26);
    if (w >= 16) {
      ctx.fillStyle = 'rgba(0,0,0,.20)';
      for (let i = 1; i < 4; i++) ctx.fillRect(1, h * i / 4, w - 2, 1);
    }
  },

  // Les bureaux : une grande verrière au centre, qui les distingue au premier
  // coup d'œil de l'immeuble d'habitation.
  bureaux(ctx, w, h, c) {
    corps(ctx, 1, 1, w - 2, h - 2, c);
    ctx.fillStyle = ton(c, 1.42);
    ctx.fillRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56);
    ctx.strokeStyle = 'rgba(0,0,0,.30)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.50, h * 0.22); ctx.lineTo(w * 0.50, h * 0.78);
    ctx.moveTo(w * 0.22, h * 0.50); ctx.lineTo(w * 0.78, h * 0.50);
    ctx.stroke();
  },

  // L'entrepôt : un hangar tout en longueur, ses portes sur la façade.
  entrepot(ctx, w, h, c) {
    corps(ctx, 1, h * 0.16, w - 2, h * 0.68, c);
    ctx.fillStyle = ton(c, 0.55);
    const n = Math.max(2, Math.round(w / 9));
    for (let i = 0; i < n; i++) {
      ctx.fillRect(2 + (w - 4) * (i + 0.25) / n, h * 0.64, (w - 4) * 0.4 / n, h * 0.18);
    }
  },

  // La ferme : d'abord des sillons, et une grange dans un coin. Ce sont les
  // sillons qu'on reconnaît de loin.
  ferme(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.82);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = ton(c, 1.15);
    const n = Math.max(3, Math.round(h / 4));
    for (let i = 0; i < n; i++) ctx.fillRect(0, h * (i + 0.15) / n, w, h * 0.4 / n);
    if (w >= 14) {
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(w * 0.06, h * 0.58, w * 0.24, h * 0.34);
    }
  },

  // Le ranch : un enclos, et le bétail dedans.
  ranch(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.86);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = ton(c, 0.5); ctx.lineWidth = 1;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    if (w >= 12) {
      ctx.fillStyle = '#6b4a33';
      for (let i = 0; i < 3; i++) {
        pastille(ctx, w * (0.25 + i * 0.24), h * (0.35 + (i % 2) * 0.3), Math.max(1, w * 0.045), '#6b4a33');
      }
    }
  },

  // La coupe forestière : des arbres, et une trouée déjà exploitée.
  coupe(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.72);
    ctx.fillRect(0, 0, w, h);
    const r = Math.max(1, w * 0.15);
    for (const [px, py] of [[0.28, 0.30], [0.68, 0.26], [0.30, 0.70], [0.72, 0.68]]) {
      pastille(ctx, w * px, h * py, r, ton(c, 1.25));
    }
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.fillRect(w * 0.44, h * 0.44, w * 0.16, h * 0.16);
  },

  // La carrière : une entaille en gradins dans le sol.
  carriere(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.80);
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ton(c, 1.05 + i * 0.14);
      const k = 0.12 + i * 0.12;
      ctx.fillRect(w * k, h * k, w * (1 - 2 * k), h * (1 - 2 * k));
    }
  },

  mineCharbon(ctx, w, h, c) { mine(ctx, w, h, c, '#26262b'); },
  mineFer(ctx, w, h, c) { mine(ctx, w, h, c, '#7a6a86'); },

  // La scierie : dents de scie, et les grumes empilées à côté.
  scierie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.62); ctx.fillRect(0, 0, w, h);
    dentsDeScie(ctx, 1, h * 0.12, w * 0.62, h * 0.74, c, Math.max(2, Math.round(w / 12)));
    ctx.fillStyle = '#7d5b3a';
    const n = 3;
    for (let i = 0; i < n; i++) {
      ctx.fillRect(w * 0.68, h * (0.18 + i * 0.24), w * 0.26, h * 0.14);
    }
  },

  // La briqueterie : le four, sa cheminée, et les briques qui sèchent.
  briqueterie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.58); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.06, h * 0.16, w * 0.52, h * 0.68, c);
    cheminee(ctx, w * 0.32, h * 0.50, Math.max(1.2, w * 0.09), '#3a2420');
    ctx.fillStyle = ton(c, 1.30);
    for (let i = 0; i < 3; i++) ctx.fillRect(w * 0.66, h * (0.20 + i * 0.24), w * 0.28, h * 0.14);
  },

  // La minoterie : les silos, en enfilade. C'est la silhouette la plus
  // reconnaissable de toute la carte.
  minoterie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.58); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.04, h * 0.24, w * 0.42, h * 0.56, c);
    const r = Math.max(1.4, h * 0.15);
    for (let i = 0; i < 3; i++) {
      pastille(ctx, w * (0.58 + i * 0.16), h * 0.5, r, ton(c, 1.22));
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w * (0.58 + i * 0.16), h * 0.5, r, 0, 7); ctx.stroke();
    }
  },

  // L'abattoir : le hangar et la cour de manœuvre.
  abattoir(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.56); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.06, h * 0.14, w * 0.56, h * 0.72, c);
    ctx.fillStyle = ton(c, 0.80);
    ctx.fillRect(w * 0.68, h * 0.20, w * 0.26, h * 0.60);
  },

  // L'aciérie : deux hauts fourneaux et la halle. Le seul bâtiment à deux
  // intrants du jeu, et le plus cher du palier — il doit se voir.
  acierie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.50); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.05, h * 0.30, w * 0.56, h * 0.60, c);
    dentsDeScie(ctx, w * 0.05, h * 0.30, w * 0.56, h * 0.60, c, 3);
    const r = Math.max(1.6, w * 0.09);
    cheminee(ctx, w * 0.74, h * 0.28, r, '#33302e');
    cheminee(ctx, w * 0.88, h * 0.42, r * 0.82, '#33302e');
    ctx.fillStyle = '#d98a3a';
    ctx.beginPath(); ctx.arc(w * 0.74, h * 0.28, r * 0.42, 0, 7); ctx.fill();
  },

  // La manufacture : la plus grande halle vitrée de la carte.
  manufacture(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.50); ctx.fillRect(0, 0, w, h);
    dentsDeScie(ctx, w * 0.06, h * 0.14, w * 0.88, h * 0.62, c, Math.max(3, Math.round(w / 10)));
    ctx.fillStyle = ton(c, 0.72);
    ctx.fillRect(w * 0.06, h * 0.80, w * 0.88, h * 0.12);
    if (w >= 18) cheminee(ctx, w * 0.14, h * 0.86, Math.max(1.2, w * 0.05), '#33302e');
  },

  // La forge : la halle basse et le marteau-pilon. Deux cheminées trapues,
  // rien de vitré — on n'y fait pas dans la dentelle.
  forge(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.50); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.06, h * 0.26, w * 0.62, h * 0.62, c);
    const r = Math.max(1.4, w * 0.08);
    cheminee(ctx, w * 0.78, h * 0.34, r, '#2f2c2a');
    cheminee(ctx, w * 0.90, h * 0.48, r * 0.8, '#2f2c2a');
    ctx.fillStyle = '#e0993f';
    ctx.fillRect(w * 0.14, h * 0.56, w * 0.20, h * 0.14);
  },

  // La papeterie : les rouleaux en bout de halle.
  papeterie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.54); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.04, h * 0.22, w * 0.54, h * 0.60, c);
    cheminee(ctx, w * 0.30, h * 0.56, Math.max(1.2, w * 0.07), '#3a3a34');
    const r = Math.max(1.3, h * 0.14);
    for (let i = 0; i < 2; i++) pastille(ctx, w * (0.70 + i * 0.18), h * 0.5, r, ton(c, 1.25));
  },

  // La faïencerie : le four rond et les pièces qui sèchent au soleil.
  faiencerie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.58); ctx.fillRect(0, 0, w, h);
    pastille(ctx, w * 0.32, h * 0.50, Math.max(1.6, w * 0.20), ton(c, 1.10));
    ctx.fillStyle = ton(c, 1.35);
    for (let i = 0; i < 3; i++) ctx.fillRect(w * 0.62, h * (0.20 + i * 0.24), w * 0.30, h * 0.12);
  },

  // La brasserie : les cuves, ventrues et alignées.
  brasserie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.52); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.04, h * 0.26, w * 0.36, h * 0.56, c);
    const r = Math.max(1.4, h * 0.17);
    for (let i = 0; i < 3; i++) pastille(ctx, w * (0.52 + i * 0.18), h * 0.52, r, ton(c, 1.25));
  },

  // La savonnerie : la halle et les blocs empilés.
  savonnerie(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.56); ctx.fillRect(0, 0, w, h);
    corps(ctx, w * 0.06, h * 0.22, w * 0.48, h * 0.62, c);
    ctx.fillStyle = ton(c, 1.30);
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++)
        ctx.fillRect(w * (0.62 + i * 0.19), h * (0.28 + j * 0.28), w * 0.15, h * 0.20);
  },

  // La filature : la halle longue et les métiers en enfilade.
  filature(ctx, w, h, c) {
    ctx.fillStyle = ton(c, 0.52); ctx.fillRect(0, 0, w, h);
    dentsDeScie(ctx, w * 0.04, h * 0.20, w * 0.92, h * 0.56, c, Math.max(3, Math.round(w / 9)));
    ctx.fillStyle = ton(c, 0.74);
    ctx.fillRect(w * 0.04, h * 0.80, w * 0.92, h * 0.10);
  },

  // LES COMMERCES : une devanture, un auvent, une enseigne. Ils se distinguent
  // des ateliers au premier coup d'œil parce qu'ils regardent la rue.
  epicerie(ctx, w, h, c) { boutique(ctx, w, h, c, 2); },
  nouveautes(ctx, w, h, c) { boutique(ctx, w, h, c, 3); },
  quincaillerie(ctx, w, h, c) { boutique(ctx, w, h, c, 2); },
  ameublement(ctx, w, h, c) { boutique(ctx, w, h, c, 1); },
  grandMagasin(ctx, w, h, c) {
    boutique(ctx, w, h, c, 4);
    ctx.fillStyle = ton(c, 1.45);
    ctx.fillRect(w * 0.10, h * 0.06, w * 0.80, h * 0.10);
  },
};

// La devanture d'un commerce : le corps, l'auvent rayé, et autant de vitrines
// qu'il tient de rayons.
function boutique(ctx, w, h, c, vitrines) {
  ctx.fillStyle = ton(c, 0.48); ctx.fillRect(0, 0, w, h);
  corps(ctx, w * 0.06, h * 0.20, w * 0.88, h * 0.66, c);
  ctx.fillStyle = ton(c, 1.40);
  ctx.fillRect(w * 0.06, h * 0.44, w * 0.88, h * 0.10);      // l'auvent
  ctx.fillStyle = '#2b2822';
  const n = Math.max(1, vitrines);
  const l = (w * 0.80) / (n * 2 - 1);
  for (let i = 0; i < n; i++) {
    ctx.fillRect(w * 0.10 + i * l * 2, h * 0.60, l, h * 0.22);
  }
}

// Le chevalement d'une mine et son terril : la même silhouette pour le charbon
// et le fer, seule la couleur du tas change.
function mine(ctx, w, h, c, tas) {
  ctx.fillStyle = ton(c, 0.70);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = tas;
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.88); ctx.lineTo(w * 0.96, h * 0.88);
  ctx.lineTo(w * 0.74, h * 0.46); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = ton(c, 1.5); ctx.lineWidth = Math.max(1, w * 0.06);
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.18); ctx.lineTo(w * 0.44, h * 0.62);
  ctx.moveTo(w * 0.44, h * 0.18); ctx.lineTo(w * 0.14, h * 0.62);
  ctx.stroke();
}
