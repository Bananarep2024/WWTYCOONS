# Usines et commerces

**Statut : implémenté.** Sept biens, sept usines, cinq commerces. Ce document décrit ce qui tourne ;
les écarts avec la proposition initiale sont signalés et expliqués.

Tous les prix ci-dessous sont **dérivés**, pas posés. Méthode du § 4.1 du barème :

```
prix de référence = coût direct unitaire ÷ (1 − taux de marge)
coût direct       = salaires + intrants au prix de référence
taux de marge     = 15 % transformation simple · 20 % lourde · 25 % manufacture
```

Vérifiée sur l'existant : planches 6,82 (table 6,83), briques 6,82, pain 6,82, viande 6,82,
acier 12,12 (table 12,14), produits 32,52 (table 32,58). L'écart est celui de l'arrondi.

---

## 1. Le principe

Le ménage achète aujourd'hui **un** bien manufacturé, indistinct. C'est un trou : le § 5.8 dit que
le budget se dépense dans l'ordre — loyer, nourriture, puis le reste — mais « le reste » n'a qu'une
ligne, si bien qu'un ménage achète tout ou rien. Avec une famille de biens, l'ordre devient une
vraie courbe : on achète d'abord le savon et la bière, et les meubles seulement s'il reste quelque
chose. **C'est la même règle, appliquée à un panier au lieu d'un article.**

Trois contraintes tenues :

1. **Aucune matière première nouvelle.** Les six existantes suffisent, et chacune gagne un débouché
   de consommation — c'est ce qui donne enfin un poids au bétail et au charbon.
2. **La grammaire du barème est respectée.** Transformation simple : 2 cases, 2 employés, 40 → 20.
   Manufacture : 4 cases, 4 employés, 60 + 20 → 30. Rien de nouveau à apprendre.
3. **Chaque usine a un mélange d'intrants distinct**, pour que le sol d'une ville décide de ses
   industries. Une ville d'argile fait de la faïence, une ville d'herbe fait du savon et de l'étoffe.

---

## 2. Les usines

| Bien | Usine | Cases | Intrants / mois | Sortie | Prix de réf. | Rang |
|---|---|---:|---|---:|---:|---|
| Vaisselle | **Faïencerie** | 2 | 40 argile | 20 | 6,82 $ | courant |
| Bière | **Brasserie** | 2 | 40 céréales | 20 | 6,82 $ | courant |
| Savon | **Savonnerie** | 2 | 40 bétail | 20 | 6,82 $ | courant |
| Étoffes | **Filature** | 2 | 40 bétail | 20 | 6,82 $ | courant |
| Papier | **Papeterie** | 2 | 30 bois + 10 charbon | 20 | 6,82 $ | courant |
| Outillage | **Forge** | 4 | 60 acier + 20 charbon | 30 | 37,56 $ | durable |
| Meubles | **Fabrique de meubles** | 4 | 60 planches + 20 acier | 30 | 32,52 $ | durable |

La **Fabrique de meubles** est l'actuelle manufacture, renommée : mêmes intrants, même débit, même
prix. Rien à recalibrer de ce côté.

**Ce que chaque matière première gagne comme débouché final :**

```
bois      → planches → meubles          ·  bois + charbon → papier
argile    → briques (bâti)              ·  argile → vaisselle
charbon   → acier                       ·  charbon → papier, outillage
minerai   → acier → outillage, meubles
céréales  → pain                        ·  céréales → bière
bétail    → viande                      ·  bétail → savon, étoffes
```

Le bétail passe de une à trois issues, et le charbon de une à trois. Ce sont les deux matières que
le modèle actuel sous-emploie.

**Une tension d'allocation apparaît, et elle est voulue.** Trois ateliers se disputent le bétail —
abattoir, savonnerie, filature — comme deux se disputent le charbon. Une ville doit arbitrer entre
manger et s'habiller, ce qu'aucune filière ne fait aujourd'hui.

### Plus tard, pas maintenant

**Constructions mécaniques** — 4 cases, 60 acier + 20 planches → 30 machines, 41,94 $. C'est un
**bien d'équipement**, pas un bien de consommation : il relèverait la productivité d'un bâtiment au
lieu d'entrer dans le panier d'un ménage. Autre mécanique, autre débat.

---

## 3. Les commerces

**Ce qu'est un commerce.** Ni une usine ni un entrepôt : un **intermédiaire**. Il achète au marché,
tient boutique, et revend au ménage avec une marge. Nouvelle catégorie `com`.

