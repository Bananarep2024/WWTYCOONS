# Questions ouvertes

## À confirmer

1. **Taille de l'immeuble, des bureaux et de l'entrepôt.** La consigne était « tous les autres
   bâtiments font 2 cases, sauf aciérie et manufacture qui en font 4 ». J'ai gardé le logement
   collectif, les bureaux et l'entrepôt à **4 cases (2×2)**, conformément au §20 — sans quoi
   tous ses chiffres calibrés tombent (205 $ par ménage, 20 ménages sur 4 cases, densité,
   rendement de 20 %). À trancher : les passe-t-on vraiment à 2 cases, en recalculant tout ?

2. **Taille de carte en production.** 64 × 64 par ville laisse 4 096 cases, dont ~36 % de rues
   au centre. Une métropole de 2 000 ménages en occupe ~3 200 : c'est trop juste. Il faudra
   soit 80 × 80, soit des rues moins denses. La démo tourne en 48 × 48, ce qui suffit
   largement au format 20 minutes.

3. **Durée des chantiers.** Le §7 annonçait 2 à 4 mois. Dans le système du §20, où la durée
   est celle de l'arrivée des matériaux, une manufacture prend 8 à 12 mois quand les briques
   sont rationnées. C'est cohérent et ça raconte quelque chose, mais c'est long pour une
   partie de 60 mois. Faut-il augmenter la production de briques au départ, ou l'assumer ?

## Points d'équilibrage à surveiller aux essais

4. **Les bureaux.** Rien ne borne leur nombre sinon la main-d'œuvre, et chacun injecte 400 $
   mensuels venus de l'extérieur de la carte. Leur rendement direct est le plus faible du jeu
   (11,7 %), ce qui les empêche d'être une stratégie dominante *en rendement* — mais ils
   restent le levier de croissance le plus puissant. À regarder de près en test.

5. **Plein-emploi et fragilité.** Confirmé en simulation, et c'est brutal : une ville sans mou
   sur le marché du travail ne peut plus bâtir la ferme qui la sauverait, et meurt de faim en
   quelques années. La démo réserve 10 % de bras avant d'autoriser un nouveau logement. Le
   réglage de cette marge est un vrai curseur de conception.

6. **La marge du promoteur.** Un bâtiment sain vaut 1,5 à 2,5 fois son coût de construction
   dès qu'il sort de terre (multiple de 10 contre rendements de 15–25 %). Assumé pour
   l'instant, les marges du barème étant des marges *de référence* qu'un bâtiment mal placé
   n'atteint jamais. Si l'écart paraît trop généreux aux essais, le multiple est le curseur.

## Non implémenté dans la démo

Emprunt bancaire · prises de contrôle par rachat d'actions · crises économiques · directeurs et
débauchage · enchère sur les salaires · enchère sur les matières · offres sur les bâtiments d'un
rival · contrats de fourniture bilatéraux · multijoueur.

Ce sont les mécaniques des formats 30 et 60 minutes. Elles s'ajoutent sur la base existante
sans la remettre en cause.

## Filière élevage

Pain et viande sont pour l'instant strictement interchangeables, et le ranch est un doublon de
la ferme céréalière (pas d'intrant, même débit, même prix). C'est un choix provisoire assumé :
il reste à décider ce qui distinguera vraiment la filière — valeur nutritive double, sol
différent, ou débouché propre.

---

## Ouvertes après le rééquilibrage économique

**1. Les derniers maillons ne gagnent rien, et c'est structurel.** L'aciérie et la
manufacture campent entre 0 et 5 % alors que le barème leur assigne 20 et 25 %. Ce n'est
plus un défaut de comptabilité — c'est l'équilibre de long terme d'un marché à entrée
libre : le prix des produits manufacturés s'établit là où la manufacture marginale ne gagne
plus rien, parce que la demande est bornée par la population tandis que l'offre ne l'est que
par le capital. Les 25 % du barème ne valent qu'au prix de référence, c'est-à-dire quand
l'offre égale la demande — ce que l'entrée libre défait aussitôt.

Trois leviers, à trancher :

- relever le prix de référence des produits manufacturés (17 $ aujourd'hui) ;
- abaisser le coût de construction de la manufacture (680 $ la case) ;
- accepter que les derniers maillons soient des affaires de **volume** et non de marge —
  ce qui est défendable, et donnerait au jeu une raison de plus de posséder toute une
  filière plutôt qu'un atelier isolé.

**2. La rente foncière devrait se capitaliser par usage.** Le facteur de richesse fait
qu'une case de fertilité 5 vaut 516 $ au lieu de 100. C'est ce qui empêche la bonne terre
d'être une rente gratuite pour le premier arrivé. Mais le prix s'applique à la case, pas à
son usage : une maison bâtie sur cette case la paie au même prix, alors qu'elle n'extrait
rien du sol. Le loyer suivant le foncier, elle devient chère à louer — pendant que le budget
du ménage provisionne un loyer forfaitaire de 5 $. Il faudrait soit valoriser la case au
regard de l'usage qu'on en fait, soit indexer le loyer provisionné par le ménage sur le
loyer réellement pratiqué.

**3. Le chômage ne descend plus sous 25 %.** L'emploi se stabilise entre 72 et 79 %. La
ville loge tant qu'elle peut nourrir, donc elle amène des bras plus vite qu'elle n'ouvre
d'ateliers — et les ateliers qu'elle pourrait ouvrir en aval ne passent pas le seuil de
rentabilité. C'est le même nœud que le point 1, vu du côté du travail.
