# Barème de référence — WWTYCOONS

**Ce document fait foi.** Il consolide le §20 du document de conception (v28, 13 août 2026), qui
prime sur toute valeur numérique des §1 à §19, et comble les trous que le §20 laissait ouverts.

Toutes les valeurs sont mensuelles. **Un mois = 10 secondes réelles.**

---

## 1. Les six données de base

| Donnée | Valeur | Ce qu'elle commande |
|---|---|---|
| Salaire d'une case | 20 $ / mois | L'unité de compte de tout le jeu |
| Terrain de référence | 100 $ la case | × facteur de niveau et de distance |
| Entretien | 10 % / an de la valeur bâtie, foncier exclu | Ne se contracte jamais |
| Rendements visés | 15 · 20 · 25 % | Fixent le coût de construction de chaque palier |
| Loyer d'un logement | 5 $ / mois au niveau 1 | Découle du foncier |
| Épargne d'un ménage | 6 $ / mois | Ce qui reste au plein emploi, et qui rebâtit la ville |

**Unité de population : le ménage.** Un ménage = 2 employés = 1 maison. Le mot « habitant »
désigne toujours un ménage.

---

## 2. Les bâtiments : taille, débit, coût

Règle générale : **une case = un employé = une production.** Un bâtiment de *n* cases a *n*
employés et produit *n* fois le débit d'une case.

Exception : le logement, les bureaux et l'entrepôt ne suivent pas cette règle (voir §2.2).

### 2.1 — Production

| Bâtiment | Cases | Intrants / mois | Sortie / mois | Marge | Construction | Entretien | Seuil d'activité |
|---|---:|---|---|---:|---:|---:|---:|
| Coupe forestière | 1 | — | 28 bois | 8 $ | 1 920 $ | 16,00 $ | — |
| Carrière | 1 | — | 28 argile | 8 $ | 1 920 $ | 16,00 $ | — |
| Mine de charbon | 1 | — | 28 charbon | 8 $ | 1 920 $ | 16,00 $ | — |
| Mine de fer | 1 | — | 28 minerai | 8 $ | 1 920 $ | 16,00 $ | — |
| Ferme céréalière | 2 | — | 11,7 céréales | 8 $ | 3 840 $ | 32,00 $ | — |
| Ranch | 2 | — | 11,7 bétail | 8 $ | 3 840 $ | 32,00 $ | — |
| Scierie | 2 | 48 bois | 24 planches | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Briqueterie | 2 | 48 argile | 24 briques | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Minoterie | 2 | 20 céréales | 10 pain | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Abattoir | 2 | 20 bétail | 10 viande | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Aciérie | 4 (2×2) | 96 charbon + 96 minerai | 24 acier | 88 $ | 3 240 $ | 27,00 $ | 31 % |
| Manufacture | 4 (2×2) | 24 planches + 8 acier | 24 produits | 88 $ | 2 720 $ | 22,67 $ | 26 % |

Les six exploitations sont **rigoureusement équivalentes** à qualité égale : même recette par
ouvrier, même capital par case, même rendement. La marchandise chère est sortie d'autant plus
lentement que son prix est élevé — céréales et bétail à 2,40 $ sortent 11,7 unités là où le bois à
1 $ en sort 28. Débits et coûts sont **dérivés**, jamais écrits à la main (§6 sexies). Les chiffres
ci-dessus valent **par case et à la qualité 1**, où le rendement est nul par construction.

Les débits de transformation s'emboîtent proprement :
1 ferme nourrit 1 minoterie · 2 coupes forestières alimentent 1 scierie ·
4 mines de charbon + 4 mines de fer alimentent 1 aciérie · 1 scierie + ⅓ d'aciérie alimentent 1 manufacture.

> **La qualité du sol.** Chaque case porte un score de **0 à 3** par ressource. La qualité ne joue
> **que** sur l'extraction, jamais sur la transformation. Voir §6 sexies : l'échelle de production
> n'est pas posée, elle se **déduit** des trois rendements visés.

### 2.2 — Logement, bureaux, négoce

| Bâtiment | Cases | Capacité | Recette | Construction | Entretien |
|---|---:|---|---:|---:|---:|
| Maison | 1 | 1 ménage (2 employés) | 5 $ de loyer | 180 $ | 1,50 $ |
| Immeuble résidentiel | 4 (2×2) | 20 ménages (40 employés) | 100 $ de loyer | 3 700 $ | 30,83 $ |
| Immeuble de bureaux | 4 (2×2) | 20 postes | 40 $ de loyer | 2 000 $ | 16,67 $ |
| Entrepôt | 4 (2×2) | 2 000 unités | — | 400 $ | 3,33 $ |

L'entrepôt emploie 4 personnes (80 $ de salaires) et ne rapporte rien : il coûte 83,33 $/mois,
soit 0,50 $ par unité stockée et par an.

### 2.3 — Rendements obtenus (niveau 1, terrain 100 $/case, prix de référence, 100 % d'activité)

| Bâtiment | Rendement | Cible |
|---|---:|---:|
| Exploitation, case 1 | 0,0 % | 0 % |
| Exploitation, case 2 | 5,0 % | 5 % |
| Exploitation, case 3 | 61,4 % | ⩾ 15 % sur un cours à 60 % |
| Maison | 15,0 % | 15 % |
| Transformation | 19,9 % | 20 % |
| Aciérie | 20,1 % | 20 % |
| Immeuble résidentiel | 20,2 % | 20 % |
| Manufacture | 25,1 % | 25 % |
| Immeuble de bureaux | 11,7 % | 12 % |

Ce sont des **rendements de référence**, atteints seulement quand l'approvisionnement, les
débouchés, la main-d'œuvre et les salaires sont tous au niveau nominal. Un bâtiment mal placé ou
mal approvisionné devient déficitaire et vaut alors moins que son coût de construction.

---

## 3. Les matériaux de construction

Le coût de construction est facturé **en quantités**, au prix du marché local du jour où le
chantier est ouvert. Un bâtiment ne coûte donc jamais deux fois la même chose.

Quantités **par case** :

