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
| Fiche d'un bâtiment | Rentabilité annuelle sur l'échelle commune, résultat du mois, profit sur douze mois, ce qu'il produit, **ce qu'il consomme avec le manquant chiffré**, et **le terrain sous ses fondations** — les cinq scores de sol, le prix actuel, le prix payé, la distance à la gare, le quartier. |
| Racheter à un indépendant | Il vend toujours, au prix du marché **majoré de 20 %**. C'est le raccourci payant : on n'attend pas d'avoir bâti. |
| Offrir à un rival | Curseur de **5 à 15 fois le profit** des douze derniers mois ; sur un bâtiment qui ne gagne rien, de 80 % à 120 % du plancher. **Une seule offre par mois et par adversaire.** La cible refuse librement — une offre sous le marché n'est acceptée que par une société aux abois, ce qui fait du mécanisme un outil de prédation contre les endettés. |
| Filtre de rentabilité | Par type de bâtiment, ou tous. Le bâtiment porte lui-même la couleur, le sol passe en sourdine, et ce qui n'est pas du métier demandé reste en silhouette : c'est ce qui permet de comparer trente scieries d'un bout à l'autre de la carte. Vert calé sur 20 % l'an. |
| Contrôles de publication | `build.mjs` refuse une page contenant une déclaration de module, un fichier absent de la liste, **ou un nom déclaré dans deux modules** — sans portée de module, le second écrase le premier. `verifier-page.mjs` charge la page réelle dans une enveloppe d'hôte hostile et vérifie que la carte est dessinée. |
| Mesure de la rentabilité | **Sur le prix de revient** — terrain et matériaux au prix du jour — jamais sur la valeur de marché. Celle-ci vaut `base + 10 × profit`, si bien que `profit ÷ valeur` tend vers 1/10 quel que soit le profit et ne peut jamais dépasser 10 % : un rendement mesuré ainsi mesure le multiple de valorisation, pas la performance du bâtiment. |
| Échelle du filtre de rentabilité | Sur la **tenue** — le rendement rapporté à celui que le barème assigne au palier (15 / 20 / 25 %, 12 % pour les bureaux). Comparer des pourcentages bruts punirait la coupe forestière pour une promesse qu'elle n'a jamais faite. Vert = le bâtiment tient sa promesse. |
| Rues | **Retirées.** Le §21 en faisait le support de la hiérarchie urbaine ; elles coûtaient 36 % de la surface du centre et ont été jugées plus gênantes qu'utiles. Les villes sont désormais des tissus continus. |
| Durée d'une partie | **Aucune.** Plus de date butoir, plus d'écran de fin, plus de décompte : la partie court tant que le joueur la fait courir. Le sous-titre de la date affiche son rang, le journal est borné à 200 lignes. |
| Contrôle de syntaxe | `build.mjs` vérifie que le script assemblé est du JavaScript valide. Une accolade orpheline passait à travers les trois garde-fous précédents et rendait la page muette. |

---

## Rééquilibrage économique — six défauts trouvés, six corrigés

Le joueur a signalé trois symptômes : des fermes et des coupes forestières à plus de 150 %
de rentabilité, une population qui ne grandissait pas, et une filière lourde à l'envers —
minoteries médiocres, aciéries déficitaires partout, scieries prospères. Les trois avaient
des causes distinctes, et aucune n'était un problème de barème.

