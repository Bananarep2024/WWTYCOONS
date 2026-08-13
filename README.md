# WWTycoons

Jeu de gestion capitaliste en temps réel — Amérique, début du XX<sup>e</sup> siècle.
5 villes, jusqu'à 10 joueurs, parties de 20 à 60 minutes.

Un joueur ne possède presque rien en propre. Il possède 10 % d'une société qu'il dirige, et
cette société possède tout le reste : les terres, les usines, les immeubles. Sa fortune, celle
qui décide de la victoire, c'est son argent liquide plus la valeur en bourse de ses actions.

---

## Où sont les choses

| Chemin | Contenu |
|---|---|
| `docs/00-BAREME.md` | **Le barème de référence. Fait foi.** Toutes les règles et tous les chiffres. |
| `docs/01-DECISIONS.md` | Les 31 arbitrages de conception, et pourquoi. |
| `docs/02-QUESTIONS-OUVERTES.md` | Ce qui reste à trancher. |
| `design/` | Le document de conception d'origine (PDF, v28). |
| `web/` | La démo navigateur (sources). |
| `web/wwtycoons.html` | **La page autonome, à ouvrir directement.** |
| `build.mjs` | Regroupe les sources en page autonome. |

## Jouer

JavaScript pur, modules ES, canvas 2D. **Aucune dépendance, aucune étape de compilation.**

**Sur mobile ou tablette** — `web/wwtycoons.html` est une page unique et autonome : tout est
en ligne, aucune requête réseau. Elle s'ouvre depuis n'importe où — un fichier reçu, un
hébergeur statique, GitHub Pages. Se joue au doigt : toucher pour inspecter, glisser pour se
déplacer, deux doigts pour zoomer, ⤢ pour revenir à la vue d'ensemble.

**En développement** — la version en modules séparés, plus commode à modifier :

```sh
cd web && python3 -m http.server 8000     # puis http://localhost:8000
node build.mjs                            # régénère la page autonome
```

`build.mjs` produit deux fichiers : `wwtycoons.html`, complet et ouvrable tel quel, et
`wwtycoons.hebergee.html`, sans squelette de document, pour les hébergeurs qui fournissent
le leur.

La simulation vit dans `web/js/sim/`, sans une seule ligne de rendu. C'est délibéré : elle se
porte telle quelle en C# dans Unity, seul le rendu change.

```
web/js/sim/
  params.js     le barème en code — aucune valeur numérique du jeu n'existe ailleurs
  mapgen.js     génération de carte : relief, qualités de sol, rues, emprises de voie
  market.js     formation des prix, rationnement au prorata
  building.js   production, comptes, valorisation d'un bâtiment
  company.js    société, cours de l'action, carnet de chantiers
  world.js      la boucle mensuelle
  ai.js         comment une ville bâtit, comment les rivales jouent
  selftest.js   banc d'essai
web/js/ui/      rendu carte, panneaux, feuille d'inspection
```

### Le banc d'essai

```sh
node web/js/sim/selftest.js
```

Il vérifie que le code retrouve les chiffres du document de conception, puis fait tourner
vingt ans de simulation sans joueur. Résultats attendus :

| Contrôle | Cible | Obtenu |
|---|---|---|
| Rendements par palier | 15 / 20 / 25 % | 15,0–15,2 / 19,9–20,2 / 25,1 % |
| Immeuble de bureaux | 11,7 % | 11,7 % |
| Marges par case | 4 / 16 / 22 $ | exactes |
| Travail incorporé, un ménage | 0,900 case | 0,900 |
| 30 % de production retenue, 5 mois | +19 % | +19,2 % |
| Ville à 20 ans — emploi | 77–80 % | 81 % |
| Ville à 20 ans — nourriture | 100 % | 100 % |
| Ville à 20 ans — produits | 54–63 % | 58 % |
| Ville à 20 ans — moyenne | ~pivot (80 %) | 80 % |
| Amplitude des prix | 0,67–1,30 × réf. | 0,86–1,23 |

## Ce que la démo couvre

Format 20 minutes : 5 villes, 60 mois de 10 secondes, 1 joueur et 3 sociétés pilotées par
l'ordinateur.

- **Une seule carte du monde** : cinq villes posées sur un relief, à distance minimale
  garantie, reliées par un réseau ferroviaire où les liaisons se chaînent
- **Bâtiments dessinés** — toits, dents de scie, silos, chevalements — et quartiers de
  vocations distinctes : l'industrie ne cerne jamais l'habitation
- **Filtres** en dégradé rouge → vert : qualité du sol case par case, baromètres ville par
  ville, et le prix de chacune des douze marchandises sur les cinq villes
- Marché foncier : contiguïté, propriétaires indépendants, prix selon le niveau et la distance
- Douze ressources, trois niveaux de filière, qualité de sol de 1 à 5 par case
- Prix formés sur les **flux**, rationnement au prorata, prix de revient local en plancher
- Carnet de chantiers : le cash part d'abord, le bâtiment sort quand la dernière brique arrive
- Curseur d'activité, mise en sommeil, arrêt automatique sur marge négative
- Démographie par les trois baromètres et le pivot ; niveaux de ville ; loyers indexés
- Chemin de fer : dates annoncées, investissement accélérateur, **fusion des marchés**
- Valorisation des bâtiments, actif net réévalué, cours de l'action
- Carte colorée : fonction, propriétaire, qualités de sol, prix du terrain ; pastilles d'alerte

## Ce qui reste à faire

Emprunt bancaire · prises de contrôle · crises économiques · directeurs · enchères sur les
salaires et les matières · débauchage · offres sur les bâtiments d'un rival · multijoueur ·
portage Unity.

Voir `docs/02-QUESTIONS-OUVERTES.md`.
