// ---------------------------------------------------------------------------
// Le contenu des volets : filtres, villes, marché, société, rail.
//
// « Le registre est ce qui permet au joueur de repérer le bâtiment qui perd de
//   l'argent. Sans lui, une société de trente bâtiments est une boîte noire et
//   le joueur ne peut prendre aucune décision éclairée — il jouera au hasard. »
// ---------------------------------------------------------------------------

import { P, RES, RESSOURCES, BAT, TYPES_BAT, niveauVille, materiaux, coutRef,
         rendementVise, devisGare } from '../sim/params.js';
import { COULEURS, FILTRES_CASE, FILTRES_VILLE, echelle } from './render.js';
import { EVENEMENTS } from '../sim/evenements.js';

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

// L'attractivité, ville par ville, et ce qui la compose.
//
// C'est le seul chiffre qui décide de la population : bâtir des logements ne
// fait venir personne, cela ouvre des portes. Le joueur doit donc pouvoir lire
// d'un coup d'œil pourquoi une ville attire et pourquoi une autre stagne — et
// les quatre composantes se lisent séparément, sinon le chiffre global ne dit
// rien d'actionnable.

// `val` est la position sur l'échelle rouge → vert, entre 0 et 1 ; `affiche`
// est ce qu'on écrit. Les deux diffèrent pour le pouvoir d'achat, dont le
// chiffre parlant est un rapport centré sur 100 % et non une position.
function miniJauge(nom, val, seuil, affiche) {
  const alerte = seuil !== undefined && val < seuil;
  return `<div class="mini">
    <div class="miniTete"><span>${nom}</span>
      <span class="${alerte ? 'rouge' : 'doux'}">${affiche ?? pct(val)}${alerte ? ' ⚠' : ''}</span></div>
    <div class="miniPiste"><div style="width:${Math.min(100, Math.max(0, val) * 100)}%;
      background:${rgb(echelle(val))}"></div></div>
  </div>`;
}

// L'aisance vaut 1,00 quand le ménage boucle tout juste. On la ramène sur
// l'échelle commune pour qu'elle se lise comme les autres : 0,70 → rouge,
// 1,20 → vert.
function echelleAisance(a) {
  return (a - P.aisanceMin) / (P.aisanceMax - P.aisanceMin);
}

function carteVille(monde, v) {
  const b = v.barometres;
  const a = monde.attractivite(v);
  const ais = monde.aisance(v);
  const croissance = v.enCrise ? -P.exodeCritique
    : Math.max(-P.cadenceMax, Math.min(P.cadenceMax, P.cadenceDemo * 100 * (a - P.pivot)));

  const mouvement = v.enCrise
    ? '<span class="rouge">seuil critique franchi — la ville se vide</span>'
    : croissance > 0.0005
      ? `<span class="vert">+${(croissance * 100).toFixed(1)} % par mois</span> venus du dehors`
      : croissance < -0.0005
        ? `<span class="rouge">${(croissance * 100).toFixed(1)} % par mois</span> — elle repousse`
        : '<span class="doux">à l\'équilibre, sur son pivot</span>';

  const mig = v.migration === undefined ? 0 : v.migration;
  const echange = Math.abs(mig) < 0.05 ? ''
    : mig > 0 ? ` · <span class="vert">+${mig.toFixed(1)}</span> pris aux villes reliées`
              : ` · <span class="rouge">${mig.toFixed(1)}</span> partis vers les villes reliées`;

  const plein = v.occupation > 0.97
    ? '<div class="avert">Logements pleins : l\'attractivité ne peut plus se traduire en habitants.</div>'
    : v.occupation < 0.55 && v.capaciteLogement > 0
      ? '<div class="note">Beaucoup de logements vides — ils ne feront venir personne tant que l\'attractivité restera sous le pivot.</div>'
      : '';

  return `<div class="carteVille ${monde.villeChoisie === v ? 'actif' : ''}" data-ville="${v.id}">
    <div class="tetVille">
      <span><b>${v.nom}</b>${v.enCrise ? ' <span class="rouge">⚠</span>' : ''}
        <span class="cv"><br>${P.nomsNiveau[v.niveau - 1]} · ${Math.round(v.menages)} ménages
        · ${pct(v.occupation)} occupé${v.temperament
          ? `<br><i class="faible">fondée comme ${v.temperament.nom}</i>` : ''}</span></span>
      <span class="attrait" style="color:${rgb(echelle(a))}">${pct(a)}
        <span class="etiq" style="display:block;text-align:right">attractivité</span></span>
    </div>
    <div class="minis">
      ${miniJauge('Nourriture', b.nourriture, P.seuilsCritiques.nourriture)}
      ${miniJauge('Emploi', b.emploi, P.seuilsCritiques.emploi)}
      ${miniJauge('Produits', b.produits, P.seuilsCritiques.produits)}
      ${miniJauge('Pouvoir d\'achat', echelleAisance(ais), undefined,
                   (ais * 100).toFixed(0) + ' %')}
    </div>
    <div class="pied">${mouvement}${echange}
      · salaire ${v.salaire.toFixed(1)} $ · panier ${monde.panier(v).toFixed(1)} $</div>
    ${plein}
  </div>`;
}