| Défaut | Ce qui se passait | Correction |
|---|---|---|
| **Le prix plancher était celui du PIRE producteur** | `declarerRevient` prenait le **maximum** des prix de revient. Sur un marché continental, la mine la plus misérable du continent tirait vers le haut le prix du charbon partout. Ce prix devenait une rente pour toutes les bonnes mines — jusqu'à 90 % de rendement — et ne descendait jamais, si bien que la mine misérable survivait à l'équilibre exact : **890 mines de charbon en vingt ans**, dont 59 % à l'arrêt. Et en aval, l'aciérie payait cette rente sans pouvoir la répercuter. | Le plancher est le coût du **meilleur** producteur : celui sous lequel même le plus efficace vendrait à perte. Au-dessus, c'est la tension qui décide, et aux exploitations mal placées de s'arrêter. |
| **L'usine rationnée payait ce qu'elle ne consommait pas** | Sous la loi du minimum, une aciérie recevant tout son charbon et deux tiers de son minerai produisait aux deux tiers — mais **achetait le charbon en entier**. Le tiers en trop était payé et brûlé. Assez, à lui seul, pour rendre toutes les aciéries déficitaires ; et le charbon retiré du marché sans usage en gonflait le prix, enrichissant les mines de la pénurie qu'elles causaient. | On ne consomme et ne paie que ce qui entre dans le produit. Le reste retourne au marché le mois même. |
| **Le salaire n'était pas le même des deux côtés du livre** | Le bâtiment payait **20 $ par case**, le ménage en recevait **14**. Les six dollars manquants n'allaient nulle part : ils n'existaient pas. Le ménage ne pouvait plus s'offrir son panier, le baromètre des produits tombait à 59 % **sans qu'aucun produit ne manque sur les étals**, et la ville s'installait sur le pivot pour vingt ans. Pire, la cible du salaire était « le panier au prix du jour, plafonné par ce que les employeurs peuvent payer » : moins d'emploi → moins de revenu → prix plus bas → salaire plus bas, une déflation dont rien ne sortait. | Un seul salaire, payé et reçu, **ancré sur les 20 $ du barème** et ne s'en écartant que sous la tension du marché du travail — entre 16 et 30 $. |
| **La ville refusait de loger dès qu'elle réussissait** | Le logement n'était mis au carnet que s'il restait 10 % de mou sur le marché du travail. Or un ménage de plus, ce sont **deux bras de plus** : le logement est le seul bâtiment qui produise du travail au lieu d'en consommer. La condition gelait net la croissance de toute ville arrivée au plein emploi — prospère et bloquée à cent cinquante ménages pendant vingt ans. | On loge tant qu'on peut **nourrir**, et tant que l'emploi ne s'effondre pas (baromètre > 80 %). |
| **Un seul chantier par mois, quelle que soit l'épargne** | `piloterVille` posait au plus un bâtiment par mois, logement compris. Au mois 240 la ville avait accumulé **621 861 $ d'épargne non dépensée**. Ce plafond, et non la cadence démographique, bornait la croissance. | Jusqu'à six chantiers par mois, tant qu'il y a l'argent, les bras et le besoin. |
| **Le goulot se lisait à un seuil absolu** | `remonter` n'allait chercher en amont que si l'intrant dépassait 1,20 × sa référence. Le cas le plus courant passait au travers : de l'acier à 1,18 en face de produits à 0,92. On rebâtissait des manufactures pendant que le minerai criait à 1,81 et que les aciéries tournaient au tiers. Et le charbon comme le minerai n'avaient **aucun chemin direct** vers le carnet de chantiers. | Comparaison **relative** entre le prix d'entrée et celui de sortie ; remontée aussi sur le **taux de service**, pas seulement sur le prix ; et les huit matières premières entrent au tableau des besoins de la ville. |

### Trois règles nouvelles

| Règle | Énoncé |
|---|---|
| **Quatrième — on ne bâtit pas ce qui ne paiera pas** | Le besoin dit quoi bâtir ; le calcul dit si ça vaut la peine **ici, sur ce sol, à ces prix**. Le rendement attendu est calculé au prix qu'aura fait la production **déjà en chantier** — sans quoi tout le monde lit le même prix élevé, ouvre le même atelier le même mois, et la vague arrive ensemble. Si le premier besoin mène à un chantier déficitaire, la ville passe au suivant plutôt que de ne rien faire. |
| **Cinquième — une affaire qui saigne deux ans ferme** | Sans sortie de marché, une filière mal proportionnée le reste pour toujours : la marge brute d'une aciérie rationnée reste positive à pleine capacité, donc l'arrêt automatique ne se déclenche jamais. Une fermeture par ville et par mois — le joueur a le temps de racheter. |
| **La rente foncière se capitalise** | La courbe de sol est resserrée — `0,46 + 0,18 × qualité`, soit 0,64 à 1,36 au lieu de 0,33 à 1,67 — parce que le salaire est un coût **fixe** : un facteur 5 sur l'écart de production devenait un facteur 5 sur la **marge**. Et la bonne terre se paie : le prix d'une case porte un facteur de richesse `0,35 + 0,65 × (qualité / 3)^4`. Sans lui, la meilleure terre était une rente gratuite pour le premier arrivé. |

