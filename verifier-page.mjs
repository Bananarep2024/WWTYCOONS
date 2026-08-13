// ---------------------------------------------------------------------------
// Vérifie la page autonome, telle qu'elle sera publiée.
//
// Ce contrôle existe parce que la page a déjà été livrée morte : le bundle a
// ses propres façons de casser — un module oublié dans la liste, un ré-export
// qui ne survit pas à la concaténation — et aucune ne se voit en servant les
// modules séparés. On charge donc le fichier réel, dans une enveloppe d'hôte
// hostile, et on regarde si la carte est dessinée.
//
//   node verifier-page.mjs        (nécessite un serveur sur web/, port 8123)
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { chromium, devices } from 'playwright';

const RACINE = new URL('./web/', import.meta.url);
const page = readFileSync(new URL('wwtycoons.hebergee.html', RACINE), 'utf8');

// L'hôte enveloppe le contenu dans un conteneur qui n'a pas de hauteur propre :
// c'est le cas le plus défavorable, et c'est celui qui a cassé la première fois.
const enveloppe = new URL('_verif.html', RACINE);
writeFileSync(enveloppe, `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>*{box-sizing:border-box}body{margin:0}</style></head>
<body><div id="hote">${page}</div></body></html>`);

const navigateur = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
});
let echecs = 0;

for (const [nom, appareil] of [
  ['iPhone 14', devices['iPhone 14']],
  ['iPad', devices['iPad (gen 7)']],
  ['ordinateur', { viewport: { width: 1440, height: 900 } }],
]) {
  const ctx = await navigateur.newContext({ ...appareil });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  // Le navigateur réclame toujours un favicon que la page ne fournit pas :
  // ce 404-là ne dit rien de l'état du jeu.
  p.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/favicon|404/.test(t)) erreurs.push(t);
  });

  await p.goto('http://localhost:8123/_verif.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const etat = await p.evaluate(() => {
    const cv = document.querySelector('#carte');
    if (!cv) return { absent: true };
    const d = cv.getContext('2d')
      .getImageData(Math.floor(cv.width / 2), Math.floor(cv.height / 2), 1, 1).data;
    return { taille: [cv.width, cv.height], centre: [d[0], d[1], d[2]] };
  });

  // Un canvas de 300 × 150 est la taille par défaut : le signe qu'il n'a jamais
  // été dimensionné. Un centre noir, celui qu'il n'a rien dessiné.
  const dimensionne = !etat.absent && etat.taille[0] > 320;
  const dessine = !etat.absent && etat.centre.some(v => v > 25);
  const bon = dimensionne && dessine && !erreurs.length;
  if (!bon) echecs++;

  console.log(`${bon ? ' ok ' : 'FAIL'}  ${nom.padEnd(12)}`
    + `canvas ${etat.absent ? 'absent' : etat.taille.join('×').padEnd(10)}  `
    + `${dessine ? 'carte dessinée' : 'CARTE VIDE'}`
    + (erreurs.length ? `\n        ${erreurs.slice(0, 3).join('\n        ')}` : ''));
  await ctx.close();
}

await navigateur.close();
unlinkSync(enveloppe);
console.log(echecs ? `\n✗ ${echecs} échec(s)` : '\n✓ la page publiée se charge et dessine');
process.exit(echecs ? 1 : 0);
