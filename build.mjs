// ---------------------------------------------------------------------------
// Fabrique une page unique et autonome : wwtycoons.html.
//
// Tout est en ligne — CSS, modules, aucune requête réseau. La page s'ouvre
// depuis un fichier local, un hébergeur statique ou une pièce jointe, sur
// téléphone comme sur tablette.
//
//   node build.mjs
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const RACINE = new URL('./web/', import.meta.url);
const lire = (p) => readFileSync(new URL(p, RACINE), 'utf8');

// L'ordre suit les dépendances. Les classes ne sont pas hissées, mais elles ne
// servent qu'à l'exécution : seul `params` doit précéder tout le monde.
const MODULES = [
  'js/sim/params.js',
  'js/sim/mapgen.js',
  'js/sim/market.js',
  'js/sim/building.js',
  'js/sim/company.js',
  'js/sim/ai.js',
  'js/sim/world.js',
  'js/ui/sprites.js',
  'js/ui/render.js',
  'js/ui/panneaux.js',
  'js/ui/feuille.js',
  'js/main.js',
];

// Retire les déclarations de module : sans portée de module, les identifiants
// se voient déjà les uns les autres.
function deshabiller(src) {
  return src
    // les imports
    .replace(/^import\s[\s\S]*?from\s*'[^']*';\s*$/gm, '')
    // les re-exports isoles - `export { X };` - qui, sans portee de module,
    // referencent un binding qui n'existe plus et font echouer TOUT le script
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')
    // le mot-cle devant une declaration
    .replace(/^export\s+(?=(const|let|var|function|class|async))/gm, '')
    .trimEnd();
}

// Garde-fou : aucun module ne doit manquer a l'appel. Un fichier oublie ne
// provoque aucune erreur de construction - seulement une page morte, et un
// « X is not defined » que personne ne verra avant l'ouverture de la page.
{
  const surDisque = [];
  for (const d of ['js/sim', 'js/ui']) {
    for (const f of readdirSync(new URL(d + '/', RACINE))) {
      if (f.endsWith('.js') && f !== 'selftest.js') surDisque.push(d + '/' + f);
    }
  }
  surDisque.push('js/main.js');
  const oublies = surDisque.filter(f => !MODULES.includes(f));
  if (oublies.length) {
    console.error('ECHEC - modules absents de la liste : ' + oublies.join(', '));
    process.exit(1);
  }
}

const js = MODULES.map(f =>
  `\n// ===== ${f} ${'='.repeat(Math.max(0, 62 - f.length))}\n\n` + deshabiller(lire(f))
).join('\n');

const css = lire('style.css');
const html = lire('index.html');

// On récupère le corps de la page telle quelle : une seule source de vérité
// pour la structure.
const corps = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .trim();

const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no">
<meta name="theme-color" content="#14130f">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>WWTycoons — démo économique</title>
<style>
${css}
</style>
</head>
<body>
${corps}
<script type="module">
${js}
</script>
</body>
</html>
`;

writeFileSync(new URL('./wwtycoons.html', RACINE), page);
console.log(`wwtycoons.html — ${(page.length / 1024).toFixed(0)} Ko, ${MODULES.length} modules`);

// Variante pour hébergement en page publiée : le squelette du document est
// fourni par l'hôte, on ne livre que le titre, les styles et le corps.
const pageHebergee = `<title>WWTycoons</title>
<style>
${css}
</style>
${corps}
<script type="module">
${js}
</script>
`;
writeFileSync(new URL('./wwtycoons.hebergee.html', RACINE), pageHebergee);
console.log(`wwtycoons.hebergee.html - ${(pageHebergee.length / 1024).toFixed(0)} Ko`);

// Garde-fou : plus aucune declaration de module ne doit subsister. Un seul
// `export` oublie fait echouer le script entier, et la page s'ouvre sur du vide
// sans la moindre erreur visible.
for (const [nom, texte] of [['complete', page], ['hebergee', pageHebergee]]) {
  const restes = texte.match(/^\s*(import\s|export[\s{])/gm);
  if (restes) {
    console.error(`ECHEC - ${restes.length} declaration(s) de module dans la page ${nom}`);
    process.exit(1);
  }
}
