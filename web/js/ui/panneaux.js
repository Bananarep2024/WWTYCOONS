// ---------------------------------------------------------------------------
// Les panneaux d'information.
//
// « Le registre est ce qui permet au joueur de repérer le bâtiment qui perd de
//   l'argent. Sans lui, une société de trente bâtiments est une boîte noire et
//   le joueur ne peut prendre aucune décision éclairée — il jouera au hasard.
//   C'est un écran à soigner autant que la carte, et probablement à concevoir
//   avant elle. » (§3)
// ---------------------------------------------------------------------------

import { P, RES, RESSOURCES, BAT, materiaux, coutRef, niveauVille } from '../sim/params.js';
import { COULEURS } from './render.js';

export const $ = (s) => document.querySelector(s);
export const eur = (n) => (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('fr-FR') + ' $';
export const pct = (n) => Math.round(n * 100) + ' %';
const cl = (n) => n > 0 ? 'vert' : n < 0 ? 'rouge' : 'doux';

// --- Ville ------------------------------------------------------------------

export function panneauVille(monde, v) {
  const b = v.barometres;
  const moy = (b.nourriture + b.emploi + b.produits) / 3;

  // Les trois barres doivent être affichées côte à côte avec leur moyenne, pour
  // qu'on voie d'un coup d'œil laquelle tire vers le bas : trois facteurs
  // médiocres donnent un résultat médiocre sans qu'aucun ne saute aux yeux.
  const jauge = (nom, val, seuil, couleur) => `
    <div class="barometre ${val < seuil ? 'critique' : ''}">
      <div class="tete"><span>${nom}</span>
        <span class="${val < seuil ? 'rouge' : 'doux'}">${pct(val)}${val < seuil ? ' ⚠' : ''}</span></div>
      <div class="piste"><div class="jauge" style="width:${Math.min(100, val * 100)}%;background:${couleur}"></div></div>
    </div>`;

  const tendance = v.enCrise ? '<span class="rouge">seuil critique franchi — la ville se vide de 5 % par mois</span>'
    : moy > P.pivot + 0.005 ? `<span class="vert">attractive — elle grossit de ${(0.2 * (moy - P.pivot) * 100).toFixed(1)} % par mois</span>`
    : moy < P.pivot - 0.005 ? `<span class="rouge">elle repousse — ${(0.2 * (moy - P.pivot) * 100).toFixed(1)} % par mois</span>`
    : '<span class="doux">à l\'équilibre, sur son pivot</span>';

  return `
    <h3>${v.nom} · ${P.nomsNiveau[v.niveau - 1]}</h3>
    <div class="grille">
      <div class="fiche"><div class="etiq">Ménages</div><div class="v">${Math.round(v.menages)}</div></div>
      <div class="fiche"><div class="etiq">Occupation</div><div class="v">${pct(v.occupation)}</div></div>
      <div class="fiche"><div class="etiq">Salaire</div><div class="v">${v.salaire.toFixed(1)} $</div></div>
      <div class="fiche"><div class="etiq">Bras libres</div><div class="v">${Math.round(Math.max(0, v.bras - v.postesDemandes))}</div></div>
    </div>

    <h3>Les trois baromètres</h3>
    ${jauge('Nourriture', b.nourriture, P.seuilsCritiques.nourriture, '#d9a441')}
    ${jauge('Emploi', b.emploi, P.seuilsCritiques.emploi, '#6f9fc9')}
    ${jauge('Produits manufacturés', b.produits, P.seuilsCritiques.produits, '#6faa72')}
    <div class="barometre" style="margin-top:11px">
      <div class="tete"><span><b>Moyenne</b> — pivot à ${pct(P.pivot)}</span><span class="or"><b>${pct(moy)}</b></span></div>
      <div class="piste"><div class="jauge" style="width:${moy * 100}%;background:#d9a441"></div></div>
    </div>
    <div class="note">${tendance}</div>

    <h3>Prochain palier</h3>
    <div class="note">${paliersuivant(v)}</div>

    <h3>Chantiers en cours (${monde.tousChantiers(v).length})</h3>
    ${tableChantiers(monde, v)}
  `;
}

function paliersuivant(v) {
  const n = niveauVille(v.menages);
  if (n >= 5) return 'Métropole — le dernier palier est atteint.';
  const cible = P.seuilsNiveau[n];
  return `${P.nomsNiveau[n]} à ${cible} ménages — il en manque <b>${Math.max(0, Math.ceil(cible - v.menages))}</b>. `
       + `Le foncier passerait de ×${P.facteurNiveau[n - 1].toFixed(1)} à ×${P.facteurNiveau[n].toFixed(1)}.`;
}

function tableChantiers(monde, v) {
  const chs = monde.tousChantiers(v).sort((a, b) => a.ouvertLe - b.ouvertLe);
  if (!chs.length) return '<div class="note faible">Aucun.</div>';
  return `<table><tr><th>Ouvert</th><th>Bâtiment</th><th>Société</th><th class="n">Avancement</th></tr>
    ${chs.map(c => `<tr>
      <td class="doux">mois ${c.ouvertLe}</td>
      <td>${BAT[c.type].nom}</td>
      <td style="color:${c.societe.couleur}">${c.societe.nom}</td>
      <td class="n">${pct(c.progression())}</td></tr>`).join('')}
  </table>
  <div class="note">Priorité au plus ancien : un chantier ouvert il y a dix mois ne cède
  jamais sa place à un chantier ouvert hier.</div>`;
}

// --- Marché -----------------------------------------------------------------

export function panneauMarche(monde, v) {
  const m = v.marche;
  const lignes = RESSOURCES.map(r => {
    const i = m.indice(r);
    const classe = i > 1.4 ? 'rouge' : i < 0.75 ? 'vert' : 'doux';
    const serv = m.service[r];
    return `<tr>
      <td><span class="puce" style="background:${RES[r].couleur}"></span>${RES[r].nom}</td>
      <td class="n">${m.prix[r].toFixed(2)} $</td>
      <td class="n ${classe}">${i.toFixed(2)}×</td>
      <td class="n ${serv < 0.95 ? 'rouge' : 'doux'}">${pct(serv)}</td>
      <td class="n doux">${Math.round(m.stock[r])}</td>
    </tr>`;
  }).join('');

  return `
    <h3>Marché de ${m.nom}</h3>
    <table>
      <tr><th>Ressource</th><th class="n">Prix</th><th class="n">/ réf.</th><th class="n">Servi</th><th class="n">Stock</th></tr>
      ${lignes}
    </table>
    <div class="note">
      Le prix suit les <b>flux</b>, jamais le stock : il monte quand les besoins réels du mois
      dépassent ce qui entre sur le marché. Rafler un stock ne fait pas bouger le cours —
      cela vide le matelas, et les usines s'arrêtent au premier accroc.
    </div>
    ${m.villes.length > 1 ? `<div class="note or">★ ${m.villes.length} villes fusionnées :
      leurs stocks se confondent et un prix unique s'établit.</div>` : ''}
  `;
}

// --- Comptes ----------------------------------------------------------------

export function panneauComptes(monde) {
  const s = monde.joueur;
  const bats = s.batiments;

  const enTete = `
    <div class="grille">
      <div class="fiche"><div class="etiq">Votre fortune</div>
        <div class="v or">${eur(s.cours(monde.multiple) * s.actions * P.partFondateur)}</div></div>
      <div class="fiche"><div class="etiq">Cours de l'action</div>
        <div class="v">${s.cours(monde.multiple).toFixed(3).replace('.', ',')} $</div></div>
      <div class="fiche"><div class="etiq">Climat</div>
        <div class="v">${{ normal: 'Normal', euphorie: 'Euphorie', crise: 'Crise' }[monde.climat]}</div></div>
    </div>`;
  if (!bats.length && !s.chantiers.length) {
    return enTete + `<h3>Livre de comptes</h3>
      <div class="note">Votre société ne possède encore rien.<br><br>
      Cliquez une case sur la carte pour acheter du terrain, puis ouvrez un chantier.
      Le terrain est la moitié du coût d'une maison — et la totalité de ce qui fait
      les fortunes.</div>`;
  }

  const lignes = bats.map(b => {
    const marge = b.margeUnitaire;
    return `<tr class="ligneBat" data-bat="${b.id}">
      <td><span class="puce" style="background:${COULEURS[b.type]}"></span>${BAT[b.type].nom}</td>
      <td class="doux">${b.ville.nom.slice(0, 7)}</td>
      <td class="n">${pct(b.tauxReel)}</td>
      <td class="n ${cl(b.resultat)}">${eur(b.resultat)}</td>
      <td class="n doux">${b.def.sort ? marge.toFixed(2) : '—'}</td>
    </tr>`;
  }).join('');

  const resultat = s.resultatMensuel;
  const actif = s.actifNet(monde.multiple);

  return enTete + `
    <h3>Exploitation du mois</h3>
    <table>
      <tr><th>Bâtiment</th><th>Ville</th><th class="n">Activité</th><th class="n">Résultat</th><th class="n">Marge/u</th></tr>
      ${lignes}
    </table>

    <h3>Bilan</h3>
    <table>
      <tr><td>Résultat net du mois</td><td class="n ${cl(resultat)}">${eur(resultat)}</td></tr>
      <tr><td>Masse salariale</td><td class="n doux">${eur(s.masseSalariale)}</td></tr>
      <tr><td>Trésorerie</td><td class="n">${eur(s.tresorerie)}</td></tr>
      <tr><td>Immobilisé en chantiers</td><td class="n doux">${eur(s.chantiers.reduce((a, c) => a + c.engage, 0))}</td></tr>
      <tr><td>Valeur des bâtiments</td><td class="n">${eur(bats.reduce((a, b) => a + b.valeur(monde.multiple), 0))}</td></tr>
      <tr><td><b>Actif net réévalué</b></td><td class="n"><b>${eur(actif)}</b></td></tr>
      <tr><td>Cours de l'action</td><td class="n or">${s.cours(monde.multiple).toFixed(3)} $</td></tr>
    </table>
    <div class="note">
      Multiple du marché : <b>×${monde.multiple}</b>. Un bâtiment vaut son terrain plus ses
      matériaux, plus ${monde.multiple} fois son résultat annuel — et jamais moins que son plancher.
    </div>

    <h3>Concurrents</h3>
    <table>
      <tr><th>Société</th><th class="n">Bâtiments</th><th class="n">Cours</th></tr>
      ${monde.societes.map(x => `<tr>
        <td><span class="puce" style="background:${x.couleur}"></span>${x.nom}</td>
        <td class="n doux">${x.batiments.length}</td>
        <td class="n">${x.cours(monde.multiple).toFixed(3)} $</td></tr>`).join('')}
    </table>
  `;
}

// --- Rail -------------------------------------------------------------------

export function panneauRail(monde) {
  const lignes = monde.liaisons.map((l, i) => {
    const reste = l.date - monde.mois;
    const part = l.capital > 0 ? (l.parts[monde.joueur.id] || 0) / l.capital : 0;
    return `<tr>
      <td>${l.nom}</td>
      <td class="n ${l.achevee ? 'vert' : reste <= 3 ? 'or' : 'doux'}">
        ${l.achevee ? 'ouverte' : reste + ' mois'}</td>
      <td class="n doux">${part > 0 ? pct(part) : '—'}</td>
      <td class="n">${l.achevee ? '—' : `<button class="miniInvest" data-liaison="${i}">+800 $</button>`}</td>
    </tr>`;
  }).join('');

  return `
    <h3>Les liaisons</h3>
    <table>
      <tr><th>Ligne</th><th class="n">Achèvement</th><th class="n">Votre part</th><th></th></tr>
      ${lignes}
    </table>
    <div class="note">
      Chaque tranche de 800 $ avance la date d'un mois, dans la limite de 40 % du délai
      initial : on peut avancer le rendez-vous, jamais le supprimer.<br><br>
      Le jour où une ligne s'ouvre, les deux villes n'ont plus qu'un seul marché. Les prix
      s'effondrent d'un côté, s'envolent de l'autre, et tous les calculs de rentabilité sont
      à refaire. <b>Celui qui a acheté les bonnes terres avant que la ligne n'aboutisse a
      gagné sa partie.</b>
    </div>

    <h3>Journal</h3>
    <div class="note">${monde.journal.slice(-9).reverse().join('<br>') || 'Rien à signaler.'}</div>
  `;
}
