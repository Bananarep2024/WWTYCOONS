# Le territoire d'une ville

**Statut : implémenté.** Un écart avec la proposition est signalé et corrigé au § 3.

Trois changements liés : la règle de contiguïté disparaît, le territoire devient un **carré qui
grandit avec le palier de la ville**, et une gare ne peut être fondée que si son carré maximal ne
recoupe celui d'aucune autre.

---

## 1. Ce qu'on remplace

Aujourd'hui le territoire est un **disque** attribué à la génération (`rayonVille: 44`), fixe pour
toute la partie, et la constructibilité est réglée par une **règle de contiguïté** : une parcelle
doit toucher du sol déjà loti ou une voie. Cette règle est invisible sur les villes de départ, dont
le parc est semé sur tout le territoire — 400 à 600 cases immédiatement constructibles — et
étouffante sur une gare fondée, qui n'en offre que **quatre**.

On remplace les deux par une seule règle : **on bâtit où l'on veut à l'intérieur du carré, nulle
part en dehors.**

---

## 2. La place qu'une ville occupe vraiment

Mesuré sur vingt-cinq ans, cinq villes, graine 12345 — cases bâties rapportées aux ménages :

| Ménages | Cases bâties | Cases / ménage |
|---:|---:|---:|
| 100 | ~220 | 2,20 |
| 250 | ~500 | 2,00 |
| 500 | ~950 | 1,90 |
| 1 000 | ~1 700 | 1,70 |
| 2 000 | ~3 100 | 1,55 |

Le ratio **baisse avec la taille** : c'est la densification par immeubles — vingt ménages sur quatre
cases là où le pavillon en loge un sur une.

---

## 3. Les rayons proposés

Carré de rayon *r* → côté 2*r*+1 cases. Distance de **Chebyshev** (le max des deux écarts), qui est
la bonne mesure pour un carré.

> **Correction : les bandes de population sont plus larges que ce que disait la proposition.**
> `seuilsNiveau` donne l'**entrée** dans le palier suivant, pas son plafond. Un Comptoir va donc
> jusqu'à **250** ménages et non 100. La première version de l'échelle avait lu le tableau à
> l'envers et donnait au Comptoir un carré de rayon 11 — 529 cases pour 500 bâties au plafond.
> Mesuré : **quatre villes sur cinq bloquées à 215 ménages**, incapables de poser une case de plus,
> et le monde à l'arrêt. L'échelle est décalée d'un cran.

| Palier | Bande | Rayon | Côté | Cases | Bâti au plafond | Occupation |
|---|---|---:|---:|---:|---:|---:|
| **Comptoir** | < 250 | **16** | 33 | 1 089 | 500 | 46 % |
| **Bourg** | 250 – 499 | **21** | 43 | 1 849 | 950 | 51 % |
| **Ville** | 500 – 999 | **26** | 53 | 2 809 | 1 700 | 61 % |
| **Grandeville** | 1 000 – 1 999 | **30** | 61 | 3 721 | 3 100 | 83 % |
| **Métropole** | ⩾ 2 000 | **34** | 69 | 4 761 | — | saturation ~3 000 |

**Le haut de l'échelle est serré, et c'est délibéré.** Le rayon maximal est borné par la règle
d'écartement, et l'élargir coûterait des sites de fondation : à 34 il en reste douze sur la carte,
à 42 il n'en resterait que six. Une Métropole sature donc autour de trois mille ménages, et la
croissance doit repartir ailleurs. **C'est la raison d'être des gares qu'on fonde.**

---

## 4. La règle de fondation

**Deux carrés maximaux ne se recoupent jamais.** Il faut donc, entre deux gares :

```
distance de Chebyshev ≥ 2 × 34 + 1 = 69 cases
```

Ce que ça laisse sur la carte utile (336 × 221), en pavage régulier :

| Rayon max | Côté | Sites sur la carte | Dont à fonder |
|---:|---:|---:|---:|
| 26 | 53 | 24 | 19 |
| 30 | 61 | 15 | 10 |
| **34** | **69** | **12** | **7** |
| 38 | 77 | 8 | 3 |
| 42 | 85 | 6 | 1 |

**Rayon 34 est le point d'équilibre** : sept gares à fonder, ce qui donne au joueur de quoi coloniser
toute une partie, sans que la Métropole soit à l'étroit. En pratique la génération ne pave pas
régulièrement, il faut donc compter cinq ou six sites réels plutôt que sept.

> **Variante si tu veux plus de colonies :** rayon max **30**, dix sites à fonder — mais la Métropole
> tombe à 3 721 cases pour 3 100 bâties, soit **83 % d'occupation**. Elle serait à l'étouffement.

---

## 5. Ce que ça casse, et qu'il faut traiter

### 5.1 — La dotation en ressources : le vrai problème *(réglé)*

C'était le point dur, et il était sérieux. Le générateur pose le relief par **grandes régions** ; un
petit carré autour d'une gare tombe donc à l'intérieur d'une seule d'entre elles. Mesuré — cases
exploitables (qualité ⩾ 1) dans le carré du Comptoir, rayon 11 :

| Ville | Fertilité | Argile | Bois | Charbon | Minerai |
|---|---:|---:|---:|---:|---:|
| Roche-Noire | **0** | **0** | **0** | 281 | 390 |
| Plaine-Dorée | 169 | 313 | **2** | **0** | **0** |
| Sainte-Agathe | 336 | 71 | 41 | **0** | **0** |
| Bois-Perdu | **0** | **0** | 146 | 410 | 107 |
| Fort-Union | **0** | **3** | 458 | **4** | **0** |

