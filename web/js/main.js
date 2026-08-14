// ---------------------------------------------------------------------------
// Orchestration : la boucle de temps, les entrées, le rafraîchissement.
//
// Un mois dure dix secondes réelles. Le joueur revient toutes les dix secondes
// pour saisir une opportunité, puis a sept secondes pour réfléchir.
// ---------------------------------------------------------------------------

import { P, RES, BAT } from './sim/params.js';
import { Monde } from './sim/world.js';
import { Rendu, FILTRES_CASE, FILTRES_VILLE } from './ui/render.js';
import { $, eur, pct, voletFiltres, voletVilles, voletMarche, voletSociete, voletRail,
         voletBatir, voletBourse, voletEvenements }
  from './ui/panneaux.js';
import { contenuFeuille, empriseDepuis, empriseConstructible, devis }
  from './ui/feuille.js';

const MOIS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
              'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Pas de durée : la partie court tant que le joueur la fait courir.
const monde = new Monde({ nbVilles: 5, graine: (Math.random() * 1e9) | 0 });
const cv = $('#carte');
const rendu = new Rendu(cv, monde);

let enMarche = false, vitesse = 1, horloge = 0;
let vueVolet = null;                 // 'filtres' | 'villes' | 'marche' | 'societe' | 'rail'

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
      monde.tick();
      rendu.rafraichirIndex();
      rafraichirTout();
    }
  }

  rendu.dessiner();
  requestAnimationFrame(boucle);
}

// --- Affichage --------------------------------------------------------------

function rafraichirTout() {
  rafraichirBarre(); rafraichirEvenements(); rafraichirVolet(); rafraichirFeuille();
}

// Les événements en cours, rappelés en permanence sous la barre. On ne les
// dessine que lorsqu'ils changent : reconstruire la rangée à chaque mois ferait
// clignoter les pastilles sous le doigt.
let signatureEvts = '';

function rafraichirEvenements() {
  const b = $('#bandeauEvenements');
  const sig = monde.evenements.map(e => `${e.type}${e.ville ? e.ville.nom : ''}${e.fin}`).join('|')
    + '#' + monde.mois;
  if (sig === signatureEvts) return;
  signatureEvts = sig;

  document.body.classList.toggle('aEvenements', monde.evenements.length > 0);
  if (!monde.evenements.length) { b.classList.add('cachee'); b.innerHTML = ''; return; }

  b.classList.remove('cachee');
  b.innerHTML = monde.evenements.map(e => {
    const reste = Math.max(0, e.fin - monde.mois);
    const ou = e.ville ? ` · ${e.ville.nom}` : '';
    return `<button class="pastilleEvt ${e.def.teinte}">`
      + `<span class="signe">${e.def.signe}</span>`
      + `<span>${e.def.nom}${ou}</span>`
      + `<span class="reste">${reste} mois</span></button>`;
  }).join('');
  b.querySelectorAll('.pastilleEvt').forEach(p => p.onclick = () => ouvrirVolet('evenements'));
}

function rafraichirBarre() {
  const s = monde.joueur;
  $('#date').textContent = `An ${Math.floor(monde.mois / 12) + 1} · ${MOIS[monde.mois % 12]}`;
  // Sans date butoir, ce qui compte n'est plus le temps qui reste mais la
  // valeur qu'on a bâtie. On affiche donc le rang.
  const clst = monde.classement();
  const rg = clst.findIndex(x => x.societe === s) + 1;
  $('#restant').textContent = `${rg === 1 ? '1er' : rg + 'e'} sur ${clst.length}`;
  $('#tresorerie').textContent = eur(s.tresorerie);

  const r = s.resultatMensuel;
  const el = $('#resultat');
  el.textContent = (r >= 0 ? '+' : '') + eur(r);
  el.className = 'sous ' + (r > 0 ? 'vert' : r < 0 ? 'rouge' : 'doux');

  $('#fortune').textContent = eur(s.cours(monde.multiple) * s.actions * P.partFondateur);
  $('#rang').textContent = `cours ${s.cours(monde.multiple).toFixed(2).replace('.', ',')} $`;
}