export function voletVilles(monde) {
  const classees = monde.villes.slice()
    .sort((a, b) => monde.attractivite(b) - monde.attractivite(a));
  return `<h3>Attractivité — les cinq villes</h3>
    <div class="listeCartesVilles">${classees.map(v => carteVille(monde, v)).join('')}</div>
    <div class="note">
      <b>attractivité = moyenne des trois baromètres × pouvoir d'achat</b>, où le pouvoir
      d'achat vaut le revenu du ménage divisé par son panier — 100 % quand il boucle tout
      juste. Au-dessus du pivot de ${pct(P.pivot)} la ville attire des habitants
      <b>du dehors</b> ; en dessous elle en perd. Une part très faible de la population
      circule en plus entre les villes qu'un rail relie, au prorata de leur attrait.<br><br>
      Bâtir des logements <b>ne fait venir personne</b> : cela ouvre des portes que
      l'attractivité remplira, ou pas.
    </div>
    <div class="pastilles"><button data-vue="evenements">${
      monde.evenements.length
        ? monde.evenements.map(e => e.def.signe).join(' ') + ' &nbsp;Ce qui arrive'
        : 'Ce qui arrive — la chronique'}</button></div>
    ${monde.villeChoisie ? detailVille(monde, monde.villeChoisie) : ''}
  `;
}

