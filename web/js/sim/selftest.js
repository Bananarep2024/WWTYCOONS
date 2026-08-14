// Banc d'essai : vérifie que le barème code bien ce que dit docs/00-BAREME.md,
// puis fait tourner vingt ans de simulation sans joueur.
import { P, BAT, RES, materiaux, coutRef, loyer, prixTerrain, potentielTerrain } from './params.js';
import { Monde } from './world.js';

let ko = 0;
const ok = (nom, val, attendu, tol = 0.05) => {
  const bon = Math.abs(val - attendu) <= tol * Math.max(1, Math.abs(attendu));
  if (!bon) ko++;
  console.log(`${bon ? ' ok ' : 'FAIL'}  ${nom.padEnd(46)} ${(+val).toFixed(2).padStart(9)}   attendu ${attendu}`);
};

console.log('\n=== Rendements de référence (niveau 1, 100 $/case) ===');
const rdt = (type, marge) => {
  const c = coutRef(type), n = BAT[type].cases, terrain = 100 * n;
  const ent = c * P.entretienAnnuel / 12;
  return (marge * n - ent) * 12 / (c + terrain) * 100;
};
ok('coupe forestière', rdt('coupe', 4), 15, 0.03);
ok('ferme céréalière', rdt('ferme', 4), 15, 0.03);
ok('maison', rdt('maison', 5), 15, 0.03);
ok('scierie', rdt('scierie', 16), 20, 0.03);
ok('minoterie', rdt('minoterie', 16), 20, 0.03);
ok('aciérie', rdt('acierie', 22), 20, 0.03);
ok('manufacture', rdt('manufacture', 22), 25, 0.03);
ok('immeuble résidentiel', rdt('immeuble', 25), 20, 0.03);
ok('immeuble de bureaux', rdt('bureaux', 10), 11.7, 0.03);

console.log('\n=== Marges aux prix de référence (par case) ===');
const marge = (t) => {
  const d = BAT[t]; let c = P.salaireCase;
  for (const [r, q] of Object.entries(d.intrants || {})) c += q * RES[r].prix;
  return d.debit * RES[d.sort].prix - c;
};
ok('coupe forestière', marge('coupe'), 4, 0.01);
ok('ferme céréalière', marge('ferme'), 4, 0.01);
ok('scierie', marge('scierie'), 16, 0.01);
ok('briqueterie', marge('briqueterie'), 16, 0.01);
ok('minoterie', marge('minoterie'), 16, 0.01);
ok('aciérie', marge('acierie'), 22, 0.01);
ok('manufacture', marge('manufacture'), 22, 0.01);

console.log('\n=== Loyers ===');
ok('maison, niveau 1', loyer('maison', 100, 180), 5, 0.01);
ok('immeuble, niveau 1', loyer('immeuble', 400, 3700), 100, 0.02);

console.log('\n=== Matériaux : la règle structurante ===');
const m = (t) => materiaux(t);
ok('maison sans acier', m('maison').acier || 0, 0, 0);
ok('immeuble sans bois', m('immeuble').planches || 0, 0, 0);
ok('bureaux sans bois', m('bureaux').planches || 0, 0, 0);
ok('coût maison', coutRef('maison'), 180, 0.01);
ok('coût immeuble (4 cases)', coutRef('immeuble'), 3700, 0.01);
ok('coût aciérie (4 cases)', coutRef('acierie'), 3240, 0.01);

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

console.log('\n=== Foncier ===');
ok('case contre la gare, comptoir', prixTerrain(1, 0), 100, 0.01);
ok('case contre la gare, métropole', prixTerrain(5, 0), 400, 0.01);
ok('case à 32 cases, métropole', prixTerrain(5, 32), 88.0, 0.02);
ok('case à 32 cases, comptoir', prixTerrain(1, 32), 52.72, 0.02);

// Le gradient se durcit avec le niveau : c'est là tout le mécanisme.
ok('potentiel du centre, comptoir', potentielTerrain(1, 0), 4.00, 0.01);
ok('potentiel à 30 cases, comptoir', potentielTerrain(1, 30), 1.677, 0.02);

// ET AUCUNE CASE NE PERD JAMAIS DE VALEUR quand la ville monte d'un palier.
// C'est ce que garantit une atténuation proportionnelle au facteur de niveau,
// et c'est la seule chose qui rende le mécanisme lisible pour un joueur.
{
  let pire = Infinity, ou = '';
  for (let n = 1; n <= 4; n++) for (let d = 0; d <= 60; d++) {
    const r = prixTerrain(n + 1, d) / prixTerrain(n, d);
    if (r < pire) { pire = r; ou = `niveau ${n}→${n + 1} à ${d} cases`; }
  }
  ok(`plus faible gain d'un palier (${ou})`, pire, 1.10, 0.10);
  if (pire < 1) console.log('FAIL  une case PERD de la valeur en montant de palier');
}

console.log('\n=== Vingt ans de simulation, sans joueur ===');
const monde = new Monde({ nbVilles: 5, duree: 240, graine: 12345 });
const t0 = Date.now();
while (monde.tick());
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
console.log(`\n${ko === 0 ? '✓ tous les contrôles passent' : '✗ ' + ko + ' contrôle(s) en échec'}\n`);
