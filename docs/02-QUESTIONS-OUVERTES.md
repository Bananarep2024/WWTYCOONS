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