**Trois villes sur cinq n'ont pas un grain de blé dans leur carré de départ.** Elles mourraient de
faim au premier mois. Et même au rayon 21, Bois-Perdu reste à zéro.

La cause : la garantie `minCasesParRessource: 60` existe déjà — c'est la règle « chaque ville doit
au moins disposer de quelques cases 1 pour chaque ressource » — mais elle s'applique sur le
**territoire entier** (4 000 à 6 000 cases) et promeut les cases là où le relief les désigne, donc
souvent loin de la gare.

**Elle est déplacée dans le carré du Comptoir**, à **24 cases exploitables par ressource** — vingt
suffisent en théorie pour nourrir un Comptoir plein : cent pains, cinq minoteries, deux cents
céréales, vingt fermes de qualité 1. Après correction, plus un seul zéro :

| Ville | Fertilité | Argile | Bois | Charbon | Minerai |
|---|---:|---:|---:|---:|---:|
| Roche-Noire | 29 | 33 | **24** | 501 | 700 |
| Plaine-Dorée | 276 | 406 | **24** | **24** | **24** |
| Sainte-Agathe | 488 | 106 | 92 | **24** | **24** |
| Bois-Perdu | **24** | **24** | 270 | 646 | 374 |
| Fort-Union | 25 | 78 | 709 | **24** | **24** |

La garantie du territoire entier (60 cases) reste en place par-dessus, inchangée.

**Une gare que le joueur fonde n'a PAS cette garantie** : elle prend le sol tel qu'il est. On
choisit où l'on s'installe, et le rail apporte ce qui manque.

### 5.2 — Le parc de départ doit se resserrer

Les villes s'ouvrent avec 200 à 300 cases bâties, dispersées jusqu'au rayon 56 par
`dispersionDepart`. Dans un carré de rayon 11 (529 cases) cela donne 55 % d'occupation dès le
premier mois — jouable, mais il faut supprimer la dispersion et poser le parc **serré autour de la
gare**.

### 5.3 — Le prix du sol est calibré sur un rayon de 44

`attenuation[n] = 0,028 × facteurNiveau[n]` est réglée en **cases absolues**, pour un territoire de
rayon 44. Dans un carré de rayon 11, le gradient centre/lisière serait quasi plat ; dans un carré de
34, deux fois trop doux. Il faut l'exprimer **en fraction du rayon courant** — la lisière vaut
toujours la même fraction du centre, quel que soit le palier — sinon le foncier perd son sens.

Et la distance à la gare doit passer en **Chebyshev** elle aussi, faute de quoi les coins du carré
seraient anormalement bon marché.

### 5.4 — Les paramètres qui disparaissent

| Paramètre | Devient |
|---|---|
| `rayonVille: 44` | le rayon du palier |
| `rayonGare: 16` | le rayon du Comptoir (11) |
| `distanceMinGare: 26` | Chebyshev ⩾ 69 |
| `distanceMinVilles: 94` | Chebyshev ⩾ 69, **plus** un minimum euclidien pour que le rail reste long |
| `dispersionDepart` | supprimé (§ 5.2) |
| contiguïté (`estAchetable`, `toucheLaVille`) | supprimée |

Sur `distanceMinVilles` : la contrainte des carrés autorise deux villes à 69 cases l'une de l'autre,
contre 94 aujourd'hui. Les lignes seraient plus courtes, donc moins chères, donc le rail moins
structurant. Je propose de **garder 94 en euclidien pour les cinq villes de départ** — le rail doit
rester un investissement lourd — et de n'appliquer que la règle des carrés aux gares que le joueur
fonde. C'est justement l'intérêt de fonder : on s'installe plus près.

---

## 6. Ce que ça donne

**Le problème d'origine est réglé.** Une gare fondée offre désormais **1 088 cases constructibles**
au lieu de quatre : elle démarre au Comptoir, donc au rayon 16, d'emblée.

**Le monde va mieux.** Cinq villes à 240 mois : 607 à 881 ménages contre 558 à 736 avant, confort
de 41 à 75 %, nourriture à 100 %. Le carré resserre le parc de départ autour de la gare — une
agglomération naissante est dense et petite, elle s'étale en grandissant — et la densité profite à
tout le reste.

**Le foncier garde son calibrage.** Le gradient porte maintenant sur *d ÷ rayon du palier* et non
sur un nombre de cases ; les coefficients sont l'ancienne atténuation multipliée par 44, de sorte
que la lisière vaut exactement la même fraction du centre qu'avant :

| Palier | Centre | Lisière | Rapport |
|---|---:|---:|---:|
| Comptoir | 100 $ | 45 $ | 45 % |
| Bourg | 130 $ | 50 $ | 38 % |
| Ville | 180 $ | 56 $ | 31 % |
| Grandeville | 260 $ | 62 $ | 24 % |
| Métropole | 400 $ | 67 $ | 17 % |

Le prix de lisière **monte** à chaque palier (45 → 50 → 56 → 62 → 67) : aucune case ne perd jamais
de valeur quand la ville grandit, l'invariant est tenu.

**Les carrés se voient.** En mode construction, chaque ville porte son carré courant en trait plein
et son carré maximal en pointillé : ce qu'on peut bâtir aujourd'hui, et ce que la ville donnera si
elle grandit. Le pointillé rend aussi lisible la règle de fondation.

### Reste ouvert

Le contrôle « aucune montagne de marchandise » est rouge à 16 mois de meubles et d'outillage : les
biens durables ne trouvent pas preneur dans le monde de base, et les usines continuent de produire
pour un marché qui n'a pas les moyens. C'est le problème signalé au § 6.2 de `03-INDUSTRIES.md`,
que le changement de territoire n'aggrave ni ne règle.
