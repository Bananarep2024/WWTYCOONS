// Capture d'écran de chaque volet, sur téléphone et sur ordinateur.
import { chromium, devices } from 'playwright';

const VOLETS = ['villes', 'marche', 'batir', 'societe', 'bourse', 'rail'];
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function serie(nomProfil, profil, mois) {
  const ctx = await nav.newContext(profil);
  const pg = await ctx.newPage();
  await pg.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });
  await pg.evaluate((n) => { for (let i = 0; i < n; i++) window.__monde.tick(); }, mois);
  // un tour de boucle pour que l'affichage rattrape la simulation
  await pg.evaluate(() => document.querySelector('#btnPause').click());
  await pg.waitForTimeout(11000);
  await pg.evaluate(() => document.querySelector('#btnPause').click());

  await pg.screenshot({ path: `/tmp/ui-${nomProfil}-carte.png` });
  for (const v of VOLETS) {
    await pg.evaluate((v) => document.querySelector(`.ico[data-vue="${v}"]`).click(), v);
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: `/tmp/ui-${nomProfil}-${v}.png` });
  }
  // une fiche de bâtiment
  await pg.evaluate(() => {
    const m = window.__monde;
    const v = m.villes[0];
    const b = m.tousBatiments(v)[0];
    if (b) window.__inspecter(b.cases[0]);
  });
  await pg.waitForTimeout(350);
  await pg.screenshot({ path: `/tmp/ui-${nomProfil}-fiche.png` });
  await ctx.close();
}

await serie('tel', { ...devices['iPhone 14'] }, 200);
await serie('pc', { viewport: { width: 1440, height: 900 } }, 200);
await nav.close();
console.log('captures faites');
