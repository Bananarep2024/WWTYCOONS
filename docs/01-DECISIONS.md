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

---

## Le sol est un plancher absolu, et la carte s'agrandit

### La machine à billets, repérée par le joueur

La décote que j'avais posée sur un bâtiment déficitaire — jusqu'à la moitié du foncier —
ouvrait un circuit à gain garanti, et le joueur l'a vu avant moi :

> racheter une ferme déficitaire **507 $** alors que ses **725 $** de terrain restent
> intacts · la démolir — la démolition conserve le sol · revendre le terrain **725 $**
> · **+218 $ sortis de nulle part**, à répéter autant de fois qu'il y a d'affaires en
> difficulté sur la carte.

Le raisonnement était faux à la racine : **une exploitation déficitaire ne rend pas son
terrain moins précieux.** Elle ne vaut simplement rien de plus que lui.

```
prix = terrain au cours du jour + max( 0 , 3 × profit des 12 derniers mois )
```

Les trois années de profit ne s'ajoutent que lorsqu'elles sont positives. Une affaire ruinée
se paie au prix de sa terre, ni plus ni moins — l'intérêt de la ramasser reste entier
puisqu'on prend le bâtiment pour rien, à charge de le redresser.

**Vérifié dans la page publiée**, circuit complet racheter → démolir → revendre le terrain,
sur *chaque* bâtiment déficitaire de la carte : **gain maximal 0,00 $**.

### La carte : 380 × 265

Les paliers de niveau vont jusqu'à 2 000 ménages, mais l'ancienne grille de 190 × 130 ne
donnait que ~830 cases par territoire, et une ville y saturait vers 400 habitants. Le calcul
du besoin est direct : au plein emploi chaque ménage réclame deux postes, un poste occupe
une case — cinq pour un bureau — et le logement en prend une de plus. Une Métropole demande
donc de l'ordre de **3 800 cases**.

| Monde | Rayon | Cases/ville | 20 ans | 40 ans | 60 ans | Niveaux atteints |
|---|---|---|---|---|---|---|
| 190 × 130 | 19 | 824 | 246 | 269 | 269 | Comptoir, Bourg |
| 240 × 165 | 26 | 1 323 | 239 | 323 | 366 | Bourg, Ville |
| 290 × 200 | 32 | 1 939 | 373 | 447 | 482 | Bourg, Ville |
| **380 × 265** | **44** | **4 155** | 329 | 481 | 538 | Ville, Grandeville |

Retenu : **380 × 265, rayon 44, distance minimale 94.** Quarante cartes tirées au sort,
**aucun échec** de placement des cinq villes.

Coût mesuré dans le navigateur, sur un écran de téléphone : page prête en **2,35 s**,
**22 Mo** de mémoire, **0,6 ms** par image en vue d'ensemble et **2,1 ms** zoomé — très
au-dessous des 16 ms d'une image à 60 Hz. La simulation coûte **9,8 ms** par mois, quand un
mois dure dix secondes de temps réel.

### Ce que la carte ne résout pas

À cent ans, une ville plafonne à **509 ménages** avec encore **2 918 cases libres** dans son
territoire. La limite n'est donc plus spatiale : la ville cesse d'ouvrir des emplois parce
qu'aucun nouveau bâtiment ne franchit le seuil de rentabilité, l'emploi reste sous les 86 %
qui autorisent à loger, et la population s'arrête là. La Métropole est désormais **possible**
— il faudra un joueur, ou un levier de plus, pour l'atteindre.

### Un bureau prend vingt bras et ne nourrit personne

Le balayage de la densité de bureaux — le seul levier d'emploi fiable, puisqu'ils rapportent
14 % et franchissent toujours le seuil de rentabilité — a révélé une falaise. Sur la carte de
380 × 265, à cent ans :

| Bureaux | 20 ans | 60 ans | 100 ans | Chômage | Attractivité | Cases libres | Niveaux |
|---|---|---|---|---|---|---|---|
| **1/40** (retenu) | 387 | 594 | 617 | 22 % | 99 % | 2 746 | Bourg, Ville |
| 1/30 | 941 | 1 515 | 1 700 | 15 % | 98 % | 1 946 | Grandeville, **Métropole** |
| 1/22 | 2 022 | 3 003 | 3 003 | 16 % | 80 % | 165 | Métropole — mais saturée et figée |
| 1/16 | 0 | 0 | **0** | 100 % | 0 % | 3 952 | **l'économie meurt** |

L'effondrement s'explique : un bureau mobilise vingt bras et ne produit aucune nourriture.
Passé un certain seuil, tous les bras partent au tertiaire, plus personne ne bâtit de ferme,
le seuil critique de nourriture est franchi et la population s'évapore à 5 % par mois.

**Garde-fou, indépendant du réglage retenu** : on ne bâtit un bureau que le ventre plein
(baromètre nourriture > 98 %) et en gardant **15 % des bras** disponibles pour armer la
filière alimentaire. Mesuré après correction : à 1/16, la ville ne meurt plus — elle atteint
1 788 ménages au lieu de zéro. La falaise recule sans disparaître, ce qui suffit : les
réglages jouables en sont très loin.

La densité reste à **1/40**. Passer à 1/30 rendrait les Métropoles atteignables par
l'ordinateur seul et ferait *baisser* le chômage de 22 à 15 % — c'est un arbitrage de
conception, en attente.

---

## Cinq villes qui n'ouvrent pas la partie dans le même état

