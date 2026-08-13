// ---------------------------------------------------------------------------
// Le rendu de la carte du monde.
//
// Deux couches, deux traitements. Le sol est une image : une fois par
// changement de filtre, on peint la carte entière à raison d'un pixel par case,
// puis on l'étire — repeindre vingt-cinq mille cases à chaque image mettrait un
// téléphone à genoux. Les bâtiments, eux, sont dessinés au-dessus, et seulement
// ceux que la fenêtre voit.
//
// Par défaut on voit les bâtiments, pas des données. Les filtres sont un mode
// qu'on demande, jamais l'état de repos de la carte.
// ---------------------------------------------------------------------------

import { P, RES, RELIEFS, BAT, prixTerrain } from '../sim/params.js';
import { estAchetable } from '../sim/mapgen.js';
import { sprite, videCache, COULEURS } from './sprites.js';

export { COULEURS };

const ALERTES = { matieres: '#e0993f', bras: '#6f9fc9', invendus: '#a97fc0', perte: '#e05a4e' };

// L'échelle des filtres : rouge pour le mauvais, jaune au milieu, vert pour le
// bon. Une seule échelle pour tous les filtres, pour que le joueur n'ait jamais
// à réapprendre à lire une couleur.
export function echelle(t) {
  t = Math.max(0, Math.min(1, t));
  const arrets = [
    [0.00, [176, 54, 45]],    // rouge
    [0.35, [201, 122, 46]],   // orange
    [0.55, [206, 178, 58]],   // jaune
    [1.00, [93, 165, 96]],    // vert
  ];
  for (let i = 1; i < arrets.length; i++) {
    if (t <= arrets[i][0]) {
      const [t0, c0] = arrets[i - 1], [t1, c1] = arrets[i];
      const k = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
    }
  }
  return arrets[arrets.length - 1][1];
}

// Les filtres par case : chacun sait lire une case et en tirer une valeur de 0
// (mauvais, rouge) à 1 (bon, vert).
export const FILTRES_CASE = {
  fertilite: { nom: 'Fertilité', lire: (c) => (c.q.fertilite - 1) / 4 },
  bois:      { nom: 'Bois',      lire: (c) => (c.q.bois - 1) / 4 },
  argile:    { nom: 'Argile',    lire: (c) => (c.q.argile - 1) / 4 },
  charbon:   { nom: 'Charbon',   lire: (c) => (c.q.charbon - 1) / 4 },
  minerai:   { nom: 'Minerai',   lire: (c) => (c.q.minerai - 1) / 4 },
  terrain:   { nom: 'Prix du sol',
               lire: (c) => 1 - Math.min(1, (prixTerrain(c.ville ? c.ville.niveau : 1,
                                                          c.distanceGare) - 60) / 340) },
};

// Les filtres par ville : l'emploi, le salaire et les baromètres ne se
// mesurent pas à la case mais à la ville entière. Tout son territoire prend
// donc la même teinte, et les cinq villes se comparent d'un coup d'œil.
export const FILTRES_VILLE = {
  emploi:     { nom: 'Emploi',     lire: (v) => v.barometres.emploi },
  nourriture: { nom: 'Nourriture', lire: (v) => v.barometres.nourriture },
  produits:   { nom: 'Produits',   lire: (v) => v.barometres.produits },
  occupation: { nom: 'Logement',   lire: (v) => 1 - Math.abs(v.occupation - 0.9) / 0.9 },
  // Un salaire élevé est une bonne nouvelle pour la ville et une mauvaise pour
  // l'industriel. On le lit ici du point de vue du patron : bas = vert.
  salaire:    { nom: 'Salaire',    lire: (v) => 1 - Math.min(1, (v.salaire - 10) / 25) },
};