export function detailVille(monde, v) {
  const b = v.barometres;
  const a = monde.attractivite(v);
  const ais = monde.aisance(v);
  const moy = (b.nourriture + b.emploi + b.produits) / 3;
  const panier = monde.panier(v);
  const revenu = P.employesParMenage * v.salaire * b.emploi;

  const jauge = (nom, val, seuil) => `
    <div class="barometre">
      <div class="tete"><span>${nom}</span>
        <span class="${seuil !== undefined && val < seuil ? 'rouge' : 'doux'}">${pct(val)}${seuil !== undefined && val < seuil ? ' ⚠' : ''}</span></div>
      <div class="piste"><div class="jauge2"
        style="width:${Math.min(100, val * 100)}%;background:${rgb(echelle(val))}"></div></div>
    </div>`;

  const n = niveauVille(v.menages);
  const palier = n >= 5 ? 'Métropole — dernier palier.'
    : `${P.nomsNiveau[n]} à ${P.seuilsNiveau[n]} ménages — il en manque
       <b>${Math.max(0, Math.ceil(P.seuilsNiveau[n] - v.menages))}</b>, et le foncier
       passerait de ×${P.facteurNiveau[n - 1].toFixed(1)} à ×${P.facteurNiveau[n].toFixed(1)}.`;

  return `
    <h3>${v.nom} · ${P.nomsNiveau[v.niveau - 1]}</h3>
    ${v.temperament ? `<div class="note" style="margin:0 0 9px">Fondée comme
      <b>${v.temperament.nom}</b>. Les cinq villes n'ouvrent pas la partie dans le même état :
      celle-ci démarrait avec ${Math.round(v.temperament.emploi * 100)} % de ses bras employés,
      ${Math.round(v.temperament.vivres * 100)} % de couverture alimentaire,
      ${Math.round(v.temperament.produits * 100)} % en produits manufacturés,
      ${v.temperament.bureaux >= 1.2 ? 'une belle dotation de bureaux'
        : v.temperament.bureaux <= 0.6 ? 'presque pas de bureaux' : 'des bureaux en nombre moyen'},
      et ${v.filieresEngorgees && v.filieresEngorgees.length
        ? `<b>${v.filieresEngorgees.map(f => RES[f].nom.toLowerCase()).join(' et ')}</b> en
           surproduction — cours effondré, stock qui s'entasse, ateliers déficitaires en bloc :
           c'est là qu'on ramasse une filière entière pour le prix de sa terre`
        : 'aucune filière en surproduction'}.</div>` : ''}
    <div class="grille">
      <div class="fiche"><div class="etiq">Ménages</div><div class="v">${Math.round(v.menages)}</div></div>
      <div class="fiche"><div class="etiq">Logements</div>
        <div class="v">${Math.round(v.capaciteLogement || 0)}</div>
        <div class="etiq" style="margin-top:2px">${pct(v.occupation)} occupés</div></div>
      <div class="fiche"><div class="etiq">Salaire</div><div class="v">${v.salaire.toFixed(1)} $</div></div>
      <div class="fiche"><div class="etiq">Bras libres</div>
        <div class="v">${Math.round(Math.max(0, (v.bras || 0) - (v.postesDemandes || 0)))}</div></div>
    </div>

    <h3>Les trois baromètres</h3>
    ${jauge('Nourriture', b.nourriture, P.seuilsCritiques.nourriture)}
    ${jauge('Emploi', b.emploi, P.seuilsCritiques.emploi)}
    ${jauge('Produits manufacturés', b.produits, P.seuilsCritiques.produits)}
    <div class="barometre" style="margin-top:8px">
      <div class="tete"><span>Moyenne</span><span class="doux">${pct(moy)}</span></div>
      <div class="piste"><div class="jauge2" style="width:${moy * 100}%;background:var(--doux)"></div></div>
    </div>

    <h3>Le pouvoir d'achat</h3>
    <div class="grille">
      <div class="fiche"><div class="etiq">Revenu du ménage</div>
        <div class="v">${eur(revenu)}</div>
        <div class="etiq" style="margin-top:2px">2 employés · emploi ${pct(b.emploi)}</div></div>
      <div class="fiche"><div class="etiq">Panier</div>
        <div class="v doux">${eur(panier)}</div>
        <div class="etiq" style="margin-top:2px">ration + produit + loyer</div></div>
      <div class="fiche"><div class="etiq">Pouvoir d'achat</div>
        <div class="v" style="color:${rgb(echelle(echelleAisance(ais)))}">${(ais * 100).toFixed(0)} %</div>
        <div class="etiq" style="margin-top:2px">borné à ${(P.aisanceMin*100).toFixed(0)}–${(P.aisanceMax*100).toFixed(0)} %</div></div>
    </div>

    <div class="barometre" style="margin-top:10px">
      <div class="tete"><span><b>Attractivité</b> — pivot à ${pct(P.pivot)}</span>
        <span class="or"><b>${pct(a)}</b></span></div>
      <div class="piste"><div class="jauge2" style="width:${Math.min(100, a * 100)}%;background:var(--or)"></div></div>
    </div>
    <div class="note">${pct(moy)} de baromètres × ${(ais * 100).toFixed(0)} % de pouvoir d'achat
      = <b>${pct(a)}</b>. ${v.enCrise
        ? '<span class="rouge">Un seuil critique est franchi : la ville se vide de 5 % par mois, quels que soient les autres chiffres.</span>'
        : a > P.pivot
          ? 'Au-dessus du pivot : la ville tire des habitants du dehors.'
          : 'Sous le pivot : elle en perd.'}</div>
    <div class="note">${palier}</div>
  `;
}

// --- Marché -----------------------------------------------------------------

// Le cours d'une marchandise, en courbe.
//
// Un instantané ne dit rien : un cours à 0,85 peut être une filière qui
// s'effondre ou une pénurie qui se résorbe, et les deux appellent des décisions
// opposées. La courbe tranche d'un coup d'œil.
function graphiqueCours(h, couleur) {
  if (!h || h.length < 2) {
    return '<div class="note">Pas encore assez de mois pour tracer une courbe.</div>';
  }
  const L = 300, H = 96, marge = 4;
  const bas = Math.min(0.9, Math.min(...h)), haut = Math.max(1.1, Math.max(...h));
  const y = (v) => marge + (haut - v) / (haut - bas) * (H - 2 * marge);
  const x = (i) => i / (h.length - 1) * L;
  const trace = h.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const aire = `${trace} L${L},${H} L0,${H} Z`;
  const dernier = h[h.length - 1];

  return `<svg viewBox="0 0 ${L} ${H}" class="cours" preserveAspectRatio="none">
      <line x1="0" y1="${y(1).toFixed(1)}" x2="${L}" y2="${y(1).toFixed(1)}"
            stroke="rgba(224,177,85,.45)" stroke-width="1" stroke-dasharray="4 4"/>
      <path d="${aire}" fill="${couleur}" opacity=".14"/>
      <path d="${trace}" fill="none" stroke="${couleur}" stroke-width="2"
            stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="legendeCours">
      <span>${h.length} mois</span>
      <span class="doux">bas ${bas.toFixed(2)}× · haut ${haut.toFixed(2)}×</span>
      <span class="or">aujourd'hui ${dernier.toFixed(2)}×</span>
    </div>
    <div class="note">Le trait doré est le <b>prix de référence</b> — celui qui s'établit
      quand la demande égale l'offre. Sous ce trait, la filière produit plus que le marché
      n'absorbe : le stock s'entasse et les ateliers perdent de l'argent, tous à la fois.</div>`;
}

