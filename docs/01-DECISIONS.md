# Arbitrages de conception

Les 31 points relevés à la lecture du document de conception v28, et la décision retenue pour
chacun. Les décisions marquées **[déléguée]** ont été prises par calcul et sont réversibles.

## A — Le socle

| # | Point | Décision |
|---|---|---|
| 1 | §20 fait-il seul foi ? | **Oui.** Seul le monde du §20 est codé. Les §1–19 ne fournissent que des *idées* (enchères, mise en sommeil, valorisation, dette, prises de contrôle) et **aucun chiffre**. |

## B — Les trous du §20, comblés par calcul

| # | Point | Décision |
|---|---|---|
| 2 | Formule des prix | **[déléguée]** `prix ← prix + 0,28 × (réf × tension^0,6 − prix)`, bornes 50–250 %. Tension = besoins réels ÷ production mise en vente ; le stock ne joue **que** sur le service, jamais sur le cours. Le lissage 0,28 est calibré sur la mesure du §20 : 30 % de production détournée donne +19,2 % en 5 mois (le doc annonce +19 %). |
| 3 | Nomenclature des matériaux | **[déléguée]** Table complète en quantités (§3 du barème), dérivée des coûts du §20 aux prix de référence. Les rendements visés sont tous retrouvés à ±0,2 point. La règle « maison = bois + brique, immeuble = brique + acier » est préservée. |
| 4 | Taille des bâtiments | Maison, coupe forestière, mines, carrière : **1 case**. Aciérie et manufacture : **4 cases (2×2)**. Tout le reste : **2 cases**. Logement collectif, bureaux et entrepôt restent à **4 cases (2×2)** conformément au §20 — *à confirmer, voir questions ouvertes*. |
| 5 | Seuils de niveau de ville | 100 / 250 / 500 / 1 000 / 2 000 ménages. |
| 6 | Cadence démographique | **[déléguée]** 0,2 % de la population par mois et par point d'écart au pivot de 80 %, plafonné à ±5 %/mois et par les logements vacants. Une ville à 90 % croît de 2 %/mois, à 85 % de 1 % — le rapport de 2 exigé par le §20. |
| 7 | Échelle monétaire | **[déléguée]** Apport du joueur **1 500 $** → 10 % d'une société de **15 000 $**, 15 000 actions à 1,00 $. De quoi bâtir 4 ou 5 bâtiments modestes, pas un empire. |
| 8 | Gare et rail | Une gare au centre de chaque ville dès le départ. Emprises de voie réservées et visibles. Une société non cotée par liaison, construite par l'ordinateur, date d'achèvement annoncée, accélérable par l'investissement des joueurs (plafond 40 %), **entrée en bourse à l'achèvement**. |

## C — Contradictions tranchées

| # | Point | Décision |
|---|---|---|
| 9 | Viande : double valeur nutritive ? | **Non.** Pain et viande substituables 1 pour 1. La filière élevage est pour l'instant un doublon de la filière céréalière ; à différencier plus tard. |
| 10 | Le ranch consomme-t-il des céréales ? | **Non.** Exploitation sans intrant, comme la ferme. |
| 11 | Seuils démographiques | §20 : nourriture 80 %, emploi 50 %, produits 20 %. Le seuil unique à 15 % du §6 est abandonné. |
| 12 | Salaire | §20 : minimum entre le besoin du ménage et la capacité des employeurs. La formule du §6 est abandonnée. |
| 13 | Les indépendants construisent-ils ? | **Oui**, avec l'épargne des ménages. Le §5 (« ils ne construisent jamais rien ») est abandonné. |
| 14 | Les cinq villes | Aucune ville figée. **Carte générée aléatoirement à chaque partie** : toutes les ressources présentes partout, chaque ville avec une prédominance et deux ou trois ressources nettement plus rares. |
| 15 | Chantier instantané ? | **Non.** Le carnet de chantiers du §20 est conservé — c'est le principal piège de trésorerie du jeu. Le §21 ne parle que de l'absence d'*animation* de chantier : une case terrassée à plat, puis le bâtiment apparaît d'un coup. |
| 16 | Taille de la carte | **64 × 64 cases par ville** (métropole pleine ≈ 3 200 cases, 22 % de marge), cinq territoires espacés, reliés par des couloirs de voie réservés. *La démo navigateur utilise 48 × 48, suffisant pour le format 20 min.* |
| 17 | Les bureaux | §20 : aucun besoin interne, ils louent 20 postes financés de l'extérieur de la carte. Les formules du §7 et du §12 sont abandonnées. |
| 18 | Vote double, seuils 28 / 55 % | **Supprimés** — les chiffres du document étaient de toute façon incohérents entre eux. Le contrôle s'obtient à **plus de 50 % du capital**. Le joueur commence avec 10 % de sa société ; racheté, il peut en refonder une avec son capital personnel. |
| 19 | Prix de référence fixes ou glissants ? | **Fixes.** Le prix de référence est par définition le prix quand demande = offre. La moyenne glissante du §12 est abandonnée — elle aurait cassé les marges en dollars du §20. |
| 20 | Qualité du terrain | Score **1 à 5 par ressource et par case**, distribué selon le relief. Sortie = `base × qualité ÷ 3`. Ne joue que sur l'extraction. |

## D — Équilibrage