export class Rendu {
  constructor(canvas, monde) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.monde = monde;
    this.filtre = null;              // null = on voit les bâtiments
    this.filtrePrix = null;          // ou le nom d'une ressource
    this.selection = null;
    this.zoom = 1;
    this.cx = 0; this.cy = 0;
    this.index = [];                 // les bâtiments, rafraîchis au mois
    this.solPerime = true;
  }

  // Le canvas est en `position: fixed` sur toute la fenetre : c'est donc la
  // fenetre qu'il faut mesurer, jamais son parent. Un hote qui enveloppe la
  // page dans un conteneur sans hauteur donnerait sinon un canvas de 300 x 150,
  // et la carte disparaitrait sans la moindre erreur.
  dimensionner() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.cv.width = Math.round(this.w * dpr); this.cv.height = Math.round(this.h * dpr);
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  // À zoom 1, le monde entier tient dans la fenêtre.
  get pasBase() { return Math.min(this.w / this.monde.L, this.h / this.monde.H); }
  get pas() { return this.pasBase * this.zoom; }
  get ox() { return (this.w - this.monde.L * this.pas) / 2 + this.cx; }
  get oy() { return (this.h - this.monde.H * this.pas) / 2 + this.cy; }

  // La carte ne quitte jamais l'écran. Quand elle est plus grande que la
  // fenêtre, ses bords s'y arrêtent — on ne dérive pas dans le vide ; quand
  // elle est plus petite, elle reste centrée.
  recadrer() {
    const eL = this.monde.L * this.pas, eH = this.monde.H * this.pas;
    const mx = Math.max(0, (eL - this.w) / 2);
    const my = Math.max(0, (eH - this.h) / 2);
    this.cx = Math.max(-mx, Math.min(mx, this.cx));
    this.cy = Math.max(-my, Math.min(my, this.cy));
  }

  zoomerVers(px, py, facteur) {
    const avant = this.pas;
    this.zoom = Math.max(1, Math.min(28, this.zoom * facteur));
    const apres = this.pas;
    if (apres === avant) return;
    const k = apres / avant;
    this.cx = (this.cx + this.w / 2 - px) * k - this.w / 2 + px;
    this.cy = (this.cy + this.h / 2 - py) * k - this.h / 2 + py;
    this.recadrer();
  }

  // Centre la vue sur une ville, au zoom où l'on distingue les bâtiments.
  cadrerVille(v) {
    // On cadre sur la plus petite dimension : en portrait, c'est la largeur qui
    // décide, et une ville coupée au bord n'est pas une ville cadrée.
    const tenir = Math.min(this.w, this.h) * 0.88;
    this.zoom = Math.max(1, Math.min(28, tenir / (v.rayon * 2.5 * this.pasBase)));
    this.cx = (this.monde.L / 2 - v.gare.x - 0.5) * this.pas;
    this.cy = (this.monde.H / 2 - v.gare.y - 0.5) * this.pas;
    this.recadrer();
  }

  caseSous(px, py) {
    const x = Math.floor((px - this.ox) / this.pas), y = Math.floor((py - this.oy) / this.pas);
    return this.monde.caseAt(x, y);
  }

  choisirFiltre(nom, prix = null) {
    this.filtre = nom; this.filtrePrix = prix;
    this.solPerime = true;
  }

  // Les bâtiments changent au mois, pas à l'image : on tient une liste à plat.
  rafraichirIndex() {
    this.index = [];
    for (const v of this.monde.villes) {
      for (const b of this.monde.tousBatiments(v)) this.index.push(b);
    }
    if (this.filtre && FILTRES_VILLE[this.filtre]) this.solPerime = true;
    if (this.filtrePrix) this.solPerime = true;
  }

  // --- Le sol -------------------------------------------------------------
  // Peint une fois, à un pixel par case, puis étiré. C'est ce qui rend une
  // carte de vingt-cinq mille cases affichable sur un téléphone.

  peindreSol() {
    const m = this.monde;
    if (!this.sol) {
      this.sol = document.createElement('canvas');
      this.sol.width = m.L; this.sol.height = m.H;
    }
    const ctx = this.sol.getContext('2d');
    const img = ctx.createImageData(m.L, m.H);
    const d = img.data;

    // Teintes de ville, calculées une fois pour toutes les cases du territoire.
    const teinteVille = new Map();
    if (this.filtrePrix) {
      for (const v of m.villes) {
        const ind = v.marche.prix[this.filtrePrix] / RES[this.filtrePrix].prix;
        // Cher = rouge, bon marché = vert. L'échelle couvre la moitié au double
        // du prix de référence, là où se joue tout ce qui est lisible.
        teinteVille.set(v, echelle(1 - (ind - 0.5) / 1.5));
      }
    } else if (this.filtre && FILTRES_VILLE[this.filtre]) {
      const f = FILTRES_VILLE[this.filtre];
      for (const v of m.villes) teinteVille.set(v, echelle(f.lire(v)));
    }

    const fCase = this.filtre && FILTRES_CASE[this.filtre] ? FILTRES_CASE[this.filtre] : null;
    const parVille = teinteVille.size > 0;
    const joueurId = m.joueur.id;
    const couleursSocietes = new Map(m.societes.map(s => [s.id,
      [parseInt(s.couleur.substr(1, 2), 16), parseInt(s.couleur.substr(3, 2), 16),
       parseInt(s.couleur.substr(5, 2), 16)]]));

    for (let i = 0; i < m.cases.length; i++) {
      const c = m.cases[i];
      let r, g, b;

      if (parVille) {
        if (c.ville) {
          const t = teinteVille.get(c.ville);
          [r, g, b] = t;
        } else {
          // Hors des villes, on garde le relief mais en sourdine : le regard
          // doit aller aux territoires comparés.
          const gris = 32 + c.alt * 26;
          r = gris; g = gris + 2; b = gris - 2;
        }
      } else if (this.filtre === 'proprio') {
        // Ce qui est à vous saute aux yeux ; le reste s'efface. C'est le seul
        // filtre qui ne suit pas l'échelle rouge-vert : il ne mesure rien, il
        // désigne.
        if (c.proprio === joueurId) { r = 224; g = 177; b = 85; }
        else if (c.proprio && c.proprio !== 'ind') {
          const s = couleursSocietes.get(c.proprio) || [90, 84, 72];
          [r, g, b] = s;
        } else if (c.bat || c.proprio === 'ind') { r = 74; g = 70; b = 60; }
        else if (c.ville) { r = 42; g = 39; b = 33; }
        else { r = 24; g = 23; b = 20; }
      } else if (fCase) {
        [r, g, b] = echelle(fCase.lire(c));
        if (!c.ville && this.filtre === 'terrain') { r = 34; g = 34; b = 30; }
      } else {
        const base = RELIEFS[c.relief].couleur;
        r = parseInt(base.substr(1, 2), 16);
        g = parseInt(base.substr(3, 2), 16);
        b = parseInt(base.substr(5, 2), 16);
      }

      // L'ombrage du relief : une lumière rasante venue du nord-ouest. C'est
      // elle, et rien d'autre, qui fait exister les montagnes sur une carte
      // vue de dessus.
      // L'altitude assombrit les fonds et blanchit les hauteurs ; l'ombrage
      // rasant du nord-ouest fait le reste. C'est ce couple, et rien d'autre,
      // qui fait exister un relief sur une carte vue de dessus.
      const etage = 0.86 + c.alt * 0.42;
      const lum = 1 + (-c.pente * 1.7 - c.penteY * 1.3) * 5.2;
      const k = Math.max(0.42, Math.min(1.7, lum * etage));
      d[i * 4]     = Math.min(255, r * k);
      d[i * 4 + 1] = Math.min(255, g * k);
      d[i * 4 + 2] = Math.min(255, b * k);
      d[i * 4 + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
    this.solPerime = false;
  }

  // --- L'image ------------------------------------------------------------

  dessiner() {
    // Les barres du navigateur mobile apparaissent et disparaissent sans
    // declencher d'evenement fiable : on verifie a chaque image.
    if (this.w !== window.innerWidth || this.h !== window.innerHeight) this.dimensionner();

    const { ctx } = this, m = this.monde, p = this.pas, ox = this.ox, oy = this.oy;
    if (this.solPerime || !this.sol) this.peindreSol();
    if (p !== this._dernierPas) { videCache(); this._dernierPas = p; }

    ctx.fillStyle = '#0f1512';
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.imageSmoothingEnabled = p < 3;
    ctx.drawImage(this.sol, ox, oy, m.L * p, m.H * p);

    // La fenêtre, en cases : tout le reste du dessin s'y limite.
    const x0 = Math.floor(-ox / p) - 1, y0 = Math.floor(-oy / p) - 1;
    const x1 = Math.ceil((this.w - ox) / p) + 1, y1 = Math.ceil((this.h - oy) / p) + 1;
    const vu = (b) => b.cases[0].x >= x0 && b.cases[0].x <= x1
                   && b.cases[0].y >= y0 && b.cases[0].y <= y1;

    this.dessinerVoies(ctx, p, ox, oy, x0, y0, x1, y1);

    // Les rues, seulement quand elles se voient.
    if (p >= 2.2 && !this.filtre && !this.filtrePrix) {
      ctx.fillStyle = 'rgba(28,25,20,.55)';
      for (const v of m.villes) {
        for (const c of v.cases) {
          if (!c.rue || c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
          ctx.fillRect(ox + c.x * p, oy + c.y * p, p, p);
        }
      }
    }

    this.dessinerBatiments(ctx, p, ox, oy, vu);
    this.dessinerChantiers(ctx, p, ox, oy, x0, y0, x1, y1);

    // Les gares, toujours visibles : ce sont les repères de la carte.
    for (const v of m.villes) {
      const gx = ox + v.gare.x * p, gy = oy + v.gare.y * p;
      const r = Math.max(3, Math.min(9, p * 0.7));
      ctx.fillStyle = '#e0b155';
      ctx.beginPath(); ctx.arc(gx + p / 2, gy + p / 2, r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    this.dessinerAlertes(ctx, p, ox, oy, vu);
    this.dessinerEtiquettes(ctx, p, ox, oy);

    // La frontière achetable : étroite et disputée, c'est là que se joue le
    // foncier. On ne la montre que quand elle sert.
    if (p >= 4 && (this.filtre === 'terrain' || this.filtre === 'proprio')) {
      ctx.strokeStyle = 'rgba(224,177,85,.75)'; ctx.lineWidth = 1;
      for (const v of m.villes) for (const c of v.cases) {
        if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
        if (!estAchetable(m, c)) continue;
        ctx.strokeRect(ox + c.x * p + .5, oy + c.y * p + .5, p - 1, p - 1);
      }
    }

    if (this.selection) {
      const c = this.selection;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(ox + c.x * p - 1, oy + c.y * p - 1, p + 2, p + 2);
    }
  }

  dessinerVoies(ctx, p, ox, oy, x0, y0, x1, y1) {
    const m = this.monde;
    // Une ligne achevée est un trait plein et doré ; une ligne en chantier
    // reste grisée. Le joueur voit dès la première seconde où le rail passera.
    for (const l of m.liaisons) {
      const a = m.villes[l.a].gare, b = m.villes[l.b].gare;
      ctx.strokeStyle = l.achevee ? 'rgba(224,177,85,.85)' : 'rgba(120,112,96,.55)';
      ctx.lineWidth = l.achevee ? Math.max(1.5, p * 0.30) : Math.max(1, p * 0.18);
      ctx.setLineDash(l.achevee ? [] : [Math.max(3, p), Math.max(3, p)]);
      ctx.beginPath();
      ctx.moveTo(ox + (a.x + .5) * p, oy + (a.y + .5) * p);
      ctx.lineTo(ox + (b.x + .5) * p, oy + (b.y + .5) * p);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  dessinerBatiments(ctx, p, ox, oy, vu) {
    const joueur = this.monde.joueur;
    const dessine = p >= 5.5 && !this.filtre && !this.filtrePrix;

    for (const b of this.index) {
      if (!vu(b)) continue;
      const c = b.cases[0];
      const x = ox + c.x * p, y = oy + c.y * p;

      if (dessine) {
        ctx.drawImage(sprite(b.type, p), Math.round(x), Math.round(y));
      } else if (!this.filtre && !this.filtrePrix) {
        // Trop petit pour un toit : on garde la couleur de famille, qui suffit
        // à lire la vocation des quartiers.
        ctx.fillStyle = COULEURS[b.type];
        ctx.fillRect(x, y, p * b.def.w, p * b.def.h);
      } else {
        // Sous un filtre, le bâti ne doit pas voler la couleur de la donnée :
        // il n'en reste qu'une silhouette sombre.
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        ctx.fillRect(x, y, p * b.def.w, p * b.def.h);
      }

      // Ce qui est à vous se voit toujours, quel que soit le mode.
      if (b.societe === joueur && p >= 3) {
        ctx.strokeStyle = '#e0b155';
        ctx.lineWidth = Math.max(1, p * 0.10);
        ctx.strokeRect(x + .5, y + .5, p * b.def.w - 1, p * b.def.h - 1);
      }
    }
  }

  dessinerChantiers(ctx, p, ox, oy, x0, y0, x1, y1) {
    const joueur = this.monde.joueur;
    for (const s of this.monde.societes) for (const ch of s.chantiers) {
      const c = ch.cases[0];
      if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
      const x = ox + c.x * p, y = oy + c.y * p;
      const w = p * BAT[ch.type].w, h = p * BAT[ch.type].h;
      ctx.fillStyle = '#3a3226';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = s === joueur ? '#e0b155' : 'rgba(150,140,120,.7)';
      ctx.setLineDash([Math.max(2, p * 0.3), Math.max(2, p * 0.3)]);
      ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      ctx.setLineDash([]);
      if (p >= 7) {
        ctx.fillStyle = '#e0b155';
        ctx.fillRect(x + 2, y + h - 4, (w - 4) * ch.progression(), 2);
      }
    }
  }

  // Les pastilles d'alerte : quatre états seulement, jamais recouvertes. C'est
  // la couche que le joueur lit vraiment.
  dessinerAlertes(ctx, p, ox, oy, vu) {
    if (p < 4) return;
    for (const b of this.index) {
      if (!b.alerte || !vu(b)) continue;
      const c = b.cases[0];
      const r = Math.min(3.2, Math.max(1.6, p / 4));
      ctx.fillStyle = ALERTES[b.alerte];
      ctx.beginPath();
      ctx.arc(ox + (c.x + b.def.w) * p - r - 1, oy + c.y * p + r + 1, r, 0, 7);
      ctx.fill();
    }
  }

  dessinerEtiquettes(ctx, p, ox, oy) {
    ctx.textAlign = 'center';
    ctx.font = `600 ${Math.max(10, Math.min(15, 9 + p * 0.5))}px ui-sans-serif, system-ui, sans-serif`;
    for (const v of this.monde.villes) {
      const x = ox + (v.gare.x + .5) * p;
      const y = oy + v.gare.y * p - Math.max(8, p * 0.9);
      if (x < -60 || x > this.w + 60 || y < -20 || y > this.h + 20) continue;
      const texte = p < 4 ? v.nom : `${v.nom} · ${Math.round(v.menages)}`;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,7,6,.85)';
      ctx.strokeText(texte, x, y);
      ctx.fillStyle = v.enCrise ? '#e05a4e' : '#efe8d8';
      ctx.fillText(texte, x, y);
    }
    ctx.textAlign = 'left';
  }
}