**Ce qu'il change, en deux règles :**

1. **L'accès.** Un ménage ne peut acheter un bien que si un commerce de sa ville le tient. Une ville
   pleine d'usines et sans boutique ne vend rien à ses propres habitants. C'est le nouveau mode
   d'échec, et il est intéressant : il crée une demande de capital qui ne produit rien.
2. **La marge.** Le prix payé par le ménage est le prix du marché majoré de la marge du commerce.
   Cette marge est le revenu du commerce — un profit réel, possédable, donc rachetable.

| Commerce | Cases | Tient | Rôle |
|---|---:|---|---|
| **Épicerie** | 2 | bière, savon | l'ordinaire — toute ville en a |
| **Nouveautés** | 2 | étoffes, vaisselle | le demi-luxe |
| **Quincaillerie** | 2 | outillage, papier | l'équipement du ménage |
| **Ameublement** | 2 | meubles | le durable, réservé aux villes riches |
| **Grand magasin** | 4 | tout | la métropole — il remplace les autres |

### Calibrage — deux corrections mesurées

**Le débit se compte en VALEUR, pas en unités.** C'est la seule mesure juste pour un détaillant :
une unité de meubles pèse cinq unités de savon, et un débit en unités aurait fait d'un magasin de
meubles une affaire cinq fois plus grosse qu'une épicerie à surface égale. Un commerce de 2 cases
écoule **1 200 $ de marchandise par mois**, un grand magasin 3 600 $.

**Et il est calibré à son activité RÉELLE, pas à son plein.** C'est la différence de fond avec un
atelier. Une usine tourne à 90-100 % parce que sa production est poussée par ses intrants ; une
boutique tourne à 60-70 % parce que sa vente est tirée par un budget qui fluctue. Calibrée au plein,
elle ne rentrait dans ses frais qu'au-dessus de 75 % d'activité — **et l'on mesurait 123 commerces
déficitaires sur 123**. Le capital se déduit donc d'un rendement de 20 % atteint à **70 % d'activité**,
ce qui fait tomber le seuil de rentabilité à 43 %.

```
à 70 % d'activité :
  marge      1 200 × 70 % × 12/112  =  90,0 $/mois
  salaires                          = −40,0 $/mois
  entretien                         = −15,6 $/mois
  ─────────────────────────────────────────────────
  résultat                             34,4 $/mois  →  20,0 %/an sur 2 067 $
```

Mesuré à 240 mois après correction : **76 boutiques, +1 542 $/mois de résultat, 22 en perte** —
contre 160 boutiques toutes déficitaires avant.

---

## 4. Le panier du ménage

Consommation mensuelle proposée, et ce qu'elle coûte au prix de référence, marge de commerce
**non** comprise :

| Bien | Quantité / mois | Prix | Coût | Rang |
|---|---:|---:|---:|---|
| Pain ou viande | 1,00 | 6,82 $ | 6,82 $ | **nourriture** |
| Savon | 0,50 | 6,82 $ | 3,41 $ | courant |
| Bière | 0,50 | 6,82 $ | 3,41 $ | courant |
| Papier | 0,50 | 6,82 $ | 3,41 $ | courant |
| Étoffes | 0,35 | 6,82 $ | 2,39 $ | courant |
| Vaisselle | 0,25 | 6,82 $ | 1,71 $ | courant |
| Outillage | 0,08 | 37,56 $ | 3,00 $ | durable |
| Meubles | 0,08 | 32,52 $ | 2,60 $ | durable |
| | | **Total** | **26,74 $** | |

Avec 12 % de marge de commerce : **29,95 $**. Un ménage au plein emploi gagne 40 $ et paie ~5 $ de
loyer : il lui reste 35 $. **Le panier complet est donc tout juste atteignable, et seulement au plein
emploi dans une ville aux prix sages.** C'est exactement le réglage voulu — le panier doit être une
ambition, pas un acquis.

### L'ordre d'achat

Le § 5.8 est étendu, pas remplacé :

```
1. le loyer
2. la nourriture — une ration, priorité absolue
3. les biens courants, du moins cher au plus cher, avec ce qui reste
4. les biens durables, du moins cher au plus cher, avec ce qui reste encore
```

Le **rang** passe avant le prix, et c'est le point : sans rang, le ménage achèterait de la vaisselle
avant du savon parce qu'elle coûte le même prix, et l'on perdrait la hiérarchie de nécessité qui
fait tout l'intérêt d'un panier.