// Qui se nourrit de sa propre production, et qui dépend de ses voisines.
//
// Un marché fusionné n'est pas un entrepôt unique : ce qu'une ville produit
// alimente d'abord ses propres besoins, et seul le surplus s'exporte. Le taux
// global du marché ne dit donc plus rien de ce que vit chaque ville, et sans ce
// détail le joueur ne peut pas voir laquelle est fournisseuse et laquelle est
// dépendante — c'est pourtant la lecture qui décide où bâtir.
function detailLocal(m, r) {
  if (m.villes.length < 2) return '';
  const lignes = [];
  for (const [v, l] of m.parVille) {
    if (l.besoins[r] <= 0.001 && l.entrees[r] <= 0.001) continue;
    const couvert = l.besoins[r] > 0.001 ? Math.min(1, l.entrees[r] / l.besoins[r]) : 1;
    const excedent = l.entrees[r] - l.besoins[r];
    lignes.push(`<div class="ligneLocale">
      <span>${v.nom}</span>
      <span class="${couvert >= 0.999 ? 'vert' : couvert < 0.6 ? 'rouge' : 'doux'}">${
        couvert >= 0.999
          ? `autosuffisante · +${Math.round(excedent).toLocaleString('fr-FR')} exportés`
          : `${pct(couvert)} de ses besoins · importe ${Math.round(-excedent).toLocaleString('fr-FR')}`}</span>
    </div>`);
  }
  if (!lignes.length) return '';
  return `<div class="detailLocal">${lignes.join('')}</div>`;
}

export function voletMarche(monde, rendu) {
  const ouvert = rendu.coursOuvert || null;

  return monde.marches.map(m => {
    const cartes = RESSOURCES.map(r => {
      const i = m.indice(r);
      const servi = m.service[r] === undefined ? 1 : m.service[r];
      const stock = m.stock[r] || 0;
      // La jauge dit ce qu'on peut OBTENIR : rouge, la marchandise manque et les
      // ateliers s'arrêtent ; vert, on en trouve autant qu'on en demande.
      const teinte = rgb(echelle(servi));
      const classePrix = i > 1.35 ? 'rouge' : i < 0.85 ? 'vert' : 'doux';
      // Le stock se lit en mois de consommation : c'est la seule échelle qui ait
      // un sens d'une marchandise à l'autre, entre un charbon qui se compte par
      // dizaines de milliers et une viande qui se compte par dizaines. Engorgé
      // veut dire au-dessus du matelas que le marché cherche à tenir (§4.2 bis)
      // — donc au-dessus de ce qui va commencer à s'abîmer.
      const matelas = m.matelasVise(r);
      const mois = m.besoins[r] > 1 ? stock / m.besoins[r] : null;
      const engorge = stock > matelas;

      return `<div class="carteRes ${ouvert === r ? 'actif' : ''}" data-cours="${r}">
        <div class="tetRes">
          <span><span class="puce" style="background:${RES[r].couleur}"></span>${RES[r].nom}</span>
          <span class="prixRes ${classePrix}">${m.prix[r].toFixed(2)} $
            <span class="etiq" style="display:block;text-align:right">${i.toFixed(2)} × réf.</span></span>
        </div>
        <div class="miniPiste" style="margin:5px 0 4px">
          <div style="width:${(servi * 100).toFixed(0)}%;background:${teinte}"></div>
        </div>
        <div class="piedRes">
          <span>stock <b>${Math.round(stock).toLocaleString('fr-FR')}</b>${
            mois === null ? '' : ` · ${mois.toFixed(1)} mois`}</span>
          <span class="${servi < 0.95 ? 'rouge' : 'doux'}">${pct(servi)} servi</span>
          ${engorge ? '<span class="vert">engorgé</span>' : ''}
        </div>
        ${detailLocal(m, r)}
        ${ouvert === r ? graphiqueCours(m.histoPrix[r], RES[r].couleur)
            + `<div class="actions" style="margin-top:6px">
                 <button data-prix="${r}">Voir sur la carte</button>
               </div>` : ''}
      </div>`;
    }).join('');

    return `<h3>${m.nom}${m.villes.length > 1 ? ' — marché fusionné' : ''}</h3>
      <div class="listeRes">${cartes}</div>`;
  }).join('') + `
    <div class="note">
      Touchez une marchandise pour <b>ouvrir sa courbe</b>, et le bouton pour la voir ville
      par ville sur la carte.<br><br>
      La jauge dit ce qu'on peut <b>obtenir</b> : rouge, la marchandise manque et les ateliers
      s'arrêtent au premier accroc ; vert, on en trouve autant qu'on en demande. Le prix suit
      les <b>flux</b> : il monte quand les besoins du mois dépassent ce qui entre sur le marché.
      Le marché cherche en plus à garder <b>un mois de consommation en cave</b> — c'est le chiffre
      en mois à côté du stock. Ce qui lui manque pour l'atteindre, il l'achète et fait monter le
      cours ; ce qu'il garde au-dessus est marqué <b>engorgé</b>, cesse d'être acheté et
      commence à s'abîmer.
    </div>`;
}

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
          <td class="n">${eur(s.batiments.reduce((a, b) => a + b.valeurDeCession, 0))}</td></tr>
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