Cinq villes identiques, c'est cinq fois rien à arbitrer : aucune raison d'aller là plutôt
qu'ici, et un rail qui ne transporte que des marchandises identiques entre des jumelles.

| Point | Décision |
|---|---|
| **Cinq archétypes, pas cinq tirages** | Tirer cinq tempéraments indépendamment les aurait fait se ressembler une fois sur deux. On tire donc cinq **archétypes distincts par construction** — cité ouvrière, ville de rentiers, comptoir affamé, bourg prospère, friche industrielle — et on les mélange. Chacun porte cinq réglages : emploi, vivres, produits, bureaux, part d'affaires bancales, et une taille de départ. |
| **Les bornes ne sont pas libres** | Sous 50 % d'emploi ou 80 % de nourriture, un seuil critique est franchi et la ville se vide de 5 % par mois quoi qu'il arrive. Un tempérament qui descendrait là ne ferait pas une ville difficile, il ferait une ville **condamnée** — mesuré : deux des cinq passaient de 50 à 12 habitants en cinq ans. L'emploi reste au-dessus de 0,68, la nourriture au-dessus de 0,88. Les produits manufacturés, dont le seuil critique est à 20 %, sont là où l'on peut vraiment creuser (0,55 à 1,15). |
| **Le chômage se fabrique par la POPULATION** | La première version ajustait les postes : elle rasait des exploitations jusqu'à ce que l'emploi tombe où il fallait. Catastrophe silencieuse — une ville de rentiers se retrouvait avec vingt bâtiments productifs, donc sans filière, donc tout en déficit, et passait de 49 à **2 ménages**. On ne fabrique pas du chômage en détruisant l'économie. Le parc est ce qu'il est ; c'est le nombre de ménages qu'on ajuste, et le logement se pose en dernier. Une ville qui a attiré plus de monde que son industrie n'en peut employer — c'est exactement l'Amérique de 1900. |
| **Les affaires bancales** | On ne choisit pas un métier pour lui chercher ensuite un mauvais sol : cette version-là posait deux bâtiments sur huit. On cherche l'inverse — **la plus mauvaise terre disponible, tous métiers confondus** — et l'on y met celui qui y perdra le plus. La ferme et le ranch sont privilégiés : deux cases, donc deux salaires pleins pour une production que le sol divise par trois. Un ranch sur de la caillasse encaisse 31 $ et en verse 40, il perd quoi que fasse le marché ; une coupe forestière, elle, redevient rentable dès que le bois se raréfie. |

### Moins d'habitants, villes moins compactes, terrains libres

| Point | Décision |
|---|---|
| **Population de départ** | 80 → **55 ménages**, étirés de 0,80 à 1,20 par le tempérament : de 44 à 66 selon la ville. |
| **Le rayon UTILE** | Le territoire est taillé pour une Métropole — quatre mille cases. Y lâcher un comptoir de cinquante ménages donnait une confiture : des fermes à trente cases de la gare dès le premier mois et un cœur rempli à 17 %. Une agglomération naissante est **dense et petite** ; elle s'étale en grandissant, elle ne naît pas étalée. On compte trois cases par ménage, on prend le rayon du disque correspondant avec 20 % de marge, et une exploitation a le droit de s'en éloigner de 2,2 fois pour suivre sa ressource. |
| **Il ne rétrécit jamais** | Une ville qui perd des habitants verrait sinon son rayon se resserrer sur un tissu déjà bâti, ne trouverait plus où bâtir, et s'enfoncerait — mesuré : une ville passait de 58 à 34 ménages avec son rayon utile rempli à 97 %. Une ville qui décline garde ses rues, elle les laisse se vider. |
| **La dispersion** | Au lieu de toujours prendre l'emplacement optimal — lequel récompense la proximité de la gare, d'où un pâté concentrique sans un pouce de vide — on tire au sort parmi ceux qui s'en approchent à 12 points près. Il reste des **trous** : des terrains libres au milieu de l'habitation, que le joueur peut acheter et où la ville densifiera plus tard. Deux parties sur la même carte n'ont plus le même plan de ville. |

### Mesuré

Huit cartes, quarante villes :

| Tempérament | Ménages au départ | Chômage au départ | Ménages à 20 ans | La pire |
|---|---|---|---|---|
| bourg prospère | 63 | 25 % | 272 | 129 |
| cité ouvrière | 44 | 28 % | 200 | 78 |
| ville de rentiers | 74 | 35 % | 242 | 141 |
| comptoir affamé | 43 | 37 % | 203 | 95 |
| friche industrielle | 63 | **48 %** | 222 | 191 |

**0 ville sur 40 sous 25 ménages à vingt ans** : le contraste ne condamne personne. Et le
tissu urbain : **47 % de remplissage** dans le rayon utile, **54 % des parcelles
d'habitation encore libres**.

Le tempérament est affiché dans l'onglet Villes — « fondée comme friche industrielle » — et
détaillé au dépli.

---

## La surproduction plutôt que le mauvais sol

Correction du joueur sur la fabrication des affaires déficitaires : ce n'est pas en plantant
des exploitations sur de la caillasse qu'on les obtient, c'est en **surconstruisant une
filière**. Si l'offre dépasse la demande, le prix tombe et le stock s'accumule — et tous les
ateliers de la filière perdent de l'argent à la fois, alors qu'aucun n'est mal placé.

