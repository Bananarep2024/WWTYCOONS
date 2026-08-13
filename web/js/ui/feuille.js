// ---------------------------------------------------------------------------
// La feuille d'inspection : ce qu'on voit quand on clique une case.
//
// Elle remonte du bas de l'écran, la carte restant entièrement visible
// au-dessus. Un panneau flottant masquerait plusieurs bâtiments et le joueur
// perdrait le contexte de ce qu'il inspecte. (§21)
// ---------------------------------------------------------------------------

import { P, BAT, RES, RELIEFS, QUALITES, materiaux, coutRef, prixTerrain }
  from '../sim/params.js';
import { estAchetable } from '../sim/mapgen.js';
import { COULEURS } from './render.js';
import { eur, pct } from './panneaux.js';

const NOMS_QUALITE = { fertilite: 'Fertilité', argile: 'Argile', bois: 'Bois',
                       charbon: 'Charbon', minerai: 'Minerai' };

// Les quartiers ne sont pas décoratifs : ils décident de ce qu'on peut y bâtir
// à bon compte, et empêchent les ateliers de cerner les maisons.
const NOMS_QUARTIER = { residentiel: 'd\'habitation', industriel: 'industriel',
                        negoce: 'de négoce', agricole: 'agricole' };

// Ce qu'on peut bâtir, groupé comme le joueur y pense.
const MENU = [
  ['Logement', ['maison', 'immeuble']],
  ['Exploitation', ['coupe', 'carriere', 'mineCharbon', 'mineFer', 'ferme', 'ranch']],
  ['Transformation', ['scierie', 'briqueterie', 'minoterie', 'abattoir', 'acierie']],
  ['Manufacture', ['manufacture']],
  ['Rapport et négoce', ['bureaux', 'entrepot']],
];

export function contenuFeuille(monde, c) {
  if (!c) return '';
  const v = c.ville;

  if (c.rue) return entete('Rue', 'Voirie — non constructible')
    + `<div class="note">Une rue toutes les cinq cases au centre, des parcelles isolées en
       périphérie : c'est ce contraste qui fait lire la hiérarchie urbaine, bien mieux que
       la superficie.</div>`;

  if (c.voie) return entete('Emprise de voie ferrée', 'Réservée — non constructible')
    + `<div class="note">Le rail passera ici. Les emprises sont visibles dès la première
       seconde : le joueur sait où la ligne aboutira, et peut acheter autour.</div>`;

  if (c.chantier) return ficheChantier(monde, c.chantier);
  if (c.bat) return ficheBatiment(monde, c.bat, c);
  if (!v) return ficheCampagne(c);
  return ficheTerrain(monde, v, c);
}

function entete(titre, sous) {
  return `<h2>${titre}</h2><div class="soustitre">${sous}</div>`;
}

// --- Un terrain -------------------------------------------------------------

function ficheTerrain(monde, v, c) {
  const joueur = monde.joueur;
  const aMoi = c.proprio === joueur.id;
  const prix = monde.prixCase(v, c);
  const base = prixTerrain(v.niveau, c.distanceGare);

  const qualites = QUALITES.map(q => {
    const n = c.q[q];
    const couleur = n >= 4 ? 'vert' : n <= 2 ? 'rouge' : 'doux';
    return `<div class="fiche"><div class="etiq">${NOMS_QUALITE[q]}</div>
      <div class="v ${couleur}">${n}<span class="faible" style="font-size:11px"> / 5</span></div></div>`;
  }).join('');

  let proprio = 'Vierge';
  if (c.proprio === 'ind') proprio = 'Propriétaire indépendant';
  else if (c.proprio) {
    const s = monde.societes.find(x => x.id === c.proprio);
    proprio = s ? s.nom : 'Inconnu';
  }

  const achetable = estAchetable(monde, c) || c.proprio === 'ind';
  let actions = '';
  if (aMoi) {
    actions = menuConstruire(monde, v, c);
  } else if (achetable) {
    const peut = joueur.tresorerie >= prix;
    actions = `<div class="actions">
      <button class="primaire" id="btnAcheter" ${peut ? '' : 'disabled'}>Acheter — ${eur(prix)}</button>
    </div>
    ${c.proprio === 'ind' ? `<div class="note">Un indépendant vend au prix du marché
      majoré de 20 % (${eur(base)} + 20 %). C'est le raccourci qui permet de contourner la
      règle de contiguïté — payant, donc réservé aux cases qui comptent.</div>` : ''}
    ${peut ? '' : '<div class="avert">Trésorerie insuffisante.</div>'}`;
  } else {
    actions = `<div class="note">Hors de portée. On ne peut acheter une terre vierge que si
      elle touche une terre déjà vendue ou bâtie : la ville s'étend en anneaux depuis sa gare,
      et il existe à chaque instant une frontière étroite et disputée.</div>`;
  }

  return entete(`${RELIEFS[c.relief].nom} · ${c.x},${c.y}`,
                `${proprio} · ${c.quartier ? 'quartier ' + NOMS_QUARTIER[c.quartier] : ''} — à ${c.distanceGare} cases de la gare`)
    + `<div class="grille">${qualites}</div>`
    + `<div class="grille">
        <div class="fiche"><div class="etiq">Prix du sol</div><div class="v">${eur(prix)}</div></div>
        <div class="fiche"><div class="etiq">Facteur ville</div><div class="v">×${P.facteurNiveau[v.niveau - 1].toFixed(1)}</div></div>
        <div class="fiche"><div class="etiq">Facteur distance</div><div class="v">×${(1 / (1 + P.attenuationDistance * c.distanceGare)).toFixed(2)}</div></div>
      </div>`
    + actions;
}

