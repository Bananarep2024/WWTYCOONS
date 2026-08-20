# Le territoire d'une ville — proposition

**Statut : proposition, rien n'est implémenté.**

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

| Palier | Plafond | Rayon | Côté | Cases | Bâti au plafond | Occupation |
|---|---:|---:|---:|---:|---:|---:|
| **Comptoir** | 100 | **11** | 23 | 529 | 220 | 42 % |
| **Bourg** | 250 | **16** | 33 | 1 089 | 500 | 46 % |
| **Ville** | 500 | **21** | 43 | 1 849 | 950 | 51 % |
| **Grandeville** | 1 000 | **27** | 55 | 3 025 | 1 700 | 56 % |
| **Métropole** | 2 000 | **34** | 69 | 4 761 | 3 100 | 65 % |

Écarts : 5, 5, 6, 7. **Chaque palier double à peu près la surface** — 529 → 1 089 → 1 849 → 3 025 →
4 761 — si bien que monter de palier n'est pas une décoration : c'est un déblocage de terrain qu'on
sent immédiatement.

L'occupation monte de 42 à 65 % : une ville est de plus en plus serrée à mesure qu'elle grandit, ce
qui est exactement ce qu'on veut. Une Métropole doit être dense.

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

### 5.1 — La dotation en ressources : le vrai problème

C'est le point dur, et il est sérieux. Le générateur pose le relief par **grandes régions** ; un
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

**Il faut la déplacer dans le carré du Comptoir.** Combien ? Un Comptoir de 100 ménages consomme 100
pains, soit 5 minoteries, soit 200 céréales, soit 20 fermes de qualité 1. On propose donc
**24 cases exploitables par ressource à l'intérieur du carré de rayon 11** — 120 cases sur 529, soit
23 % du carré, toutes de qualité 1 : le droit de produire à prix coûtant, pas une faveur.

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

## 6. Ce qu'il reste à décider

1. **Rayon max 34 (sept sites) ou 30 (dix sites, Métropole à l'étroit) ?**
2. **La garantie de ressources à 24 cases par ressource dans le carré de départ** — ou un autre
   chiffre, sachant que 20 est le strict nécessaire pour nourrir un Comptoir plein.
3. **Faut-il un rayon intermédiaire à la fondation ?** Une gare fondée démarre à zéro ménage, donc
   Comptoir, donc rayon 11 d'emblée. C'est cohérent, et cela règle du même coup le problème des
   quatre cases constructibles.