Il avait raison sur les deux plans. Le mauvais sol était une propriété **cachée** que rien
n'annonçait, et il ne marchait qu'à moitié : une coupe forestière sur de la caillasse
redevient rentable dès que le bois se raréfie, si bien que les affaires voulues bancales ne
l'étaient plus. La surproduction, elle, se lit sur le marché — cours effondré, stock qui
enfle — et donne au joueur un vrai gisement : une scierie déficitaire dans une ville qui en
compte deux fois trop vaut le prix de sa terre, et redevient excellente le jour où le rail
la relie à une ville qui manque de planches.

| Point | Décision |
|---|---|
| **Une ou deux filières engorgées par ville** | Selon le tempérament : rien pour un bourg prospère, deux pour une friche industrielle. On surconstruit la filière **et son amont** — trop de scieries ne sert à rien sans trop de coupes. |
| **Le rayon de fondation anticipe le parc** | Défaut trouvé au test : le rayon utile se calcule sur la population, et la population n'est fixée qu'à la fin, une fois les postes comptés. Le parc se bâtissait donc dans le rayon d'un hameau, la surcapacité ne trouvait pas un pouce de terre libre et **ne se posait tout simplement pas** — zéro effet mesuré. On amorce le rayon sur ce que la ville va peser. |
| **Mesuré** | Filières engorgées à 18 mois : cours de **0,75 à 0,93 ×** la référence, stocks de **338 à 1 401**, et jusqu'à **3 aciéries sur 3** en perte. Les filières saines restent entre 0,96 et 1,25. |

## Le marché, marchandise par marchandise

| Point | Décision |
|---|---|
| **Une carte par marchandise** | Le tableau à quatre colonnes disait tout et ne montrait rien. Chaque marchandise a maintenant sa carte : nom, prix, cours rapporté à la référence, **jauge rouge → vert**, stock disponible, taux de service. |
| **Ce que mesure la jauge** | Ce qu'on peut **obtenir** — le taux de service. Rouge : la marchandise manque et les ateliers s'arrêteront au premier accroc. Vert : on en trouve autant qu'on en demande. C'est la seule lecture qui commande une décision ; le prix, lui, est donné en chiffre à côté. |
| **La pastille « engorgé »** | Cours sous 0,90 × la référence **et** plus de 200 unités en stock : la signature d'une surproduction. C'est l'endroit où chiner. |
| **La courbe des cours** | Toucher une marchandise déplie sa courbe sur 180 mois, avec le prix de référence en trait doré, le plus bas, le plus haut et le cours du jour. Un instantané ne dit rien : un cours à 0,85 peut être une filière qui s'effondre ou une pénurie qui se résorbe, et les deux appellent des décisions opposées. |
| **L'historique** | `Marche.histoPrix` conserve 180 mois par marchandise, écrits à chaque fixation de prix. |

---

## Un bureau pour trente ménages

Le cadran de la croissance, poussé de 1/40 à **1/30** sur décision du joueur. Les bureaux
sont le seul argent qui vienne du dehors — vingt postes qu'aucune entreprise locale ne paie —
donc le seul moyen d'employer une population que l'industrie locale ne peut pas absorber.

Balayage sur six cartes et cent ans, avant les départs hétérogènes :

| Bureaux | Ménages à 60 ans | Chômage | Nourriture | Attractivité | Cases libres | Niveaux |
|---|---|---|---|---|---|---|
| 1/40 | 349 | 18 % | 97 % | 99 % | 3 388 | Bourg, Ville |
| 1/34 | 591 | 16 % | 100 % | 99 % | 2 672 | + Grandeville ×3 |
| **1/30** | **1 300** | **15 %** | 100 % | 100 % | 1 772 | **Métropole ×3** |
| 1/26 | 2 944 | 15 % | 99 % | 91 % | **158** | tout saturé |
| 1/22 | 2 425 | **30 %** | **80 %** | 67 % | 716 | l'économie décroche |

Le contre-intuitif : **le chômage baisse** quand on ajoute des bureaux. Un immeuble amène
vingt postes et pas un seul habitant — c'est le logement qui amène les habitants, et il ne
se construit qu'au-dessus de 86 % d'emploi. Passé 1/22 la chose se retourne : les bras
partent tous au tertiaire, plus personne ne bâtit de ferme, le seuil critique de nourriture
est franchi. Le garde-fou alimentaire — on ne bâtit un bureau que le ventre plein, et en
gardant 15 % des bras — protège cette borne.

Mesuré à 1/30 avec les départs hétérogènes et la carte agrandie :

| | 20 ans | 40 ans | 60 ans |
|---|---|---|---|
| Ménages par ville | 612 | 814 | 874 |

Chômage 16 %, nourriture 100 %, produits 94 %, attractivité 98 %, salaire 21,2 $ — et encore
**2 538 cases libres** par territoire. Sur la partie de référence, les cinq villes passent
de 55 ménages à 618–1 063 en vingt ans : quatre au niveau **Ville**, une **Grandeville**.

---

## Le centre se convoite par la pente, pas par le taux

Le rendement d'un logement est le même partout à tout instant, et c'est un équilibre, pas un
défaut : le loyer étant indexé sur le foncier — `rdt × (terrain + construction) / 12 +
entretien` — il s'ajuste et le taux ne bouge pas. Un rendement central supérieur serait
d'ailleurs **instable** : tout le monde y achèterait jusqu'à ce que le prix du sol remonte et
ramène le taux à l'équilibre.

Ce qui distingue le centre, c'est la **pente**.

### L'atténuation se durcit avec le niveau de la ville

`attenuationDistance` était une constante — 0,04 quel que soit le palier. Le rapport centre /
périphérie restait donc figé pour toujours : quand la ville montait d'un cran, tout le monde
était multiplié par le même nombre. Or dans un hameau le centre ne vaut guère plus que la
lisière, tandis que dans une métropole il vaut vingt fois plus.

