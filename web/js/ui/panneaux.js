// ---------------------------------------------------------------------------
// Le contenu des volets : filtres, villes, marché, société, rail.
//
// « Le registre est ce qui permet au joueur de repérer le bâtiment qui perd de
//   l'argent. Sans lui, une société de trente bâtiments est une boîte noire et
//   le joueur ne peut prendre aucune décision éclairée — il jouera au hasard. »
// ---------------------------------------------------------------------------

import { P, RES, RESSOURCES, BAT, TYPES_BAT, niveauVille, materiaux, coutRef,
         rendementVise } from '../sim/params.js';
import { COULEURS, FILTRES_CASE, FILTRES_VILLE, echelle } from './render.js';

export const $ = (s) => document.querySelector(s);
export const eur = (n) => (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('fr-FR') + ' $';
export const pct = (n) => Math.round(n * 100) + ' %';
const cl = (n) => n > 0 ? 'vert' : n < 0 ? 'rouge' : 'doux';
export const rgb = (t) => `rgb(${t[0]},${t[1]},${t[2]})`;

// Les bâtiments dont la rentabilité veut dire quelque chose : l'entrepôt ne
// rapporte rien par construction, il n'a pas de rendement à comparer.
const RENTABLES = TYPES_BAT.filter(t => BAT[t].cat !== 'neg');

// --- Filtres ----------------------------------------------------------------

export function voletFiltres(monde, rendu) {
  const past = (id, nom, actif, teinte) =>
    `<button data-filtre="${id}" class="${actif ? 'actif' : ''}">`
    + (teinte ? `<span class="nuance" style="background:${teinte}"></span>` : '')
    + `${nom}</button>`;

  const f = rendu.filtre, fp = rendu.filtrePrix, rendement = rendu.filtreRdt;

  return `
    <h3>Ce que montre la carte</h3>
    <div class="pastilles">
      ${past('', 'Les bâtiments', !f && !fp)}
      ${past('proprio', 'Mes possessions', f === 'proprio')}
    </div>

    <h3>Le terrain — case par case</h3>
    <div class="pastilles">
      ${Object.entries(FILTRES_CASE).map(([id, x]) =>
        past(id, x.nom, f === id)).join('')}
    </div>

    <h3>Les villes — territoire entier</h3>
    <div class="pastilles">
      ${Object.entries(FILTRES_VILLE).map(([id, x]) =>
        past(id, x.nom, f === id)).join('')}
    </div>

    <h3>La rentabilité, bâtiment par bâtiment</h3>
    <div class="pastilles">
      <button data-rdt="tous" class="${rendement === 'tous' ? 'actif' : ''}">Tous</button>
      ${RENTABLES.map(t =>
        `<button data-rdt="${t}" class="${rendement === t ? 'actif' : ''}">
           <span class="nuance" style="background:${COULEURS[t]}"></span>${BAT[t].nom}</button>`
      ).join('')}
    </div>
    <div class="note">Chaque bâtiment prend la couleur de son rendement : rouge s'il ne
      rapporte rien, vert à 20 % l'an — le rendement visé de la transformation, au milieu du
      barème. Ceux d'un autre métier restent en silhouette.</div>

    <h3>Le prix d'une marchandise, ville par ville</h3>
    <div class="pastilles">
      ${RESSOURCES.map(r =>
        `<button data-prix="${r}" class="${fp === r ? 'actif' : ''}">
           <span class="nuance" style="background:${RES[r].couleur}"></span>${RES[r].nom}</button>`
      ).join('')}
    </div>

    <div class="note">
      Une seule échelle pour tout : <b class="rouge">rouge</b> pour ce qui va mal,
      jaune au milieu, <b class="vert">vert</b> pour ce qui va bien. Sur les prix,
      le rouge dit « cher » — mauvaise nouvelle pour qui achète, bonne pour qui vend.
    </div>
  `;
}

// --- Villes -----------------------------------------------------------------

export function voletVilles(monde) {
  return `<h3>Les cinq villes</h3>
    <div class="listeVilles">
      ${monde.villes.map(v => {
        const b = v.barometres;
        const moy = (b.nourriture + b.emploi + b.produits) / 3;
        return `<button data-ville="${v.id}">
          <span>
            <b>${v.nom}</b>${v.enCrise ? ' <span class="rouge">⚠</span>' : ''}
            <span class="cv"><br>${P.nomsNiveau[v.niveau - 1]} · ${Math.round(v.menages)} ménages</span>
          </span>
          <span class="cv" style="text-align:right">
            <span style="color:${rgb(echelle(moy))}">●</span> ${pct(moy)}
            <br>salaire ${v.salaire.toFixed(1)} $
          </span>
        </button>`;
      }).join('')}
    </div>
    <div class="note">Touchez une ville pour l'atteindre sur la carte.</div>
    ${monde.villeChoisie ? detailVille(monde, monde.villeChoisie) : ''}
  `;
}

export function detailVille(monde, v) {
  const b = v.barometres;
  const moy = (b.nourriture + b.emploi + b.produits) / 3;

  const jauge = (nom, val, seuil) => `
    <div class="barometre">
      <div class="tete"><span>${nom}</span>
        <span class="${val < seuil ? 'rouge' : 'doux'}">${pct(val)}${val < seuil ? ' ⚠' : ''}</span></div>
      <div class="piste"><div class="jauge2"
        style="width:${Math.min(100, val * 100)}%;background:${rgb(echelle(val))}"></div></div>
    </div>`;

  const tendance = v.enCrise
    ? '<span class="rouge">seuil critique franchi — la ville se vide de 5 % par mois</span>'
    : moy > P.pivot + 0.005 ? `<span class="vert">attractive — +${(0.2 * (moy - P.pivot) * 100).toFixed(1)} % par mois</span>`
    : moy < P.pivot - 0.005 ? `<span class="rouge">elle repousse — ${(0.2 * (moy - P.pivot) * 100).toFixed(1)} % par mois</span>`
    : '<span class="doux">à l\'équilibre, sur son pivot</span>';

  const n = niveauVille(v.menages);
  const palier = n >= 5 ? 'Métropole — dernier palier.'
    : `${P.nomsNiveau[n]} à ${P.seuilsNiveau[n]} ménages — il en manque
       <b>${Math.max(0, Math.ceil(P.seuilsNiveau[n] - v.menages))}</b>, et le foncier
       passerait de ×${P.facteurNiveau[n - 1].toFixed(1)} à ×${P.facteurNiveau[n].toFixed(1)}.`;

  return `
    <h3>${v.nom} · ${P.nomsNiveau[v.niveau - 1]}</h3>
    <div class="grille">
      <div class="fiche"><div class="etiq">Ménages</div><div class="v">${Math.round(v.menages)}</div></div>
      <div class="fiche"><div class="etiq">Occupation</div><div class="v">${pct(v.occupation)}</div></div>
      <div class="fiche"><div class="etiq">Salaire</div><div class="v">${v.salaire.toFixed(1)} $</div></div>
      <div class="fiche"><div class="etiq">Bras libres</div>
        <div class="v">${Math.round(Math.max(0, (v.bras || 0) - (v.postesDemandes || 0)))}</div></div>
    </div>

    <h3>Les trois baromètres</h3>
    ${jauge('Nourriture', b.nourriture, P.seuilsCritiques.nourriture)}
    ${jauge('Emploi', b.emploi, P.seuilsCritiques.emploi)}
    ${jauge('Produits manufacturés', b.produits, P.seuilsCritiques.produits)}
    <div class="barometre" style="margin-top:10px">
      <div class="tete"><span><b>Moyenne</b> — pivot à ${pct(P.pivot)}</span>
        <span class="or"><b>${pct(moy)}</b></span></div>
      <div class="piste"><div class="jauge2" style="width:${moy * 100}%;background:var(--or)"></div></div>
    </div>
    <div class="note">${tendance}</div>
    <div class="note">${palier}</div>
  `;
}

// --- Marché -----------------------------------------------------------------

export function voletMarche(monde, rendu) {
  return monde.marches.map(m => {
    const lignes = RESSOURCES.map(r => {
      const i = m.indice(r);
      const classe = i > 1.35 ? 'rouge' : i < 0.8 ? 'vert' : 'doux';
      return `<tr class="ligneRes" data-prix="${r}">
        <td><span class="puce" style="background:${RES[r].couleur}"></span>${RES[r].nom}</td>
        <td class="n">${m.prix[r].toFixed(2)} $</td>
        <td class="n ${classe}">${i.toFixed(2)}×</td>
        <td class="n ${m.service[r] < 0.95 ? 'rouge' : 'doux'}">${pct(m.service[r])}</td>
      </tr>`;
    }).join('');
    return `<h3>${m.nom}${m.villes.length > 1 ? ' — marché fusionné' : ''}</h3>
      <table>
        <tr><th>Marchandise</th><th class="n">Prix</th><th class="n">/ réf.</th><th class="n">Servi</th></tr>
        ${lignes}
      </table>`;
  }).join('') + `
    <div class="note">
      Touchez une marchandise pour la voir sur la carte, ville par ville.<br><br>
      Le prix suit les <b>flux</b>, jamais le stock : il monte quand les besoins du mois
      dépassent ce qui entre sur le marché. Rafler un stock ne fait pas bouger le cours —
      cela vide le matelas, et les usines s'arrêtent au premier accroc.
    </div>`;
}

// --- Société ----------------------------------------------------------------

export function voletSociete(monde) {
  const s = monde.joueur;
  const enTete = `
    <div class="grille">
      <div class="fiche"><div class="etiq">Votre fortune</div>
        <div class="v or">${eur(s.cours(monde.multiple) * s.actions * P.partFondateur)}</div></div>
      <div class="fiche"><div class="etiq">Cours</div>
        <div class="v">${s.cours(monde.multiple).toFixed(3).replace('.', ',')} $</div></div>
      <div class="fiche"><div class="etiq">Trésorerie</div><div class="v">${eur(s.tresorerie)}</div></div>
    </div>`;

  if (!s.batiments.length && !s.chantiers.length) {
    return enTete + `<h3>Livre de comptes</h3>
      <div class="note">Votre société ne possède encore rien.<br><br>
      Approchez une ville, touchez une case libre à la lisière du bâti, achetez-la, puis
      ouvrez un chantier. Le terrain est la moitié du coût d'une maison — et la totalité
      de ce qui fait les fortunes.</div>`;
  }

  const lignes = s.batiments.map(b => `
    <tr class="ligneBat" data-bat="${b.id}">
      <td><span class="puce" style="background:${COULEURS[b.type]}"></span>${BAT[b.type].nom}</td>
      <td class="doux">${b.ville.nom.slice(0, 8)}</td>
      <td class="n">${pct(b.tauxReel)}</td>
      <td class="n" style="color:${rgb(echelle(b.tenue()))}">${(b.rendement * 100).toFixed(0)} %</td>
      <td class="n ${cl(b.resultat)}">${eur(b.resultat)}</td>
    </tr>`).join('');

  return enTete + `
    <h3>Exploitation du mois</h3>
    <table>
      <tr><th>Bâtiment</th><th>Ville</th><th class="n">Activ.</th>
          <th class="n">Rdt</th><th class="n">Résultat</th></tr>
      ${lignes}
    </table>

    <h3>Bilan</h3>
    <table>
      <tr><td>Résultat net</td><td class="n ${cl(s.resultatMensuel)}">${eur(s.resultatMensuel)}</td></tr>
      <tr><td>Immobilisé en chantiers</td>
          <td class="n doux">${eur(s.chantiers.reduce((a, c) => a + c.engage, 0))}</td></tr>
      <tr><td>Valeur des bâtiments</td>
          <td class="n">${eur(s.batiments.reduce((a, b) => a + b.valeur(monde.multiple), 0))}</td></tr>
      <tr><td><b>Actif net réévalué</b></td><td class="n"><b>${eur(s.actifNet(monde.multiple))}</b></td></tr>
    </table>

    <h3>Les concurrents</h3>
    <table>
      <tr><th>Société</th><th class="n">Bâtiments</th><th class="n">Cours</th></tr>
      ${monde.societes.map(x => `<tr>
        <td><span class="puce" style="background:${x.couleur}"></span>${x.nom}</td>
        <td class="n doux">${x.batiments.length}</td>
        <td class="n">${x.cours(monde.multiple).toFixed(3).replace('.', ',')} $</td></tr>`).join('')}
    </table>
    <div class="note">Multiple du marché : <b>×${monde.multiple}</b>. Un bâtiment vaut son
      terrain plus ses matériaux, plus ${monde.multiple} fois son résultat annuel.</div>

    <h3>La partie</h3>
    <div class="note">Elle n'a pas de terme : elle court tant que vous la faites courir.
      Il n'y a plus de décompte à battre, seulement une fortune à bâtir.</div>
    <div class="actions" style="margin-top:8px">
      <button onclick="location.reload()">Nouveau monde</button>
    </div>`;
}

// --- Rail -------------------------------------------------------------------

export function voletRail(monde) {
  const lignes = monde.liaisons.map((l, i) => {
    const reste = l.date - monde.mois;
    const part = l.capital > 0 ? (l.parts[monde.joueur.id] || 0) / l.capital : 0;
    return `<tr>
      <td>${l.nom}<br><span class="faible">${l.longueur} cases</span></td>
      <td class="n ${l.achevee ? 'vert' : reste <= 3 ? 'or' : 'doux'}">
        ${l.achevee ? 'ouverte' : reste + ' mois'}</td>
      <td class="n doux">${part > 0 ? pct(part) : '—'}</td>
      <td class="n">${l.achevee ? '—'
        : `<button class="miniInvest" data-liaison="${i}">+800 $</button>`}</td>
    </tr>`;
  }).join('');

  // Ce que voit le joueur : quelles villes partagent déjà un marché.
  const reseaux = monde.marches.map(m => m.villes.map(v => v.nom).join(' + ')).join('<br>');

  return `
    <h3>Les liaisons</h3>
    <table>
      <tr><th>Ligne</th><th class="n">Achèvement</th><th class="n">Votre part</th><th></th></tr>
      ${lignes}
    </table>
    <div class="note">
      Chaque tranche de 800 $ avance la date d'un mois, dans la limite de 40 % du délai
      initial : on peut avancer le rendez-vous, jamais le supprimer.
    </div>

    <h3>Marchés en présence</h3>
    <div class="note">${reseaux}<br><br>
      Les liaisons ne s'additionnent pas, elles se chaînent : si A rejoint B et B rejoint C,
      alors A et C partagent déjà le même marché, sans qu'aucune ligne supplémentaire ait
      été posée.</div>

    <h3>Journal</h3>
    <div class="note">${monde.journal.slice(-8).reverse().join('<br>') || 'Rien à signaler.'}</div>
  `;
}


// ---------------------------------------------------------------------------
// Bâtir. Le volet qui manquait.
//
// Le joueur commence sans un pouce de terre. Pour bâtir il fallait deviner
// qu'une case libre de la frontière était achetable, l'acheter, puis la
// re-cliquer — deux gestes que rien n'annonçait, sur une case que la carte ne
// distinguait pas des autres. On choisit maintenant le bâtiment d'abord, et la
// carte montre elle-même où il peut aller.
// ---------------------------------------------------------------------------

const MENU_BATIR = [
  ['Logement', ['maison', 'immeuble']],
  ['Exploitation', ['coupe', 'carriere', 'mineCharbon', 'mineFer', 'ferme', 'ranch']],
  ['Transformation', ['scierie', 'briqueterie', 'minoterie', 'abattoir', 'acierie']],
  ['Manufacture', ['manufacture']],
  ['Rapport et négoce', ['bureaux', 'entrepot']],
];

export function voletBatir(monde, rendu) {
  const joueur = monde.joueur;
  // Le devis se chiffre dans la ville qu'on regarde : les matériaux n'ont pas
  // le même prix d'un marché à l'autre tant que le rail ne les a pas réunis.
  const v = monde.villeChoisie || rendu.villeAuCentre() || monde.villes[0];
  const m = v.marche;

  const groupes = MENU_BATIR.map(([titre, types]) => {
    const lignes = types.map(t => {
      const def = BAT[t];
      let materiel = 0;
      for (const [r, q] of Object.entries(materiaux(t))) materiel += q * m.prix[r];
      const cher = materiel / coutRef(t);
      const choisi = rendu.pose === t;
      const abordable = joueur.tresorerie >= materiel;
      const vise = rendementVise(t);
      return `<button class="ligneBatir ${choisi ? 'actif' : ''}" data-batir="${t}"
                ${abordable ? '' : 'disabled'}>
        <span class="puce" style="background:${COULEURS[t]}"></span>
        <span class="nomBat">${def.nom}</span>
        <span class="sousBat">${def.w}×${def.h}${vise ? ' · visé ' + Math.round(vise * 100) + ' %' : ''}</span>
        <span class="prixBat ${cher > 1.25 ? 'rouge' : cher < 0.85 ? 'vert' : 'doux'}">${eur(materiel)}</span>
      </button>`;
    }).join('');
    return `<h3>${titre}</h3><div class="listeBatir">${lignes}</div>`;
  }).join('');

  const enCours = rendu.pose
    ? `<div class="avertBatir">Posez la <b>${BAT[rendu.pose].nom}</b> — touchez la carte.
         Les cases possibles sont cerclées d'or.
         <button id="btnAnnulerPose">Annuler</button></div>`
    : `<div class="note">Choisissez un bâtiment, puis touchez la carte à l'endroit voulu.
         Le terrain qui vous manque est acheté dans le même geste — on ne peut prendre
         qu'une terre vierge touchant la frontière urbaine, ou celle d'un indépendant,
         jamais celle d'un rival.</div>`;

  return `<div class="grille">
      <div class="fiche"><div class="etiq">Trésorerie</div>
        <div class="v or">${eur(joueur.tresorerie)}</div></div>
      <div class="fiche"><div class="etiq">Devis établi à</div>
        <div class="v" style="font-size:12px">${v.nom}</div></div>
    </div>
    ${enCours}${groupes}
    <div class="note">Le prix affiché est celui des <b>matériaux au marché du jour</b> ;
      le foncier s'y ajoute selon l'endroit et vous est annoncé avant de valider. Le cash
      part immédiatement, le chantier ne sort de terre qu'à la dernière brique livrée.</div>`;
}