// ---------------------------------------------------------------------------
// La bourse.
//
// Le PER n'est pas un réglage : c'est un prix, formé comme tous les autres par
// une tension entre une demande — les capitaux que l'épargne des ménages dirige
// vers le marché — et une offre : les bénéfices qu'on peut acheter. C'est de là
// que vient le cycle, sans qu'aucun « climat » n'ait à être piloté.
// ---------------------------------------------------------------------------

export function voletBourse(monde, rendu) {
  const per = monde.per;
  const ouvert = rendu.coursOuvert || null;

  const tension = monde.tensionBourse || 1;
  const chaud = tension > 1.3, froid = tension < 0.7;

  const entete = `
    <div class="grille">
      <div class="fiche"><div class="etiq">PER du marché</div>
        <div class="v or">${per.toFixed(1)}</div>
        <div class="etiq" style="margin-top:2px">référence ${P.perReference}</div></div>
      <div class="fiche"><div class="etiq">Capitaux placés</div>
        <div class="v">${eur(monde.capitauxBourse || 0)}</div>
        <div class="etiq" style="margin-top:2px">par mois</div></div>
      <div class="fiche"><div class="etiq">Bénéfices cotés</div>
        <div class="v doux">${eur(monde.beneficesCotes || 0)}</div>
        <div class="etiq" style="margin-top:2px">par an</div></div>
    </div>
    <div class="carteRes ${ouvert === '__per' ? 'actif' : ''}" data-cours="__per">
      <div class="tetRes"><span><b>Le multiple de marché</b>
        <span class="cv"><br>${chaud ? 'les capitaux se pressent — les cours montent plus vite que les profits'
          : froid ? 'les capitaux se retirent — les cours montent moins vite que les profits'
          : 'le marché est à sa valeur'}</span></span>
        <span class="prixRes ${chaud ? 'vert' : froid ? 'rouge' : 'doux'}">${tension.toFixed(2)}
          <span class="etiq" style="display:block;text-align:right">tension</span></span></div>
      ${ouvert === '__per' ? graphiqueCours(monde.histoPER.map(x => x / P.perReference), '#e0b155')
        + `<div class="note">La courbe est rapportée au PER de référence (${P.perReference}).
             Elle monte quand l'épargne des ménages afflue plus vite que les bénéfices — c'est
             le haut de cycle — et retombe quand l'économie rentre.</div>` : ''}
    </div>`;

  const societes = monde.societes.map(s => {
    const cours = s.cours(per), cap = cours * s.actions;
    const part = s.partDe(s === monde.joueur ? s.id + ':fondateur' : '__');
    const b = s.profitAnnuel;
    return `<div class="carteRes ${ouvert === 'S' + s.id ? 'actif' : ''}" data-cours="S${s.id}">
      <div class="tetRes">
        <span><b>${s.nom}</b>${s === monde.joueur ? ' <span class="or">— vous</span>' : ''}
          <span class="cv"><br>${s.batiments.length} bâtiments · actif net ${eur(s.actifNet())}</span></span>
        <span class="prixRes">${cours.toFixed(2)} $
          <span class="etiq" style="display:block;text-align:right">l'action</span></span>
      </div>
      <div class="piedRes">
        <span>capitalisation <b>${eur(cap)}</b></span>
        <span class="${b >= 0 ? 'vert' : 'rouge'}">bénéfice ${eur(b)}/an</span>
        ${s === monde.joueur ? `<span class="or">vos ${pct(P.partFondateur)} : ${eur(cap * P.partFondateur)}</span>` : ''}
      </div>
      ${ouvert === 'S' + s.id ? graphiqueCours(s.histoCours.map(x => x / Math.max(0.01, s.histoCours[0])), '#e0b155') : ''}
    </div>`;
  }).join('');

  // Une seule compagnie de chemin de fer, qui pose ses lignes l'une après
  // l'autre. Sa carte dit ce qu'elle exploite déjà et ce qu'elle creuse.
  const co = monde.compagnie;
  const chantier = monde.chantierRail;
  const mien = co.parts[monde.joueur.id] || 0;
  const partPct = co.actions > 0 ? mien / co.actions : 0;
  const cours = monde.coursRail();
  const benef = monde.beneficeAnnuelRail();
  const reste = chantier && chantier.date !== null ? chantier.date - monde.mois : null;

  const enTravaux = !chantier ? `
      <div class="piedRes"><span class="doux">réseau achevé — plus rien à poser</span></div>`
    : chantier.date === null ? `
      <div class="piedRes"><span class="doux">prochain chantier : ${chantier.nom}</span></div>`
    : `
      <div class="piedRes">
        <span>chantier <b>${chantier.nom}</b></span>
        <span class="or">ouverture dans ${Math.max(0, reste)} mois</span>
      </div>
      <div class="actions" style="margin-top:6px">
        <button class="miniInvest">Souscrire 800 $</button>
      </div>`;

  const rails = `<div class="carteRes ${ouvert === 'RAIL' ? 'actif' : ''}" data-cours="RAIL">
      <div class="tetRes">
        <span><b>${co.nom}</b>
          <span class="cv"><br>${co.lignes.length} ligne${co.lignes.length > 1 ? 's' : ''} en exploitation
          · ${co.cotee ? 'cotée' : 'non cotée'}</span></span>
        <span class="prixRes">${cours.toFixed(2)} $
          <span class="etiq" style="display:block;text-align:right">l'action</span></span>
      </div>
      ${co.cotee ? `<div class="piedRes">
        <span>capitalisation <b>${eur(monde.capitalisationRail())}</b></span>
        <span class="${benef >= 0 ? 'vert' : 'rouge'}">${eur(benef)}/an</span>
        ${mien > 0 ? `<span class="or">votre part ${pct(partPct)} · ${eur(mien * cours)}</span>` : ''}
      </div>` : `<div class="piedRes">
        <span class="doux">souscrit ${eur(co.capital)}</span>
        ${mien > 0 ? `<span class="or">vous : ${eur(mien * P.prixNominalAction)}</span>` : ''}
      </div>`}
      ${enTravaux}
      ${ouvert === 'RAIL' && co.histoCours.length > 1
        ? graphiqueCours(co.histoCours.map(x => x / Math.max(0.01, co.histoCours[0])), '#8fb0c9') : ''}
    </div>`;


  return entete
    + `<h3>Les sociétés</h3><div class="listeRes">${societes}</div>`
    + `<h3>Le chemin de fer</h3><div class="listeRes">${rails}</div>`
    + `<div class="note">
        Il n'y a qu'<b>une compagnie</b>, et elle pose ses lignes l'une après l'autre. Tant
        qu'elle n'a pas ouvert sa première, elle n'est pas cotée : on y souscrit au franc le
        franc — ${eur(P.prixNominalAction)} l'action — et chaque tranche avance la date
        d'ouverture du chantier en cours. Le jour de la première ligne, le consortium extérieur
        complète le capital, la compagnie <b>entre en bourse</b> et acquiert d'un coup tout
        son goodwill.<br><br>
        Elle vit ensuite d'un péage de ${pct(P.peageRail)} sur le chiffre d'affaires du marché
        qu'elle dessert, au prorata du rail qu'elle a posé, et verse son bénéfice à ses
        porteurs. C'est la valeur de croissance du jeu : son profit monte avec les villes,
        sans que vous ayez rien à faire — mais vous souscrivez en aveugle, des années avant
        de savoir lesquelles auront grandi.
      </div>`;
}

// Le choix des deux gares. Il vit ici plutôt que dans le monde : c'est un
// état d'interface, pas un fait de simulation.
export const choixVoie = { a: null, b: null };

export function voletRail(monde) {
  const joueur = monde.joueur;
  const villes = monde.villes;
  if (choixVoie.a === null && villes.length) choixVoie.a = 0;
  if (choixVoie.b === null && villes.length > 1) choixVoie.b = 1;

  const options = (sel) => villes.map((v, i) =>
    `<option value="${i}" ${i === sel ? 'selected' : ''}>${v.nom}</option>`).join('');

  const devis = monde.devisVoie(choixVoie.a, choixVoie.b);
  const deja = devis && monde.dejaReliees(choixVoie.a, choixVoie.b);
  const assez = devis && joueur.tresorerie >= devis.cout;

  let resume;
  if (!devis) resume = '<div class="note">Choisissez deux gares différentes.</div>';
  else if (deja) resume = `<div class="note">Ces deux gares partagent déjà un marché —
    une seconde ligne n'y ajouterait rien.</div>`;
  else resume = `
    <div class="grille">
      <div class="fiche"><div class="etiq">Longueur</div>
        <div class="v">${devis.longueur}<span class="faible" style="font-size:11px"> cases</span></div></div>
      <div class="fiche"><div class="etiq">Devis</div>
        <div class="v ${assez ? '' : 'rouge'}">${eur(devis.cout)}</div></div>
      <div class="fiche"><div class="etiq">Durée annoncée</div>
        <div class="v">${devis.mois}<span class="faible" style="font-size:11px"> mois</span></div></div>
    </div>
    <div class="actions"><button id="btnVoie" class="primaire">Ouvrir le chantier</button></div>
    <div class="note">Le devis n'est pas prélevé d'avance : chaque mois le chantier présente
      sa facture et la voie avance <b>au prorata de ce qui est payé</b>. Caisse vide, il se
      suspend là où il en est et repart dès qu'il y a de quoi — rien de posé n'est perdu.</div>`;

  // Les chantiers en cours, et ce qui est déjà ouvert.
  const enCours = monde.liaisons.filter(l => l.societe && !l.achevee);
  const ouvertes = monde.liaisons.filter(l => l.achevee);

  const barre = (l) => {
    const p = Math.max(0, Math.min(1, l.pose / l.longueur));
    const teinte = l.arret ? '#b8663a' : '#5f8f6a';
    return `<div class="miniPiste" style="margin:5px 0 2px">
      <div style="width:${(100 * p).toFixed(0)}%;background:${teinte}"></div></div>
      <span class="faible">${Math.round(l.pose)} / ${l.longueur} cases ·
      ${eur(l.depense)} engagés${l.arret ? ' · <span class="rouge">suspendu, caisse vide</span>' : ''}</span>`;
  };

  const listeChantiers = enCours.length ? enCours.map(l =>
    `<div class="fiche" style="margin-bottom:6px"><div class="etiq">${l.nom}</div>${barre(l)}</div>`
  ).join('') : '<div class="note">Aucun chantier en cours.</div>';

  const listeOuvertes = ouvertes.length
    ? `<table>${ouvertes.map(l => `<tr><td>${l.nom}</td>
        <td class="n"><span class="vert">ouverte</span><br>
        <span class="faible">${l.longueur} cases</span></td></tr>`).join('')}</table>`
    : '<div class="note">Aucune ligne ouverte. Tant que rien ne relie deux gares,'
      + ' chacune vit sur son seul marché.</div>';

  return `
    <h3>Tirer une voie</h3>
    <div class="grille">
      <div class="fiche"><div class="etiq">Départ</div>
        <select id="railA" class="choix">${options(choixVoie.a)}</select></div>
      <div class="fiche"><div class="etiq">Arrivée</div>
        <select id="railB" class="choix">${options(choixVoie.b)}</select></div>
    </div>
    ${resume}
    <h3>Chantiers</h3>
    ${listeChantiers}
    <h3>Lignes ouvertes</h3>
    ${listeOuvertes}`;
}

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
    ? `<div class="avertBatir">Posez la <b>${rendu.pose === 'gare' ? 'gare fondatrice'
          : BAT[rendu.pose].nom}</b> — touchez la carte.
         Les cases possibles sont cerclées d'or.
         <button id="btnAnnulerPose">Annuler</button></div>`
    : `<div class="note">Choisissez un bâtiment, puis touchez la carte à l'endroit voulu.
         Le terrain qui vous manque est acheté dans le même geste — on ne peut prendre
         qu'une terre vierge touchant la frontière urbaine, ou celle d'un indépendant,
         jamais celle d'un rival.</div>`;

  // LA GARE EST EN TÊTE, ET À PART. Elle ne se pose pas dans une ville : elle en
  // fonde une. C'est le seul bâtiment qui s'installe hors de tout territoire, et
  // le seul dont le prix comprend une cargaison.
  const dg = devisGare();
  const gare = `<h3>Fonder</h3>
    <div class="listeBatir">
      <button class="ligneBatir ${rendu.pose === 'gare' ? 'actif' : ''}" data-batir="gare"
              ${joueur.tresorerie >= dg.cout ? '' : 'disabled'}>
        <span class="puce" style="background:#c9a227"></span>
        <span class="nomBat">Gare fondatrice</span>
        <span class="sousBat">${P.logementsGare} logements · ${P.moisDeVivres} mois de vivres</span>
        <span class="prixBat ${joueur.tresorerie >= dg.cout ? 'doux' : 'rouge'}">${eur(dg.cout)}</span>
      </button>
    </div>
    <div class="note">Une gare s'installe <b>hors de tout territoire</b> et fonde une localité.
      Elle n'apporte <b>pas d'habitants</b> — elle apporte de quoi en attirer :
      ${P.logementsGare} maisons vides, ${P.exploitationsFournies} exploitations pour donner du
      travail, et ${P.moisDeVivres} mois de vivres et de produits pour que les premiers venus y
      vivent au plein. La population arrive ensuite d'elle-même, tant que les trois baromètres
      tiennent. Passé ce délai, ou le hameau se nourrit seul, ou une voie le relie, ou il
      s'éteint.</div>`;

  return `<div class="grille">
      <div class="fiche"><div class="etiq">Trésorerie</div>
        <div class="v or">${eur(joueur.tresorerie)}</div></div>
      <div class="fiche"><div class="etiq">Devis établi à</div>
        <div class="v" style="font-size:12px">${v.nom}</div></div>
    </div>
    ${enCours}${gare}${groupes}
    <div class="note">Le prix affiché est celui des <b>matériaux au marché du jour</b> ;
      le foncier s'y ajoute selon l'endroit et vous est annoncé avant de valider. Le cash
      part immédiatement, le chantier ne sort de terre qu'à la dernière brique livrée.</div>`;
}