```
attenuation[n] = 0,028 × facteurNiveau[n]   →   [0,0280 · 0,0364 · 0,0504 · 0,0728 · 0,1120]
```

**La proportionnalité n'est pas cosmétique : c'est elle qui garantit qu'aucune case ne perd
jamais de valeur.** Une première version montait plus vite — 0,020 à 0,130 — et une case de
lisière passait de 271 à 257 $ au passage au Bourg. « Mon terrain vaut moins parce que la
ville a grandi » est exactement ce qu'un joueur ne doit jamais lire. Le banc d'essai vérifie
désormais cette monotonie sur les quatre paliers et soixante distances : le plus faible gain
mesuré est de **+7 %**.

| Distance | Comptoir | Bourg | Ville | Grandeville | Métropole | **Potentiel** |
|---|---|---|---|---|---|---|
| 0 — la gare | 100 $ | 130 $ | 180 $ | 260 $ | 400 $ | **×4,00** |
| 5 | 88 $ | 111 $ | 148 $ | 205 $ | 256 $ | ×2,92 |
| 10 | 78 $ | 96 $ | 124 $ | 164 $ | 189 $ | ×2,42 |
| 20 | 64 $ | 76 $ | 94 $ | 118 $ | 124 $ | ×1,93 |
| 30 | 54 $ | 63 $ | 75 $ | 91 $ | 92 $ | ×1,68 |
| 45 — la lisière | 44 $ | 51 $ | 60 $ | 71 $ | 66 $ | **×1,49** |

### Ce que ça donne pour un propriétaire

| Maison bâtie au Comptoir et conservée | Loyer Comptoir | Loyer Métropole | **Rendement sur coût historique** |
|---|---|---|---|
| Contre la gare | 5,00 $ | 8,75 $ | **31,1 %** |
| À 10 cases | 4,73 $ | 6,11 $ | 21,4 % |
| À 30 cases | 4,43 $ | 4,90 $ | 17,4 % |
| À 45 cases | 4,30 $ | 4,58 $ | **16,5 %** |

Celui qui **achète aujourd'hui** en Métropole touche 15,0 % partout : le taux ne bouge pas.
La récompense n'est pas un meilleur rendement, c'est d'avoir bâti tôt et tenu.

### Et l'industrie s'en va d'elle-même en périphérie

Une recette d'atelier ne dépend pas du sol — le terrain qui monte ne fait qu'alourdir son
prix de revient :

| Scierie | Comptoir | Métropole |
|---|---|---|
| Au centre | 19,9 % | **13,8 %** |
| À 45 cases | 21,7 % | 21,0 % |

Six points perdus au centre, sept dixièmes à la lisière. **Aucune règle d'urbanisme n'est
nécessaire : l'économie range la ville toute seule**, et racheter l'atelier vieillissant du
centre pour le démolir et bâtir des logements devient une opération rentable.

### La jauge

`potentielTerrain(niveau, distance, richesse)` = ce que la case vaudra en Métropole rapporté
à ce qu'elle vaut aujourd'hui. Elle apparaît à trois endroits :

- **un filtre de carte**, « Potentiel de valorisation », sur l'échelle commune rouge → vert ;
- **la fiche d'un terrain**, avec le prix d'aujourd'hui, celui du palier suivant et celui de
  la Métropole ;
- **la fiche d'un bâtiment**, avec un texte qui change selon la catégorie — *« votre loyer
  suivra »* pour une résidence, *« seul votre prix de revient suivra, donc votre rendement
  baissera »* pour un atelier. C'est là que le joueur comprend l'asymétrie sans qu'on la lui
  explique.

### Le loyer provisionné devient le loyer réel

Le budget du ménage retenait **5 $ forfaitaires** quand le loyer suit le foncier — jusqu'à
8,75 $ au centre d'une Métropole. Tant que le gradient était plat l'écart restait anecdotique ;
il devient matériel, et le ménage paierait un loyer que son panier n'a pas prévu, faussant
silencieusement le pouvoir d'achat, donc l'attractivité, donc la démographie. `loyerMoyen(v)`
calcule la moyenne pondérée réellement pratiquée dans la ville, et remplace le forfait dans
le panier, dans le budget et dans le salaire de subsistance. Mémorisé au mois : il est
demandé cinq fois par ville et par mois, plus une fois par image quand le volet des villes
est ouvert.

---

## Les emprises de voie, réservées et visibles

La réservation existait déjà côté simulation : `tracerVoie` marquait `c.voie = true` sur tout
le tracé, et `estAchetable`, `trouverEmplacement` et `empriseConstructible` refusaient ces
cases. **Vérifié : 880 cases réservées, zéro bâtiment dessus au départ comme à soixante ans.**

Ce qui manquait était le rendu. `dessinerVoies` tirait **un trait droit entre les deux
gares** — alors que l'emprise réelle est un escalier doux qui passe à côté de la moitié de ce
trait. Le joueur ne pouvait donc pas savoir quelles cases étaient réservées, ni acheter
autour en connaissance de cause.

