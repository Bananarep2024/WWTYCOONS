// ---------------------------------------------------------------------------
// La feuille d'inspection : ce qu'on voit quand on clique une case.
//
// Elle remonte du bas de l'écran, la carte restant entièrement visible
// au-dessus. Un panneau flottant masquerait plusieurs bâtiments et le joueur
// perdrait le contexte de ce qu'il inspecte. (§21)
// ---------------------------------------------------------------------------

import { P, BAT, RES, RELIEFS, QUALITES, materiaux, coutRef, prixTerrain,
         rendementVise, facteurQualite, qualiteMax, potentielTerrain }
  from '../sim/params.js';
import { estAchetable } from '../sim/mapgen.js';
import { COULEURS, echelle } from './render.js';
import { eur, pct, rgb } from './panneaux.js';

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
  const base = prixTerrain(v.niveau, c.distanceGare, qualiteMax(c));

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
    const revente = monde.prixCessionTerrain(v, c);
    actions = menuConstruire(monde, v, c)
      + `<h3>Ou s'en défaire</h3>
         <div class="actions">
           <button id="btnVendreTerrain">Vendre le terrain — ${eur(revente)}</button>
         </div>
         <div class="note">Un indépendant le reprend au prix du marché du jour, sans la
           majoration de 20 % : ce surprix est ce qu'un indépendant fait payer pour vendre
           hors de son tour, et l'on ne se le verse pas à soi-même. Acheter tôt et revendre
           quand la ville a grandi reste donc rentable — c'est le niveau de la ville qui
           fait le prix, pas la transaction.</div>`;
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
    actions = `<div class="note">Hors de portée — cette case ne touche aucun terrain vendu.
      <b>Un bâtiment n'est pas nécessaire</b> : il suffit qu'elle jouxte du sol déjà acheté,
      le vôtre comme celui d'un autre, ou une emprise de voie ferrée. La ville s'étend ainsi
      de proche en proche, et l'on avance en achetant case après case.</div>`;
  }

  return entete(`${RELIEFS[c.relief].nom} · ${c.x},${c.y}`,
                `${proprio} · ${c.quartier ? 'quartier ' + NOMS_QUARTIER[c.quartier] : ''} — à ${c.distanceGare} cases de la gare`)
    + `<div class="grille">${qualites}</div>`
    + `<div class="grille">
        <div class="fiche"><div class="etiq">Prix du sol</div><div class="v">${eur(prix)}</div></div>
        <div class="fiche"><div class="etiq">Facteur ville</div><div class="v">×${P.facteurNiveau[v.niveau - 1].toFixed(1)}</div></div>
        <div class="fiche"><div class="etiq">Facteur distance</div>
          <div class="v">×${(1 / (1 + P.attenuationDistance[v.niveau - 1] * c.distanceGare)).toFixed(2)}</div></div>
      </div>`
    + jaugePotentiel(v, c)
    + actions;
}