// --- Les événements ---------------------------------------------------------
//
// Un événement qu'on subit sans comprendre ce qu'il fait n'apprend rien. Chaque
// fiche dit donc trois choses : ce qui arrive, combien de temps cela dure, et
// par quel canal exactement cela touche l'économie du joueur.

const CANAL = {
  sol: 'Le rendement des terres — fermes, ranchs, coupes, carrières et mines '
     + 'sortent moins (ou plus) que leur ordinaire, sans que rien d\'autre ne change. '
     + 'Le prix suit, puisqu\'il suit les flux.',
  travail: 'Le régime des ateliers touchés, ramené à ' + pct(P.regimeDeGreve) + ' de la normale. '
     + 'Les ouvriers ne sont pas partis : ils sont là et ne produisent pas. La grève cesse '
     + 'd\'elle-même dès que le salaire de la ville atteint ce qu\'elle réclame.',
  finance: 'La destination de l\'épargne des ménages : ce qui achète des titres, '
     + 'ce qui bâtit, ce qui dort en banque.',
  population: 'Le nombre d\'habitants, une fois pour toutes — un afflux ne remplit '
     + 'que les logements déjà debout, et une épidémie ne rend pas ce qu\'elle a pris.',
};

function ficheEvenement(monde, e) {
  const reste = Math.max(0, e.fin - monde.mois);
  const total = Math.max(1, e.fin - e.debut);
  const avance = Math.max(0, Math.min(1, (monde.mois - e.debut) / total));
  return `
    <div class="carteEvt ${e.def.teinte}">
      <div class="tete">
        <b><span class="signe">${e.def.signe}</span> ${e.def.nom}</b>
        <span class="doux">${reste} mois</span>
      </div>
      <div class="piste"><div class="jauge2" style="width:${Math.round(100 * avance)}%"></div></div>
      <div class="texteEvt">${e.def.texte(e)}.</div>
      <div class="note">${CANAL[e.def.portee]}</div>
    </div>`;
}