| Palier | Planches | Briques | Acier | = au prix de réf. |
|---|---:|---:|---:|---:|
| Exploitation | 384 | — | — | 1 920 $ |
| Maison | 24 | 12 | — | 180 $ |
| Entrepôt | 20 | — | — | 100 $ |
| Transformation | 60 | 55 | — | 575 $ |
| Manufacture | 40 | 36 | 20 | 680 $ |
| Aciérie | 30 | 42 | 30 | 810 $ |
| Immeuble de bureaux | — | 40 | 20 | 500 $ |
| Immeuble résidentiel | — | 65 | 40 | 925 $ |

> **La règle structurante est préservée :** la maison est en bois et brique, l'immeuble en brique
> et acier. Sans accès à l'acier, une ville ne peut bâtir ni immeuble, ni immeuble de bureaux, ni
> aciérie, ni manufacture — quelle que soit la fortune de ses joueurs. **C'est la liaison
> ferroviaire, et elle seule, qui ouvre la verticalité.**

**Stock d'amorçage, par ville : 800 planches et 400 briques**, jamais réapprovisionné. De quoi
bâtir environ deux ateliers de transformation et quelques maisons. Le premier joueur qui élève la
scierie et la briqueterie d'une ville la tient.

---

## 4. Les prix

### 4.1 — Prix de référence

Le prix de référence est **le prix qui s'établit quand la demande égale l'offre**. C'est une
constante du jeu, jamais recalculée.

| Bien | Prix | Travail incorporé | Part du salaire |
|---|---:|---:|---:|
| Bois, argile, charbon, minerai | 1 $ | 0,042 case | 83 % |
| Céréales, bétail | 2,40 $ | 0,100 case | 83 % |
| Planches, briques | 5 $ | 0,167 case | 67 % |
| Pain, viande | 12 $ | 0,400 case | 67 % |
| Acier | 15 $ | 0,500 case | 67 % |
| Produits manufacturés | 17 $ | 0,500 case | 59 % |

### 4.2 — Formation du prix : le flux, et l'écart au matelas

```
Tension     = besoins effectifs du mois ÷ entrées du mois
Prix cible  = prix de référence × Tension ^ 0,60
Prix du mois = prix précédent + 0,28 × (prix cible − prix précédent)

Bornes : 50 % à 250 % du prix de référence
Plancher local supplémentaire : le prix de revient réel sur ce marché
```

- **Besoins réels** = consommation des ménages + intrants des bâtiments en activité + matériaux
  des chantiers ouverts + entretien, **plus le rattrapage du matelas** (§ 4.2 bis).
- **Entrées** = production mise en vente + ce que les entrepôts relâchent.
- **Exposant 0,60** : repris du §8, seul chiffre que le document ait testé. Tension ×2 → prix ×1,52.
- **Lissage 0,28** : calibré sur la mesure du §20 — 30 % de production détournée doit donner
  +19 % en 5 mois. Ce coefficient donne +19,2 %. ✔

> **Rafler un marché le fait monter — lentement.** L'achat spéculatif n'entre toujours pas dans les
> besoins du mois : il ne touche pas la tension par ce côté. Mais il vide la cave, et depuis le
> §4.2 bis la cave compte. Le manque se rattrape sur six mois, si bien qu'un raid de N unités ne
> déplace le prix que d'un sixième de son poids, et il faut le tenir pour que ça dure — le stock
> racheté dort dans un entrepôt qui coûte ses salaires et son entretien tous les mois. C'est un
> accaparement possible et coûteux, ce qu'il doit être. **Retenir sa propre production** reste bien
> plus tranchant : elle réduit directement les entrées et fait monter le prix dès le mois suivant.
>
> *Avant le §4.2 bis, rafler ne bougeait pas le cours d'un centime.* C'était le corollaire assumé
> d'un prix qui ignorait le stock — et c'est le même angle mort qui laissait un tas de bétail
> grossir pendant trente ans sans que rien ne le voie.

### 4.2 bis — Le matelas de sécurité

Le prix ne suivait que les flux et le stock n'entrait nulle part dans le calcul. Le défaut n'était
visible qu'à long terme : **dès qu'un marché s'était constitué un tas, ce tas devenait invisible.**
Les flux se rééquilibraient autour de lui, la tension revenait à 1, le prix aussi, et plus rien ne
le mangeait ni ne le faisait grossir. Une partie de trente ans finissait avec 23 mois d'argile et
1 155 mois de bétail immobilisés pendant que le bois vivait sur un demi-mois.

Le marché déclare donc ce qu'il veut **tenir**, et l'écart à ce matelas s'ajoute à ses besoins :

```
Matelas visé      = 1,0 × besoins du mois                    (matelasMois)
Rattrapage brut   = (matelas visé − stock) ÷ 6               (moisDeRestockage)
Rattrapage        = borné à ± 0,25 × besoins du mois         (correctionMatelas)
Besoins effectifs = besoins du mois + rattrapage             ⩾ 0
```

Une cave à sec achète au-delà de sa consommation et fait monter le prix ; une cave pleine achète
moins et le fait tomber. À l'équilibre exact — stock = matelas — le terme s'annule et on retrouve
la loi du §4.2 mot pour mot.

> **Le matelas module le signal de prix, il ne le remplace pas**, et la borne n'est pas un
> garde-fou de confort. Sans elle, une ville neuve se fait tuer par son propre amorçage : elle
> démarre avec 3 000 planches (§ *stockAmorcage*) face à des besoins minuscules, soit des dizaines
> de mois de couverture ; le rattrapage annulait alors ses besoins effectifs, écrasait le prix des
> planches, et personne n'y bâtissait de scierie. L'amorçage épuisé, la ville n'avait aucune
> industrie du bois et s'éteignait — sur la graine 7, deux villes sur cinq mortes avant le mois 60.
> Avec la borne, une cave pleine fait au plus tomber la tension d'un quart, soit **−16 %** sur le
> prix : un signal net, mais la ville continue d'exister aux yeux du marché.
>
> La borne a été balayée sur 8 cartes × 30 ans, freinte tenue à 0,10. ±0,80 laisse une ville morte,
> ±0,50 en laisse deux — un quart de la consommation est déjà assez de latitude pour effacer une
> ville jeune. **±0,25** : aucune morte, aucune crise, 2 180 ménages par ville, et un matelas d'au
> moins 0,57 mois sur chaque matière première.