// La jauge de potentiel de valorisation.
//
// Le rendement d'un logement est le même partout à tout instant : le loyer est
// indexé sur le foncier, donc il s'ajuste et le taux ne bouge pas. Ce qui
// distingue le centre, c'est la PENTE — bâtir contre la gare au premier mois,
// c'est acheter un loyer qui quadruplera ; bâtir en lisière, un loyer qui
// gagnera 11 %. Sans cette jauge, rien à l'écran ne le dirait.
// `cases` est l'emprise entière quand on inspecte un bâtiment, et la seule case
// touchée quand on inspecte un terrain nu. Les sommes portent donc toujours sur
// ce que le joueur a effectivement sélectionné — un bâtiment de quatre cases
// annonçait auparavant le foncier d'une seule, celle qu'on avait touchée.
function jaugePotentiel(v, cases, bat) {
  const liste = Array.isArray(cases) ? cases : [cases];
  const somme = (niveau) => liste.reduce(
    (s, k) => s + prixTerrain(niveau, k.distanceGare, qualiteMax(k)), 0);

  const auj = somme(v.niveau);
  const bout = somme(P.facteurNiveau.length);
  const suivant = v.niveau < 5 ? somme(v.niveau + 1) : null;
  // Le potentiel est le rapport des deux sommes : il vaut le potentiel d'une
  // case quand l'emprise n'en compte qu'une, et la moyenne pondérée sinon.
  const p = auj > 0 ? bout / auj : 1;
  const t = Math.max(0, Math.min(1, (p - 1) / (P.facteurNiveau[4] - 1)));

  // Le même mouvement du sol enrichit une résidence et appauvrit un atelier :
  // le loyer suit le foncier, la recette d'un atelier n'en dépend pas.
  const quoi = liste.length > 1 ? `Le sol de ces <b>${liste.length} cases</b>` : 'Le sol de cette case';
  let dit = `${quoi} peut encore <b>${p.toFixed(2)} ×</b> sa valeur.`;
  if (bat && bat.def.cat === 'loge') {
    dit += ' Le loyer étant indexé sur le foncier, <span class="vert">votre loyer suivra</span> —'
         + ' et votre rendement montera d\'autant, puisqu\'il se calcule sur ce que vous avez payé.';
  } else if (bat) {
    dit += ' La recette d\'un atelier ne dépend pas du sol :'
         + ' <span class="rouge">seul votre prix de revient suivra</span>, donc votre rendement'
         + ' baissera. L\'industrie a intérêt à la périphérie, l\'habitation au centre.';
  } else {
    dit += ' Une résidence encaisserait cette hausse par son loyer ; un atelier ne ferait que'
         + ' la subir dans son prix de revient.';
  }

  return `<h3>Potentiel de valorisation</h3>
    <div class="miniPiste" style="margin-bottom:6px">
      <div style="width:${(t * 100).toFixed(0)}%;background:${rgb(echelle(t))}"></div>
    </div>
    <div class="grille">
      <div class="fiche"><div class="etiq">Aujourd'hui</div><div class="v">${eur(auj)}</div></div>
      ${suivant ? `<div class="fiche"><div class="etiq">${P.nomsNiveau[v.niveau]}</div>
        <div class="v doux">${eur(suivant)}</div></div>` : ''}
      <div class="fiche"><div class="etiq">Métropole</div>
        <div class="v" style="color:${rgb(echelle(t))}">${eur(bout)}</div></div>
    </div>
    <div class="note">${dit}</div>`;
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
      const emprise = empriseDepuis(monde, c, t);
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
// joueur possède déjà toutes les cases OU peut les acheter sur-le-champ.
//
// C'est la fonction du mode « Bâtir ». Exiger de posséder d'abord chaque case
// était le vrai obstacle : le joueur commence sans un pouce de terre, et rien
// dans l'interface ne lui disait qu'il fallait acheter avant de pouvoir bâtir.
// Ici on additionne le foncier manquant au devis, et `ouvrirChantier` achète le
// tout d'un seul geste.
export function empriseConstructible(monde, c, type) {
  const def = BAT[type];
  const joueur = monde.joueur;
  let meilleur = null;
  for (let dy = 0; dy < def.h; dy++) for (let dx = 0; dx < def.w; dx++) {
    const cases = [];
    let ok = true, terrain = 0, aVendre = 0;
    for (let j = 0; j < def.h && ok; j++) for (let i = 0; i < def.w && ok; i++) {
      const k = monde.caseAt(c.x - dx + i, c.y - dy + j);
      if (!k || !k.ville || k.voie || k.bat || k.chantier) { ok = false; break; }
      if (k.proprio !== joueur.id) {
        // Le reste appartient à un rival : on ne prend pas.
        if (k.proprio && k.proprio !== 'ind') { ok = false; break; }
        if (!k.proprio) aVendre++;                 // terre vierge à acquérir
        terrain += monde.prixCase(k.ville, k);
      }
      cases.push(k);
    }
    if (!ok || cases.length !== def.cases) continue;

    // La contiguïté s'apprécie sur la PARCELLE, pas sur chaque case.
    //
    // On l'exigeait case par case, et c'était intenable : sur un carré de deux
    // par deux posé au bord de la frontière, le coin opposé ne touche rien, si
    // bien que tout le placement était refusé alors que la parcelle, elle,
    // touchait la ville. Une parcelle est contiguë dès qu'UNE de ses cases
    // jouxte du sol déjà vendu — le reste vient avec, comme quand on achète un
    // terrain d'un seul tenant.
    if (aVendre > 0 && !toucheLaVille(monde, cases, joueur)) continue;

    // À forme égale, on prend l'emprise la moins chère en foncier.
    if (!meilleur || terrain < meilleur.terrain) meilleur = { cases, terrain };
  }
  return meilleur;
}

// La parcelle touche-t-elle la ville déjà lotie ? On regarde autour du bloc
// entier : du sol vendu — le sien, celui d'un indépendant, celui d'un rival —
// ou une emprise de voie ferrée. Les cases du bloc lui-même ne comptent pas.
function toucheLaVille(monde, cases, joueur) {
  const dedans = new Set(cases.map(k => k.x + ',' + k.y));
  for (const k of cases) {
    if (k.vendue || k.proprio) return true;        // une case déjà lotie suffit
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const z = monde.caseAt(k.x + dx, k.y + dy);
      if (!z || dedans.has(z.x + ',' + z.y)) continue;
      if (z.vendue || z.voie) return true;
    }
  }
  return false;
}

