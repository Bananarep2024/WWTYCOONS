# Usines et commerces — proposition

**Statut : proposition, rien n'est implémenté.** Ce document découpe le fourre-tout « produits
manufacturés » en une famille de biens, et introduit l'étage qui manque entre l'usine et le ménage :
le commerce.

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
| Papier | **Papeterie** | 4 | 60 bois + 20 charbon | 30 | 10,31 $ | courant |
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
| **Épicerie** | 2 | pain, viande, bière, savon | l'ordinaire — toute ville en a |
| **Nouveautés** | 2 | étoffes, vaisselle | le demi-luxe |
| **Quincaillerie** | 2 | outillage, papier | l'équipement du ménage |
| **Ameublement** | 2 | meubles | le durable, réservé aux villes riches |
| **Grand magasin** | 4 | tout | la métropole — il remplace les autres |

### Calibrage proposé

Un commerce de 2 cases, 2 employés, **débit 100 unités par mois**, **marge 12 %** :

```
chiffre d'affaires   100 × 6,82  =  682 $/mois
marge                682 × 12 %  =   82 $/mois
salaires                         =   40 $/mois
entretien du bâti                =   12 $/mois
──────────────────────────────────────────────
résultat                             30 $/mois  →  23 %/an sur ~1 600 $ investis
```

Le débit sort de la forme d'une ville, pas d'un souhait : une épicerie tenant environ deux unités
par ménage et par mois sert cinquante ménages, ce qui donne à une ville de cinq cents habitants une
dizaine de boutiques. La marge se déduit ensuite du rendement visé — 20 % l'an, celui de la
transformation. **Ces deux nombres devront être mesurés comme l'a été la commission du rail** : ils
sont posés ici pour donner un ordre de grandeur, pas pour être crus.

---

## 4. Le panier du ménage

Consommation mensuelle proposée, et ce qu'elle coûte au prix de référence, marge de commerce
**non** comprise :

| Bien | Quantité / mois | Prix | Coût | Rang |
|---|---:|---:|---:|---|
| Pain ou viande | 1,00 | 6,82 $ | 6,82 $ | **nourriture** |
| Savon | 0,50 | 6,82 $ | 3,41 $ | courant |
| Bière | 0,50 | 6,82 $ | 3,41 $ | courant |
| Papier | 0,50 | 10,31 $ | 5,16 $ | courant |
| Étoffes | 0,35 | 6,82 $ | 2,39 $ | courant |
| Vaisselle | 0,25 | 6,82 $ | 1,71 $ | courant |
| Outillage | 0,08 | 37,56 $ | 3,00 $ | durable |
| Meubles | 0,08 | 32,52 $ | 2,60 $ | durable |
| | | **Total** | **28,49 $** | |

Avec 12 % de marge de commerce : **31,91 $**. Un ménage au plein emploi gagne 40 $ et paie ~5 $ de
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

## 6. Questions ouvertes

1. **Le commerce gate-t-il l'accès, ou seulement la marge ?** La proposition dit les deux. N'en
   garder qu'un — la marge — serait plus simple et moins risqué : aucune ville ne peut alors mourir
   d'un manque de boutiques. Mais on perd ce qui rend le commerce intéressant à posséder.
2. **Le grand magasin remplace-t-il les autres, ou s'y ajoute-t-il ?** S'il remplace, il faut un
   seuil de niveau de ville. S'il s'ajoute, il écrase les petits commerces par sa marge.
3. **Sept biens, est-ce trop ?** Le panier passe de deux lignes à huit. C'est plus riche et plus
   lourd à lire. Un premier jet à **quatre** biens — savon, bière, papier, meubles — serait un test
   honnête avant d'aller jusqu'à sept.
4. **Les étoffes sortent-elles du bétail ou faut-il une matière ?** La laine sort du troupeau, ce
   qui est juste, mais met trois ateliers sur le même intrant. L'autre voie serait une septième
   matière première — du coton, sur les cases fertiles chaudes — au prix d'une exception à la
   contrainte « aucune matière nouvelle ».