### Ce que ça donne, sur quatre cartes tirées au sort, à vingt ans

| | Avant | Après | Visé |
|---|---|---|---|
| Coupe forestière | −68 % à +99 % selon le sol | ~25 % | 15 % |
| Ferme céréalière | jusqu'à +150 % | ~28 % | 15 % |
| Mines, carrière | −11 % ou +138 % | 21 à 25 % | 15 % |
| Scierie, minoterie | −1 % à +34 % | 15 à 16 % | 20 % |
| Aciérie | **−12 %, 100 % déficitaires** | ~5 % | 20 % |
| Maison | 12 % | 15 % | 15 % |
| Ménages par ville | 80 → 117 | 80 → ~180 | — |
| Intrants reçus | 44 à 79 % | 96 à 100 % | 100 % |

### Ce qui reste ouvert

L'aciérie et la manufacture campent près de zéro. Ce n'est plus un défaut de comptabilité :
c'est l'**équilibre de long terme d'un marché à entrée libre**. Le prix des produits
manufacturés s'établit là où la manufacture marginale ne gagne plus rien, parce que la
demande est bornée par la population tandis que l'offre ne l'est que par le capital. Les
25 % du barème ne valent qu'au prix de référence, c'est-à-dire quand l'offre égale la
demande — ce que l'entrée libre défait aussitôt. Trois leviers possibles, à trancher :
relever le prix de référence des produits, abaisser le coût de construction de la
manufacture, ou accepter que les derniers maillons soient des affaires de volume et non de
marge. Voir `docs/02-QUESTIONS-OUVERTES.md`.

Second point ouvert : avec le facteur de richesse, une case de fertilité 5 vaut 516 $ au
lieu de 100. Le loyer suit le foncier, donc une maison bâtie sur de la bonne terre coûte
cher à louer — alors que le budget du ménage provisionne un loyer forfaitaire de 5 $. La
rente foncière devrait se capitaliser **par usage** : une maison n'extrait rien du sol.

---

## La fiche d'un logement

| Point | Décision |
|---|---|
| Ce qu'on y voit | Depuis une maison ou un immeuble, la fiche montre **la ville** : taux de chômage, jauge de nourriture, jauge de produits manufacturés, salaire de case rapporté aux 20 $ du barème, revenu du ménage et **taux d'épargne**. |
| Pourquoi | Un immeuble ne vaut que par le pouvoir d'achat de ceux qui l'habitent : le loyer suit le foncier, l'occupation suit la population, et la population suit les trois baromètres. Ces chiffres ne sont pas du décor — ce sont les variables dont dépend directement le revenu du propriétaire. |
| Forme | Trois jauges sur l'échelle commune rouge → vert, le chômage lu à l'envers. |

---

## Le chômage, le salaire, l'épargne : la boucle qui empêchait les villes de grandir

Le joueur a posé le problème dans le bon ordre : les salaires ne permettaient pas de
satisfaire 100 % des besoins, donc l'épargne était nulle sur toute la carte, donc rien ne
s'investissait, donc les villes ne se développaient pas. Et il a écarté la sortie facile —
on ne peut pas baisser le prix des produits manufacturés quand ce sont leurs intrants qui
coûtent le plus cher du jeu.

### L'arithmétique du ménage

