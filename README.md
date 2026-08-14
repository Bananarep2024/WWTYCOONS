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

**Avant de publier**, toujours :

```sh
node verifier-page.mjs        # nécessite un serveur sur web/, port 8123
```

Ce contrôle charge la page autonome réelle, dans une enveloppe d'hôte hostile, et vérifie
que la carte est effectivement dessinée. Il existe parce que la page a déjà été livrée
morte : le bundle a ses propres façons de casser — un module absent de la liste, un
ré-export qui ne survit pas à la concaténation — et **aucune ne se voit en servant les
modules séparés**. `build.mjs` refuse par ailleurs de produire une page où subsisterait une
déclaration de module, ou dans laquelle manquerait un fichier présent sur le disque.

La simulation vit dans `web/js/sim/`, sans une seule ligne de rendu. C'est délibéré : elle se
porte telle quelle en C# dans Unity, seul le rendu change.

```
web/js/sim/
  params.js     le barème en code — aucune valeur numérique du jeu n'existe ailleurs
  mapgen.js     génération de carte : relief, qualités de sol, quartiers, emprises de voie
  market.js     formation des prix, rationnement au prorata
  building.js   production, comptes, valorisation d'un bâtiment
  company.js    société, cours de l'action, carnet de chantiers
  world.js      la boucle mensuelle
  ai.js         comment une ville bâtit, comment les rivales jouent — cinq règles :
                on bâtit le goulot, on loge tant qu'on peut nourrir, on ne dépasse
                pas les bras, on ne bâtit pas ce qui ne paiera pas, et une affaire
                qui saigne deux ans ferme
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
| Ville à 20 ans — ménages | 55 → 500 et plus | 618–1 063 |
| Ville à 20 ans — niveau | Ville ou mieux | Ville ×4, Grandeville ×1 |
| Ville à 20 ans — emploi | 82–90 % | 84–89 % |
| Ville à 20 ans — nourriture | 100 % | 100 % |
| Ville à 20 ans — produits | 90–100 % | 93 % |
| Ville à 20 ans — salaire | ~20 $, le barème | 20,2–21,3 |
| Ville à 20 ans — salaire | ~20 $, le barème | 19,1–20,0 |
| Amplitude des prix | 0,67–1,30 × réf. | 0,83–1,17 |

Les cinq dernières lignes ne sont pas des assertions : elles sont imprimées, pas vérifiées.
Le carnet de chantiers tire au sort entre les occasions qui se valent, si bien que deux
exécutions ne donnent jamais exactement la même ville.

## Ce que la démo couvre

Cinq villes sur une carte de 380 × 265 cases — environ 4 000 par territoire, de quoi
qu'une Métropole soit physiquement possible. 1 joueur et 3 sociétés pilotées par
l'ordinateur. **La partie n'a pas de
terme** : un mois dure dix secondes, et elle court tant qu'on la fait courir.

- **Une seule carte du monde** : cinq villes posées sur un relief, à distance minimale
  garantie, reliées par un réseau ferroviaire où les liaisons se chaînent
- **Bâtiments dessinés** — toits, dents de scie, silos, chevalements — et quartiers de
  vocations distinctes : l'industrie ne cerne jamais l'habitation
- **Cinq villes aux départs différents** — chacune fondée sur un tempérament tiré au sort :
  cité ouvrière, ville de rentiers, comptoir affamé, bourg prospère, friche industrielle.
  Chômage de 25 à 48 %, couverture des besoins, dotation en bureaux — et une ou deux
  filières **en surproduction** selon la ville : cours effondré, stock qui s'entasse,
  ateliers déficitaires en bloc
- **Attractivité par ville** — le seul chiffre qui décide de la population : moyenne des
  trois baromètres × pouvoir d'achat, avec le détail des quatre composantes ville par ville
- **Le marché, marchandise par marchandise** : jauge rouge → vert de ce qu'on peut obtenir,
  stock disponible, cours rapporté à la référence, et la **courbe des cours sur 180 mois**
  en touchant la marchandise
- **Filtres** en dégradé rouge → vert : qualité du sol case par case, baromètres ville par
  ville, et le prix de chacune des douze marchandises sur les cinq villes
- **Fiche complète au clic** : rentabilité, intrants reçus et manquants, production, marge,
  et le terrain sous les fondations — les cinq scores de sol, le prix, le quartier
- **Depuis un logement, la ville** : chômage, jauges de nourriture et de produits
  manufacturés, salaire de case, revenu du ménage et taux d'épargne — un immeuble ne vaut
  que par le pouvoir d'achat de ceux qui l'habitent
- **Racheter** le bâtiment d'un indépendant et **le revendre**, au même prix : terrain au
  cours du jour + 3 années de profit, ces dernières ne comptant que si elles sont positives.
  Le sol est un plancher absolu — sans quoi racheter, démolir et revendre le terrain
  fabriquerait de l'argent. Vente des terrains nus aussi.
- **Faire une offre** sur le bâtiment d'un rival
- **Filtre de rentabilité** par type de bâtiment, sur la même échelle rouge → vert
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
