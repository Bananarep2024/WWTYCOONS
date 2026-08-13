// ---------------------------------------------------------------------------
// Orchestration : la boucle de temps, les entrées, le rafraîchissement.
//
// Un mois dure dix secondes réelles. Le joueur revient toutes les dix secondes
// pour saisir une opportunité, puis a sept secondes pour réfléchir.
// ---------------------------------------------------------------------------

import { P, BAT, materiaux } from './sim/params.js';
import { Monde } from './sim/world.js';
import { Rendu } from './ui/render.js';
import { $, eur, pct, panneauVille, panneauMarche, panneauComptes, panneauRail }
  from './ui/panneaux.js';
import { contenuFeuille, empriseDepuis } from './ui/feuille.js';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const monde = new Monde({ nbVilles: 3, duree: 60, graine: (Math.random() * 1e9) | 0 });
const cv = $('#carte');
const rendu = new Rendu(cv, monde);
rendu.iVille = 0;

let enMarche = false;
let vitesse = 1;
let horloge = 0;
let ongletPanneau = 'ville';

// --- Boucle -----------------------------------------------------------------

let precedent = performance.now();
function boucle(t) {
  const dt = Math.min(250, t - precedent);
  precedent = t;

  if (enMarche) {
    horloge += dt * vitesse;
    const duree = P.moisParSeconde * 1000;
    while (horloge >= duree) {
      horloge -= duree;
      if (!monde.tick()) { enMarche = false; finDePartie(); break; }
      rafraichirTout();
    }
  }

  rendu.dessiner();
  requestAnimationFrame(boucle);
}

// --- Affichage --------------------------------------------------------------

function rafraichirTout() {
  rafraichirBarre();
  rafraichirPanneau();
  rafraichirFeuille();
  rafraichirOngletsVilles();
}

function rafraichirBarre() {
  const s = monde.joueur;
  const an = Math.floor(monde.mois / 12) + 1;
  $('#date').textContent = `An ${an} · ${MOIS[monde.mois % 12]}`;
  $('#restant').textContent = `${monde.duree - monde.mois} mois restants`;
  $('#tresorerie').textContent = eur(s.tresorerie);

  const r = s.resultatMensuel;
  const el = $('#resultat');
  el.textContent = (r >= 0 ? '+' : '') + eur(r) + ' / mois';
  el.className = 'sous ' + (r > 0 ? 'vert' : r < 0 ? 'rouge' : 'doux');

  $('#cours').textContent = s.cours(monde.multiple).toFixed(3).replace('.', ',') + ' $';
  $('#actifnet').textContent = 'actif net ' + eur(s.actifNet(monde.multiple));
  $('#fortune').textContent = eur(s.cours(monde.multiple) * s.actions * P.partFondateur);
  $('#climat').textContent = { normal: 'Normal', euphorie: 'Euphorie', crise: 'Crise' }[monde.climat];

  const cl = monde.classement();
  const rang = cl.findIndex(x => x.societe === s) + 1;
  $('#rang').textContent = `${rang === 1 ? '1er' : rang + 'e'} sur ${cl.length}`
    + ` — multiple du marché ×${monde.multiple}`;
}

function rafraichirPanneau() {
  const v = rendu.ville;
  const p = $('#panneau');
  const haut = p.scrollTop;
  p.innerHTML =
      ongletPanneau === 'ville' ? panneauVille(monde, v)
    : ongletPanneau === 'marche' ? panneauMarche(monde, v)
    : ongletPanneau === 'comptes' ? panneauComptes(monde)
    : panneauRail(monde);
  p.scrollTop = haut;

  p.querySelectorAll('.ligneBat').forEach(tr => tr.onclick = () => {
    const b = monde.joueur.batiments.find(x => x.id === +tr.dataset.bat);
    if (!b) return;
    rendu.iVille = monde.villes.indexOf(b.ville);
    rendu.selection = b.cases[0];
    rafraichirTout();
    ouvrirFeuille();
  });

  p.querySelectorAll('.miniInvest').forEach(btn => btn.onclick = () => {
    monde.investirRail(monde.liaisons[+btn.dataset.liaison], monde.joueur, 800);
    rafraichirTout();
  });
}

function rafraichirOngletsVilles() {
  const n = $('#ongletsVilles');
  if (n.children.length !== monde.villes.length) {
    n.innerHTML = monde.villes.map((v, i) =>
      `<button data-ville="${i}" class="${i === rendu.iVille ? 'actif' : ''}"></button>`).join('');
    n.querySelectorAll('button').forEach(b => b.onclick = () => {
      rendu.iVille = +b.dataset.ville;
      rendu.selection = null;
      fermerFeuille();
      rafraichirTout();
    });
  }
  monde.villes.forEach((v, i) => {
    const b = n.children[i];
    const alerte = v.enCrise ? ' <span style="color:#c2544b">⚠</span>' : '';
    b.innerHTML = `${v.nom} <span class="faible">${Math.round(v.menages)}</span>${alerte}`;
    b.className = i === rendu.iVille ? 'actif' : '';
  });
}

// --- Feuille ----------------------------------------------------------------

function ouvrirFeuille() { $('#feuille').classList.remove('fermee'); }
function fermerFeuille() { $('#feuille').classList.add('fermee'); rendu.selection = null; }

function rafraichirFeuille() {
  if ($('#feuille').classList.contains('fermee')) return;
  const v = rendu.ville, c = rendu.selection;
  const corps = $('#feuilleCorps');
  corps.innerHTML = contenuFeuille(monde, v, c);
  brancherFeuille(v, c);
}