| # | Point | Décision |
|---|---|---|
| 21 | Construire double-t-il la mise ? | Les marges du barème sont des **marges de référence**, atteintes seulement à approvisionnement, débouchés et main-d'œuvre nominaux. Un bâtiment mal placé devient déficitaire et vaut moins que son coût. Le multiple de 10 est conservé. |
| 22 | Les bureaux, machine à imprimer ? | Conservés tels quels : leur rendement (11,7 %) reste **le plus faible du jeu**, sous celui d'une unité de production à pleine capacité à bon prix. Ils accélèrent la ville, mais tous les joueurs peuvent investir dans toutes les villes. *À surveiller en test.* |
| 23 | Coût de transport après fusion | **Aucun.** Deux villes reliées = un marché, un prix, sans délai ni coût. |
| 24 | Les fermes tuées par le rail | **Comportement voulu.** Le plancher de prix de revient est *local* ; la fusion des marchés le fait disparaître, la marge brute passe négative, le bâtiment s'arrête de lui-même. C'est le principal risque patrimonial du jeu. |
| 25 | Ressources du format 20 min | Sans objet : toutes les ressources sont présentes dans toutes les villes (voir 14). Le format 20 min se distingue par ses **mécaniques** désactivées, pas par son arbre de production. |
| 26 | Faillite et rachat | **Faillite possible.** Un joueur dont la société est rachetée peut en fonder une nouvelle avec son capital personnel — dividendes et gains boursiers. |
| 27 | Retenir sa production | Possible via un entrepôt : on affecte la production d'un bâtiment à son entrepôt au lieu du marché. |
| 28 | Directeurs | **[déléguée]** Recalculés : contremaître 20 $ / 3 mois, directeur 60 $ / 1 mois, directeur général 150 $ / immédiat. Rentables respectivement à ~8, ~25 et ~60 cases. |

## E — Production

| # | Point | Décision |
|---|---|---|
| 29 | Moteur de la démo | **Web pur** — JavaScript ES modules + canvas 2D, sans build ni dépendance. La simulation est isolée dans `web/js/sim/`, sans une ligne de rendu, pour être portée telle quelle en C# dans Unity. Unity plus tard. |
| 30 | Solo ou multijoueur | Démo **solo** : 1 joueur + 3 sociétés pilotées par l'ordinateur. |
| 31 | Premier livrable | L'économie qui tourne et se lit, avant tout graphisme : baromètres, prix, marges, carnet de chantiers, livre de comptes. |


---

## Refonte de la carte et de l'interface

| Point | Décision |
|---|---|
| Carte | **Une seule carte du monde** de 190 × 130 cases, où les cinq villes sont posées. Plus de carte par ville. |
| Placement des villes | Tiré au sort, avec une **distance minimale de 46 cases** de centre à centre, et un site choisi pour la ressource de la vocation de la ville. |
| Géométrie des villes | Ellipse orientée au hasard, aplatissement et rayon propres à chacune, lisière brouillée par du bruit. Aucune ville n'a le plan d'une autre. |
| Quartiers | Chaque territoire est découpé en taches de Voronoï de quatre vocations — habitation, industrie, négoce, agriculture. Une usine dans un quartier d'habitation est le seul placement vraiment banni ; le reste est découragé, jamais interdit. |
| Relief | Carte d'altitude fractale, ombrée par une lumière rasante du nord-ouest. **Le minerai et le charbon sont dans la roche**, la fertilité dans les plaines : c'est le relief qui décide des ressources, donc de ce qu'il faudra relier. |
| Réseau ferroviaire | Arbre couvrant minimal sur les distances, plus une boucle. **Les liaisons se chaînent** : A–B et B–C valent A–C, sans troisième ligne. La durée d'une ligne est proportionnelle à sa longueur. |
| Niveau de départ | Les cinq villes démarrent à **80 ménages**, donc au niveau 1 (Comptoir), conformément aux seuils retenus (100 / 250 / 500 / 1 000 / 2 000). |
| Bâtiments | **Dessinés**, plus des cases de couleur : toits à deux pentes, dents de scie, silos, chevalements, cheminées. Vu de haut, le toit est la seule surface entièrement visible : c'est là que vit l'identité. Pré-rendus une fois par palier de zoom. |
| Carte plein écran | La carte occupe tout l'écran ; tout le reste flotte au-dessus. Menus en icônes — sur téléphone ils descendent en bas, à portée du pouce. |
| Filtres | Par défaut **on voit les bâtiments**. Les filtres sont un mode qu'on demande. Une seule échelle pour tous : rouge → jaune → vert. Trois familles : par case (fertilité, bois, argile, charbon, minerai, prix du sol), par ville (emploi, salaire, nourriture, produits, logement), et **le prix de chacune des douze marchandises**, ville par ville. |
| Lisibilité du sol | Le sol est peint une fois à un pixel par case dans un canevas hors-écran, puis étiré. Repeindre vingt-cinq mille cases à chaque image mettrait un téléphone à genoux. |

| Prix de départ | **Calculés sur l'offre et la demande de chaque ville**, jamais posés au prix de référence. Le parc de départ suit la vocation de la ville : excédent dans sa spécialité, déficit dans ses deux raretés, la filière alimentaire restant protégée. Dix marchandises sur douze ouvrent à un prix différent d'une ville à l'autre — c'est cette asymétrie qui rend le rail intéressant dès la première minute. |