// --- Volet ------------------------------------------------------------------

const TITRES = { filtres: 'Filtres', villes: 'Les villes', marche: 'Le marché',
                 societe: 'Ma société', rail: 'Le chemin de fer', batir: 'Bâtir',
                 bourse: 'La bourse', evenements: 'Ce qui arrive' };

function ouvrirVolet(vue) {
  vueVolet = vue;
  $('#volet').classList.remove('cachee');
  $('#voletTitre').textContent = TITRES[vue];
  document.querySelectorAll('.ico').forEach(b =>
    b.classList.toggle('actif',
      b.dataset.vue === vue || (vue === 'filtres' && b.id === 'btnFiltres')));
  rafraichirVolet();
}

function fermerVolet() {
  vueVolet = null;
  $('#volet').classList.add('cachee');
  document.querySelectorAll('.ico').forEach(b => b.classList.remove('actif'));
}

function rafraichirVolet() {
  if (!vueVolet) return;
  const corps = $('#voletCorps');
  const haut = corps.scrollTop;
  corps.innerHTML =
      vueVolet === 'filtres' ? voletFiltres(monde, rendu)
    : vueVolet === 'villes'  ? voletVilles(monde)
    : vueVolet === 'marche'  ? voletMarche(monde, rendu)
    : vueVolet === 'societe' ? voletSociete(monde)
    : vueVolet === 'batir'   ? voletBatir(monde, rendu)
    : vueVolet === 'bourse'  ? voletBourse(monde, rendu)
    : vueVolet === 'evenements' ? voletEvenements(monde)
    : voletRail(monde);
  corps.scrollTop = haut;
  brancherVolet(corps);
}

function brancherVolet(corps) {
  // Un volet peut renvoyer vers un autre : la fiche d'une ville mène à ce qui
  // lui arrive, et réciproquement.
  corps.querySelectorAll('[data-vue]').forEach(b => b.onclick = () => ouvrirVolet(b.dataset.vue));
  corps.querySelectorAll('[data-filtre]').forEach(b => b.onclick = () => {
    appliquerFiltre(b.dataset.filtre || null, null);
    rafraichirVolet();
  });
  corps.querySelectorAll('[data-prix]').forEach(b => b.onclick = (e) => {
    e.stopPropagation();               // sinon la carte se replie aussitôt
    appliquerFiltre(null, b.dataset.prix);
    rafraichirVolet();
  });
  // Toucher une marchandise déplie sa courbe ; la retoucher la replie.
  corps.querySelectorAll('[data-cours]').forEach(b => b.onclick = () => {
    rendu.coursOuvert = rendu.coursOuvert === b.dataset.cours ? null : b.dataset.cours;
    rafraichirVolet();
  });
  corps.querySelectorAll('[data-rdt]').forEach(b => b.onclick = () => {
    appliquerFiltre(null, null, b.dataset.rdt);
    rafraichirVolet();
  });
  corps.querySelectorAll('[data-ville]').forEach(b => b.onclick = () => {
    const v = monde.villes[+b.dataset.ville];
    monde.villeChoisie = v;
    rendu.cadrerVille(v);
    rafraichirVolet();
  });
  corps.querySelectorAll('.ligneBat').forEach(tr => tr.onclick = () => {
    const b = monde.joueur.batiments.find(x => x.id === +tr.dataset.bat);
    if (!b) return;
    rendu.selection = b.cases[0];
    rendu.cadrerVille(b.ville);
    fermerVolet();
    ouvrirFeuille(); rafraichirFeuille();
  });
  corps.querySelectorAll('[data-batir]').forEach(b => b.onclick = () => {
    // Re-toucher le bâtiment déjà choisi annule la pose : on ne se retrouve
    // jamais coincé dans un mode dont on ne sait pas sortir.
    const meme = rendu.pose === b.dataset.batir;
    rendu.pose = meme ? null : b.dataset.batir;
    rendu.survol = null;
    // Et le volet s'efface — sur téléphone il couvre les trois quarts de
    // l'écran, si bien que le doigt tendu vers la carte retombait sur la liste
    // et changeait de bâtiment au lieu d'en poser un. Le bandeau du haut suffit
    // à rappeler ce qu'on est en train de faire.
    if (!meme) { fermerVolet(); fermerFeuille(); }
    majBandeauPose();
    if (vueVolet) rafraichirVolet();
  });
  const annuler = corps.querySelector('#btnAnnulerPose');
  if (annuler) annuler.onclick = () => {
    rendu.pose = null; rendu.survol = null; majBandeauPose(); rafraichirVolet();
  };

  corps.querySelectorAll('.miniInvest').forEach(btn => btn.onclick = () => {
    monde.investirRail(monde.liaisons[+btn.dataset.liaison], monde.joueur, 800);
    rafraichirTout();
  });
}

