// Banc d'essai : vérifie que le barème code bien ce que dit docs/00-BAREME.md,
// puis fait tourner vingt ans de simulation sans joueur.
import { P, BAT, RES, materiaux, coutRef, loyer, prixTerrain, potentielTerrain,
         facteurQualite, ECHELLE_SOL } from './params.js';
import { Marche } from './market.js';
import { Monde } from './world.js';

let ko = 0;
const ok = (nom, val, attendu, tol = 0.05) => {
  const bon = Math.abs(val - attendu) <= tol * Math.max(1, Math.abs(attendu));
  if (!bon) ko++;
  console.log(`${bon ? ' ok ' : 'FAIL'}  ${nom.padEnd(46)} ${(+val).toFixed(2).padStart(9)}   attendu ${attendu}`);
};
// Pour les bornes, où seul le dépassement est une faute.
const sous = (nom, val, plafond) => {
  const bon = val <= plafond;
  if (!bon) ko++;
  console.log(`${bon ? ' ok ' : 'FAIL'}  ${nom.padEnd(46)} ${(+val).toFixed(2).padStart(9)}   au plus ${plafond}`);
};

console.log('\n=== Rendements de référence (niveau 1, 100 $/case) ===');

// LA BASE PROPRE. Marge et rendement se comptent par BÂTIMENT, plus par case :
// une exploitation tient sur une case avec un ouvrier, une aciérie sur quatre
// avec quatre. Les débits, les intrants et les matériaux sont écrits pour le
// bâtiment entier.
const marge = (t) => {
  const d = BAT[t];
  let c = d.employes * P.salaireCase;
  for (const [r, q] of Object.entries(d.intrants || {})) c += q * RES[r].prix;
  return d.debit * RES[d.sort].prix - c;          // à la qualité 1
};
const rdt = (t, q = 1) => {
  const d = BAT[t], C = coutRef(t), T = 100 * d.cases;
  const m = marge(t) + (d.qual ? d.debit * (facteurQualite(q) - 1) * RES[d.sort].prix : 0);
  return (m * 12 - C * P.entretienAnnuel) / (C + T) * 100;
};

// Une exploitation sur une case de qualité 1 perd légèrement de l'argent : elle
// ne se travaille que sous la pression d'un cours plus haut que la référence.
// C'est ce qui rend la terre pauvre habitable sans la rendre profitable.
ok('exploitation, case 1', rdt('coupe', 1), -10, 0.05);
ok('exploitation, case 2', rdt('coupe', 2), 15, 0.05);
ok('exploitation, case 3', rdt('coupe', 3), 90, 0.05);
ok('scierie', rdt('scierie'), 20, 0.03);
ok('briqueterie', rdt('briqueterie'), 20, 0.03);
ok('minoterie', rdt('minoterie'), 20, 0.03);
ok('abattoir', rdt('abattoir'), 20, 0.03);
ok('aciérie', rdt('acierie'), 20, 0.03);
ok('manufacture', rdt('manufacture'), 25, 0.03);

console.log('\n=== Les filières s\'emboîtent ===');
// Une exploitation de qualité 1 alimente exactement un atelier simple.
ok('4 exploitations pour 1 scierie', BAT.scierie.intrants.bois / BAT.coupe.debit, 4, 0.001);
ok('4 fermes pour 1 minoterie', BAT.minoterie.intrants.cereales / BAT.ferme.debit, 4, 0.001);
ok('3 mines de chaque pour 1 aciérie', BAT.acierie.intrants.charbon / BAT.mineCharbon.debit, 3, 0.001);
ok('3 scieries pour 1 manufacture', BAT.manufacture.intrants.planches / BAT.scierie.debit, 3, 0.001);

console.log('\n=== Loyers ===');
ok('maison, niveau 1', loyer('maison', 100, 180), 5, 0.01);
ok('immeuble, niveau 1', loyer('immeuble', 400, 3700), 100, 0.02);

console.log('\n=== Matériaux : la règle structurante ===');
const m = (t) => materiaux(t);
ok('maison sans acier', m('maison').acier || 0, 0, 0);
ok('immeuble sans bois', m('immeuble').planches || 0, 0, 0);
ok('bureaux sans bois', m('bureaux').planches || 0, 0, 0);