// --- Le menu de construction ------------------------------------------------

function menuConstruire(monde, v, c) {
  const joueur = monde.joueur;
  const m = v.marche;

  const groupes = MENU.map(([titre, types]) => {
    const boutons = types.map(t => {
      const def = BAT[t];
      // La facture est établie au prix du marché local du jour où le chantier
      // est lancé. Bâtir pendant une surproduction de briques revient beaucoup
      // moins cher que pendant une pénurie.
      let cout = 0;
      for (const [r, q] of Object.entries(materiaux(t))) cout += q * m.prix[r];
      const emprise = empriseDepuis(monde, v, c, t);
      const possible = !!emprise && joueur.tresorerie >= cout;
      const cher = cout / coutRef(t);
      return `<button class="btnBatir" data-type="${t}" ${possible ? '' : 'disabled'}
        title="${def.nom}">
        <span class="puce" style="background:${COULEURS[t]}"></span>${def.nom}
        <span class="${cher > 1.25 ? 'rouge' : cher < 0.85 ? 'vert' : 'doux'}"> ${eur(cout)}</span>
      </button>`;
    }).join('');
    return `<div class="etiq" style="margin:9px 0 4px">${titre}</div><div class="actions">${boutons}</div>`;
  }).join('');

  return groupes + `<div class="note">
    Le coût est établi <b>au prix du marché du jour</b> : un bâtiment ne coûte jamais deux
    fois la même chose. On bâtit quand les matériaux sont au plus bas — c'est-à-dire au
    moment précis où l'on peut le moins se le permettre.<br><br>
    Le cash part immédiatement ; le chantier reste un trou dans le sol tant que la dernière
    brique n'est pas livrée.</div>`;
}

// Cherche une emprise de la bonne forme, ancrée sur la case cliquée, dont le
// joueur possède toutes les cases.
export function empriseDepuis(monde, c, type) {
  const def = BAT[type];
  const joueur = monde.joueur;
  for (let dy = 0; dy < def.h; dy++) for (let dx = 0; dx < def.w; dx++) {
    const cases = [];
    let ok = true;
    for (let j = 0; j < def.h && ok; j++) for (let i = 0; i < def.w && ok; i++) {
      const k = monde.caseAt(c.x - dx + i, c.y - dy + j);
      if (!k || k.voie || k.rue || k.bat || k.chantier || k.proprio !== joueur.id) {
        ok = false; break;
      }
      cases.push(k);
    }
    if (ok && cases.length === def.cases) return cases;
  }
  return null;
}

// Hors des territoires : on ne bâtit pas en rase campagne. C'est ce qui donne
// leur valeur aux cases de la frontière urbaine.
function ficheCampagne(c) {
  const qualites = QUALITES.map(q => {
    const n = c.q[q];
    return `<div class="fiche"><div class="etiq">${NOMS_QUALITE[q]}</div>
      <div class="v ${n >= 4 ? 'vert' : n <= 2 ? 'rouge' : 'doux'}">${n}
      <span class="faible" style="font-size:11px"> / 5</span></div></div>`;
  }).join('');
  return entete(RELIEFS[c.relief].nom, 'Rase campagne — hors de tout territoire')
    + `<div class="grille">${qualites}</div>`
    + `<div class="note">Aucune ville ne s'étend jusqu'ici. On ne bâtit que dans le
       territoire d'une ville, et il s'étend en anneaux depuis sa gare.</div>`;
}

// --- Un chantier ------------------------------------------------------------

function ficheChantier(monde, ch) {
  const m = ch.ville.marche;
  const lignes = Object.entries(materiaux(ch.type)).map(([r, total]) => {
    const recu = ch.recu[r] || 0;
    return `<tr><td><span class="puce" style="background:${RES[r].couleur}"></span>${RES[r].nom}</td>
      <td class="n">${Math.round(recu)} / ${total}</td>
      <td class="n ${m.service[r] < 0.9 ? 'rouge' : 'doux'}">${pct(m.service[r])} servi</td></tr>`;
  }).join('');

  return entete(`Chantier — ${BAT[ch.type].nom}`,
    `${ch.societe.nom} · ouvert au mois ${ch.ouvertLe} · ${pct(ch.progression())} livré`)
    + `<table>${lignes}</table>
    <div class="note">Le bâtiment ne sortira de terre que le mois où la dernière brique sera
    livrée. Ouvrir trop de chantiers à la fois, c'est immobiliser son cash dans des trous —
    c'est le principal piège de trésorerie du jeu.</div>`;
}

