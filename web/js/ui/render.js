// ---------------------------------------------------------------------------
// Le rendu de la carte.
//
// Deux états, pas un dégradé (§21) : la vue de ville, où chaque bâtiment a sa
// couleur de fonction, et le mode carte colorée, qui teinte les cases selon une
// donnée unique — fertilité, prix des terres, chômage, propriétaire. Ce second
// mode n'est pas une concession technique : c'est le mode déclaré obligatoire
// au §19 pour rendre le jeu lisible.
// ---------------------------------------------------------------------------

import { BAT, RELIEFS, prixTerrain } from '../sim/params.js';
import { estAchetable } from '../sim/mapgen.js';

// La couleur sert la fonction avant l'ornement : un joueur doit distinguer d'un
// coup d'œil une scierie d'une aciérie parmi des centaines de bâtiments, sur un
// écran de téléphone. La teinte dit la famille, la valeur dit le bâtiment.
export const COULEURS = {
  coupe: '#6b8f4e', carriere: '#a8724a', mineCharbon: '#3a3a40', mineFer: '#6e5f78',
  ferme: '#c9a93f', ranch: '#a8804f',
  scierie: '#b5894f', briqueterie: '#9c4a35', minoterie: '#d6b74e',
  abattoir: '#a83f3f', acierie: '#5a7d8c', manufacture: '#4f8f6a',
  maison: '#8a7f6d', immeuble: '#b3a68e', bureaux: '#7fa3c4', entrepot: '#5f5a4d',
};

const ALERTES = { matieres: '#c9863f', bras: '#6f9fc9', invendus: '#9a6fb0', perte: '#c2544b' };