Et **ce qui dort au-dessus du matelas se perd** : le grain s'échauffe, la bête maigrit, le charbon
s'effrite. 10 % de l'excédent par mois (`freinteExcedent`). Sans cette freinte, un tas constitué une
fois ne redescend jamais : 1 155 mois de bétail à consommation constante, c'est 96 ans de purge.
Elle ne coûte rien à un marché bien tenu, puisqu'elle ne mord que sur l'excédent.

```
Débit d'une ville   = max(ses besoins du mois, ce qu'elle a sorti, 0,80 × son débit précédent)
Matelas d'une ville = 1,0 × ce débit
Perte               = 10 % de ce qu'elle garde au-dessus
```

Le débit est une **enveloppe qui redescend de 20 % par mois**, pas la mesure de l'instant. Sans
cette mémoire, une scierie mise en sommeil un seul mois ramène le débit de sa ville à zéro, fait
pourrir d'un coup tout ce qu'elle gardait pour l'export, et repart le mois suivant sans matelas.
C'est ce qui tuait 2 villes sur 40 ; avec la mémoire, sur la graine 12345, **les cinq villes
dépassent le témoin** au lieu que deux y meurent.

> **La marchandise pourrit là où elle est.** La freinte se calcule livre par livre, sur le stock de
> chaque ville — et le matelas d'une ville se mesure sur son **débit**, pas sur sa consommation.
> Les deux autres formulations ont été essayées et sont fausses :
>
> - *matelas = consommation locale* : sous la règle du service local (§4.3), une ville minière garde
>   dans son livre le charbon qu'elle destine à l'export ; ses besoins locaux sont nuls, donc son
>   matelas aussi, et tout ce qu'elle allait vendre pourrissait chaque mois. 1 065 ménages au lieu
>   de 1 889, 7 villes sur 20 en crise.
> - *matelas commun au marché, perte au prorata des livres* : la ville qui n'avait rien en trop
>   payait pour le tas de la voisine. Sur la graine 12345, deux villes sur cinq sont mortes pendant
>   qu'une autre doublait.

**Le plancher au prix de revient reste intact.** Le retirer sur un marché engorgé achève plus vite
un troupeau invendable, mais il ne protège pas que l'éleveur : il tient toute la filière lourde.
Sans lui, le baromètre des produits tombe de 97 % à 57 %.

### 4.3 — Le rationnement

Quand les entrées plus le stock ne couvrent pas les besoins, **chacun est servi au prorata** :
si le marché ne couvre que 12 % des demandes du mois, usines, chantiers et entretien reçoivent
chacun 12 % de ce qu'ils demandent.

Deux corrections à ce prorata :
1. **L'enchère sur les matières** — chaque société fixe un prix maximum par matière ; la bourse
   sert par prix décroissant. Celui qui a plafonné trop bas n'est pas servi. *(formats 30 et 60 min)*
2. **La priorité de l'entrepôt** — un entrepôt sert les bâtiments de son propriétaire avant le
   marché. C'est le principal intérêt d'en posséder un.

---

## 5. La ville

### 5.1 — Niveaux

| Niveau | Nom | Ménages | Facteur foncier |
|---:|---|---:|---:|
| 1 | Comptoir | < 100 | 1,0 |
| 2 | Bourg | 100 | 1,3 |
| 3 | Ville | 250 | 1,8 |
| 4 | Grandeville | 500 | 2,6 |
| 5 | Métropole | 1 000 | 4,0 |

*(seuil supplémentaire : 2 000 ménages = métropole pleinement développée)*

Le niveau **descend aussi bien qu'il monte**, et le prix du terrain le suit.

### 5.2 — Prix du terrain

```
Prix = 100 $ × Facteur de niveau × Facteur de distance
Facteur de distance = 1 ÷ (1 + 0,04 × cases depuis la gare)
```

De 1,00 contre la gare à 0,44 au bord du territoire (32 cases). Une parcelle périphérique de
métropole (176 $) vaut plus qu'une parcelle centrale de comptoir (100 $).

**Contiguïté :** on ne peut acheter une terre vierge que si elle touche une terre déjà vendue ou
bâtie. La ville s'étend en anneaux depuis sa gare. 30 % des cases appartiennent à des propriétaires
indépendants, qui vendent au prix du marché **majoré de 20 %** — le raccourci payant.

### 5.3 — Les trois baromètres

| Baromètre | Seuil critique | À l'équilibre |
|---|---:|---:|
| Nourriture | **90 %** | 100 % |
| Emploi | 50 % | 78 % |
| Produits manufacturés | **aucun** | 59 % |

**Les produits manufacturés ne vident plus une ville.** On ne la quitte pas parce qu'on n'y trouve
pas de quoi s'équiper : on y vit moins bien, ce que l'attractivité dit déjà, et cela suffit. Le
seuil transformait un inconfort en exode et condamnait par construction toute ville jeune, dont la
filière manufacturière est la dernière à se monter — trois étages au-dessus de la mine.

**La nourriture, elle, monte de 80 à 90 %** : c'est elle, et elle seule, qui retient une
population.

**Et l'emploi reste**, parce que c'est le SALAIRE qui permet d'acheter cette nourriture. Sans ce
seuil, fonder une ville et n'y bâtir que des maisons suffirait à faire venir du monde — des gens
sans travail, donc sans revenu, donc sans repas. Un logement ouvre une porte ; c'est la paie qui
fait entrer.

Pain et viande sont **substituables 1 pour 1** : le ménage veut une ration par mois, il mange ce
qu'il y a. Une ville de blé se passe d'élevage sans être punie.

### 5.4 — Démographie

```
Moyenne = moyenne des trois baromètres
Pivot   = 80 %

Δpopulation = 0,2 % de la population, par mois et par point d'écart au pivot
              plafonné à ±5 % par mois
              plafonné par les emplacements de logement vacants

Un seul seuil critique franchi vers le bas → exode forcé de 5 % par mois
```

Une ville à 90 % de moyenne croît de 2 % par mois, une ville à 85 % de 1 % — deux fois moins vite,
conforme au §20. La croissance dégrade les baromètres et ramène d'elle-même la ville au pivot :
**le pivot arbitre le confort, l'économie décide de la taille.**

### 5.5 — Emploi et budget