console.log('\n=== Travail incorporé (§20) ===');
ok('planches', 2 / 12, 0.167, 0.02);
ok('acier', 3 / 6, 0.500, 0.02);
ok('pain', 2 / 5, 0.400, 0.02);
ok('produits', 3 / 6, 0.500, 0.02);
ok('ménage : 1 pain + 1 produit', 0.400 + 0.500, 0.900, 0.01);

console.log('\n=== Formation des prix ===');
{
  const cible = Math.pow(1 / 0.70, P.exposantPrix);
  let p = 1; for (let i = 0; i < 5; i++) p += P.lissagePrix * (cible - p);
  ok('30 % de production retenue, 5 mois', (p - 1) * 100, 19, 0.12);
}

// --- Le marché sert le LOCAL d'abord ---------------------------------------
//
// Un marché fusionné n'est pas un entrepôt unique. Ce qu'une ville produit
// alimente d'abord ses propres besoins ; seul le surplus part chez la voisine.
// Deux choses à garantir : que rien ne se crée ni ne se perde au guichet, et que
// la ville autosuffisante soit servie en plein pendant que la ville en manque
// est rationnée.
console.log('\n=== Le marché sert le local d\'abord ===');
{
  const w = new Monde({ nbVilles: 5, duree: 200, graine: 12345 });
  let ecartMax = 0, plusNegatif = 0;
  while (w.tick()) {
    for (const mk of w.marches) for (const r of Object.keys(mk.stock)) {
      let somme = 0;
      for (const l of mk.parVille.values()) {
        somme += l.stock[r];
        if (l.stock[r] < plusNegatif) plusNegatif = l.stock[r];
      }
      if (mk._orphelin) somme += mk._orphelin.stock[r];
      ecartMax = Math.max(ecartMax, Math.abs(somme - mk.stock[r]));
    }
  }
  ok('le grand livre est conservatif', ecartMax < 1e-4 ? 0 : 1, 0, 0.01);
  ok('aucun stock local négatif', plusNegatif < -1e-6 ? 1 : 0, 0, 0.01);

}

// La règle, vérifiée sur un marché fabriqué plutôt que sondée dans une partie.
// Un sondage se prend forcément APRÈS la consommation, quand les besoins sont
// soldés : il ne trouvait rien à observer et faisait échouer le contrôle sans
// qu'aucune règle n'ait bougé.
{
  const A = { nom: 'A' }, B = { nom: 'B' };
  const essai = (offreA, offreB, besoinA, besoinB) => {
    const mk = new Marche([A, B]);
    mk.offrir('pain', offreA, A); mk.offrir('pain', offreB, B);
    mk.demander('pain', besoinA, A); mk.demander('pain', besoinB, B);
    mk.ouvrirGuichet(); mk.calculerService();
    return { a: mk.prendre('pain', besoinA, A), b: mk.prendre('pain', besoinB, B) };
  };

  // A se suffit tout juste, B ne produit rien : A est servie en plein, B a zéro.
  let r = essai(100, 0, 100, 100);
  ok('l\'autosuffisante est servie en plein', r.a, 100, 0.001);
  ok('… même quand la voisine manque de tout', r.b, 0, 0.001);

  // A produit la moitié de trop : son surplus part chez B, et pas un grain de plus.
  r = essai(150, 0, 100, 100);
  ok('elle garde ce qu\'il lui faut', r.a, 100, 0.001);
  ok('… et n\'exporte que son surplus', r.b, 50, 0.001);

  // Personne n'a assez : les deux sont rationnées, et rien ne se crée.
  r = essai(60, 40, 100, 100);
  ok('en disette, rien ne se crée', r.a + r.b, 100, 0.001);
}

console.log('\n=== Foncier ===');
ok('case contre la gare, hameau', prixTerrain(0, 0), 70, 0.01);
ok('case contre la gare, comptoir', prixTerrain(1, 0), 100, 0.01);
ok('case contre la gare, métropole', prixTerrain(5, 0), 400, 0.01);
// LE GRADIENT SE LIT MAINTENANT À LA LISIÈRE, PAS À UNE DISTANCE ABSOLUE.
//
// Il portait sur un nombre de cases, calibré pour un territoire de rayon 44.
// Depuis que le rayon suit le palier — 16 au Comptoir, 34 à la Métropole — la
// seule question qui garde un sens est : que vaut le bord du carré, rapporté à
// son centre ? Le calibrage d'origine est conservé là exactement : 45 % au
// Comptoir, 17 % à la Métropole.
for (const [n, part] of [[0, 0.537], [1, 0.448], [5, 0.169]]) {
  const r = P.rayonPalier[n];
  ok(`lisière ÷ centre, ${P.nomsNiveau[n].toLowerCase()} (r=${r})`,
     prixTerrain(n, r) / prixTerrain(n, 0), part, 0.01);
}