// --- Un bâtiment ------------------------------------------------------------

const TEXTE_ALERTE = {
  matieres: 'Manque de matières premières',
  bras: 'Manque de main-d\'œuvre',
  invendus: 'Locaux vacants',
  perte: 'Perte financière',
};

function ficheBatiment(monde, b, c) {
  const def = b.def, m = b.ville.marche;
  const aMoi = b.societe === monde.joueur;
  const proprio = b.societe ? b.societe.nom : 'Propriétaire indépendant';
  const mb = b.margeBrute(m);
  const seuil = b.seuilActivite(m);

  let production = '';
  if (def.sort) {
    const intr = Object.entries(def.intrants || {}).map(([r, q]) =>
      `${Math.round(q * b.n)} ${RES[r].nom.toLowerCase()}`).join(' + ') || '—';
    production = `<div class="grille">
      <div class="fiche"><div class="etiq">Produit</div>
        <div class="v">${b.production.toFixed(0)}<span class="faible" style="font-size:11px"> ${RES[def.sort].nom.toLowerCase()}</span></div></div>
      <div class="fiche"><div class="etiq">Consomme</div><div class="v" style="font-size:12px">${intr}</div></div>
      <div class="fiche"><div class="etiq">Marge par unité</div>
        <div class="v ${b.margeUnitaire > 0 ? 'vert' : 'rouge'}">${b.margeUnitaire.toFixed(2)} $</div></div>
      <div class="fiche"><div class="etiq">Seuil d'activité</div>
        <div class="v ${seuil > 0.6 ? 'rouge' : 'doux'}">${isFinite(seuil) ? pct(seuil) : 'hors d\'atteinte'}</div></div>
    </div>`;
  }

  let qualite = '';
  if (def.qual) {
    qualite = `<div class="note">Sol de qualité <b>${b.qualite.toFixed(1)} / 5</b> :
      cette exploitation sort ${(b.qualite / 3).toFixed(2)}× ce que sortirait la même sur une
      terre moyenne. Un handicap de terrain ne fait aucun bruit — il se lit uniquement dans
      la marge, et il ne se guérit jamais.</div>`;
  }

  const reglage = aMoi && def.sort ? `
    <div class="etiq" style="margin:11px 0 4px">Curseur d'activité — ${Math.round(b.activite * 100)} %</div>
    <input type="range" id="curseurActivite" min="0" max="100" value="${Math.round(b.activite * 100)}">
    <div class="actions" style="margin-top:6px">
      <button class="preReglage" data-v="0">Sommeil</button>
      <button class="preReglage" data-v="50">50 %</button>
      <button class="preReglage" data-v="100">100 %</button>
      ${b.def.cat !== 'loge' && monde.joueur.entrepotDans(b.ville)
        ? `<button id="btnEntrepot">${b.versEntrepot ? '↺ Vendre au marché' : '⇥ Vers l\'entrepôt'}</button>` : ''}
    </div>
    <div class="note">Curseur à zéro : plus de matières achetées, plus de salaires versés.
    Le bâtiment reste debout moyennant un entretien réduit à 10 % de sa masse salariale, et
    se rallume quand le marché repart.</div>` : '';

  const demolir = aMoi ? `<div class="actions" style="margin-top:9px">
    <button id="btnDemolir">Démolir</button></div>
    <div class="note">La société conserve le terrain, ne récupère aucun matériau, et la case
    est libre le mois suivant. C'est le seul moyen, pour une ville saturée, de se densifier.</div>` : '';

  return entete(def.nom,
    `${proprio} · ${b.ville.nom} · ${def.cases} case${def.cases > 1 ? 's' : ''}`
    + (b.alerte ? ` · <span class="rouge">⚠ ${TEXTE_ALERTE[b.alerte]}</span>` : ''))
    + `<div class="grille">
        <div class="fiche"><div class="etiq">Activité</div><div class="v">${pct(b.tauxReel)}</div></div>
        <div class="fiche"><div class="etiq">Résultat du mois</div>
          <div class="v ${b.resultat >= 0 ? 'vert' : 'rouge'}">${eur(b.resultat)}</div></div>
        <div class="fiche"><div class="etiq">Entretien</div><div class="v doux">${b.entretien.toFixed(2)} $</div></div>
        <div class="fiche"><div class="etiq">Valeur</div><div class="v">${eur(b.valeur(monde.multiple))}</div></div>
      </div>`
    + production + qualite + reglage + demolir;
}