Aux prix de référence, le panier vaut **34 $** : 12 $ de ration, 17 $ de produit
manufacturé, 5 $ de loyer. Le revenu vaut `2 employés × salaire × taux d'emploi`.

- Au plein emploi il faut **17 $** de salaire de case. Avec les 20 $ du barème, il reste
  6 $, soit **15 % d'épargne**.
- Les 20 $ ne suffisent plus **en dessous de 85 % d'emploi** — et c'est le produit
  manufacturé qui saute le premier, la nourriture et le loyer passant avant.
- Le plafond, lui, vient de l'employeur : une exploitation n'encaisse que 24 $ de valeur
  ajoutée par case et doit en garder 4 pour tenir ses 15 %. Elle ne peut donc pas payer
  plus de **20 $**.

Le jeu vit dans une bande de trois dollars, 17 à 20, et le barème est calé exactement sur la
borne haute. **L'emploi est donc la seule variable qui reste.**

### Quatre défauts, tous du côté de l'emploi

| Défaut | Ce qui se passait | Correction |
|---|---|---|
| **Les bureaux n'étaient bâtis qu'à la création du monde** | Ils sont pourtant le seul argent qui vienne du dehors — 20 postes qu'aucune entreprise locale ne paie. Une ville qui doublait de population gardait son unique immeuble : la part de revenu extérieur était divisée par deux à mesure qu'elle grandissait. | Ils entrent au carnet de chantiers et y restent : un immeuble pour **40 ménages**. |
| **Un bureau réclamait quatre bras au lieu de vingt** | Le contrôle de main-d'œuvre lisait `def.cases` et non `def.postes`. La ville ouvrait des bureaux qu'elle ne pouvait pas pourvoir. | On compte les postes. |
| **La règle salariale était déflationniste** | Le salaire suivait la seule tension du marché du travail : du chômage le faisait baisser, le ménage s'appauvrissait, n'achetait plus de produits, les prix tombaient, les ateliers fermaient, le chômage augmentait. La boucle était complète et rien n'en sortait — le salaire s'installait à 17 $ pour un panier à 30 $. | Un **plancher de subsistance** : le salaire vise ce qui permet au ménage de boucler son mois et de mettre 6 % de côté, borné par ce que les employeurs peuvent réellement payer. |
| **La densification était impossible** | On ne bâtissait un immeuble que si `stock.acier > 200`. Or sur un marché en juste-à-temps l'acier est consommé le mois même où il sort de l'aciérie : le stock y est structurellement **nul**, même filière à plein régime. La condition n'était jamais vraie. La ville couvrait son territoire de maisons à un ménage la case jusqu'au dernier pouce de terre, puis s'arrêtait avec **quatre millions de dollars d'épargne morte**. | La disponibilité se lit au **taux de service**, jamais au stock. Et quand il ne reste plus un carré de quatre cases libres, la ville **rase quatre maisons d'indépendants** pour dresser un immeuble : vingt ménages là où il y en avait quatre. |

### La loi du chômage d'équilibre

Le plus contre-intuitif est venu en dernier. Agrandir la carte de 190 × 130 à 300 × 210
faisait passer la population de 440 à 1 824 ménages et débloquait les Métropoles — **et le
chômage restait rivé à 30 %, exactement.** Ce n'était donc pas la terre.

> **Le chômage d'équilibre d'une ville n'est pas fixé par ses usines. Il est fixé par le
> seuil d'emploi au-dessous duquel elle cesse de loger.**

Un ménage de plus, ce sont deux bras de plus. Tant que la ville continue de loger, elle
continue d'ajouter des bras, et l'emploi retombe aussitôt sur le seuil qui a autorisé la
construction. L'emploi ne peut jamais s'établir durablement au-dessus de ce nombre : il s'y
colle.

Le seuil était calculé comme le point de bouclage du ménage — `panier ÷ (2 × salaire)`. Le
raisonnement se tenait, mais il était **circulaire** : le salaire de subsistance montait pour
compenser le chômage, ce qui abaissait le seuil, ce qui autorisait plus de logements, ce qui
aggravait le chômage. D'où les 70 % d'emploi imperturbables.