Consommation d'un ménage : **1 nourriture (0,400 case) + 1 produit manufacturé (0,500 case) = 0,900 case.**
Avec les matériaux de chantier et l'entretien : **1,305 case par ménage**, pour 2 cases de travail
fournies → **65 % d'emploi hors bureaux.**

| Poste | Montant | Part du revenu |
|---|---:|---:|
| Nourriture, 1 unité | 12 $ | 30 % |
| Produits manufacturés, 1 unité | 17 $ | 42 % |
| Loyer | 5 $ | 12 % |
| **Total** | **34 $** | **85 %** |
| Épargne au plein emploi | 6 $ | 15 % |

L'épargne des ménages n'est ni perdue ni thésaurisée : **elle bâtit la ville**. Les habitants
construisent ce qui manque le plus, et ces bâtiments appartiennent aux propriétaires indépendants —
donc rachetables par les joueurs.

### 5.6 — Les bureaux, seul argent venu du dehors

Les bureaux ne répondent à aucun besoin interne : ils louent 20 postes à des sociétés extérieures
à la carte, dont les 400 $ de salaires mensuels financent une consommation que la ville n'a pas eu
à produire. Leur seule limite est la main-d'œuvre : **un poste vide ne rapporte rien.**

> **Le repère du générateur de carte : 1 immeuble de bureaux pour 78 ménages** maintient l'emploi
> à 78 %. Une métropole de 2 000 ménages en porte 26. Ce chiffre reproduit exactement la simulation
> du §20 (2 immeubles → 156 ménages).

Leur rendement (11,7 % au comptoir) reste **le plus faible du jeu** — sous celui d'une unité de
production tournant à pleine capacité à bon prix. C'est le pari sur la croissance : bâti au
comptoir et conservé, le même immeuble rend 31,7 % sur le prix payé une fois la métropole atteinte.

### 5.7 — Le salaire, variable d'ajustement

> **Suspendu.** `salaireFixe` est levé : le salaire vaut **20 $ la case partout**, sans exception
> et sans dérive. Tout ce qui suit décrit la machine endogène, qui reste écrite dans le code et
> qui reprendra du service en abaissant ce drapeau.
>
> La raison de la mise en sommeil tient en une phrase : **le salaire endogène remboursait la
> rareté**. Une ville aux mauvaises cases payait ses produits cher, donc son panier cher, donc son
> salaire de subsistance montait, donc le ménage rachetait ses produits — et la pauvreté du sol ne
> se lisait nulle part. À salaire identique partout, la même ville a le revenu de toutes les autres
> et des prix plus hauts que toutes les autres : le produit manufacturé y devient un article de
> luxe. Voir § 5.8.

Chaque mois le salaire de la ville tend vers **le plus petit** de deux nombres :
- ce dont le ménage a besoin pour couvrir son panier au prix du jour, divisé par 2 employés ;
- ce que les employeurs peuvent payer sans passer sous leur seuil d'activité, moyenné sur les
  cases réellement en activité.

Le rattrapage prend quelques mois — et c'est dans cette fenêtre que les baromètres plongent. Le
joueur ne fixe pas son salaire dans l'absolu mais **par rapport à celui de sa ville**, entre 80 %
et 150 % : au-dessus pour rafler la main-d'œuvre de ses rivaux, en dessous pour engranger de la
marge au risque de perdre ses employés. *(formats 30 et 60 min)*

### 5.8 — L'ordre des dépenses du ménage

Le budget se dépense dans un ordre, et **cet ordre est une règle du jeu** :

1. **le loyer**, celui qui se pratique vraiment dans la ville, pas un forfait ;
2. **la nourriture**, une ration par ménage et par mois, au prix du mélange pain/viande que la
   ville est capable de servir — et non au moins cher des deux : une ville où le pain manque paie
   de la viande, et c'est la viande qui grève son budget ;
3. **les produits manufacturés**, avec ce qui reste. S'il reste quelque chose.

C'est de cet ordre que sort l'effet de rareté, sans qu'il faille l'écrire nulle part. Une ville
dont le sol ne donne que du minerai de qualité 1 paie son minerai cher ; l'acier suit, la
manufacture suit, et le produit arrive sur l'étal à un prix qui, rapporté à un salaire identique
partout, en fait un luxe. Le ménage mange quand même — il mange d'abord — mais il n'achète plus,
et la manufacture ne vend pas.

Mesuré à 60 mois sur cinq marchés isolés (graine 12345) :

| Ville | Minerai | Produits | Ménages qui en achètent |
|---|---|---|---|
| Bois-Perdu | 1,34 $ | 29,44 $ | **69 %** |
| Sainte-Agathe | 2,67 $ | 37,30 $ | 52 % |
| Fort-Union | 3,04 $ | 39,68 $ | 45 % |
| Plaine-Dorée | 2,67 $ | 67,89 $ | **15 %** |

La nourriture, elle, reste servie en priorité : là où la ville en a les moyens, le baromètre
alimentaire est à 100 % quel que soit le prix des produits.

---

## 6. La carte

- **Territoire par ville : 64 × 64 = 4 096 cases**, gare au centre. Une métropole pleinement
  développée en occupe environ 3 200, ce qui laisse 22 % de marge pour que les joueurs se
  disputent le foncier jusqu'à la dernière minute.
- **Cinq territoires**, séparés par de l'espace vide et reliés par des **couloirs de voie ferrée
  réservés**, grisés dès le début de partie et non constructibles.
- **Génération aléatoire à chaque partie.** Le relief (plaine, colline, montagne, forêt) est tiré
  par bruit cohérent ; chaque case reçoit un score de 0 à 3 par ressource dont la distribution
  dépend du relief — les montagnes portent plutôt du minerai et du charbon, les plaines plutôt de
  la fertilité et de l'argile.
- **Toutes les ressources sont présentes dans toutes les villes.** Chaque ville a une prédominance
  et deux ou trois ressources nettement plus rares. Aucune ville ne peut se suffire à elle-même,
  aucune n'est privée de quoi que ce soit.
- **Garantie du générateur :** aucune ville ne démarre sous le seuil de survie alimentaire, sans
  quoi elle meurt avant que quiconque ait pu lui poser une voie.

---

### 6 sexies. Le sol : une échelle de 0 à 3, déduite des rendements visés