Le baromètre « produits » devient un **taux de satisfaction du panier** : la part des biens
effectivement obtenus, pondérée par le rang.

---

## 5. Ce que ça change ailleurs

| Endroit | Effet |
|---|---|
| `RES` | 6 biens ajoutés, `produits` renommé `meubles` |
| `BAT` | 6 usines ajoutées, `manufacture` renommée, 5 commerces ajoutés |
| Filières locales (§ 5.10) | deux filières de plus par ville : **Boissons et savons**, **Négoce** ; les commerces rejoignent le Comptoir |
| Panier (§ 5.8) | boucle sur le panier au lieu d'un article, avec le rang |
| Baromètre produits | devient le taux de satisfaction du panier |
| Rail | rien à changer : la commission porte sur la valeur, quelle que soit la marchandise |
| Barème § 2.1 | sept lignes de plus |

---

## 6. Ce qui a été tranché, et ce qui reste

**La nourriture ne passe pas par le commerce.** C'est un besoin primaire : le boulanger vend son
pain, et aucune ville ne doit pouvoir mourir de faim faute d'épicerie. Le verrou du comptoir ne
porte que sur les besoins secondaires — c'est exactement la ligne de partage entre les deux étages.

**Le souhait est distinct de la demande.** Le ménage *souhaite* ce que son budget supporte ; il
*demande* le minimum entre ce souhait et ce que les boutiques savent vendre. Sans cette distinction,
la ville comparait ses comptoirs à un désir absolu que personne ne pouvait payer, et bâtissait des
boutiques qui ne vendraient jamais rien. C'était la cause des 123 commerces déficitaires.

**L'ameublement n'est pas au parc de départ.** Le meuble est un bien de rang 2 qu'aucun ménage de
comptoir ne peut s'offrir ; la boutique ouvrirait pour ne rien vendre.

**Les vagues de production sont dérivées.** L'ordre dans lequel les ateliers produisent — la scierie
après la coupe, la manufacture après la scierie — était écrit à la main, et c'était un piège :
ajouter une usine sans l'inscrire dans la liste la laissait à zéro pour toujours, sans la moindre
erreur. C'est arrivé aux sept nouvelles d'un coup. La profondeur se calcule désormais depuis les
intrants ; on ne peut plus l'oublier.

### La papeterie ramenée à deux cases

Elle était bâtie sur le patron des quatre cases — 60 bois + 20 charbon pour 30 papier — ce qui lui
donnait un prix de référence de **10,31 $**, une fois et demie celui des autres biens courants. À
une demi-rame par mois, le papier pesait alors **6,60 $ sur les 19,98 $ de budget secondaire** d'un
ménage : un tiers à lui seul. Le rang 1 consommait la totalité du budget, et **aucun ménage n'a
jamais acheté un meuble ni un outil, pas même dans un monde de cases 3.**

Ramenée à la recette commune — deux ouvriers, quarante matières, vingt unités, 30 bois + 10 charbon
pour garder au charbon ses trois débouchés — elle sort à **6,83 $** comme le savon et la bière, pour
un rendement de 19,8 % conforme au palier.

Ce que ça débloque, mesuré à 240 mois sur trois richesses de sol :

| Monde | Confort | Outillage | Meubles |
|---|---:|---:|---:|
| actuel (80 % de cases 0) | 52 → **61 %** | 0 % | 0 % |
| riche | 76 → **84 %** | 0 → **17 %** | 33 → **67 %** |
| très riche (35 % de cases 3) | 78 → **73 %** | 0 → **43 %** | 2 → **70 %** |

**Les durables répondent enfin à la qualité du sol** — inatteignables sur terre pauvre, largement
servis sur terre riche — ce qui était le but. Et dans une ville au plein emploi, le panier entier
passe : Plaine-Dorée, 100 % d'emploi, achète ses 0,084 meubles et ses 0,084 outils par mois pour
0,08 voulus, en épargnant encore 39 % de son revenu.

### Reste ouvert

1. **Le grand magasin** est défini et constructible, mais rien ne le fait remplacer les petits
   commerces au-delà d'un seuil de ville. Il s'ajoute.
2. **Le grand magasin** ne remplace rien : il s'ajoute.
3. **Les étoffes sortent du bétail**, ce qui met trois ateliers sur le même intrant. L'autre voie
   serait une septième matière première, du coton, au prix de la contrainte « aucune matière
   nouvelle ».