// Le devis complet d'un bâtiment posé ici : le foncier manquant plus les
// matériaux au prix du marché local du jour.
export function devis(monde, c, type) {
  const e = empriseConstructible(monde, c, type);
  if (!e) return null;
  const m = c.ville.marche;
  let materiel = 0;
  for (const [r, q] of Object.entries(materiaux(type))) materiel += q * m.prix[r];
  return { cases: e.cases, terrain: e.terrain, materiel, total: e.terrain + materiel };
}

// L'ancienne version, qui exige la pleine possession : c'est encore la bonne
// pour le menu qui s'ouvre sur une case qu'on détient déjà.
export function empriseDepuis(monde, c, type) {
  const def = BAT[type];
  const joueur = monde.joueur;
  for (let dy = 0; dy < def.h; dy++) for (let dx = 0; dx < def.w; dx++) {
    const cases = [];
    let ok = true;
    for (let j = 0; j < def.h && ok; j++) for (let i = 0; i < def.w && ok; i++) {
      const k = monde.caseAt(c.x - dx + i, c.y - dy + j);
      if (!k || k.voie || k.bat || k.chantier || k.proprio !== joueur.id) {
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

// --- La ville vue depuis un logement ----------------------------------------
//
// Un immeuble ne vaut que par le pouvoir d'achat de ceux qui l'habitent. Le
// loyer suit le foncier, l'occupation suit la population, et la population suit
// les trois baromètres. Ces chiffres-là ne sont donc pas du décor : ce sont les
// variables dont dépend directement le revenu du propriétaire.
function jauge(etiquette, valeur, texte, inverse = false) {
  const t = inverse ? 1 - valeur : valeur;
  const couleur = rgb(echelle(Math.max(0, Math.min(1, t))));
  return `<div class="fiche"><div class="etiq">${etiquette}</div>
    <div class="v" style="color:${couleur}">${texte}</div>
    <div style="margin-top:5px;height:5px;border-radius:3px;background:rgba(255,255,255,.10);overflow:hidden">
      <div style="height:100%;width:${(Math.max(0, Math.min(1, valeur)) * 100).toFixed(0)}%;background:${couleur}"></div>
    </div></div>`;
}

function ficheVilleDepuisLogement(v) {
  const b = v.barometres;
  const chomage = 1 - b.emploi;
  const epargne = v.tauxEpargne === undefined ? 0 : v.tauxEpargne;

  return `<h3>La ville, vue d'ici</h3>
    <div class="grille">
      ${jauge('Chômage', chomage, pct(chomage), true)}
      ${jauge('Nourriture', b.nourriture, pct(b.nourriture))}
      ${jauge('Produits manufacturés', b.produits, pct(b.produits))}
    </div>
    <div class="grille">
      <div class="fiche"><div class="etiq">Salaire de case</div>
        <div class="v">${v.salaire.toFixed(2)} $</div>
        <div class="etiq" style="margin-top:2px">barème ${P.salaireCase} $</div></div>
      <div class="fiche"><div class="etiq">Revenu du ménage</div>
        <div class="v doux">${eur(v.revenuMenage || 0)}</div>
        <div class="etiq" style="margin-top:2px">2 employés, emploi compris</div></div>
      ${jauge('Taux d\'épargne', epargne, pct(epargne))}
    </div>
    <div class="note">Le ménage paie d'abord sa nourriture et son loyer ; c'est l'achat de
      produits manufacturés qui encaisse tout le chômage. Ce qui reste après le panier ne
      dort pas : il bâtit la ville, et ce sont ces chantiers-là que l'on rachète.</div>`;
}

function ficheBatiment(monde, b, c) {
  const def = b.def, m = b.ville.marche;
  const joueur = monde.joueur;
  const aMoi = b.societe === joueur;
  const independant = !b.societe;
  const proprio = independant ? 'Propriétaire indépendant' : b.societe.nom;

  const rdt = b.rendement;
  const vise = rendementVise(b.type);
  const seuil = b.seuilActivite(m);
  // Un logement ne « tourne » pas : il se remplit. Ce que le reste du jeu
  // appelle taux d'activité est ici le TAUX D'OCCUPATION, et c'est celui de la
  // ville entière — tous les propriétaires le partagent, personne ne remplit ses
  // murs avant ceux du voisin.
  const loge = def.cat === 'loge';

  // --- Ce qu'il rapporte ---------------------------------------------------
  const exploitation = `
    <div class="grille">
      <div class="fiche"><div class="etiq">Rentabilité</div>
        <div class="v" style="color:${rgb(echelle(b.tenue()))}">${(rdt * 100).toFixed(1)} %</div>
        <div class="etiq" style="margin-top:2px">visé ${(vise * 100).toFixed(0)} %</div></div>
      <div class="fiche"><div class="etiq">Résultat du mois</div>
        <div class="v ${b.resultat >= 0 ? 'vert' : 'rouge'}">${eur(b.resultat)}</div></div>
      <div class="fiche"><div class="etiq">Profit sur 12 mois</div>
        <div class="v ${b.profitAnnuel >= 0 ? 'vert' : 'rouge'}">${eur(b.profitAnnuel)}</div></div>
      ${loge
        ? `<div class="fiche"><div class="etiq">Occupation</div>
             <div class="v" style="color:${rgb(echelle(b.tauxReel))}">${pct(b.tauxReel)}</div>
             <div class="etiq" style="margin-top:2px">${b.vacantePenurie ? 'vacant' : 'de la ville'}</div></div>`
        : `<div class="fiche"><div class="etiq">Activité</div>
             <div class="v">${pct(b.tauxReel)}</div></div>`}
      <div class="fiche"><div class="etiq">Entretien</div>
        <div class="v doux">${b.entretien.toFixed(2)} $</div></div>
      <div class="fiche"><div class="etiq">Valeur</div>
        <div class="v">${eur(b.valeurDeCession)}</div></div>
      <div class="fiche"><div class="etiq">Prix de revient</div>
        <div class="v doux">${eur(b.prixDeRevient)}</div></div>
    </div>
    <div class="note">${loge ? `L'occupation est celle de la ville entière : tous les
      logements se remplissent au même taux, personne n'a la priorité sur son voisin.
      ${Math.round(b.ville.menages)} ménages pour ${Math.round(b.ville.capaciteLogement || 0)}
      logements.<br><br>` : ''}La rentabilité se mesure sur le prix de revient — terrain et matériaux
      au prix du jour — et se compare au rendement que le barème assigne à son palier.
      ${rdt >= vise ? '<span class="vert">Ce bâtiment tient sa promesse.</span>'
        : rdt <= 0 ? '<span class="rouge">Il ne rapporte rien.</span>'
        : `<span class="doux">Il en tient ${Math.round(b.tenue() * 100)} %.</span>`}</div>`;

  // --- Ce qu'il consomme, et ce qui lui manque -----------------------------
  let intrants = '';
  const liste = b.intrants();
  if (liste.length) {
    intrants = `<h3>Ce qu'il consomme</h3><table>
      <tr><th>Intrant</th><th class="n">Reçu / demandé</th><th class="n">Prix</th></tr>
      ${liste.map(i => {
        const manque = i.part < 0.97;
        return `<tr>
          <td><span class="puce" style="background:${RES[i.res].couleur}"></span>${RES[i.res].nom}</td>
          <td class="n ${manque ? 'rouge' : 'vert'}">${Math.round(i.recu)} / ${Math.round(i.demande)}
            ${manque ? ` <b>· il manque ${Math.round(i.demande - i.recu)}</b>` : ' ✓'}</td>
          <td class="n doux">${m.prix[i.res].toFixed(2)} $</td>
        </tr>`;
      }).join('')}
    </table>`;
    const pire = liste.slice().sort((a, x) => a.part - x.part)[0];
    if (pire.part < 0.97) {
      intrants += `<div class="avert">Rationné sur ${RES[pire.res].nom.toLowerCase()} :
        il ne tourne qu'à ${pct(b.tauxReel)}. On ne scie pas du bois qu'on n'a pas — c'est
        la loi du minimum, et elle ne se contourne qu'en amont.</div>`;
    }
  }

  // --- Ce qu'il produit ----------------------------------------------------
  let production = '';
  if (def.sort) {
    production = `<h3>Ce qu'il produit</h3>
      <div class="grille">
        <div class="fiche"><div class="etiq">${RES[def.sort].nom} par mois</div>
          <div class="v">${b.production.toFixed(0)}
            <span class="faible" style="font-size:11px"> / ${b.capacite.toFixed(0)}</span></div></div>
        <div class="fiche"><div class="etiq">Prix de vente</div>
          <div class="v">${m.prix[def.sort].toFixed(2)} $</div></div>
        <div class="fiche"><div class="etiq">Marge par unité</div>
          <div class="v ${b.margeUnitaire > 0 ? 'vert' : 'rouge'}">${b.margeUnitaire.toFixed(2)} $</div></div>
        <div class="fiche"><div class="etiq">Seuil d'activité</div>
          <div class="v ${seuil > 0.6 ? 'rouge' : 'doux'}">${isFinite(seuil) ? pct(seuil) : 'hors d\'atteinte'}</div></div>
      </div>`;
  }

  // Un logement : ce qui décide de son loyer et de son occupation, c'est l'état
  // de la ville, pas ce qui se passe entre ses murs.
  const ville = def.cat === 'loge' ? ficheVilleDepuisLogement(b.ville) : '';

  // --- Le terrain sous le bâtiment ----------------------------------------
  // Ce qu'il y a sous les fondations décide de ce que vaut le bâtiment autant
  // que ce qu'il produit : le terrain est la moitié du coût d'une maison, et la
  // qualité du sol commande le rendement de toute exploitation.
  const qMoy = {};
  for (const q of QUALITES) {
    qMoy[q] = b.cases.reduce((s, k) => s + k.q[q], 0) / b.cases.length;
  }
  const sol = `<h3>Le terrain — ${b.cases.length} case${b.cases.length > 1 ? 's' : ''}</h3>
    <div class="grille">
      ${QUALITES.map(q => {
        const n = qMoy[q];
        const vise = def.qual === q;
        return `<div class="fiche" ${vise ? 'style="border-color:var(--or)"' : ''}>
          <div class="etiq">${NOMS_QUALITE[q]}${vise ? ' ★' : ''}</div>
          <div class="v ${n >= 3.5 ? 'vert' : n <= 2.2 ? 'rouge' : 'doux'}">${n.toFixed(1)}
            <span class="faible" style="font-size:11px"> / 5</span></div></div>`;
      }).join('')}
    </div>
    <div class="grille">
      <div class="fiche"><div class="etiq">Prix du sol</div>
        <div class="v">${eur(b.terrainCourant)}</div></div>
      <div class="fiche"><div class="etiq">Payé à l'achat</div>
        <div class="v doux">${eur(b.terrain)}</div></div>
      <div class="fiche"><div class="etiq">Distance à la gare</div>
        <div class="v doux">${b.cases[0].distanceGare}</div></div>
      <div class="fiche"><div class="etiq">Quartier</div>
        <div class="v doux" style="font-size:12px">${NOMS_QUARTIER[b.cases[0].quartier] || '—'}</div></div>
    </div>
    ${jaugePotentiel(b.ville, b.cases, b)}
    ${def.qual ? `<div class="note">Sol de qualité <b>${b.qualite.toFixed(1)} / 5</b> : cette
      exploitation sort ${facteurQualite(b.qualite).toFixed(2)}× ce que sortirait la même sur une terre
      moyenne. Un handicap de terrain ne fait aucun bruit — il se lit uniquement dans la
      marge, et il ne se guérit jamais.</div>` : ''}`;

  // --- Ce qu'on peut en faire ---------------------------------------------
  let actions = '';

  if (aMoi) {
    if (def.sort) {
      actions += `
        <h3>Curseur d'activité — ${Math.round(b.activite * 100)} %</h3>
        <input type="range" id="curseurActivite" min="0" max="100" value="${Math.round(b.activite * 100)}">
        <div class="actions" style="margin-top:6px">
          <button class="preReglage" data-v="0">Sommeil</button>
          <button class="preReglage" data-v="50">50 %</button>
          <button class="preReglage" data-v="100">100 %</button>
          ${joueur.entrepotDans(b.ville)
            ? `<button id="btnEntrepot">${b.versEntrepot ? '↺ Vendre au marché' : '⇥ Vers l\'entrepôt'}</button>` : ''}
        </div>
        <div class="note">Curseur à zéro : plus de matières achetées, plus de salaires versés.
        Le bâtiment reste debout moyennant un entretien réduit à 10 % de sa masse salariale.</div>`;
    }
    const cession = monde.prixDeCession(b);
    const terrain = b.terrainCourant;
    actions += `<h3>S'en défaire</h3>
      <div class="actions">
        <button class="primaire" id="btnVendre">Vendre — ${eur(cession)}</button>
        <button id="btnDemolir">Démolir</button>
      </div>
      <div class="note"><b>Vendre</b> : un indépendant le reprend au prix que dit son compte
        d'exploitation — ${eur(terrain)} de terrain${b.profitAnnuel > 0
          ? ` + ${eur(P.anneesDeProfit * b.profitAnnuel)} de ${P.anneesDeProfit} années de profit`
          : ''}. C'est exactement le prix auquel vous l'auriez racheté : on n'achète pas cher
        pour revendre bon marché.
        ${b.profitAnnuel <= 0
          ? ' Elle ne gagne rien : vous n\'en tirerez que la valeur du sol.'
          : ''}</div>
      <div class="note"><b>Démolir</b> : vous conservez le terrain, ne récupérez aucun
        matériau, et la case est libre le mois suivant. À préférer quand c'est la PLACE que
        vous voulez, et non l'argent.</div>`;

  } else if (independant) {
    // Un indépendant vend à qui le demande — au prix de son compte d'exploitation.
    const prix = monde.prixRachatIndependant(b);
    const terrain = b.terrainCourant;
    const peut = joueur.tresorerie >= prix;
    const troisAns = Math.max(0, P.anneesDeProfit * b.profitAnnuel);
    actions = `<h3>L'acquérir</h3>
      <div class="actions">
        <button class="primaire" id="btnRacheter" ${peut ? '' : 'disabled'}>
          Racheter — ${eur(prix)}</button>
      </div>
      <table style="margin-top:8px">
        <tr><td>Terrain, au cours du jour</td><td class="n">${eur(terrain)}</td></tr>
        <tr><td>${P.anneesDeProfit} années de profit
          <span class="faible">(12 derniers mois : ${eur(b.profitAnnuel)}/an)</span></td>
          <td class="n ${troisAns > 0 ? 'vert' : 'doux'}">${troisAns > 0 ? '+' + eur(troisAns) : '—'}</td></tr>
        <tr><td><b>Prix</b></td><td class="n"><b>${eur(prix)}</b></td></tr>
      </table>
      <div class="note">Un indépendant vend à qui le demande. On n'achète pas une promesse,
      on achète un compte d'exploitation. Une affaire qui ne gagne rien se paie
      <b>au prix de sa terre</b>, ni plus ni moins : le bâtiment vient pour rien, à charge
      de le redresser. Le sol, lui, vaut toujours ce qu'il vaut — sans quoi il suffirait
      de racheter, de démolir et de revendre le terrain pour fabriquer de l'argent.</div>
      ${peut ? '' : '<div class="avert">Trésorerie insuffisante.</div>'}`;

  } else {
    // Une offre sur le bien d'un rival : un curseur, une réponse en un clic.
    const possible = monde.offrePossible(b, joueur);
    const rentable = b.profitAnnuel > 0;
    actions = `<h3>Faire une offre à ${b.societe.nom}</h3>`;
    if (!possible) {
      actions += `<div class="note">Vous avez déjà fait une offre à cette société ce mois-ci.
        Une seule par mois et par adversaire : cela interdit le harcèlement et, surtout, cela
        force à choisir le bâtiment qui compte vraiment.</div>`;
    } else {
      actions += `
        <input type="range" id="curseurOffre" min="5" max="15" step="1" value="10">
        <div class="actions" style="margin-top:6px">
          <button class="primaire" id="btnOffre">Offrir <span id="montantOffre">—</span></button>
        </div>
        <div class="note" id="lectureOffre"></div>
        <div class="note">
          ${rentable
            ? `Le curseur va de 5 à 15 fois le profit des douze derniers mois. Le marché paie
               <b>×${monde.multiple}</b> en ce moment : offrir moins est une insulte, offrir
               plus est un prix de dépossession — rationnel seulement pour un bâtiment
               stratégique.`
            : `Ce bâtiment ne gagne rien : l'offre porte sur son plancher — terrain et
               matériaux — de 80 % à 120 %.`}
        </div>`;
    }
  }

  return entete(def.nom,
      `${proprio} · ${b.ville.nom}`
      + (b.alerte ? ` · <span class="rouge">⚠ ${TEXTE_ALERTE[b.alerte]}</span>` : ''))
    + exploitation + ville + production + intrants + sol + actions;
}