C'est maintenant un objectif et non un point mort : `emploiPourLoger`, à **90 %**. On ne
fait venir des gens que dans une ville qui a du travail à leur donner.

| Seuil | Ménages | Chômage | Nourriture | Produits | Salaire | Épargne | Moyenne |
|---|---|---|---|---|---|---|---|
| 80 % | 381 | **30 %** | 95 % | 74 % | 28,1 $ | 21 % | 80 % |
| 86 % | 264 | 23 % | 98 % | 90 % | 23,9 $ | 12 % | 88 % |
| **90 %** | **202** | **19 %** | **99 %** | **89 %** | **22,7 $** | **12 %** | **90 %** |
| 94 % | 194 | 16 % | 96 % | 97 % | 21,6 $ | 12 % | 92 % |
| 97 % | 199 | 15 % | 100 % | 100 % | 21,3 $ | 7 % | 95 % |

### Ce que ça donne

| | Avant cet échange | Après |
|---|---|---|
| Chômage | 25 à 30 % | **10 à 14 %** |
| Nourriture | 96 % | 100 % |
| Produits manufacturés | 70 à 84 % | 100 % |
| Salaire de case | 17,3 $ (panier à 30 $) | **19,1 à 20,0 $** — le barème |
| Taux d'épargne | **0 %** | 10 % |
| Moyenne des baromètres | 82 % | 95 à 97 % |
| Ménages par ville, à 10 / 20 / 40 ans | 117 / 117 / 117 | **225 / 285 / 338** |
| Exploitations | −11 à +88 % | 13 à 21 % (visé 15) |
| Maison · immeuble · bureaux | 12 % · — · 12 % | 15 % · 20 % · 14 % |

### Ce qui reste ouvert

**La carte est trop petite pour ses propres seuils de niveau.** Les paliers vont jusqu'à
2 000 ménages (Métropole), mais un territoire de rayon 19 — environ 1 100 cases — sature
vers 400 à 600 ménages : au plein emploi chaque ménage réclame deux postes, un poste occupe
une case (cinq pour un bureau), et le logement en prend une de plus. Mesuré :

| Monde | Rayon | Cases par ville | Ménages | Niveaux atteints |
|---|---|---|---|---|
| 190 × 130 | 19 | 864 | 440 | Bourg, Ville |
| 230 × 160 | 25 | 1 554 | 959 | Ville, Grandeville |
| 260 × 180 | 30 | 1 727 | 1 114 | Ville, Grandeville |
| 300 × 210 | 36 | 2 892 | 1 824 | Grandeville, **Métropole** |

Le coût est de 4,6 à 18,6 ms par mois simulé — rien de rédhibitoire quand un mois dure dix
secondes. C'est une décision de conception, pas un correctif : la carte est restée à
190 × 130 en attendant l'arbitrage.

**La scierie, la minoterie et la manufacture restent sous leur cible** (5 à 9 % contre 20 et
25). C'est toujours l'équilibre de long terme d'un marché à entrée libre, décrit plus haut.

---

## Bâtir : l'option qui n'existait pas, et la ville qui doit monter d'un étage