// LE SOL SE PAIE CE QU'IL REND. La prime foncière d'une bonne terre doit valoir
// exactement la prime de rendement qu'elle capitalise — sinon la terre riche est
// un mauvais placement et la terre pauvre une aubaine.
//
// Un barème séparé existait, qui étalait le prix sur un rapport de 15 quand le
// rendement n'en vaut que 2,1. Invisible tant que le sol était excellent
// partout ; dès que les villes ont eu des vocations tranchées, la richesse
// pesait 58 % du prix contre 42 % à la distance, et des villes affichaient un
// centre moins cher que leur lisière.
ok('prime foncière de la meilleure terre', prixTerrain(3, 0, 5) / prixTerrain(3, 0, 1),
   facteurQualite(P.qualiteSommet) / facteurQualite(1), 0.001);
ok('… et elle vaut la prime de rendement',
   facteurQualite(P.qualiteSommet) / facteurQualite(1), ECHELLE_SOL[P.qualiteSommet], 0.001);
// La distance doit peser plus que la richesse, sans quoi la carte du prix du sol
// ne se lit plus comme un gradient urbain.
ok('la distance pèse autant que le sol',
   prixTerrain(3, 0, 3) / prixTerrain(3, P.rayonPalier[3], 3),
   1 + P.gradientFoncier[3], 0.001);

// UNE CASE DE NIVEAU 5 VAUT CINQ CASES DE NIVEAU 1 — en production, en emploi et
// en prix du sol à la fois. C'est la même loi qui commande les trois, et c'est
// ce qui fait qu'une bonne case n'est pas plus rentable : elle est plus grande.
ok('production de la case 3, en cases 1', facteurQualite(3), ECHELLE_SOL[3], 0.001);
ok('production de la case 2, en cases 1', facteurQualite(2), ECHELLE_SOL[2], 0.001);
ok('la case 0 ne produit rien', facteurQualite(0), 0, 0.001);
ok('prix du sol : la case 3 se paie ce qu\'elle rend',
   prixTerrain(1, 0, P.qualiteSommet) / prixTerrain(1, 0, 1), ECHELLE_SOL[P.qualiteSommet], 0.001);
// Sauf tout en bas : une case sans gisement ne vaut pas zéro, elle vaut son
// terrain nu. Sans ce plancher, la moitié de la carte serait gratuite.
ok('… et la case stérile garde son plancher',
   prixTerrain(1, 0, 0) / prixTerrain(1, 0, 1), P.solPlancher, 0.001);

// Le gradient se durcit avec le niveau : c'est là tout le mécanisme.
ok('potentiel du centre, hameau', potentielTerrain(0, 0), 4.00 / 0.70, 0.01);
ok('potentiel du centre, comptoir', potentielTerrain(1, 0), 4.00, 0.01);
// ET AUCUNE CASE DU CARRÉ MAXIMAL N'A UN POTENTIEL SOUS 1 : où qu'elle soit,
// une case vaut plus dans une métropole que dans un comptoir. C'est l'invariant
// qui rend l'achat de terre lisible.
{
  let bas = Infinity, ou = 0;
  for (let d = 0; d <= P.rayonPalier[P.rayonPalier.length - 1]; d++) {
    const p = potentielTerrain(0, d);
    if (p < bas) { bas = p; ou = d; }
  }
  sous(`potentiel minimal du carré (à ${ou} cases, ×${bas.toFixed(2)})`, 1 / bas, 1.0);
}

