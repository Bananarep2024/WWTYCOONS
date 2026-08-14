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
| Coupe forestière | 1 | — | 24 bois | 4 $ | 130 $ | 1,08 $ | 27 % |
| Carrière | 1 | — | 24 argile | 4 $ | 130 $ | 1,08 $ | 27 % |
| Mine de charbon | 1 | — | 24 charbon | 4 $ | 130 $ | 1,08 $ | 27 % |
| Mine de fer | 1 | — | 24 minerai | 4 $ | 130 $ | 1,08 $ | 27 % |
| Ferme céréalière | 2 | — | 20 céréales | 8 $ | 260 $ | 2,17 $ | 27 % |
| Ranch | 2 | — | 20 bétail | 8 $ | 260 $ | 2,17 $ | 27 % |
| Scierie | 2 | 48 bois | 24 planches | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Briqueterie | 2 | 48 argile | 24 briques | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Minoterie | 2 | 20 céréales | 10 pain | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Abattoir | 2 | 20 bétail | 10 viande | 32 $ | 1 150 $ | 9,58 $ | 30 % |
| Aciérie | 4 (2×2) | 96 charbon + 96 minerai | 24 acier | 88 $ | 3 240 $ | 27,00 $ | 31 % |
| Manufacture | 4 (2×2) | 24 planches + 8 acier | 24 produits | 88 $ | 2 720 $ | 22,67 $ | 26 % |

Les débits s'emboîtent proprement :
1 ferme nourrit 1 minoterie · 2 coupes forestières alimentent 1 scierie ·
4 mines de charbon + 4 mines de fer alimentent 1 aciérie · 1 scierie + ⅓ d'aciérie alimentent 1 manufacture.

> **La qualité du sol.** Chaque case porte un score de 1 à 5 par ressource. La sortie réelle d'une
> exploitation vaut `débit de base × qualité ÷ 3`. La qualité ne joue **que** sur l'extraction,
> jamais sur la transformation. Une case de qualité 1 est en pratique inexploitable pour cette
> ressource : son prix de revient dépasse le plafond de prix.

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
| Exploitation | 15,2 % | 15 % |
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
| Exploitation | 26 | — | — | 130 $ |
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

### 4.2 — Formation du prix : le flux, jamais le stock

```
Tension     = besoins réels du mois ÷ entrées du mois
Prix cible  = prix de référence × Tension ^ 0,60
Prix du mois = prix précédent + 0,28 × (prix cible − prix précédent)

Bornes : 50 % à 250 % du prix de référence
Plancher local supplémentaire : le prix de revient réel sur ce marché
```

- **Besoins réels** = consommation des ménages + intrants des bâtiments en activité + matériaux
  des chantiers ouverts + entretien. **Acheter pour stocker n'est pas un besoin** et n'entre pas
  dans le calcul.
- **Entrées** = production mise en vente + ce que les entrepôts relâchent.
- **Exposant 0,60** : repris du §8, seul chiffre que le document ait testé. Tension ×2 → prix ×1,52.
- **Lissage 0,28** : calibré sur la mesure du §20 — 30 % de production détournée doit donner
  +19 % en 5 mois. Ce coefficient donne +19,2 %. ✔

> **Rafler un marché ne fait pas monter les prix.** Racheter tout le stock disponible alors que les
> besoins du mois sont servis ne bouge pas le cours d'un centime. Cela vide en revanche le matelas :
> au premier accroc de production, les usines s'arrêtent faute d'intrants. Le matelas protège
> l'approvisionnement, pas le cours. **Retenir sa propre production**, en revanche, réduit
> directement les entrées et fait monter le prix immédiatement.

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
| Nourriture | 80 % | 100 % |
| Emploi | 50 % | 78 % |
| Produits manufacturés | 20 % | 59 % |

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

Chaque mois le salaire de la ville tend vers **le plus petit** de deux nombres :
- ce dont le ménage a besoin pour couvrir son panier au prix du jour, divisé par 2 employés ;
- ce que les employeurs peuvent payer sans passer sous leur seuil d'activité, moyenné sur les
  cases réellement en activité.

Le rattrapage prend quelques mois — et c'est dans cette fenêtre que les baromètres plongent. Le
joueur ne fixe pas son salaire dans l'absolu mais **par rapport à celui de sa ville**, entre 80 %
et 150 % : au-dessus pour rafler la main-d'œuvre de ses rivaux, en dessous pour engranger de la
marge au risque de perdre ses employés. *(formats 30 et 60 min)*

---

## 6. La carte

- **Territoire par ville : 64 × 64 = 4 096 cases**, gare au centre. Une métropole pleinement
  développée en occupe environ 3 200, ce qui laisse 22 % de marge pour que les joueurs se
  disputent le foncier jusqu'à la dernière minute.
- **Cinq territoires**, séparés par de l'espace vide et reliés par des **couloirs de voie ferrée
  réservés**, grisés dès le début de partie et non constructibles.
- **Génération aléatoire à chaque partie.** Le relief (plaine, colline, montagne, forêt) est tiré
  par bruit cohérent ; chaque case reçoit un score de 1 à 5 par ressource dont la distribution
  dépend du relief — les montagnes portent plutôt du minerai et du charbon, les plaines plutôt de
  la fertilité et de l'argile.
- **Toutes les ressources sont présentes dans toutes les villes.** Chaque ville a une prédominance
  et deux ou trois ressources nettement plus rares. Aucune ville ne peut se suffire à elle-même,
  aucune n'est privée de quoi que ce soit.
- **Garantie du générateur :** aucune ville ne démarre sous le seuil de survie alimentaire, sans
  quoi elle meurt avant que quiconque ait pu lui poser une voie.

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