// Le bandeau rappelle en permanence qu'on regarde une donnée et non la carte :
// sans lui, on oublie le filtre actif et on lit des couleurs qui ne sont pas
// celles des bâtiments.
function appliquerFiltre(nom, prix, rdt) {
  rendu.choisirFiltre(nom, prix, rdt);
  const b = $('#bandeauFiltre');
  if (!nom && !prix && !rdt) { b.classList.add('cachee'); return; }
  b.classList.remove('cachee');
  $('#bandeauNom').textContent =
      rdt ? (rdt === 'tous' ? 'Rentabilité — tous' : `Rentabilité — ${BAT[rdt].nom}`)
    : prix ? `Prix — ${RES[prix].nom}`
    : nom === 'proprio' ? 'Mes possessions'
    : (FILTRES_CASE[nom] || FILTRES_VILLE[nom]).nom;
  // L'échelle porte enfin ses deux bouts. Un dégradé rouge → vert sans légende
  // se lit « vert = beaucoup », ce qui est vrai pour la fertilité et faux pour
  // le prix du sol, où le vert dit « bon marché ».
  const f = rdt ? null : prix ? null : (FILTRES_CASE[nom] || FILTRES_VILLE[nom]);
  const bornes = rdt ? ['à l\'arrêt', 'au rendement visé']
    : prix ? ['cher · ×2 la référence', 'bon marché · ×0,5']
    : f && f.bornes ? f.bornes : null;
  const mesure = $('#bandeauMesure');
  mesure.style.display = nom === 'proprio' ? 'none' : '';
  $('#bandeauBas').textContent  = bornes ? bornes[0] : '';
  $('#bandeauHaut').textContent = bornes ? bornes[1] : '';
}

// Le bandeau du haut sert aussi de rappel de mode : on ne doit jamais pouvoir
// toucher la carte sans savoir ce qui va s'y passer.
function majBandeauPose() {
  const b = $('#bandeauFiltre');
  $('#btnQuitterFiltre').textContent = 'Voir les bâtiments';
  if (!rendu.pose) {
    if (!rendu.filtre && !rendu.filtrePrix && !rendu.filtreRdt) b.classList.add('cachee');
    else appliquerFiltre(rendu.filtre, rendu.filtrePrix, rendu.filtreRdt);
    return;
  }
  b.classList.remove('cachee');
  $('#bandeauNom').textContent = `Poser — ${BAT[rendu.pose].nom} · touchez la carte`;
  $('#bandeauEchelle').style.display = 'none';
  $('#btnQuitterFiltre').textContent = 'Annuler';
}

// Poser un bâtiment : on achète le foncier manquant et on ouvre le chantier
// d'un seul geste. Le joueur voit le total avant de valider.
function poser(c) {
  const d = devis(monde, c, rendu.pose);
  if (!d) return false;
  const joueur = monde.joueur;
  if (joueur.tresorerie < d.total) {
    $('#bandeauNom').textContent =
      `${BAT[rendu.pose].nom} — ${eur(d.total)}, trésorerie insuffisante`;
    return false;
  }
  // Le foncier des cases qu'on ne possède pas encore est réglé par
  // `ouvrirChantier` lui-même ; il ne reste qu'à les rendre acquérables.
  if (!monde.ouvrirChantier(rendu.pose, c.ville, d.cases, joueur)) return false;
  rendu.rafraichirIndex();
  rendu.pose = null; rendu.survol = null;
  majBandeauPose();
  rafraichirTout();
  return true;
}