| Point | Décision |
|---|---|
| **On dessine les cases, pas un trait** | `tracerVoie` renvoie désormais l'emprise **dans l'ordre**, de la gare de départ à celle d'arrivée, et la liaison la conserve. Le rendu peint chaque case. |
| **La ligne se pose depuis les deux gares** | Chacune avance vers l'autre. Ce qui est posé est doré, ce qui reste est gris — on voit le chantier progresser, et l'on voit son propre investissement le faire avancer d'un coup. |
| **Le gris doit se lire dès le premier mois** | C'est lui qui annonce où la ligne passera, donc où acheter avant tout le monde. Porté à 46 % d'opacité sur un gris clair. |
| **Un plancher de largeur** | À la vue d'ensemble une case fait deux pixels ; une emprise dessinée à 62 % de cela disparaissait. Minimum 1,8 pixel. |

---

## La bourse : un PER endogène et des compagnies de chemin de fer

### Le PER est un prix, formé comme tous les autres

`get multiple()` renvoyait 5, 10 ou 15 selon un `climat` qui n'était **jamais réassigné** :
une constante déguisée en fonction en escalier. Le multiple se forme désormais par la même
tension que tous les prix du jeu :

```
tension = capitaux cherchant un placement ÷ bénéfices annuels des sociétés COTÉES
PER ← PER + 0,04 × ( 10 × tension^0,6 − PER )        borné à [4 ; 22]
```

Les capitaux viennent de l'épargne des ménages, dont **30 %** sont désormais dirigés vers le
marché au lieu de bâtir la ville. C'est le prix à payer pour avoir une bourse, et c'est aux
sociétés des joueurs de prendre le relais de la construction.

Le cycle **émerge** sans qu'aucun drapeau ne soit piloté, et pour une raison précise :
l'épargne est un **résidu** — ce qui reste une fois le panier payé — donc la grandeur la plus
volatile du modèle, mesurée entre 0 et 21 % du revenu selon la conjoncture. Elle monte bien
plus vite que les bénéfices en haut de cycle et s'évapore bien plus vite en bas.

Mesuré sur trois parties, du mois 60 au mois 480 : **minimum 7,3 · médiane 9,8 · maximum
19,4**. Le lissage à 0,04 fait qu'un multiple de marché se déplace en années, pas en mois.

### Le multiple quitte le bâtiment pour la société

Il s'appliquait **bâtiment par bâtiment**, ce qui empilait autant de goodwills qu'il y avait
de murs. Une société se valorise une fois, globalement :

```
actif net = trésorerie − dette + Σ (terrain + valeur bâtie) + chantiers + parts ferroviaires
cours     = ( actif net + PER × bénéfice annuel ) ÷ actions
```

Et `Batiment.valeur(multiple)` devient `valeurDeCession` — terrain plus trois années de
profit — c'est-à-dire exactement le prix auquel un indépendant cède son bien. Un bâtiment ne
se cote pas : il se vend.

### Une liaison EST une société

| | Pendant les travaux | Après l'ouverture |
|---|---|---|
| **État** | non cotée | **cotée** |
| **Action** | 10 $, au franc le franc | `(capital nominal + PER × bénéfice) ÷ actions` |
| **Recette** | aucune | péage sur le trafic |
| **Ce qu'on fait** | souscrire — chaque tranche avance la date | encaisser le dividende |

Le capital nominal vaut **150 $ la case de longueur** ; ce que les joueurs ne souscrivent pas
est porté par un consortium extérieur, apporté le jour de l'introduction. La compagnie vit
ensuite d'un **péage de 1 %** sur le chiffre d'affaires du marché qu'elle dessert, au prorata
de la longueur de rail qu'elle a posée — ce qui règle proprement la connexité transitive :
A–B et B–C forment un seul marché, et les deux compagnies s'en partagent le trafic.

Le péage est **prélevé sur les producteurs** à la vente, comme un frais de port : rien n'est
créé. Un marché d'une seule ville ne paie rien, n'étant desservi par aucune ligne.

Mesuré sur une ligne de 136 cases : capital nominal 20 400 $, recette 182 $/mois, entretien
68 $, bénéfice **1 512 $/an — 7,4 % du nominal**, délibérément sous les 15 à 25 % d'un
bâtiment. Le rail est l'actif sûr : régulé, monopolistique, sans loi du minimum ni pénurie
d'intrants.

**Une souscription de 5 000 $ à la première ligne vaut ×2,48 au bout de quarante ans** — et
l'on souscrit en aveugle, cinquante mois avant l'ouverture, sans savoir lesquelles des cinq
villes auront grandi.

### Deux défauts trouvés au test

- `l.beneficeAnnuel` et `l.cours` étaient référencés sans jamais être définis : tout le PER
  passait à `NaN` dès la première introduction en bourse.
- Une ligne préexistante — `l.actions = Math.max(1000, l.capital)` — écrasait le calcul des
  actions juste après l'introduction, donnant dix fois trop de titres. La part d'un
  souscripteur de 6 000 $ tombait à 1 428 $ au lieu de monter à 14 672 $.

### Ce que le joueur voit

Un onglet **Bourse** : le PER du marché avec sa courbe sur 180 mois, les capitaux dirigés
vers le marché ce mois-ci, les bénéfices cotés et la tension — puis une carte par société et
une carte par compagnie ferroviaire, avec cours, capitalisation, bénéfice, part détenue et
sa valeur. En travaux, la carte porte le bouton de souscription et le compte à rebours ;
cotée, elle porte la courbe du cours.

---

## Les événements, et le bug qu'ils ont révélé

Huit accidents peuvent frapper la carte : sécheresse, récolte exceptionnelle, vague
d'immigration, grippe espagnole, grève, krach, crise, boom. Le barème (§13) donne les poids,
les durées et les ampleurs.

### Un événement ne mute rien