| Point | Décision |
|---|---|
| **Le bug qui rendait la construction invisible** | `menuConstruire` appelait `empriseDepuis(monde, v, c, t)` — quatre arguments contre trois. Le paramètre `type` recevait la case, `BAT[case]` valait `undefined`, et la lecture de `def.h` levait une exception qui emportait toute la fiche. Le joueur qui cliquait une case lui appartenant voyait un panneau vide. |
| **Le mode Bâtir** | Une icône dédiée dans la barre du haut. On choisit le bâtiment **d'abord** — catalogue avec emprise, rendement visé et prix des matériaux au marché local du jour — puis la carte montre elle-même où il peut aller : toutes les cases possibles cerclées d'or, l'emprise exacte en plein sous le doigt. |
| **Le foncier acheté dans le même geste** | On exigeait auparavant de posséder chaque case avant de pouvoir bâtir. Or le joueur commence avec **zéro case** et 15 000 $ : il fallait deviner qu'une case libre de la frontière était achetable, l'acheter, puis la re-cliquer. Deux gestes que rien n'annonçait. `empriseConstructible` accepte désormais les cases vierges touchant la frontière et celles d'un indépendant ; `ouvrirChantier` règle le tout d'un coup. Jamais la terre d'un rival. |
| **Un toucher ou deux** | Un bâtiment d'une seule case se pose au premier toucher. Pour les autres, le premier montre l'emprise et le second la valide — sur un écran tactile il n'y a pas de survol, et poser à l'aveugle un carré de quatre cases n'est pas jouable. |
| **Le volet s'efface** | Défaut découvert au test : sur téléphone le volet couvre 631 pixels sur 830. Le doigt tendu vers la carte retombait sur la liste et **changeait de bâtiment au lieu d'en poser un**. Choisir un bâtiment referme désormais le volet ; le bandeau du haut rappelle ce qu'on pose et offre « Annuler ». |

### La ville monte d'un étage quand la place manque

| Point | Décision |
|---|---|
| **On ne pose plus de pavillon sur les dernières cases** | Une ville à l'étroit qui n'a pas les moyens d'un immeuble **attend** — elle passe au besoin suivant. Chaque maison posée sur les dernières cases libres est un ménage gagné aujourd'hui et vingt perdus demain. |
| **L'étroitesse se mesure sur le quartier d'habitation** | Et non sur le territoire entier : une ville peut avoir des hectares agricoles en friche tout en n'ayant plus où loger personne. Sous 25 % de cases d'habitation libres, on bâtit haut. |
| **L'emploi s'apprécie sur l'état d'APRÈS** | Un immeuble amène vingt ménages d'un coup — quarante bras, zéro poste. Une ville qui vérifiait son taux d'emploi avant de le poser le voyait s'effondrer juste après : 62 à 70 % d'emploi, contre 88 à 90 % attendus. Le contrôle est désormais prospectif, comme le calcul de rentabilité l'est pour les usines. |

Sur des villes volontairement étroites (rayon 12), **55 % de la population finit logée en immeuble**.

### Le seuil de logement, mesuré à nouveau

| Seuil | Ménages à 10 / 20 / 40 ans | Chômage | Produits | Salaire | Épargne | Moyenne |
|---|---|---|---|---|---|---|
| 78 % | 381 / 411 / 410 | 28 % | 73 % | 27,3 $ | 21 % | 81 % |
| 82 % | 327 / 370 / 431 | 25 % | 89 % | 24,7 $ | 13 % | 87 % |
| 86 % | 188 / 208 / 250 | 20 % | 99 % | 21,9 $ | 8 % | 92 % |
| **90 %** | **165 / 205 / 273** | **16 %** | **100 %** | **20,0 $** | 7 % | **95 %** |

À 90 % la population croît encore à quarante ans au lieu de plafonner, et le salaire s'établit
exactement sur les 20 $ du barème sans qu'on le lui ait demandé.

---

## L'attractivité : ce qui fait venir les habitants

Correction du joueur, et elle portait sur le fond : **un immeuble n'ajoute aucun habitant, il
ouvre des logements vides.** La population n'entre que par l'attractivité de la ville ; le
logement en est le plafond, jamais le moteur. Le code faisait déjà cela — `ménages ←
min(ménages × (1 + croissance), capacité)` — mais je l'avais décrit à l'envers, et la règle
qui vérifiait l'emploi « après vingt ménages de plus » reposait sur cette erreur.

### La formule