// --- Feuille ----------------------------------------------------------------

function ouvrirFeuille() { $('#feuille').classList.remove('fermee'); }
function fermerFeuille() { $('#feuille').classList.add('fermee'); rendu.selection = null; }

function rafraichirFeuille() {
  if ($('#feuille').classList.contains('fermee')) return;
  const c = rendu.selection;
  $('#feuilleCorps').innerHTML = contenuFeuille(monde, c);
  brancherFeuille(c);
}

function brancherFeuille(c) {
  if (!c) return;
  const joueur = monde.joueur;

  const acheter = $('#btnAcheter');
  if (acheter) acheter.onclick = () => {
    if (monde.acheterTerrain(c.ville, c, joueur)) rafraichirTout();
  };

  document.querySelectorAll('.btnBatir').forEach(btn => btn.onclick = () => {
    const cases = empriseDepuis(monde, c, btn.dataset.type);
    if (!cases) return;
    if (monde.ouvrirChantier(btn.dataset.type, c.ville, cases, joueur)) {
      rendu.rafraichirIndex();
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
  if (ent && c.bat) ent.onclick = () => {
    c.bat.versEntrepot = !c.bat.versEntrepot; rafraichirTout();
  };

  const dem = $('#btnDemolir');
  if (dem && c.bat) dem.onclick = () => {
    monde.demolir(c.bat); rendu.rafraichirIndex(); fermerFeuille(); rafraichirTout();
  };

  // Céder ce qu'on possède, au même prix qu'on l'aurait payé.
  const vnd = $('#btnVendre');
  if (vnd && c.bat) vnd.onclick = () => {
    if (monde.vendreBatiment(c.bat, joueur)) {
      rendu.rafraichirIndex(); rafraichirTout();
    }
  };
  const vTer = $('#btnVendreTerrain');
  if (vTer && c.ville && !c.bat) vTer.onclick = () => {
    if (monde.vendreTerrain(c.ville, c, joueur)) rafraichirTout();
  };

  // Racheter à un indépendant : il vend toujours, au prix majoré.
  const rach = $('#btnRacheter');
  if (rach && c.bat) rach.onclick = () => {
    if (monde.acheterBatiment(c.bat, joueur)) { rendu.rafraichirIndex(); rafraichirTout(); }
  };

  // Offrir à un rival : le curseur dit le prix, la cible répond en un clic.
  const cur2 = $('#curseurOffre');
  if (cur2 && c.bat) {
    const majMontant = () => {
      const prix = monde.prixOffre(c.bat, +cur2.value);
      $('#montantOffre').textContent = eur(prix);
      const valeur = c.bat.valeurDeCession;
      const ecart = prix / valeur;
      $('#lectureOffre').innerHTML = c.bat.profitAnnuel > 0
        ? `×${cur2.value} le profit, soit ${eur(prix)} — `
          + (ecart < 0.95 ? '<span class="rouge">sous la valeur du bâtiment</span>'
             : ecart > 1.25 ? '<span class="or">bien au-dessus : un prix de dépossession</span>'
             : '<span class="vert">un prix qui peut être accepté</span>')
        : `${eur(prix)} sur un plancher de ${eur(valeur)}`;
      $('#btnOffre').disabled = joueur.tresorerie < prix;
    };
    cur2.oninput = majMontant;
    majMontant();
  }

  const off = $('#btnOffre');
  if (off && c.bat) off.onclick = () => {
    const r = monde.faireOffre(c.bat, joueur, +$('#curseurOffre').value);
    if (!r.fait) { $('#lectureOffre').innerHTML = `<span class="rouge">${r.motif}</span>`; return; }
    rendu.rafraichirIndex();
    rafraichirTout();
    if (!r.accepte) {
      $('#lectureOffre').innerHTML = `<span class="rouge">Offre refusée.</span>
        La cible refuse librement : une offre sous le marché n'est jamais acceptée, sauf par
        quelqu'un qui a besoin d'argent.`;
    }
  };
}

// --- La carte au doigt ------------------------------------------------------
// Un toucher sélectionne, un glissement déplace, deux doigts zooment. Il faut
// distinguer les trois, sans quoi le moindre tremblement de la main ouvrirait
// une fiche au mauvais endroit.

const doigts = new Map();
let depart = null, aGlisse = false, ecartInitial = 0, zoomInitial = 1, dernierToucher = 0;

cv.addEventListener('pointerdown', (e) => {
  // La capture échoue sur un pointeur synthétique — celui d'un banc d'essai —
  // et l'exception emporterait tout le reste du geste avec elle.
  try { cv.setPointerCapture(e.pointerId); } catch { /* sans importance */ }
  doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (doigts.size === 1) {
    depart = { x: e.clientX, y: e.clientY, cx: rendu.cx, cy: rendu.cy };
    aGlisse = false;
  } else {
    // Deux doigts ou plus : on prend les deux premiers. Le cas d'un troisième
    // doigt qui se pose compte aussi — sans quoi l'écart de référence resterait
    // celui d'avant et le zoom bondirait.
    const [a, b] = [...doigts.values()];
    ecartInitial = Math.hypot(a.x - b.x, a.y - b.y);
    zoomInitial = rendu.zoom;
    aGlisse = true;                     // un pincement n'est jamais une sélection
  }
});

cv.addEventListener('pointermove', (e) => {
  if (!doigts.has(e.pointerId)) return;
  doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (doigts.size >= 2) {
    const [a, b] = [...doigts.values()];
    const ecart = Math.hypot(a.x - b.x, a.y - b.y);
    if (ecartInitial > 8) {
      const r = cv.getBoundingClientRect();
      const cible = Math.max(1, Math.min(28, zoomInitial * ecart / ecartInitial));
      rendu.zoomerVers((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, cible / rendu.zoom);
    }
    return;
  }

  if (!depart) return;
  const dx = e.clientX - depart.x, dy = e.clientY - depart.y;
  if (!aGlisse && Math.hypot(dx, dy) > 9) aGlisse = true;
  if (aGlisse) { rendu.cx = depart.cx + dx; rendu.cy = depart.cy + dy; rendu.recadrer(); }
});

cv.addEventListener('pointerup', (e) => {
  doigts.delete(e.pointerId);
  const t = Date.now();

  if (doigts.size === 0 && depart && !aGlisse) {
    const r = cv.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;

    // Deux touchers rapprochés : on approche, plutôt que d'ouvrir une fiche.
    if (t - dernierToucher < 320) {
      rendu.zoomerVers(px, py, 2.0);
    } else {
      const c = rendu.caseSous(px, py);
      if (c && rendu.pose) {
        // Un bâtiment d'une seule case se pose au premier toucher : il n'y a
        // rien à prévisualiser. Pour les autres, le premier toucher montre
        // l'emprise et le second la valide — sur un écran tactile il n'y a pas
        // de survol, et poser à l'aveugle un carré de quatre cases n'est pas
        // jouable.
        if (BAT[rendu.pose].cases === 1 || rendu.survol === c) poser(c);
        else rendu.survol = c;
      } else if (c) {
        rendu.selection = c;
        if (c.ville) monde.villeChoisie = c.ville;
        ouvrirFeuille(); rafraichirFeuille();
      }
    }
  }
  dernierToucher = t;
  if (doigts.size === 0) depart = null;
  else reancrer();
});

cv.addEventListener('pointercancel', (e) => {
  doigts.delete(e.pointerId);
  if (doigts.size === 0) depart = null;
  else reancrer();
});

// Quand un doigt se lève et qu'il en reste au moins un, il FAUT repartir de la
// position courante.
//
// Sans cela, `depart` gardait la position du premier doigt telle qu'elle était
// AVANT le pincement, ainsi que le cadrage d'avant. Au relâchement du second
// doigt, le moindre mouvement du doigt restant rejouait `cx = depart.cx + dx`
// depuis cette origine périmée : la vue sautait d'un coup à la fin de chaque
// zoom. C'est le décalage qu'on voyait sur tablette, et il ne se produisait
// jamais à la souris — un seul pointeur ne quitte jamais l'écran à mi-geste.
function reancrer() {
  const restants = [...doigts.values()];
  if (restants.length === 1) {
    depart = { x: restants[0].x, y: restants[0].y, cx: rendu.cx, cy: rendu.cy };
    // Un geste qui a commencé à deux doigts ne doit pas finir en sélection.
    aGlisse = true;
  } else {
    const [a, b] = restants;
    ecartInitial = Math.hypot(a.x - b.x, a.y - b.y);
    zoomInitial = rendu.zoom;
  }
}

cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  rendu.zoomerVers(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.18 : 1 / 1.18);
}, { passive: false });

// --- Commandes --------------------------------------------------------------

function majPause() {
  $('#btnPause').querySelector('.signe').textContent = enMarche ? '❚❚' : '▶';
}

$('#btnPause').onclick = () => { enMarche = !enMarche; majPause(); };

const VITESSES = [1, 4, 20];
$('#btnVitesse').onclick = () => {
  vitesse = VITESSES[(VITESSES.indexOf(vitesse) + 1) % VITESSES.length];
  $('#btnVitesse').textContent = '×' + vitesse;
};

document.querySelectorAll('.ico[data-vue]').forEach(b => b.onclick = () => {
  vueVolet === b.dataset.vue ? fermerVolet() : ouvrirVolet(b.dataset.vue);
});
$('#btnFiltres').onclick = () => vueVolet === 'filtres' ? fermerVolet() : ouvrirVolet('filtres');
$('#btnFermerVolet').onclick = fermerVolet;
$('#feuillePoignee').onclick = fermerFeuille;
$('#btnQuitterFiltre').onclick = () => {
  if (rendu.pose) { rendu.pose = null; rendu.survol = null; majBandeauPose(); }
  else appliquerFiltre(null, null, null);
  if (vueVolet) rafraichirVolet();
};

$('#btnRecentrer').onclick = () => { rendu.zoom = 1; rendu.cx = 0; rendu.cy = 0; };
$('#btnZoomPlus').onclick  = () => rendu.zoomerVers(rendu.w / 2, rendu.h / 2, 1.6);
$('#btnZoomMoins').onclick = () => rendu.zoomerVers(rendu.w / 2, rendu.h / 2, 1 / 1.6);

addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); $('#btnPause').click(); }
  if (e.key === 'Escape') { fermerFeuille(); fermerVolet(); }
});
addEventListener('resize', () => rendu.dimensionner());


// --- Départ -----------------------------------------------------------------

// Exposés pour le banc d'essai : la page se pilote au doigt, mais un test
// doit pouvoir viser une case précise.
// Le rendu a besoin de savoir où un bâtiment tient ; feuille.js importe déjà
// render.js, on injecte donc la fonction plutôt que de croiser les imports.
rendu.emprise = (c, type) => empriseConstructible(monde, c, type);
rendu.villeAuCentre = () => monde.villeChoisie || monde.villes[0];

window.__rendu = rendu; window.__monde = monde; window.__feuille = contenuFeuille;
// Ouvrir la fiche d'une case par programme : le banc d'essai s'en sert pour
// vérifier les fiches sans avoir à viser un pixel sur la carte.
window.__inspecter = (c) => { rendu.selection = c; ouvrirFeuille(); rafraichirFeuille(); }; window.__feuille = contenuFeuille;

rendu.dimensionner();
rendu.rafraichirIndex();
// On ouvre sur une ville plutôt que sur la carte entière : le joueur doit voir
// des bâtiments à la première seconde, pas une mosaïque de taches.
rendu.cadrerVille(monde.villes[0]);
monde.villeChoisie = monde.villes[0];
rafraichirTout();
requestAnimationFrame(boucle);