function brancherFeuille(v, c) {
  const joueur = monde.joueur;

  const acheter = $('#btnAcheter');
  if (acheter) acheter.onclick = () => {
    if (monde.acheterTerrain(v, c, joueur)) rafraichirTout();
  };

  document.querySelectorAll('.btnBatir').forEach(btn => btn.onclick = () => {
    const type = btn.dataset.type;
    const cases = empriseDepuis(monde, v, c, type);
    if (!cases) return;
    const ch = monde.ouvrirChantier(type, v, cases, joueur);
    if (ch) {
      // On paie les matériaux au fil des livraisons, mais le terrain part tout
      // de suite. Le chantier entre au carnet.
      rafraichirTout();
    }
  });

  const cur = $('#curseurActivite');
  if (cur && c.bat) {
    cur.oninput = () => { c.bat.activite = +cur.value / 100; };
    cur.onchange = () => rafraichirTout();
  }
  document.querySelectorAll('.preReglage').forEach(b => b.onclick = () => {
    if (c.bat) { c.bat.activite = +b.dataset.v / 100; rafraichirTout(); }
  });

  const ent = $('#btnEntrepot');
  if (ent && c.bat) ent.onclick = () => { c.bat.versEntrepot = !c.bat.versEntrepot; rafraichirTout(); };

  const dem = $('#btnDemolir');
  if (dem && c.bat) dem.onclick = () => { monde.demolir(c.bat); fermerFeuille(); rafraichirTout(); };
}

// --- Entrées ----------------------------------------------------------------

cv.addEventListener('pointerdown', (e) => {
  const r = cv.getBoundingClientRect();
  const c = rendu.caseSous(e.clientX - r.left, e.clientY - r.top);
  if (!c) return;
  rendu.selection = c;
  ouvrirFeuille();
  rafraichirFeuille();
});

$('#feuillePoignee').onclick = fermerFeuille;

$('#btnPause').onclick = () => {
  enMarche = !enMarche;
  $('#btnPause').textContent = enMarche ? '❚❚ Pause' : '▶ Reprendre';
};

document.querySelectorAll('.vit').forEach(b => b.onclick = () => {
  vitesse = +b.dataset.vitesse;
  document.querySelectorAll('.vit').forEach(x => x.classList.toggle('actif', x === b));
});

document.querySelectorAll('#modesCarte button').forEach(b => b.onclick = () => {
  rendu.mode = b.dataset.mode;
  document.querySelectorAll('#modesCarte button').forEach(x => x.classList.toggle('actif', x === b));
  legende();
});

document.querySelectorAll('#ongletsPanneau button').forEach(b => b.onclick = () => {
  ongletPanneau = b.dataset.onglet;
  document.querySelectorAll('#ongletsPanneau button')
    .forEach(x => x.classList.toggle('actif', x === b));
  rafraichirPanneau();
});

addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); $('#btnPause').click(); }
  if (e.key === 'Escape') fermerFeuille();
});

addEventListener('resize', () => { rendu.dimensionner(); legende(); });

// --- Légende ----------------------------------------------------------------

function legende() {
  const el = $('#legende');
  const m = rendu.mode;
  if (m === 'fonction') {
    el.innerHTML = `<b>Fonction</b> — pastilles d'alerte :<br>
      <div class="ligne"><i style="background:#c9863f"></i>manque de matières</div>
      <div class="ligne"><i style="background:#6f9fc9"></i>manque de bras</div>
      <div class="ligne"><i style="background:#9a6fb0"></i>locaux vacants</div>
      <div class="ligne"><i style="background:#c2544b"></i>perte financière</div>`;
  } else if (m === 'proprio') {
    el.innerHTML = '<b>Propriétaire</b><br>' + monde.societes.map(s =>
      `<div class="ligne"><i style="background:${s.couleur}"></i>${s.nom}</div>`).join('')
      + `<div class="ligne"><i style="background:#4a463a"></i>indépendants</div>
         <div class="ligne"><i style="background:#1e1c17"></i>vierge</div>
         <div style="margin-top:4px">Liseré doré : la frontière achetable.</div>`;
  } else if (m === 'terrain') {
    el.innerHTML = `<b>Prix du sol</b><br>Plus c'est doré, plus c'est cher.<br>
      Le foncier monte avec le niveau de la ville, et baisse avec la distance à la gare.`;
  } else {
    el.innerHTML = `<b>${m}</b> — qualité de 1 à 5.<br>Plus c'est vert, plus la case rend.<br>
      Un handicap de terrain ne se guérit jamais.`;
  }
}

// --- Fin de partie ----------------------------------------------------------

function finDePartie() {
  const cl = monde.classement();
  const moi = cl.findIndex(x => x.societe === monde.joueur) + 1;
  $('#finPartie').innerHTML = `<div class="boite">
    <h1>Fin de partie</h1>
    <div class="soustitre" style="color:var(--doux);margin-bottom:16px">
      Dix ans. Le cours retenu est la moyenne des douze derniers mois.</div>
    <table>${cl.map((x, i) => `<tr>
      <td>${i + 1}. <span class="puce" style="background:${x.societe.couleur}"></span>${x.societe.nom}</td>
      <td class="n ${x.societe === monde.joueur ? 'or' : ''}">${eur(x.fortune)}</td></tr>`).join('')}
    </table>
    <div class="note">Vous finissez <b>${moi === 1 ? '1er' : moi + 'e'}</b>.</div>
    <div class="actions" style="margin-top:16px">
      <button class="primaire" onclick="location.reload()">Nouvelle partie</button></div>
  </div>`;
  $('#finPartie').classList.remove('cachee');
}

// --- Départ -----------------------------------------------------------------

rendu.dimensionner();
legende();
rafraichirTout();
requestAnimationFrame(boucle);