```
attractivité = ( nourriture + emploi + produits ) / 3  ×  pouvoir d'achat

pouvoir d'achat = revenu du ménage ÷ panier local,  borné à [0,70 ; 1,20]
revenu          = 2 employés × salaire × taux d'emploi
panier          = ration la moins chère + produit manufacturé + loyer

si nourriture < 80 % ou emploi < 50 % ou produits < 20 % :
    croissance = −5 % / mois                    ← exode, quels que soient les autres
sinon :
    croissance = 0,35 × ( attractivité − 0,80 )  ← immigration du DEHORS, bornée à ±5 %/mois

ménages ← min( ménages × (1 + croissance) , capacité de logement )
```

Le pouvoir d'achat vaut 1,00 quand le ménage boucle son mois au centime près. Les trois
baromètres disent si les biens sont **là** ; le pouvoir d'achat dit si le ménage a les moyens
de les prendre. Une ville peut avoir les étals pleins et ne rien valoir — c'est exactement ce
qui arrivait quand le salaire tombait sous le panier.

### Deux flux, et pas un seul

| Flux | Ce que c'est | Poids mesuré |
|---|---|---|
| **Immigration extérieure** | Le moteur. Des gens qui n'étaient pas sur la carte viennent s'installer là où l'on vit bien. Jusqu'à 5 % de la population par mois. | jusqu'à **+5 %/mois** |
| **Migration inter-villes** | L'appoint. 0,6 % de la population est mobile chaque mois et se redistribue entre les villes qu'un **rail achevé** relie, au prorata de leur attrait. Jeu à somme nulle. | **0,18 ménage/mois/ville** |

Le second n'est pas là pour peupler la carte — ce serait un circuit fermé — mais pour donner
au rail un second visage : une ligne n'apporte pas que des marchandises, elle ouvre aussi la
porte aux gens, dans les deux sens. Une ville prospère grignote ses voisines à la marge ;
elle ne les vide pas.

### L'indicateur, dans l'onglet Villes

Les cinq villes classées par attractivité, chacune avec **les quatre composantes** en jauges
rouge → vert — nourriture, emploi, produits, pouvoir d'achat — le mouvement du mois
(immigration extérieure et solde des échanges avec les villes reliées), le salaire et le
panier. Une ville dont les logements sont pleins le dit : « l'attractivité ne peut plus se
traduire en habitants ». Une ville aux logements vides le dit aussi. En dépliant une ville,
le détail complet : revenu, panier, pouvoir d'achat, et la multiplication qui donne le
chiffre final.

### Le verrou qu'il a fallu desserrer

Une fois l'emploi entré dans l'attractivité, la règle « on ne loge que si l'emploi dépasse
90 % » faisait **doublon** : sur-loger se punit désormais tout seul, par la chute de
l'attractivité. Le verrou tenait la population figée à 188 ménages dès le mois 120, avec
100 % d'occupation et une attractivité de 100 % qui réclamait +5 % par mois.

| Seuil | Ménages à 10 / 20 / 40 ans | Attractivité | Chômage | Produits | Occupation |
|---|---|---|---|---|---|
| 62 % | 482 / 496 / 496 | 80 % | 32 % | 64 % | 78 % |
| 70 % | 462 / 473 / 472 | 81 % | 30 % | 66 % | 91 % |
| 78 % | 397 / 404 / 404 | 86 % | 30 % | 75 % | 99 % |
| **86 %** | **212 / 278 / 293** | **98 %** | **19 %** | **96 %** | 100 % |
| 90 % | 181 / 186 / 186 | 99 % | 16 % | 95 % | 100 % |

Retenu : **86 %**. C'est le seul réglage où la population croît **encore** à quarante ans au
lieu de se figer, tout en gardant une attractivité proche de 100 % et un chômage à 19 %.

---

## La contiguïté foncière s'apprécie sur la parcelle, pas sur la case

La règle d'achat était déjà celle que voulait le joueur — `estAchetable` accepte toute case
qui jouxte du sol **vendu**, bâti ou non — et j'ai vérifié qu'on peut enchaîner six achats en
ligne droite sans qu'aucun bâtiment n'entre en jeu. Le blocage était ailleurs, et il était
réel.