**L'échelle n'est pas posée, elle se déduit.** On tient trois choses pour données, et tout le reste
en découle — c'est ce qui garantit que le barème et le code disent la même chose même si l'on
retouche une cible.

| qualité | ce que c'est | rendement annuel visé |
|---|---|---|
| **0** | pas de gisement | on ne peut **rien** y ouvrir |
| **1** | le sol de partout | **0 %** au prix de référence, négatif dès que le cours passe dessous |
| **2** | correct | **5 %** |
| **3** | le filon | **15 %** sur un cours à 60 % de la référence |

De la première ligne — « la case 1 couvre tout juste son entretien » — découle le **capital** d'une
case : `12 × effectif × marge ÷ 10 %`. Les deux autres fixent les échelons :

```
Y(q) = [12 k (r·g(q)·i − s) − 0,10 C] ÷ (C + T·g(q))
échelle du sol : 0 · 1 · 1,075 · 2,062
```

**Ce que les cibles imposent, et qui n'est pas un choix.** Une case 2 ne produit que **7 % de plus**
qu'une case 1. Si la case 1 couvre exactement son entretien, tout ce que la case 2 sort en plus est
du profit net, et 5 % de rendement ne pèse que 7 % de production. Ce qui sépare une case 2 d'une
case 1 n'est pas le volume, c'est la **marge**. L'échelle est donc accélérée, pas linéaire : la
case 3, pour tenir 15 % sur un cours effondré, doit produire 2,06 fois la case 1 — et elle rend
alors 61 % au prix de référence, 130 % à un cours de 1,6.

**Le salaire de calibrage n'est pas le salaire de référence.** `salaireCase` — 20 $ — est l'unité de
compte du barème ; ce n'est pas ce que la partie paie. Le salaire est endogène et s'établit autour
de **24 $** (`salaireAttendu`). Calibré sur 20 $, « case 1 = rendement nul » était faux en jeu de
quatre dollars par ouvrier : la case 1 tournait à −7,9 %, la case 2 à −3,3 %, la base extractive
fermait, et **dix-huit villes sur quarante mouraient**.

**Une case porte quatre ouvriers** (`echelleIndustrielle`), et l'effectif **ne suit plus le sol** —
quatre bras, filon maigre ou gras. C'est la condition pour que la qualité se voie sur la marge :
tant que l'emploi suivait la production en proportion exacte, la recette par ouvrier valait
`débit × prix`, une constante, et la bonne terre n'enrichissait personne — elle ajoutait des
ouvriers, rien de plus. L'échelle ne vaut que pour l'exploitation ; un atelier transforme ce qu'on
lui livre, sa taille est celle de ses murs.

**Le filon est toujours hors les murs, et hors de portée.** Une ville, si bien dotée soit-elle,
plafonne à la **qualité 2** sur son territoire : elle vit correctement de son sol, elle ne
s'enrichit pas dessus. Toute la qualité 3 se trouve sur la terre libre, et **à plus de 78 cases du
centre de toute ville fondatrice** — sans quoi un filon de lisière se cueillerait en posant une
gare juste derrière la frontière, sans rien risquer. Pour l'atteindre il faut vraiment partir, et
une colonie lointaine est une colonie qu'il faudra relier. Mesuré sur la graine 1 : 512 cases de
qualité 3, **aucune** en territoire, **aucune** à moins de 78 cases d'une ville.

**Chaque ville produit tout, fût-ce à perte.** Deux ressources par ville montent à 3, une à 2, deux
plafonnent à 1 — et le générateur garantit à chaque ville au moins **60 cases de qualité 1 sur
chacune des cinq ressources**. Elle peut donc produire, au rendement nul, ce que son sol ne lui
donne pas. Ce n'est pas une faveur : c'est ce qui rend la liaison ferroviaire **désirable** plutôt
que vitale — la ville survit sans elle, elle ne prospère qu'avec.

**Les bonnes cases sont des îlots.** On ne répartit plus le bruit sur 1–5, on **classe** les cases
et on découpe à des quantiles fixes :

| Qualité | Part de la carte |
|---|---|
| 1 | 85,8 % |
| 2 | 10,0 % |
| 3 | 3,6 % |
| 4 | **0,4 %** |
| 5 | **0,2 %** |

Mesuré sur 6 cartes : une ville tient **58 cases de qualité ≥ 4** dans sa ressource dominante,
soit **29 fermes** — l'ordre de grandeur voulu. Le bruit est resserré à [11, 5] cases d'échelle,
si bien que les sommets forment de petites taches et non des régions.

**La recette par ouvrier est une constante : `débit × prix de référence`.** L'emploi suivant le
sol exactement comme la production, la qualité s'annule dans ce rapport — c'est donc lui, et non
la qualité, qui doit passer devant le salaire. Les débits d'exploitation sont relevés d'un quart
(30 par case pour les mines et coupes, 12,5 pour les fermes et ranchs) : la recette par ouvrier
passe de 24 $ à **30 $**, contre un salaire qui s'établit autour de 21 $.

À 24 $ elle n'y arrivait pas : mesurée en partie, la meilleure ferme du jeu affichait **0,07 $ de
marge à l'unité** et se mettait en sommeil. Elle en dégage 0,78 $ et rapporte 118 $ par mois.

La qualité du sol reste ce qui décide de la **taille** d'une exploitation — donc du profit qu'une
case rapporte, et de ce que vaut cette case.

Le stock d'amorçage passe à 3 000 planches : une exploitation coûte désormais 700 $ la case et
800 planches n'en bâtissaient plus que quatre.

---

### 6 ter. Le sol se paie ce qu'il rend

Le prix d'une case vaut `100 $ × facteur de niveau × facteur de distance × facteur de richesse`,
et **le facteur de richesse est la loi de rendement elle-même** — `0,46 + 0,18 × qualité`, la
même qui décide de ce que sort une exploitation.

Une bonne terre rend **2,1 fois** une mauvaise, elle coûte donc 2,1 fois plus. Il y avait
auparavant un barème séparé, de plancher 0,35 et d'exposant 4, qui étalait le prix sur un
rapport de **15** : la prime foncière valait sept fois la rente qu'elle prétendait capitaliser.

Le défaut était invisible tant que le sol était excellent presque partout — le terme était une
quasi-constante. Depuis que les villes ont des vocations tranchées, il dominait tout :