export function voletEvenements(monde) {
  const actifs = monde.evenements.length
    ? monde.evenements.map(e => ficheEvenement(monde, e)).join('')
    : `<div class="note">Rien en cours. Ce qui ne durera pas : la carte connaît en moyenne
       un accident tous les ${Math.round(P.moisEntreEvenements / 12)} ans, et jamais plus de
       ${P.evenementsSimultanes} à la fois.</div>`;

  // La chronique ne garde que ce qui porte un signe d'événement : le journal
  // sert aussi aux rachats et aux mises en service.
  const signes = Object.values(EVENEMENTS).map(d => d.signe);
  const chronique = monde.journal
    .filter(l => signes.some(s => l.includes(s)))
    .slice(-14).reverse();

  return `<h3>En cours</h3>
    ${actifs}
    <div class="note">
      Un événement ne détruit rien : il déplace un curseur tant qu'il dure, puis le rend.
      Les seules pertes sèches sont celles de population — la grippe et l'immigration
      frappent une fois et ne se reprennent pas. Les ${Math.round(P.graceEvenements / 12)}
      premières années sont épargnées, le temps de bâtir de quoi encaisser.
    </div>

    <h3>Chronique</h3>
    <div class="note">${chronique.join('<br>') || 'La carte a été tranquille jusqu\'ici.'}</div>
  `;
}