| Point | Décision |
|---|---|
| **Le vrai obstacle** | `empriseConstructible` exigeait que **chaque** case d'un bâtiment satisfasse `estAchetable`. Sur un carré de 2×2 posé au bord de la frontière, le coin opposé ne touche rien — et tout le placement était refusé, alors que la parcelle, elle, touchait la ville. |
| **La correction** | Une parcelle est contiguë dès qu'**une** de ses cases jouxte du sol vendu ou une emprise de voie. Le reste vient avec, comme quand on achète un terrain d'un seul tenant. Une case appartenant à un rival reste interdite. |
| **Mesuré** | Une aciérie dont **trois des quatre cases ne touchent rien** se pose désormais. Emplacements possibles au premier mois : 1 191 pour un 1×1, 2 058 pour un 2×1, **2 646 pour un 2×2** — le carré en a davantage que la case seule, puisqu'il peut s'ancrer de quatre façons. |
| **La frontière devient visible** | Le liseré doré des cases achetables ne s'affichait que sous les filtres « prix du sol » et « mes possessions ». Il apparaît maintenant aussi dès qu'on inspecte un terrain : sans le voir, le joueur croit la règle plus dure qu'elle n'est. |
| **Le texte de la fiche** | « Hors de portée » disait « il faut toucher une terre déjà vendue **ou bâtie** », ce qui laissait entendre qu'un bâtiment comptait. Il dit maintenant explicitement qu'un bâtiment n'est pas nécessaire. |

---

## Le prix d'un bâtiment, et le marché qui va dans les deux sens

| Point | Décision |
|---|---|
| **Le prix d'un bâtiment d'indépendant** | `terrain au cours du jour + 3 années de profit`, le profit étant celui des **douze derniers mois réellement écoulés**. On n'achète pas une promesse, on achète un compte d'exploitation. Trois ans, c'est le délai qu'un acheteur accepte de payer d'avance ; au-delà il préfère bâtir. Remplace l'ancien `valeur de marché × 1,20`, qui reposait sur le multiple boursier et n'avait aucun sens pour un actif qui ne se cote pas. |
| **Une affaire ruinée vaut moins que son terrain** | Le profit entre au prix avec son signe. Une ferme à 725 $ de terrain qui perd 73 $/an se rachète **507 $**. C'est ce qui rend les affaires en difficulté intéressantes à ramasser. |
| **Le plancher** | Jamais moins que **la moitié du foncier**. Sous ce seuil il vaudrait mieux raser et repartir — et le sol, lui, garde sa valeur quoi qu'il arrive. |
| **La vente au même prix** | `prixDeCession` **est** `prixRachatIndependant`. Un marché où l'on achèterait cher pour revendre bon marché ne serait pas un marché, ce serait une taxe. Le bâtiment repasse aux indépendants et continue de tourner ; les cases suivent. |
| **La vente d'un terrain nu** | Au prix du marché du jour, **sans la majoration de 20 %** : ce surprix est ce qu'un indépendant fait payer pour vendre hors de son tour, et l'on ne se le verse pas à soi-même. Acheter tôt et revendre quand la ville a grandi reste rentable — c'est le niveau de la ville qui fait le prix, pas la transaction. |
| **Vendre ou démolir** | Les deux boutons côte à côte, et la note dit lequel choisir : vendre quand on veut l'argent, démolir quand on veut la **place**. |
| **Le détail du prix, à l'écran** | La fiche d'un indépendant montre la décomposition en clair — terrain, trois années de profit avec le profit annuel constaté, total — plutôt qu'un chiffre nu. Un joueur qui ne voit pas d'où sort un prix ne peut pas décider. |

Mesuré dans la page publiée : minoterie à 910 $ de terrain et 173 $/an de profit → rachat
**1 429 $**, revente **1 429 $**. Terrain nu acheté 402 $ à un indépendant (335 + 20 %),
revendu **335 $**.