| | Avant | Après |
|---|---|---|
| Part du prix expliquée par la **distance** | 42 % | **76 %** |
| Part expliquée par la **richesse** | 58 % | 24 % |
| Villes dont plus d'un quart du centre est moins cher que leur médiane | 6 % | **0 %** |

### 6 bis. Les vocations : deux riches, une moyenne, deux pauvres

Chaque ville reçoit un **plafond de qualité par ressource**, sur les cinq matières premières
(fertilité, argile, bois, charbon, minerai) :

| Rang | Plafond | Combien par ville |
|---|---|---|
| riche | **5** | 2 ressources |
| moyenne | **3 ou 4** | 1 ressource |
| pauvre | **1 ou 2** | 2 ressources |

La prédominance du profil prend l'un des deux 5 ; les deux `rares` du profil prennent les
plafonds bas. Mesuré sur 200 villes : **99 % respectent exactement cette répartition.**

Le plafond s'applique par **appartenance au territoire**, pas par distance. Deux pondérations
par distance ont été essayées — inverse de la distance, puis gaussienne — et dans les deux cas
la ville voisine pesait encore assez en lisière pour remonter les plafonds bas : une ville sur
dix seulement respectait sa vocation. Seule la terre vierge de l'entre-deux est mélangée, ce
qui donne le dégradé entre deux zones.

Le second emplacement riche est **réparti à l'échelle de la carte**, et non tiré ville par
ville : chaque ressource est riche dans exactement **deux villes**. Tiré indépendamment, il
laissait des cartes entières avec une seule ville nourricière — et ces cartes ne pouvaient pas
se nourrir. Mesuré sur 40 cartes : la couverture est maintenant de 2 villes pour chacune des
cinq ressources, sans exception.

Le plafond **étire** la valeur brute au lieu de la couper : une case médiocre reste médiocre,
une case excellente atteint tout juste le plafond, et le relief continue de se lire à
l'intérieur de la zone.

**Ce que cela change.** Avant, 81 % des villes avaient au moins une case excellente dans les
cinq ressources à la fois : aucune ne manquait de rien, donc aucune n'avait de raison
d'échanger, et le rail ne transportait que des marchandises que l'autre bout produisait déjà.
Désormais aucune ville ne se suffit à elle-même.

Le coût est réel et assumé : la croissance des vingt premières années ralentit, le temps que
les marchés fusionnent (mois 50 à 54). Mesuré sur 8 cartes — 256 ménages par ville à 10 ans,
813 à 20 ans, 1 425 à 30 ans, **aucune ville en crise, aucune ville morte**, et le palier de
Métropole atteint.

---

### 6 quinquies. Le marché sert le local d'abord

Quand deux villes sont reliées, leurs marchés fusionnent — mais **un marché fusionné n'est pas
un entrepôt unique**.

    1. Chaque ville sert ses propres besoins sur SA propre production.
    2. Le surplus des excédentaires alimente un pot commun.
    3. Les villes en manque se partagent ce pot au prorata de leur déficit.

Une ville qui produit assez est donc servie à **100 %** quoi qu'il arrive ailleurs. Auparavant,
un seul stock et un seul taux de service : la ville qui produisait tout le blé était rationnée
exactement comme celle qui n'en produisait pas un grain.

**Le prix, lui, reste celui du marché entier.** Un marché relié a un cours — c'est ce qui le
définit. La priorité locale décide de *qui obtient* la marchandise, jamais de ce qu'elle coûte.

Mesuré au mois 200 sur un marché de cinq villes, en tension sur les produits manufacturés :

| Ville | Produit | Demande | Servie sur sa production |
|---|---|---|---|
| Roche-Noire | 395 | 391 | **100 %** |
| Plaine-Dorée | 216 | 210 | **100 %** |
| Bois-Perdu | 397 | 358 | **100 %** |
| Sainte-Agathe | 486 | 507 | 96 % |
| Fort-Union | 478 | 678 | **70 %** |

Le taux global du marché était de 92 % : sous l'ancien modèle, les cinq auraient été rationnées
à 92 % — y compris les trois qui produisaient plus que leurs besoins.

Le stock appartient à la ville qui l'a produit, y compris au moment de la fusion : additionner
les réserves en un tas commun aurait dépossédé le producteur à l'instant précis où la ligne
s'ouvre. Quatre contrôles du banc d'essai garantissent que rien ne se crée, que rien ne devient
négatif, et que l'autosuffisante est bien servie en plein.

---

## 7. Le chemin de fer

- Chaque ville a **une gare au centre**, présente dès le début.
- Les emprises de voie entre les villes sont **réservées et visibles** dès la première seconde.
- Chaque liaison entre deux villes est portée par **une société non cotée**, une par liaison,
  construite par l'ordinateur.
- **La date d'achèvement de chaque liaison est annoncée dès le début de la partie**, avec un compte
  à rebours visible de tous.
- Les joueurs peuvent y investir. **Chaque tranche de capital avance la date d'un mois, dans la
  limite de 40 % du délai initial.** Le plafond est essentiel : sans lui, un joueur riche
  achèterait toutes les liaisons dans la première minute.
- **À l'achèvement, la société entre en bourse** et verse des dividendes.
- **Fusion des marchés :** dès qu'une ligne est achevée, les deux villes n'ont plus qu'un seul
  marché — stocks confondus, prix unique, besoins et productions additionnés. Sans coût ni délai
  de transport.

> **Le piège qui se referme le jour du rail.** Une ferme bâtie sur un mauvais sol est parfaitement
> rationnelle tant que la ville est isolée : le prix de revient local fait plancher et il faut bien
> manger. Le jour où la ligne s'ouvre vers une ville au bon sol, ce plancher local disparaît, le
> prix unique passe sous le prix de revient, et la marge brute devient négative : la ferme s'arrête
> d'elle-même. Elle ne perd pas des clients, **elle perd sa raison d'être** — et le patrimoine du
> joueur qui la possède part avec. C'est le principal risque patrimonial du jeu, et il ne se voit
> venir qu'en regardant la carte des qualités de sol, jamais le compte de résultat.

---

## 8. La société et la finance

### 8.1 — Structure