C'est la seule décision d'architecture qui compte ici. Un événement **ne touche jamais l'état
du monde** : il s'inscrit dans `monde.evenements` et la simulation lit ses modificateurs là où
ils s'appliquent — quatre lecteurs, quatre points d'application, et rien d'autre :

| Lecteur | Lu par | Ce qu'il change |
|---|---|---|
| `facteurSol(monde, ville)` | `Batiment.capacite` | ce que rend une terre |
| `facteurGreve(monde, ville, cat)` | `Batiment.produire` | le régime d'un atelier |
| `orientationEpargne(monde)` | le partage de l'épargne | brique, titre, ou rien |
| `salaireExige(monde, ville)` | `ajusterSalaire` | le plancher que réclame la grève |

Quand un événement expire, il disparaît de la liste et tout revient de soi-même. Aucun code de
« défaire ». Les seules exceptions sont les mouvements de population, appliqués une fois : une
épidémie qui a emporté des gens ne les rend pas, et il n'y aurait aucun sens à ce qu'elle le
fasse à sa date de fin.

La conséquence pratique : ajouter un neuvième événement, c'est écrire une entrée de catalogue
et, si son canal est nouveau, un lecteur de plus. Jamais une branche dans la boucle du mois.

### La grève est le seul événement qui se négocie

Les autres durent le temps qu'ils durent. La grève, elle, réclame **+14 % sur le salaire de la
ville** et s'arrête dès qu'elle l'a obtenu. Elle ne peut pas forcer un employeur à payer ce
qu'il n'encaisse pas — le plafond de capacité tient toujours, et une grève qui exige plus que
la ville ne peut donner ira jusqu'à son terme sans rien obtenir.

C'est ce qui en fait autre chose qu'un malus : le joueur peut y répondre.

### Le bug que la mesure a mis au jour

Le premier banc d'essai comparait le même monde avec et sans événement forcé. Les colonnes de
référence étaient **différentes d'une ligne à l'autre** — le même monde témoin, rejoué, ne
donnait pas le même résultat.

Trois `Math.random()` traînaient dans `ai.js` et deux dans `world.js` : le choix de la filière
surconstruite au départ, la dispersion des implantations, et les arbitrages où deux acteurs qui
lisent le même marché ne doivent pas ouvrir le même chantier. Chacun se justifiait — mais tous
tiraient hors de la graine.

La partie n'était donc **pas reproductible**, et le banc d'essai mesurait le bruit. Sur la
graine du contrôle, deux exécutions donnaient 1 383 et 742 ménages pour la même ville : un
facteur deux, attribué à tort aux événements. Le contrôle affichait au passage un baromètre
produits à 74 % qui n'existait pas.

Le monde porte maintenant `monde.hasard`, tiré de la graine, et c'est lui que tout le monde
consulte. Trois exécutions de la même graine donnent la même carte au ménage près.

**La leçon est générale** : une simulation qu'on ne peut pas rejouer à l'identique ne se mesure
pas. Le premier travail avant d'ajouter quoi que ce soit d'aléatoire, c'est de rendre l'aléa
reproductible.

### Ce que cela fait, une fois mesuré

Sur trente ans et huit graines, les événements coûtent **0,5 % de population** — ils secouent
sans saigner. Localement c'est autre chose : une sécheresse dure met les céréales à +74 % et le
pain à +52 %, un krach met la bourse à zéro pendant quinze mois, un boom la multiplie par
trois. La couverture est de 30 % des mois : un joueur passe le tiers de sa partie avec quelque
chose en cours.

L'équilibre voulu est celui-là. Un événement doit créer une occasion et un danger, pas un impôt
permanent qui n'appelle aucune décision.

### Ce que le joueur voit

Une rangée de pastilles sous la barre, toujours à l'écran tant que quelque chose court : signe,
nom, ville touchée, mois restants. Une sécheresse qu'on n'a pas vue venir n'est pas une
difficulté, c'est une injustice.

Chaque pastille ouvre le volet **Ce qui arrive** : pour chaque événement en cours, sa jauge
d'avancement, son texte, et surtout **le canal exact par lequel il touche l'économie** — un
événement qu'on subit sans comprendre ce qu'il fait n'apprend rien. Le volet garde ensuite la
chronique des quatorze derniers, et reste accessible depuis l'onglet Villes.

---

## Des zones, enfin : la vocation cesse d'être décorative

`PROFILS` déclarait depuis toujours, pour chaque ville, une prédominance et **deux raretés**.
La prédominance servait à choisir le site. Les raretés n'étaient lues **nulle part** — un champ
mort dans une table qu'on relisait sans le voir.

Conséquence mesurée sur 200 villes tirées sur 40 cartes : **81 % avaient au moins une case
excellente dans les cinq ressources à la fois**, et 96 % pour le charbon seul. Le sol sortait
du même bruit fractal partout ; le choix du site garantissait un bon score sur la vocation, et
le bruit offrait les quatre autres par-dessus le marché.

Une carte où personne ne manque de rien est une carte où personne n'a de raison d'échanger. Le
rail y transportait des marchandises que l'autre bout produisait déjà.

### La règle

Deux ressources à 5, une à 3 ou 4, deux à 1 ou 2 — barème §6 bis. Les `rares` prennent enfin
les deux plafonds bas.

### Trois essais pour trouver la bonne application

1. **Pondération en 1/d^2,2 depuis les cinq villes.** À la lisière d'un territoire — 44 cases
   du centre, 50 de la ville d'à côté — la voisine pesait encore 43 %. Tous les plafonds bas
   remontaient. Conformité : 8 %.