// ET AUCUNE CASE NE PERD JAMAIS DE VALEUR quand la ville monte d'un palier.
// C'est ce que garantit une atténuation proportionnelle au facteur de niveau,
// et c'est la seule chose qui rende le mécanisme lisible pour un joueur.
{
  let pire = Infinity, ou = '';
  const dMax = P.rayonPalier[P.rayonPalier.length - 1];
  for (let n = 0; n <= P.nomsNiveau.length - 2; n++) for (let d = 0; d <= dMax; d++) {
    const r = prixTerrain(n + 1, d) / prixTerrain(n, d);
    if (r < pire) { pire = r; ou = `niveau ${n}→${n + 1} à ${d} cases`; }
  }
  // Ce qui est vérifié ici est un INVARIANT, pas un réglage : aucune case ne
  // doit perdre de valeur quand sa ville monte d'un palier. La valeur du plus
  // faible gain est imprimée pour information ; c'est le franchissement de 1
  // qui compte.
  sous(`toute case gagne au passage de palier (pire : ${ou}, ×${pire.toFixed(2)})`,
       1 / pire, 1.0);
}

console.log('\n=== Vingt ans de simulation, sans joueur ===');
const monde = new Monde({ nbVilles: 5, duree: 240, graine: 12345 });
// Le rail n'est plus construit par personne d'office : c'est le joueur qui le
// pose. Le banc d'essai tient donc ce rôle — il finance le maillage des cinq
// villes — sinon il mesurerait un monde morcelé en cinq marchés isolés, qui
// n'est pas celui qu'on prétend contrôler ici.
const t0 = Date.now();
for (let i = 1; i < monde.villes.length; i++) {
  monde.joueur.tresorerie += 1e6;
  monde.lancerVoie(i - 1, i, monde.joueur);
}
while (monde.tick()) monde.joueur.tresorerie += 5000;
const dt = Date.now() - t0;
console.log(`  ${monde.mois} mois simulés en ${dt} ms (${(dt / monde.mois).toFixed(2)} ms/mois)\n`);
for (const v of monde.villes) {
  const b = v.barometres;
  console.log(`  ${v.nom.padEnd(14)} ${String(Math.round(v.menages)).padStart(5)} ménages  `
    + `niv.${v.niveau}  salaire ${v.salaire.toFixed(1).padStart(5)}  `
    + `emploi ${(b.emploi * 100).toFixed(0).padStart(3)}%  `
    + `nourr ${(b.nourriture * 100).toFixed(0).padStart(3)}%  `
    + `prod ${(b.produits * 100).toFixed(0).padStart(3)}%  `
    + `moy ${((b.emploi + b.nourriture + b.produits) / 3 * 100).toFixed(0)}%`);
}
console.log('\n  Prix, en indice du prix de référence :');
for (const mk of monde.marches) {
  const l = Object.keys(RES).map(r => `${r.slice(0, 4)} ${mk.indice(r).toFixed(2)}`).join('  ');
  console.log(`   ${l}`);
}

// Le matelas (§4.2 bis) : aucune marchandise ne doit dormir en montagne. Sans
// les deux règles, la même partie finit avec 23 mois d'argile et plus de mille
// mois de bétail — un tas devenu invisible au prix, que rien ne mangeait plus.
console.log('\n  Couverture des stocks, en mois de consommation :');
const couverture = {};
for (const r of Object.keys(RES)) {
  let stock = 0, besoins = 0;
  for (const mk of monde.marches) { stock += Math.max(0, mk.stock[r]); besoins += mk.besoins[r]; }
  couverture[r] = besoins > 1 ? stock / besoins : 0;
}
console.log('   ' + Object.keys(RES).map(r => `${r.slice(0, 4)} ${couverture[r].toFixed(1)}`).join('  '));
// Le bétail est exclu : sa demande est structurellement quasi nulle — le pain
// couvre la ration entière et la viande n'est qu'un appoint (§ décision 9) —
// si bien qu'un tas minuscule y pèse des dizaines de mois de couverture.
const surveillees = Object.keys(RES).filter(r => r !== 'betail');
const pire = Math.max(...surveillees.map(r => couverture[r]));
// Le seuil reste à 4 mois : c'est la promesse du §4.2 bis. Il est FRANCHI
// depuis le rééquilibrage des filières — l'économie n'est plus calibrée et le
// contrôle doit le dire, pas s'adapter. On le laisse échouer bruyamment.
sous('aucune montagne de marchandise', pire, 4);
console.log(`\n${ko === 0 ? '✓ tous les contrôles passent' : '✗ ' + ko + ' contrôle(s) en échec'}\n`);