| Paramètre | Valeur |
|---|---:|
| Apport personnel du joueur | 1 500 $ |
| Souscription publique | 13 500 $ |
| **Capital de la société** | **15 000 $** |
| Part initiale du joueur | 10 % |
| Nombre d'actions | 15 000, à 1,00 $ |

Le joueur dirige dix fois son argent. À l'échelle du barème, 15 000 $ financent par exemple une
scierie, une briqueterie, deux coupes forestières, une carrière et cinq maisons — avec de la
réserve. On ne peut pas tout faire : il faut choisir.

**Toutes les propriétés physiques appartiennent aux sociétés, jamais aux joueurs.** Un joueur ne
détient que de l'argent liquide et des actions.

**Le contrôle s'obtient à plus de 50 % du capital.** Pas d'actions de fondateur, pas de vote
double. Un joueur dont la société est rachetée peut en fonder une nouvelle avec son capital
personnel — constitué de ses dividendes et de ses gains boursiers. **La faillite est possible.**

### 8.2 — Valorisation

```
Valeur d'un bâtiment = terrain + matériaux + 10 × résultat annuel   si le résultat est positif
                     = terrain + matériaux −  3 × perte annuelle    si le résultat est négatif
Plancher             = terrain + matériaux −  3 × entretien annuel

Actif net réévalué = Σ valeur des bâtiments + trésorerie − dettes
Cours de l'action  = Actif net réévalué ÷ nombre d'actions
```

Le multiple du marché vaut **10 en temps normal, 15 en euphorie, 5 en crise**. Cette unique
variation se propage partout : valeur des bâtiments, actif net, cours de l'action, et ratio
d'endettement qui déclenche les ventes forcées. Un seul chiffre à régler.

Le profit se mesure sur **12 mois glissants**, soit deux minutes de jeu réel.

### 8.3 — Dette et crises

| Paramètre | Valeur |
|---|---|
| Capacité d'emprunt | 50 % de l'actif net |
| Taux d'intérêt | 6 % / an, 9 % en crise |
| Seuil d'alerte | dette > 60 % de l'actif |
| Défaut | dette > 70 % de l'actif : vente d'office à 70 % de la valeur |

Pendant une crise : chantiers de l'ordinateur −70 %, consommation des ménages −30 %, prix de
référence −25 %, multiple du marché 10 → 5, intérêts 6 % → 9 %. Durée 2 à 3 années de jeu.

### 8.4 — Offres sur les bâtiments d'un rival

Curseur de **5 à 15 fois le profit des 12 derniers mois** ; pour un bâtiment déficitaire, de 80 %
à 120 % du plancher. **Une seule offre par mois et par adversaire.** Accepter ou refuser, pas de
contre-offre. Les propriétaires indépendants vendent au multiple du marché majoré de 20 %.

---

## 9. Les chantiers

**On lance un chantier dès qu'on a le cash** — rien n'oblige à attendre les matériaux. Le cash part
immédiatement, le chantier entre au carnet, et il reste un trou dans le sol tant que la totalité
des matériaux n'est pas livrée. Le bâtiment ne sort de terre que le mois où la dernière brique
arrive.

Cette commande n'est pas une intention : **c'est une demande réelle sur le marché**, au même titre
que le pain d'un ménage. Elle fait monter le prix des matériaux et elle appelle leur production.

- **Priorité au plus ancien.** Un chantier ouvert il y a dix mois ne cède jamais sa place.
- **Partage équitable avec les usines.** Le chantier compte comme un consommateur d'intrants,
  temporaire mais réel. Ni prioritaire, ni sacrifié.
- **Les bras suivent les matériaux :** un chantier qui reçoit un cinquième de sa livraison consomme
  un cinquième de sa main-d'œuvre. Un chantier à l'arrêt ne mobilise personne.

> **Le principal piège de trésorerie du jeu.** Ouvrir trop de chantiers à la fois, c'est immobiliser
> son cash dans des trous. Et il vaut aussi contre un adversaire : rafler les briques d'une ville ne
> bloque pas ses usines, mais gèle ses chantiers pendant des mois.

Visuellement, le chantier est une case terrassée à plat, **visible de tous dès le premier jour** —
personne n'est jamais pris par surprise. Pas de grue, pas d'échafaudage : le bâtiment apparaît d'un
coup le mois où il est achevé.

---

## 10. L'activité d'un bâtiment

```
résultat mensuel = taux d'activité × marge brute − entretien
production réelle = capacité × min(matières obtenues, main-d'œuvre obtenue) × réglage du joueur
```

Les trois lignes se contractent ensemble : un atelier à moitié achète la moitié de ses intrants,
paie la moitié de ses salaires et vend la moitié de sa production. **Seul l'entretien ne bouge
jamais** — c'est lui qui borne les pertes et qui fixe le seuil d'activité.

- **Sous 15 % de ses besoins en matières**, un bâtiment s'arrête complètement et ne paie plus que
  son entretien.
- **Mise en sommeil** (curseur à zéro) : plus de matières, plus de salaires, plus de production.
  Le bâtiment reste debout moyennant **10 % de sa masse salariale normale** et se rallume quand le
  marché repart.
- **Marge brute négative → arrêt automatique.** Le joueur peut forcer la production pour tenir une
  filière ou asphyxier un rival, mais c'est un choix explicite, jamais le comportement par défaut.
- **Une case qui reste vide un an ferme**, libérant les bras, le foncier et le droit de rebâtir
  ailleurs. Une seule par mois.

> **Le seul chiffre à afficher sur un bâtiment est sa marge par unité produite** — un nombre, vert
> ou rouge. Le danger vient toujours de l'écart entre le prix d'entrée et le prix de sortie, jamais
> d'un prix seul. Une scierie ne souffre pas du manque de bois : elle souffre parce que le bois est
> rare *alors que les planches ne le sont pas*.

**Les comptes ne dépendent jamais du propriétaire.** Quand un joueur alimente son propre atelier
depuis son propre entrepôt, la marchandise est valorisée au prix du marché local du jour. Personne
ne peut rendre une usine comptablement misérable pour la protéger d'une offre, ni la gonfler pour
son score. Le gain de la spéculation apparaît là où il a eu lieu : dans les comptes de l'entrepôt.

---

## 11. Les directeurs

Recalculés sur l'échelle du barème (salaire d'une case = 20 $).