2. **Pondération gaussienne.** Mieux, pas assez : 10 %.
3. **Appartenance au territoire.** Le découpage existe déjà à ce stade du générateur — autant
   s'en servir. Plafond net à l'intérieur, dégradé gaussien seulement sur la terre vierge de
   l'entre-deux, celle que les villes atteindront en grandissant. Conformité : **99 %.**

La leçon : quand une donnée exacte existe (l'appartenance), interpoler une approximation
continue (la distance) est un contresens, même quand l'interpolation semble plus « naturelle ».

### Le défaut qui a coûté les deux premiers essais

Le vrai coupable n'était pas la pondération. En extrayant la valeur brute du calcul des
qualités, la borne et le biais de relief avaient été **intervertis** :

```js
Math.max(1, Math.min(5, bruit) * biais)      // faux : borne d'abord
Math.max(1, Math.min(5, bruit * biais))      // juste : biais d'abord
```

Une montagne multiplie le minerai par 1,6. Borner d'abord laissait donc passer des valeurs
brutes jusqu'à 8, que l'étirement sous plafond ramenait à 5 quel que soit le plafond. Les
vocations pauvres ne pouvaient pas tenir. Corrigé, la conformité est passée de 10 % à 99 % sans
toucher à la pondération — les deux premiers essais avaient diagnostiqué la mauvaise cause.

### Le plafond étire, il ne coupe pas

`q = 1 + (brut − 1) × (plafond − 1) / 4`. Une case médiocre reste médiocre, une case excellente
atteint tout juste le plafond, et le relief continue de se lire à l'intérieur de la zone. Une
coupe franche aurait donné des plateaux uniformes.

### Ce que ça coûte

La croissance des vingt premières années ralentit — le temps que les marchés fusionnent, entre
les mois 50 et 54. Sur 8 cartes : 256 ménages par ville à 10 ans, 813 à 20 ans, 1 425 à 30 ans.
Aucune ville en crise, aucune ville morte, le palier de Métropole atteint. Le prix des denrées
monte de 7 à 31 % selon la marchandise : la rareté est enfin réelle.

C'est le prix voulu. Une ville pauvre en minerai fabrique quand même son acier — elle creuse
trois à six fois plus de trous pour le même résultat, et souffre jusqu'à ce que le rail arrive.
Après quoi elle se spécialise : mesuré, une ville pauvre en minerai finit à 0 mine, 12 aciéries
et 20 manufactures — elle importe et transforme. Sa voisine fait l'inverse. Personne n'a
programmé cet avantage comparatif ; il sort du seul jeu des prix.

---

## Le sol se paie ce qu'il rend, et la carte se nourrit

Deux défauts découverts en tirant le fil d'une observation de jeu : « toutes les villes avaient
un centre rouge donc cher, sauf une qui montrait l'inverse ».

### La prime foncière valait sept fois la rente

`prixTerrain` portait un barème de richesse séparé — plancher 0,35, exposant 4 — qui étalait le
prix de la terre sur un rapport de **15** entre la pire et la meilleure. Le rendement, lui, ne
varie que d'un rapport de **2,1** (`0,64` à `1,36`). Une terre riche était donc un placement
calamiteux et une terre pauvre une aubaine.

Le défaut dormait depuis toujours : tant que 81 % des villes avaient les cinq ressources en
excellent, le terme était une quasi-constante et seule la distance se voyait. Les vocations
l'ont réveillé — mesuré, **58 % du prix venait de la richesse contre 42 % à la distance**, si
bien qu'une case de lisière posée sur un bon filon coûtait plus cher qu'une case du centre sur
une terre pauvre. Six pour cent des villes affichaient un centre bon marché.

Le correctif supprime le barème plutôt que de le régler : `fq = facteurQualite(richesse)`. Le
facteur de richesse **est** la loi de rendement. Deux paramètres disparaissent, et l'énoncé
devient exact — le sol se paie ce qu'il rend. La distance explique désormais 76 % du prix, et
plus aucune ville n'a le centre inversé. Les assertions foncières du banc d'essai passent sans
retouche : elles se lisent à la richesse 3, où le facteur vaut 1 par construction.

Trois contrôles verrouillent la loi pour qu'elle ne dérive plus : la prime foncière de la
meilleure terre, son égalité avec la prime de rendement, et le fait que la distance pèse plus
que la richesse.

### Les cartes qui ne pouvaient pas se nourrir

Le correctif précédent rendait la terre riche bien moins chère, donc la construction plus
rapide, donc les villes plus grosses — et cinq villes sur trente passaient sous le seuil
critique de nourriture à trente ans.

Le diagnostic a d'abord semblé local, puis s'est révélé global. Les villes affamées avaient
**exactement le même sol et le même nombre de fermes** que les repues : fertilité 3,2 contre
3,3, 149 fermes contre 144. Ce n'était donc pas la ville qui manquait de terre.

C'était la carte. Chaque ville tire deux ressources riches : la première est sa prédominance —
et comme les cinq profils ont cinq prédominances distinctes, chaque ressource est riche au
moins une fois. La **seconde** se tirait ville par ville, indépendamment. Quand aucune des deux
villes libres de leur second choix ne le donnait à la fertilité, le continent entier ne comptait
qu'une seule ville nourricière, et il ne pouvait pas se nourrir.

Les seconds emplacements sont désormais **répartis** par couplage : cinq villes à deux
emplacements font dix places pour cinq ressources, le compte tombe juste, et un couplage
complet existe toujours sur les profils du jeu. On explore en profondeur dans un ordre tiré au
sort — deux cartes ne se ressemblent pas — avec repli sur un choix libre quand la partie compte
moins de cinq villes.

Mesuré sur 40 cartes : chaque ressource est riche dans exactement deux villes, sans exception.
La nourriture finale passe de 91 % à **99 %**, plus aucune ville ne franchit le seuil critique,
et la population croît de ×3,18 à ×3,79 entre quinze et trente ans.

### Ce qui reste, et qui est voulu

5,6 % des mois-ville se passent en crise, dont 88 % pour la nourriture. Ce ne sont pas des
villes malades mais des épisodes de croissance : la population dépasse ses vivres, le baromètre
plonge, la ville se vide un peu, puis les fermes rattrapent. Une économie qui ne connaîtrait
jamais ce cycle n'aurait rien à arbitrer.


---

## Une compagnie, une ligne à la fois

Le réseau se construisait en parallèle : cinq liaisons en travaux dès le premier mois, chacune
sa propre société, quatre introductions en bourse la même année. Le rail n'était pas une affaire
qu'on suit, c'était un décor qui se déployait tout seul.

Il n'y a plus qu'**une compagnie**, qui pose ses lignes **l'une après l'autre**. Le chantier
ouvert est le seul qu'on puisse financer ; le suivant ne commence qu'une fois celui-ci livré. La
compagnie entre en bourse le jour de sa première ligne, et chaque ligne suivante grossit son
capital nominal.

L'objet `compagnie` porte délibérément les mêmes champs qu'une liaison d'autrefois — `parts`,
`actions`, `cours` — de sorte que la société et les panneaux de bourse la lisent sans rien
changer à leur code.

### Le chantier n'est daté qu'à son ouverture

`date` reste nulle tant que les travaux n'ont pas commencé. Dater d'avance des travaux qui n'ont
pas d'ouvriers ferait courir un compte à rebours sur une ligne dont rien ne bouge.

### La durée d'un chantier a dû être divisée par trois et demi

Les durées ne se recouvrent plus, elles s'additionnent. À l'ancien réglage — 0,42 mois la case —
le réseau ne s'achevait qu'entre les mois **312 et 366**, et une ville restée isolée vingt-cinq
ans finissait par mourir : mesuré, **trois graines sur quatre perdaient une ville**, dont
Plaine-Dorée tombée à zéro habitant.

À **0,12 mois la case**, le premier train roule vers le mois 25, le réseau est complet vers le
mois 135, et aucune ville ne meurt sur aucune des graines essayées. Une ligne tous les vingt
mois : assez rare pour que chaque ouverture compte, assez fréquent pour qu'on la voie venir.


---

## Le marché sert le local d'abord

Question posée en jouant : « lorsque deux villes sont reliées, ce qui est produit localement
alimente-t-il en priorité l'économie locale, le surplus seul étant exporté ? »

La réponse était **non**. Un `Marche` fusionné tenait un seul stock, une seule demande agrégée et
un seul taux de service ; `prendre()` servait tout le monde au même prorata sans regarder qui
avait produit. Une ville qui sortait tout le blé de la région était rationnée exactement comme sa
voisine qui n'en produisait pas un grain. Le rail ne reliait pas deux économies, il les fondait
en une seule bouillie.

### Le grand livre par ville

Le marché tient maintenant un livre par ville — stock, besoins, entrées, taux de service — et
sert en deux passes : d'abord chacun sur sa propre production, puis le surplus des excédentaires
partagé au prorata entre ceux qui manquent.

Le stock **appartient à la ville qui l'a produit**, y compris au moment de la fusion. Additionner
les réserves en un tas commun aurait dépossédé le producteur à l'instant précis où la ligne
s'ouvre, c'est-à-dire au moment où la priorité locale compte le plus.

### Le prix reste régional, et c'est un choix

Un marché relié a **un** cours : c'est ce qui le définit. La priorité locale décide de qui obtient
la marchandise, jamais de ce qu'elle coûte. Fragmenter aussi les prix aurait voulu dire cinq
cotations par marchandise, cinq courbes, cinq tensions — un modèle plus riche, mais qui aurait
retiré au rail sa fonction la plus lisible : faire converger les prix.

### Ce que ça donne

Au mois 200, sur un marché de cinq villes tendu à 92 % sur les produits manufacturés : les trois
villes qui produisent plus que leurs besoins sont servies à 100 %, Sainte-Agathe à 96 %, et
Fort-Union — qui produit 478 pour 678 de besoin — à 70 %, complétée par un pot commun servi à
22 %. Sous l'ancien modèle, les cinq auraient été rationnées à 92 % sans distinction.

### Le coût, et ce qu'il a fallu corriger

Recomposer le stock total après chaque prise doublait le temps de simulation — 20,4 ms le mois
contre 10,7. Le total suit maintenant la sortie réelle par simple décrément, `servi` étant
exactement ce qui a quitté les livres. Retour à 16,1 ms, dont le reste tient au coût honnête des
deux passes.

Quatre contrôles verrouillent l'invariant : le grand livre est conservatif à 10⁻⁴ près, aucun
stock local ne devient négatif, des cas de tension sont bien observés, et dans tous ces cas la
ville autosuffisante est servie en plein.

### Ce que le joueur voit

Sous chaque marchandise d'un marché fusionné, la liste des villes : « autosuffisante · +476
exportés » ou « 70 % de ses besoins · importe 200 ». Le taux global ne disait plus rien de ce que
vit chaque ville, et c'est pourtant cette lecture qui décide où bâtir.