export class Rendu {
  constructor(canvas, monde) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.monde = monde;
    this.mode = 'fonction';
    this.selection = null;
    this.survol = null;
    this.zoom = 1;
    this.cx = 0; this.cy = 0;          // décalage en cases
  }

  dimensionner() {
    const z = this.cv.parentElement;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = z.clientWidth; this.h = z.clientHeight;
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr;
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  get ville() { return this.monde.villes[this.iVille || 0]; }

  // Taille d'une case à l'écran. À zoom 1, la ville tient entièrement dans la
  // fenêtre, quel que soit l'écran — c'est la vue d'ensemble. Au-delà, on entre
  // dans le détail, et sur un téléphone c'est indispensable : une case de sept
  // pixels ne se vise pas au doigt.
  get pasBase() { return Math.min(this.w, this.h) / this.ville.N; }
  get pas() { return Math.max(2, this.pasBase * this.zoom); }
  get ox() { return Math.round((this.w - this.ville.N * this.pas) / 2 + this.cx); }
  get oy() { return Math.round((this.h - this.ville.N * this.pas) / 2 + this.cy); }

  // On ne laisse jamais la ville sortir entièrement de l'écran.
  recadrer() {
    const etendue = this.ville.N * this.pas;
    const margeX = Math.max(0, (etendue - this.w) / 2 + this.w * 0.35);
    const margeY = Math.max(0, (etendue - this.h) / 2 + this.h * 0.35);
    this.cx = Math.max(-margeX, Math.min(margeX, this.cx));
    this.cy = Math.max(-margeY, Math.min(margeY, this.cy));
  }

  // Zoome en gardant fixe le point visé — sinon la carte glisse sous le doigt.
  zoomerVers(px, py, facteur) {
    const avant = this.pas;
    this.zoom = Math.max(1, Math.min(6, this.zoom * facteur));
    const apres = this.pas;
    if (apres === avant) return;
    const k = apres / avant;
    this.cx = (this.cx + this.w / 2 - px) * k - this.w / 2 + px;
    this.cy = (this.cy + this.h / 2 - py) * k - this.h / 2 + py;
    this.recadrer();
  }

  caseSous(px, py) {
    const x = Math.floor((px - this.ox) / this.pas), y = Math.floor((py - this.oy) / this.pas);
    const v = this.ville;
    if (x < 0 || y < 0 || x >= v.N || y >= v.N) return null;
    return v.cases[y * v.N + x];
  }

  dessiner() {
    const { ctx } = this, v = this.ville, p = this.pas, ox = this.ox, oy = this.oy;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = '#0e0d0a';
    ctx.fillRect(0, 0, this.w, this.h);

    const joueur = this.monde.joueur;

    for (const c of v.cases) {
      const x = ox + c.x * p, y = oy + c.y * p;
      if (x + p < 0 || y + p < 0 || x > this.w || y > this.h) continue;

      ctx.fillStyle = this.couleurCase(c, v);
      ctx.fillRect(x, y, p, p);

      if (c.rue && this.mode === 'fonction') {
        ctx.fillStyle = '#2a2822';
        ctx.fillRect(x, y, p, p);
      }

      // Les emprises de voie sont réservées et visibles dès la première
      // seconde : le joueur sait où le rail passera.
      if (c.voie) {
        ctx.fillStyle = '#2f2c25';
        ctx.fillRect(x, y, p, p);
        ctx.strokeStyle = '#4a463a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y + p / 2); ctx.lineTo(x + p, y + p / 2); ctx.stroke();
      }
    }

    // Le contour remplace l'occlusion et se voit à toutes les distances (§21) :
    // un trait sombre sur les ruptures rend la trame urbaine lisible.
    if (p >= 5 && this.mode === 'fonction') {
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1;
      const vus = new Set();
      for (const c of v.cases) {
        if (!c.bat || vus.has(c.bat.id)) continue;
        vus.add(c.bat.id);
        const xs = c.bat.cases.map(k => k.x), ys = c.bat.cases.map(k => k.y);
        const x0 = ox + Math.min(...xs) * p, y0 = oy + Math.min(...ys) * p;
        const w = (Math.max(...xs) - Math.min(...xs) + 1) * p;
        const h = (Math.max(...ys) - Math.min(...ys) + 1) * p;
        ctx.strokeRect(x0 + .5, y0 + .5, w - 1, h - 1);
      }
    }

    // La gare, au centre.
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(ox + v.gare.x * p, oy + v.gare.y * p, p, p);

    // Chantiers : une case terrassée à plat, visible de tous dès le premier
    // jour. Personne n'est jamais pris par surprise.
    for (const c of v.cases) {
      if (!c.chantier) continue;
      const x = ox + c.x * p, y = oy + c.y * p;
      ctx.fillStyle = '#3d3527';
      ctx.fillRect(x, y, p, p);
      ctx.strokeStyle = c.chantier.societe === joueur ? '#d9a441' : '#6b6252';
      ctx.setLineDash([2, 2]); ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, p - 1, p - 1);
      ctx.setLineDash([]);
      if (p >= 8) {
        ctx.fillStyle = '#d9a441';
        ctx.fillRect(x + 1, y + p - 3, (p - 2) * c.chantier.progression(), 2);
      }
    }

    // Les pastilles d'alerte : quatre états seulement, et jamais recouvertes.
    // C'est la couche que le joueur lit vraiment.
    if (p >= 6) {
      const vus = new Set();
      for (const c of v.cases) {
        const b = c.bat;
        if (!b || !b.alerte || vus.has(b.id)) continue;
        vus.add(b.id);
        ctx.fillStyle = ALERTES[b.alerte];
        ctx.beginPath();
        ctx.arc(ox + c.x * p + p - 2.5, oy + c.y * p + 2.5, Math.min(2.5, p / 4), 0, 7);
        ctx.fill();
      }
    }

    // La frontière achetable : étroite et disputée. Les joueurs se battent sur
    // le même mince liseré, ce qui concentre la compétition.
    if (this.mode === 'proprio' || this.mode === 'terrain') {
      ctx.strokeStyle = 'rgba(217,164,65,.55)'; ctx.lineWidth = 1;
      for (const c of v.cases) {
        if (!estAchetable(v, c)) continue;
        ctx.strokeRect(ox + c.x * p + .5, oy + c.y * p + .5, p - 1, p - 1);
      }
    }

    if (this.selection) {
      const c = this.selection;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(ox + c.x * p - 1, oy + c.y * p - 1, p + 2, p + 2);
    }
  }

  couleurCase(c, v) {
    switch (this.mode) {
      case 'fonction': {
        // « Si la teinte sert à l'individualité, elle n'est plus disponible
        //   pour l'information. » On ne fait donc varier que la valeur : la
        //   teinte reste celle de la famille, et deux maisons voisines se
        //   distinguent quand même.
        if (c.bat) return nuance(COULEURS[c.bat.type], c.bat.id);
        return nuance(RELIEFS[c.relief].couleur, c.x * 31 + c.y * 17);
      }

      case 'proprio': {
        if (!c.vendue && !c.proprio) return '#1e1c17';
        if (c.proprio === 'ind') return '#4a463a';
        const s = this.monde.societes.find(x => x.id === c.proprio);
        return s ? s.couleur : '#2a2822';
      }

      case 'terrain': {
        const t = prixTerrain(v.niveau, c.distanceGare);
        const k = Math.min(1, (t - 60) / 360);
        return melange('#22201a', '#d9a441', k);
      }

      default: {
        // Les cartes de qualité : le seul endroit où se lit le handicap de
        // terrain, qui ne fait aucun bruit et ne se guérit jamais.
        const q = c.q[this.mode];
        return q == null ? '#22201a' : melange('#241f17', '#7dd48a', (q - 1) / 4);
      }
    }
  }
}

// Fait varier la luminosité d'une teinte selon un identifiant, sans jamais
// toucher à la teinte elle-même.
function nuance(hex, graine) {
  const h = ((graine * 2654435761) >>> 0) % 1000 / 1000;
  const k = 0.86 + h * 0.28;
  const p = (i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.substr(i, 2), 16) * k)));
  const c = (v) => v.toString(16).padStart(2, '0');
  return `#${c(p(1))}${c(p(3))}${c(p(5))}`;
}

function melange(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const p = (h) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}