| Rang | Salaire mensuel | Délai de réaction | Rentable à partir de |
|---|---:|---|---|
| Contremaître | 20 $ | 3 mois | ~8 cases (4 bâtiments) |
| Directeur | 60 $ | 1 mois | ~25 cases (12 bâtiments) |
| Directeur général | 150 $ | immédiat | ~60 cases (30 bâtiments) |

**Le directeur fait tourner ce qui existe, le joueur décide de ce qui doit exister.** Un directeur
règle le niveau de salaire offert, le taux d'activité et l'approvisionnement, dans la limite d'un
budget mensuel fixé par le joueur. Il ne construit jamais, n'achète jamais un terrain, ne touche
jamais à une action.

**Aucun directeur, même le plus cher, n'anticipe.** Il réagit à ce qui est déjà arrivé. Il ne saura
jamais qu'une ligne ouvre dans deux mois, ni qu'une crise se prépare. Déléguer, c'est accepter
d'être moyen partout pour être excellent là où on regarde.

Trois mandats, changeables à tout moment : **prudent** (protège la marge), **équilibré** (défaut),
**offensif** (production au maximum, surenchère forte sur les salaires).

---

## 12. La victoire

```
Fortune finale = argent liquide personnel + actions détenues × cours
```

Le cours retenu est **la moyenne des douze derniers mois de jeu**, jamais celui de la dernière
seconde : sans cette précaution la partie se déciderait sur une manipulation de dernière minute
plutôt que sur trente ans de construction.

---

## 13. Les événements

Une économie qui ne connaît que sa propre mécanique devient prévisible : on trouve la bonne
trajectoire, on la répète, et il n'y a plus rien à décider. Les événements sont ce qui casse
la trajectoire.

**Principe** — un événement ne mute jamais l'état de façon irréversible. Il s'inscrit dans une
liste et la simulation **lit** ses modificateurs là où ils s'appliquent ; quand il expire, il
disparaît et tout revient de soi-même. Les seules exceptions sont les mouvements de population :
une épidémie qui a emporté des gens ne les rend pas.

| Événement | Portée | Poids | Durée | Ampleur |
|---|---|---|---|---|
| **Sécheresse** ☀ | rendement des terres | 14 | 10 à 30 mois | 45 à 78 % de l'ordinaire |
| **Grève** ✊ | régime des ateliers | 13 | 4 à 16 mois | 35 % du régime normal |
| **Vague d'immigration** ⇥ | population | 11 | immédiat | +12 à +35 % de ménages |
| **Récolte exceptionnelle** ✿ | rendement des terres | 10 | 6 à 14 mois | 120 à 155 % |
| **Boom économique** △ | épargne | 10 | 10 à 24 mois | +35 à +90 % d'apport |
| **Krach boursier** ↯ | destination de l'épargne | 9 | 8 à 20 mois | rien ne va plus en bourse |
| **Crise économique** ▽ | destination de l'épargne | 9 | 10 à 26 mois | l'épargne dort en banque |
| **Grippe espagnole** † | population | 7 | immédiat | −6 à −18 % de ménages |

**Cadence** — les 24 premiers mois sont épargnés, le temps de bâtir de quoi encaisser. Ensuite
un mois sur trente déclenche un tirage, et jamais plus de deux événements coexistent — ni deux
du même type.

**Local ou général** — 62 % des événements ne frappent qu'une ville. C'est le cas normal, et
c'est lui qui rend le rail précieux : on achète le pain de la ville d'à côté. Deux exceptions
de nature : la **finance** n'est jamais locale — il n'y a qu'une bourse et qu'une épargne ; la
**grève** l'est toujours — on ne fait pas grève « en général » contre un salaire qui se fixe
ville par ville.

**La grève a une condition de sortie**, et c'est ce qui la distingue d'un simple malus : elle
réclame +14 % sur le salaire de la ville et s'arrête d'elle-même dès qu'elle l'a obtenu — sans
pouvoir forcer un employeur à payer ce qu'il n'encaisse pas, le plafond de capacité tenant
toujours.

**Une vague d'immigration ne crée pas de logements**, elle remplit ceux qui sont vides. Qui a
bâti en avance encaisse la vague ; qui a bâti juste ce qu'il fallait la regarde passer.

### Ce que cela fait, mesuré

Le même monde joué deux fois, avec et sans un événement forcé de 24 mois (graine 7, ville 0) :

| Événement | Nourriture | Céréales | Pain | Bourse |
|---|---|---|---|---|
| Sécheresse douce (0,78) | 100 → 100 % | +3 % | +9 % | — |
| Sécheresse dure (0,45) | 100 → 78 % | **+74 %** | **+52 %** | — |
| Récolte exceptionnelle | 98 → 100 % | −20 % | −10 % | — |
| Grève générale | 100 → 96 % | — | +15 % | salaire +8 % |
| Krach | — | — | — | **−100 %** |
| Crise | — | — | — | **−100 %** |
| Boom | — | — | — | **+191 %** |

Sur trente ans et huit graines, les événements coûtent **0,5 % de population** : ils secouent
sans saigner. C'est voulu — un événement doit créer une occasion et un danger, pas un impôt
permanent qui n'appelle aucune décision.

---

## 14. Les trois formats

| Élément | 20 min | 30 min | 60 min |
|---|---|---|---|
| Années simulées | 10 | 15 | 30 |
| Mois (tours de 10 s) | 60 | 90 | 180 |
| Villes | 3 | 4 | 5 |
| Filière élevage-boucherie | non | oui | oui |
| Enchère sur les salaires | non | oui | oui |
| Enchère sur les matières | non | oui | oui |
| Emprunt bancaire | non | oui | oui |
| Prises de contrôle | non | oui | oui |
| Débauchage de directeurs | non | oui | oui |
| Crises économiques | non | 1 | 2 à 3 |
| Joueurs recommandés | 4 à 6 | 6 à 8 | 8 à 10 |
| Mise en sommeil · directeurs · bureaux | oui | oui | oui |

Les trois durées ne sont pas le même jeu à des vitesses différentes : **ce sont trois jeux de
complexité croissante**, ce qui donne au passage une progression naturelle pour l'apprentissage.

---

*Barème consolidé — version 1, 13 août 2026. En cas de contradiction avec le PDF de conception,
ce document l'emporte.*
