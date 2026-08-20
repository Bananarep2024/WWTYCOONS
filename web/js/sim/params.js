// ---------------------------------------------------------------------------
// Le barème de référence, en code. Voir docs/00-BAREME.md — ce fichier en est
// la transcription littérale. Aucune valeur numérique du jeu ne doit exister
// ailleurs que dans ce fichier.
// ---------------------------------------------------------------------------

export const P = {
  moisParSeconde: 10,          // 1 mois = 10 s réelles
  salaireCase: 20,             // $ / mois, l'unité de compte de tout le jeu
  salaireFixe: true,           // le même salaire partout : la variabilité dort
  elasticiteSalaire: 0.50,     // le salaire suit la tension du marché du travail
  salairePlancher: 0.80,       // sans jamais tomber sous 16 $
  salairePlafond: 1.50,        // ni monter au-dessus de 30 $
  epargneVisee: 0.06,          // ce que le ménage doit pouvoir mettre de côté
  terrainRef: 100,             // $ la case, avant facteurs
  entretienAnnuel: 0.10,       // 10 % / an de la valeur bâtie, foncier exclu
  loyerBase: 5,                // $ / mois pour une maison au niveau 1

  // Marché
  exposantPrix: 0.60,          // tension^0,6
  lissagePrix: 0.28,           // calibré : 30 % de production retenue -> +19 % en 5 mois
  prixPlancher: 0.50,          // du prix de référence
  prixPlafond: 2.50,
  tensionMin: 0.20,
  tensionMax: 6.00,

  // Le matelas de sécurité, et ce qui l'y ramène.
  //
  // Le prix ne suivait que les flux — besoins du mois ÷ entrées du mois — et le
  // stock n'entrait nulle part dans le calcul. La conséquence n'était visible
  // qu'à long terme : dès qu'un marché s'était constitué un tas, ce tas devenait
  // INVISIBLE. Les flux se rééquilibraient autour de lui, la tension revenait à
  // 1, le prix aussi, et plus rien ne le mangeait ni ne le faisait grossir. Une
  // partie de trente ans finissait avec vingt-trois mois d'argile et mille sept
  // cents mois de bétail immobilisés, tandis que le bois vivait sur un demi-mois.
  //
  // On corrige des deux côtés. Le marché déclare maintenant ce qu'il veut TENIR
  // — un mois de consommation, pas plus — et l'écart entre ce matelas et ce
  // qu'il a en cave s'ajoute à ses besoins du mois, étalé sur le délai de
  // reconstitution. Un marché à sec achète au-delà de sa consommation et fait
  // monter le prix ; un marché engorgé achète moins et le fait tomber.
  matelasMois: 1.0,            // le matelas visé, en mois de consommation
  moisDeRestockage: 6,         // sur combien de mois on comble ou on purge l'écart
  // Le rattrapage ne déplace les besoins que d'un quart, dans un sens comme
  // dans l'autre. Balayé sur 8 cartes × 30 ans : ±0,80 laisse une ville morte,
  // ±0,50 en laisse deux — c'est encore assez pour qu'une ville neuve endormie
  // sur son amorçage n'existe plus aux yeux du marché. ±0,25 : aucune morte,
  // aucune crise, 2 180 ménages par ville et un matelas d'au moins 0,57 mois
  // sur chaque matière première.
  correctionMatelas: 0.25,

  // Et ce qui dort au-dessus du matelas se perd : le grain s'échauffe, la bête
  // maigrit, le charbon s'effrite sous la pluie. Sans cette freinte, un tas
  // constitué une fois ne redescend jamais — mille sept cents mois de bétail à
  // cent soixante têtes de consommation, c'est cent quarante ans de purge.
  // Elle ne coûte rien à un marché bien tenu : elle ne mord que sur l'excédent.
  //
  // Elle se calcule livre par livre — la marchandise pourrit là où elle est — et
  // le matelas d'une ville se mesure sur son DÉBIT LISSÉ, le plus grand de ce
  // qu'elle consomme, de ce qu'elle sort, et de son débit du mois d'avant amorti
  // de 20 %. Voir market.js : les trois autres façons de l'écrire ont été
  // essayées et tuent des villes.
  //
  // Réglée par balayage sur 4 cartes × 25 ans, le matelas et le délai tenus
  // fixes. 0,05 laisse le troupeau à 150 mois ; 0,20 resserre bien mais rabote
  // le matelas de planches à 0,2 mois, c'est-à-dire plus de matelas du tout.
  // 0,10 tient tout entre 0,5 et 1,5 mois et donne la population la plus haute
  // des trois — 2 051 ménages contre 1 889 sans aucune des deux règles.
  freinteExcedent: 0.10,       // part de l'excédent perdue chaque mois
  memoireDebit: 0.80,          // le débit d'une ville redescend de 20 % par mois

  // Ville
  cibleProduits: 0.90,         // au-dessus, la ville cesse d'ajouter des manufactures

  // LA MARGE DU DÉTAILLANT. Ce que la boutique ajoute au prix du marché, et qui
  // fait tout son revenu. Elle se déduit du rendement visé de la transformation
  // — 20 % l'an — pour un commerce de deux cases écoulant 600 $ de marchandise
  // par mois : 72 $ de marge, 40 $ de salaires, 9,60 $ d'entretien, 22,40 $ de
  // résultat sur 1 347 $ de terrain et de murs. Exactement 20 %.
  margeCommerce: 0.12,
  // Un immeuble de bureaux pour tant de ménages.
  //
  // C'est le cadran de la croissance, et il est brutal. Les bureaux sont le seul
  // argent qui vienne du dehors — vingt postes qu'aucune entreprise locale ne
  // paie — donc le seul moyen d'employer une population que l'industrie locale
  // ne peut pas absorber. Mesuré sur six cartes et cent ans :
  //
  //   1/40  →   349 ménages · 18 % de chômage · Bourgs et Villes
  //   1/34  →   591 ménages · 16 % · quelques Grandevilles
  //   1/30  →  1 300 ménages · 15 % · Villes, Grandevilles, Métropoles
  //   1/26  →  2 944 ménages · 15 % · mais 158 cases libres : tout est saturé
  //   1/22  →  l'économie décroche — 30 % de chômage, 80 % de nourriture
  //
  // À 1/30 les Métropoles deviennent atteignables et le chômage BAISSE — les
  // bureaux emploient plus de bras qu'ils n'en amènent. Mesuré depuis, avec les
  // départs hétérogènes : 612 ménages par ville à vingt ans, 814 à quarante,
  // 874 à soixante, 16 % de chômage, nourriture à 100 %, et encore 2 538 cases
  // libres par territoire — la partie n'est pas finie.
  menagesParBureaux: 30,
  brasReservesAuxVivres: 0.15, // bras qu'on garde pour nourrir avant tout bureau
  emploiPourLoger: 0.86,       // on ne loge que dans une ville qui a du travail
  densifierSous: 0.25,         // quartier d'habitation rempli au 3/4 : on bâtit haut
  pivot: 0.80,                 // attractivité au-dessus de laquelle la ville attire

  // L'attractivité
  // attractivité = moyenne des trois baromètres × facteur d'aisance
  // aisance = revenu du ménage ÷ panier local — 1,00 = il boucle tout juste
  aisanceMin: 0.70,            // une ville où l'on ne boucle pas repousse
  aisanceMax: 1.20,            // une ville où l'on met de côté attire
  partMobile: 0.006,           // ce qui bouge chaque mois entre villes reliées
  cadenceDemo: 0.0035,         // % de population par mois et par point d'attractivité
  cadenceMax: 0.05,            // plafond ±5 % / mois
  exodeCritique: 0.05,         // seuil critique franchi -> -5 % / mois
  // LES SEUILS QUI VIDENT UNE VILLE.
  //
  // Les produits manufacturés n'en font plus partie. On ne quitte pas une ville
  // parce qu'on n'y trouve pas de quoi s'équiper — on y vit moins bien, ce que
  // l'attractivité dit déjà, et cela suffit. Le seuil produits transformait un
  // inconfort en exode et condamnait toute ville jeune, dont la filière
  // manufacturière est par construction la dernière à se monter.
  //
  // La nourriture monte en revanche de 80 à 90 % : c'est elle, et elle seule,
  // qui retient une population. En dessous, on part.
  //
  // Et l'emploi reste, car c'est le SALAIRE qui permet d'acheter cette
  // nourriture. Sans lui, fonder une ville et n'y bâtir que des maisons
  // suffirait à faire venir du monde — des gens sans travail, sans revenu, donc
  // sans repas.
  // L'ATTRACTIVITÉ TIENT EN DEUX CRITÈRES, ET RIEN D'AUTRE.
  //
  //   chômage au-dessus de 15 %, OU nourriture sous 85 %  →  la ville se vide
  //   sinon                                               →  elle se remplit
  //
  // C'est tout. La moyenne des trois baromètres pondérée par l'aisance a été
  // abandonnée : elle plafonnait à 67 % une ville sans manufacture — treize
  // points sous le pivot — qui perdait donc de la population chaque mois avec
  // une nourriture à 100 % et un plein emploi. Une ville n'a pas à mourir de ne
  // pas s'équiper.
  seuilsCritiques: { nourriture: 0.85, emploi: 0.85 },
  employesParMenage: 2,
  coefChantiers: 1.45,         // au-delà de la consommation : matériaux et entretien

  // Bâtiments
  seuilMatieres: 0.15,         // sous 15 % de ses besoins, un bâtiment s'arrête
  entretienSommeil: 0.10,      // 10 % de la masse salariale en sommeil
  moisAvantFermeture: 12,      // une case vide un an ferme
  moisAvantFaillite: 24,       // une affaire qui saigne deux ans ferme

  // Société
  apportJoueur: 1500,
  partFondateur: 0.10,
  actionsInitiales: 15000,
  // --- La bourse ---
  //
  // Le PER n'est pas un réglage, c'est un PRIX — et il se forme comme tous les
  // autres prix du jeu, par une tension entre une demande et une offre :
  //
  //   tension = capitaux cherchant un placement ÷ bénéfices annuels offerts
  //   PER ← PER + lissage × ( PER de référence × tension^exposant − PER )
  //
  // Il était jusqu'ici une fonction en escalier sur un `climat` qui n'était
  // jamais réassigné : une constante déguisée. Désormais le cycle ÉMERGE —
  // beaucoup de cash et peu de bénéfices à acheter, le multiple monte et les
  // cours montent plus vite que les profits ; économie molle, l'épargne
  // s'évapore et le multiple s'effondre.
  perReference: 10,
  perPlancher: 4,
  perPlafond: 22,
  lissageBourse: 0.04,         // un multiple de marché se déplace en années, pas en mois
  partEnBourse: 0.30,          // part de l'épargne des ménages dirigée vers la bourse
  beneficePlancher: 4000,      // sous ce total, la tension divergerait — et au premier
                               // mois aucune société n'a encore douze mois d'historique

  // --- Les sociétés locales ---
  //
  // Le parc d'une ville n'appartient plus à des « indépendants » anonymes : il
  // appartient à des sociétés de filière, une par métier et par ville, qui
  // possèdent leur amont et leur aval d'un seul tenant — la coupe ET la scierie,
  // la ferme ET la minoterie. On ne leur rachète pas un bâtiment : on les prend
  // en bourse, ou pas du tout.
  partProfitLocalEnBourse: 0.30,  // ce que la filière place au lieu de bâtir
  primeOPA: 0.15,                 // la prime minimale qu'accepte le public
  curseurOPA: [0, 60],            // le curseur de l'offre, en % au-dessus du cours

  // --- Les compagnies de chemin de fer ---
  //
  // Une liaison EST une société : on y souscrit pendant les travaux, elle entre
  // en bourse le jour où la ligne s'ouvre, et elle vit ensuite d'un péage sur le
  // trafic qu'elle porte. C'est la valeur de croissance du jeu : son bénéfice
  // monte mécaniquement avec les villes qu'elle dessert.
  capitalParCaseDeVoie: 150,   // capital nominal d'une ligne, par case de longueur
  prixNominalAction: 10,       // une action de compagnie ferroviaire
  entretienVoie: 0.04,         // 4 % / an du capital nominal

  // --- LE MODÈLE ÉCONOMIQUE DU RAIL ---
  //
  // Deux recettes, et il faut les deux.
  //
  // 1. VOYAGEURS ET COURRIER — une recette par ménage relié et par mois. C'est
  //    la part STABLE : elle ne dépend d'aucun cours, elle ne s'effondre pas en
  //    bas de cycle, et elle monte avec la population. C'est ce qui fait du rail
  //    la valeur de croissance du jeu : son revenu augmente sans que le porteur
  //    ait rien à faire, pourvu que les villes qu'il dessert grandissent.
  //
  // 2. COMMISSION SUR LE FRET — un pourcentage de la valeur des marchandises
  //    qui passent par le marché desservi. C'est la part CYCLIQUE : elle suit
  //    les prix et les volumes, donc elle triple en haut de cycle et fond en bas.
  //
  // La commission ENTRE DANS LE PRIX. Un marché relié cote plus cher qu'un
  // marché isolé, exactement de la commission — c'est un prix rendu, port
  // compris. Le producteur, lui, encaisse toujours le même prix départ : le rail
  // ne lui prend rien, il facture l'acheminement à l'acheteur. C'est la seule
  // formulation honnête, et c'est aussi celle qui donne au joueur le bon signal :
  // relier deux villes RENCHÉRIT leurs marchandises, et n'a d'intérêt que si
  // l'écart de prix entre les deux dépasse la commission.
  //
  // LE CALIBRAGE. Balayé sur 25 ans, cinq villes reliées, graine 12345. Le
  // réseau fait 799 cases, coûte 95 880 $ à poser et 4 794 $/an à entretenir.
  // Résultat net de la compagnie, et année où elle a remboursé la voie :
  //
  //   commission   an 5    an 10   an 15   an 20   an 25   remb.    ménages
  //        0 %      −57    −113      15     208     425   jamais      2 355
  //        1 %      239     446     821   1 342   1 875   17,9 ans    2 169
  //        2 %      566     905   1 486   2 439   3 657   13,0 ans    2 481
  //        4 %    1 137   1 904   2 777   3 926   5 612    9,3 ans    2 032
  //        8 %    2 284   3 784   4 911   6 833   9 412    6,7 ans    1 960
  //       15 %    4 133   5 625   7 624   9 602  12 453    5,2 ans    1 481
  //
  // Trois choses se lisent là-dedans.
  //
  // 1. SANS COMMISSION, LE RAIL NE SE REMBOURSE JAMAIS. Le voyageur et le
  //    courrier ne couvrent même pas l'entretien avant la quinzième année. Une
  //    ligne ne peut pas vivre de son quai : il lui faut du fret.
  // 2. AU-DELÀ DE 4 %, LA COMMISSION ÉTRANGLE CE QU'ELLE TRANSPORTE. À 15 % la
  //    compagnie gagne cinq fois plus et il y a 40 % d'habitants en moins : elle
  //    a mangé son propre marché.
  // 3. L'OPTIMUM DE L'ÉCONOMIE EST À 2 %, et il est net — 2 481 ménages, plus
  //    qu'à 0 % (2 355) parce qu'une compagnie rentable reverse des dividendes
  //    qui rebâtissent les villes, et plus qu'à 4 % parce que le port ne pèse
  //    pas encore sur les cours.
  //
  // Treize ans de remboursement, c'est délibérément long : le rail est le pari
  // du jeu. À cinq ans il rend 7 %/an, moins qu'une maison ; à vingt ans il en
  // rend 30, plus qu'une manufacture. C'est le seul actif dont le revenu monte
  // tout seul, et c'est ce qu'on achète en le posant.
  voyageursParMenage: 0.35,    // $ / mois et par ménage relié — voyageurs et courrier
  commissionFret: 0.020,       // 2 % de la valeur des marchandises, incluse dans le prix

  multipleNormal: 10,
  multipleEuphorie: 15,
  multipleCrise: 5,
  malusPerte: 3,               // une perte se répare : -3 × perte annuelle
  fenetreProfit: 12,           // mois glissants
  histoireDesCours: 180,       // mois de cours conservés par marchandise

  // Foncier
  facteurNiveau: [1.0, 1.3, 1.8, 2.6, 4.0],
  seuilsNiveau: [100, 250, 500, 1000, 2000],   // en ménages
  nomsNiveau: ['Comptoir', 'Bourg', 'Ville', 'Grandeville', 'Métropole'],
  // L'atténuation du prix du sol avec la distance à la gare, PAR NIVEAU.
  //
  // C'était une constante, et c'était l'erreur : le rapport centre / périphérie
  // restait alors figé pour toujours, et quand la ville montait d'un palier tout
  // le monde était multiplié par le même nombre. Or dans un hameau le centre ne
  // vaut guère plus que la lisière, tandis que dans une métropole il vaut vingt
  // fois plus. L'atténuation doit donc se DURCIR avec le niveau.
  //
  // Elle est PROPORTIONNELLE au facteur de niveau, et ce n'est pas un détail :
  // c'est la seule progression qui garantisse qu'aucune case ne perde jamais de
  // valeur quand la ville grandit. Une première version montait plus vite —
  // 0,020 à 0,130 — et une case de lisière passait alors de 271 à 257 $ au
  // passage au Bourg. « Mon terrain vaut moins parce que la ville a grandi » est
  // exactement ce qu'un joueur ne doit jamais lire.
  //
  //   attenuation[n] = 0,028 × facteurNiveau[n]
  //
  // Le potentiel de valorisation va alors de ×4,00 contre la gare à ×1,49 à
  // quarante-cinq cases, en croissant à chaque palier partout. Et c'est de là
  // que vient tout le reste : une résidence encaisse la hausse du sol par son
  // loyer, un atelier ne fait que la subir dans son prix de revient. L'économie
  // range la ville toute seule.
  //
  // ELLE SE COMPTE MAINTENANT EN FRACTION DU RAYON, PLUS EN CASES.
  //
  // Le réglage ci-dessus était absolu, calibré sur un territoire de rayon 44.
  // Depuis que le rayon constructible suit le palier — 11 au Comptoir, 34 à la
  // Métropole — un chiffre absolu n'a plus de sens : dans un carré de 11 le
  // gradient serait plat, et le centre d'un comptoir vaudrait sa lisière.
  //
  // Le gradient porte donc sur d ÷ rayon du palier, et les coefficients sont
  // l'ancienne atténuation multipliée par 44 : à la LISIÈRE, le prix vaut
  // exactement la même fraction du centre qu'avant — 45 % au Comptoir, 17 % à
  // la Métropole. Le calibrage est conservé là où il avait été mesuré ; seul
  // l'intérieur se redistribue.
  gradientFoncier: [1.232, 1.602, 2.218, 3.203, 4.928],
  partIndependants: 0.30,
  surprixIndependants: 1.20,   // ce qu'un indépendant fait payer sur une CASE
  anneesDeProfit: 3,           // un bâtiment vaut son terrain + 3 ans de profit
  // — le plancher est le terrain lui-même : voir prixRachatIndependant

  chantiersVilleParMois: 6,       // ce qu'une ville peut lancer en un mois
  // LE RAYON CONSTRUCTIBLE, PAR PALIER.
  //
  // Le territoire d'une ville n'est plus un disque figé où la contiguïté décide
  // de tout : c'est un CARRÉ centré sur la gare, dont le rayon suit le palier.
  // On bâtit où l'on veut dedans, nulle part dehors.
  //
  // LES BANDES SONT CELLES DE `seuilsNiveau`, ET ELLES SONT LARGES. Un Comptoir
  // va jusqu'à 250 ménages, pas 100 : le seuil est l'ENTRÉE dans le palier
  // suivant. Une première version de cette échelle l'avait lu à l'envers et
  // donnait au Comptoir un carré de rayon 11 — 529 cases pour 500 bâties au
  // plafond. Mesuré : quatre villes sur cinq bloquées à 215 ménages, incapables
  // de poser une case de plus, et le monde à l'arrêt.
  //
  //   Comptoir    <250       r=16  côté 33  1 089 cases    500 bâties   46 %
  //   Bourg        250-499   r=21  côté 43  1 849 cases    950          51 %
  //   Ville        500-999   r=26  côté 53  2 809 cases  1 700          61 %
  //   Grandeville 1000-1999  r=30  côté 61  3 721 cases  3 100          83 %
  //   Métropole   ⩾2000      r=34  côté 69  4 761 cases       —          —
  //
  // Les rayons sortent d'une mesure : une ville occupe 2,20 case par ménage à
  // cent ménages et 1,55 à deux mille, le ratio baissant à mesure qu'elle
  // densifie par immeubles.
  //
  // Le haut de l'échelle est SERRÉ, et c'est délibéré. Le rayon maximal est
  // borné par la règle d'écartement — deux carrés maximaux ne se recoupent
  // jamais — et l'élargir coûterait des sites de fondation : à 34 il en reste
  // douze sur la carte, à 42 il n'en resterait que six. Une Métropole sature
  // donc autour de trois mille ménages, et la croissance doit repartir
  // ailleurs. C'est la raison d'être des gares qu'on fonde.
  //
  // La distance se mesure en CHEBYSHEV — le plus grand des deux écarts — parce
  // que c'est la distance d'un carré. En euclidien, les coins seraient hors du
  // territoire tout en paraissant dedans.
  rayonPalier: [16, 21, 26, 30, 34],
  // Deux carrés maximaux ne se recoupent jamais : c'est la seule condition pour
  // fonder une gare. 2 × 34 + 1.
  ecartMinimalGares: 69,
  // Ce que le générateur garantit à chaque ville DANS SON CARRÉ DE DÉPART.
  // Vingt cases suffisent en théorie — cent pains, cinq minoteries, deux cents
  // céréales, vingt fermes de qualité 1 — on en met vingt-quatre pour la marge.
  minCasesParRessourceDepart: 24,
  dispersionDepart: 0,         // le parc de départ ne se disperse plus (§ 5.2)
  casesParMenage: 3.0,         // logement + postes : ce qu'un ménage occupe
  aisanceUrbaine: 1.20,        // marge sur le rayon utile — d'où les trous
  porteeExploitations: 2.2,    // une ferme a le droit de s'éloigner
  margeFondation: 2.4,         // le rayon de fondation anticipe le parc complet
  ampleurSurcapacite: 4.0,     // ×4 la surcapacité du tempérament, en excès d'offre
  dispersionVille: 18,         // et ensuite, quand la ville bâtit d'elle-même
  rendementMinimalPourBatir: 0.05,  // sous ce rendement attendu, on ne bâtit pas
  couvertureMinimale: 1.00,    // pas un atelier de plus si l'amont ne suit pas

  // Le sol — échelle 0 à 3
  //
  //   0  rien du tout. Pas de gisement, pas de terre : on ne peut rien y ouvrir.
  //   1  le sol de partout. À prix de référence, l'exploitation couvre tout
  //      juste son entretien : rendement nul, et négatif dès que le cours passe
  //      sous la référence. Chaque ville en a pour chaque ressource — c'est le
  //      plancher qui lui permet de produire ce qu'elle n'a pas, à prix coûtant.
  //   2  correct. 5 % l'an.
  //   3  le filon. 15 % même sur un cours effondré, et bien davantage sinon.
  //
  // ÉCHELLE 0-3, ET CE QU'ELLE IMPOSE.
  //
  // Les trois rendements visés ne laissent pas le choix de la forme : ils la
  // déterminent. Si la case 1 couvre exactement son entretien, alors tout ce
  // qu'une case 2 produit EN PLUS est du profit net — et 5 % de rendement, sur
  // un capital de cet ordre, ne représente que 9 % de production supplémentaire.
  // La case 2 produit donc à peine plus que la case 1 ; ce qui la sépare d'elle
  // n'est pas le volume, c'est la marge. En revanche la case 3, pour tenir 15 %
  // sur un cours à 60 % de la référence, doit produire 2,1 fois la case 1 — et
  // elle rend alors 61 % au prix de référence.
  //
  // L'échelle de production est donc ACCÉLÉRÉE, pas linéaire : 0 · 1 · 1,09 ·
  // 2,13. C'est une conséquence arithmétique des trois cibles, pas un choix.
  //
  // L'EFFECTIF NE SUIT PLUS LE SOL. Une concession se travaille par une équipe
  // fixe ; c'est le filon qui décide de ce qu'elle en tire, pas le nombre de
  // bras. C'est la condition pour que la qualité se voie sur la MARGE — quand
  // l'emploi suivait le sol en proportion exacte de la production, la recette
  // par ouvrier était une constante et la bonne terre ne rapportait rien de
  // plus par ouvrier que la mauvaise.
  qualiteSommet: 3,            // le haut de l'échelle
  rendementQ2: 0.05,           // ce que doit rendre une case 2, au prix de référence
  rendementQ3: 0.15,           // ce que doit rendre une case 3, sur un cours effondré
  prixEffondre: 0.60,          // et « effondré » veut dire 60 % de la référence
  // LE SALAIRE QUI SERT À CALIBRER N'EST PAS LE SALAIRE DE RÉFÉRENCE.
  //
  // salaireCase — 20 $ — est l'unité de compte du barème. Ce n'est pas ce que
  // la partie paie : le salaire est endogène, il monte avec la tension du
  // marché du travail, et il s'établit autour de 24 $. Calibrer « la case 1
  // couvre tout juste son entretien » sur 20 $ revient donc à la calibrer sur
  // une marge qui n'existe pas — mesuré : la case 1 tournait à −7,9 %, la case 2
  // à −3,3 %, toute la base extractive fermait, et dix-huit villes sur quarante
  // mouraient.
  salaireAttendu: 24,
  // CE QU'UN OUVRIER SORT SUR UNE CASE 1, EN DOLLARS DE MARCHANDISE.
  //
  // 12 $, soit la MOITIÉ de son salaire : une exploitation de qualité 1 est
  // franchement déficitaire au prix de référence, et ne revient à l'équilibre
  // que si le cours double — ce qui est précisément ce qui arrive dans une ville
  // qui n'a que du sol pauvre, puisqu'elle produit peu et manque de tout.
  //
  // C'est le mécanisme voulu : le sol pauvre ne se paie pas en faillites, il se
  // paie en PRIX ÉLEVÉS et en salaires au plafond, donc en budgets de ménages
  // contraints et en épargne nulle. La ville vit, elle ne prospère pas.
  //
  // Une ferme : 12 ÷ 2,40 = 5 par case, × 2 cases × 4 ouvriers = 40 céréales.
  // Une coupe : 12 ÷ 1 = 12 par case, × 1 case × 4 ouvriers = 48 bois.
  // 24,10 $, c'est-à-dire le salaire lui-même à dix centimes près : une case de
  // qualité 1 couvre exactement sa masse salariale et rien de plus.
  //
  // Ce n'est pas un choix, c'est le point fixe du système. Les prix de référence
  // se déduisent de ce que sort un ouvrier ; ce que sort un ouvrier se déduit de
  // cette recette. Elle valait 12 $ le temps d'un tour — la moitié du salaire —
  // et les prix redéduits l'ont ramenée d'eux-mêmes ici, en doublant. Ce chiffre
  // et la table des prix sont la même équation vue des deux bouts.
  //
  // Une ferme : 24,10 ÷ 4,82 = 5 par case, × 2 cases × 4 ouvriers = 40 céréales.
  // Une coupe : 24,10 ÷ 2,01 = 12 par case, × 1 case × 4 ouvriers = 48 bois.
  recetteOuvrierQ1: 24.10,
  // Ce qu'un ouvrier dégage AU-DESSUS de son salaire sur une case 1. C'est cette
  // marge, et elle seule, qui fixe le capital d'une exploitation : « case 1 =
  // rendement nul » veut dire « marge brute annuelle = entretien », donc
  // capital = 12 × effectif × marge ÷ 10 %.
  margeOuvrierQ1: 4,
  // Ce qu'une case vaut quand elle ne vaut rien : une case sans gisement garde
  // sa valeur de terrain nu. Sans ce plancher, la moitié de la carte serait
  // gratuite et le foncier cesserait d'être un arbitrage.
  solPlancher: 0.50,
  // L'ÉCHELLE INDUSTRIELLE : combien d'ouvriers tient une case. Une case n'est
  // pas un poste. Elle vaut pour l'exploitation comme pour l'atelier, si bien
  // que tous les rapports du barème restent exacts — débits, intrants, salaires
  // et coûts de construction montent ensemble.
  //
  // Sur une exploitation, elle NE se combine plus à la qualité du sol : quatre
  // ouvriers sur une case, qu'elle vaille 1 ou 3. Voir plus haut pourquoi.
  echelleIndustrielle: 4,

  // La rareté, en part de la carte entière. On ne s'appuie pas sur la forme du
  // bruit — on CLASSE les cases et on découpe à ces quantiles.
  //
  // Quatre cases sur cinq ne donnent RIEN pour une ressource donnée. Avec cinq
  // ressources tirées séparément, il reste malgré tout de quoi faire : une case
  // sur trois environ ne vaut rien pour aucune des cinq.
  partQualite: [0.80, 0.15, 0.04, 0.01],   // q0 … q3, somme = 1
  echellesQualite: [11, 5],    // l'échelle du bruit : des îlots, pas des régions
  // Le plancher promis à chaque ville : quoi qu'en dise le relief et quelle que
  // soit sa vocation, elle dispose d'au moins ce nombre de cases de qualité 1
  // sur CHACUNE des cinq ressources. Sans quoi une ville sans charbon ne peut
  // pas en produire une tonne avant que le rail n'arrive, et la partie s'arrête
  // pour elle.
  minCasesParRessource: 60,

  // --- Les événements ---
  //
  // Une économie qui ne connaît que sa propre mécanique devient prévisible : on
  // trouve la bonne trajectoire, on la répète, il n'y a plus rien à décider. Les
  // événements sont ce qui la casse.
  graceEvenements: 24,         // on laisse la partie s'installer avant le premier
  moisEntreEvenements: 30,     // un mois sur trente en déclenche un
  evenementsSimultanes: 2,     // empiler les catastrophes ne se joue plus, ça se subit
  partEvenementsLocaux: 0.62,  // le local est la règle — c'est lui qui rend le rail précieux

  secheresseMin: 0.45, secheresseMax: 0.78,   // ce que rend la terre pendant
  recolteMin: 1.20,    recolteMax: 1.55,
  immigrationMin: 0.12, immigrationMax: 0.35, // ménages en plus, si les logements suivent
  grippeMin: 0.06,     grippeMax: 0.18,       // ménages emportés
  regimeDeGreve: 0.35,         // à quel régime tourne un atelier en grève
  hausseExigee: 0.14,          // ce que la grève réclame sur le salaire
  boomMin: 0.35,       boomMax: 0.90,         // l'épargne gonflée par des capitaux du dehors

  // Les vocations : ce qui fait des zones plutôt qu'une carte uniforme
  //
  // Chaque ville reçoit un plafond de qualité par ressource. Deux ressources
  // montent à 3, une à 2, deux plafonnent à 1 — de sorte qu'aucune ville ne se
  // suffit à elle-même et que le rail transporte enfin autre chose que des
  // marchandises que l'autre bout produisait déjà.
  //
  // Le plafond ne descend jamais sous 1 : une ville dispose toujours de quelques
  // cases exploitables sur CHACUNE des cinq ressources, au rendement nul de la
  // qualité 1. Elle peut donc produire ce qu'elle n'a pas — à prix coûtant, et
  // c'est précisément ce qui rend la liaison ferroviaire désirable plutôt
  // qu'indispensable à la survie.
  vocationRiche: 3,
  vocationMoyenMin: 2, vocationMoyenMax: 2,
  vocationPauvreMin: 1, vocationPauvreMax: 1,
  // LE FILON EST TOUJOURS HORS LES MURS. Une ville, si bien dotée soit-elle,
  // plafonne à la qualité 2 sur son propre territoire : elle vit correctement
  // de son sol, elle ne s'enrichit pas dessus. Toute la qualité 3 se trouve dans
  // la terre que personne ne possède — il faut y fonder une gare pour l'atteindre.
  // C'est ce qui fait de la colonisation le seul chemin vers le vrai profit.
  plafondEnVille: 2,
  // ET HORS DE PORTÉE. Un filon collé à la lisière d'une ville de départ se
  // laisse cueillir en fondant une gare à vingt-six cases de là — c'est-à-dire
  // sans rien risquer. On repousse donc la qualité 3 au-delà de cette distance
  // du centre de toute ville fondatrice : pour l'atteindre il faut vraiment
  // partir, et une colonie lointaine est une colonie qu'il faudra relier.
  distanceMinFilon: 78,
  // La portée de la vocation, en cases : l'écart-type de la gaussienne qui
  // mélange les plafonds de deux villes voisines. À peu près le rayon d'une
  // ville, de sorte qu'un territoire lit sa propre vocation presque pure et que
  // le dégradé se joue dans l'entre-deux, sur la terre que personne n'occupe
  // encore.
  porteeVocation: 30,

  // --- La gare fondatrice -------------------------------------------------
  //
  // Poser une gare, ce n'est pas poser un bâtiment : c'est FONDER. Elle arrive
  // avec ses colons, de quoi les loger, de quoi ouvrir leurs premières
  // exploitations, et de quoi les nourrir deux ans. Passé ce délai les vivres
  // sont épuisés : ou le hameau a monté sa propre filière, ou il est relié au
  // rail, ou il s'éteint. C'est ce pari qui donne son prix à la voie.
  //
  // Son prix inclut tout — le bâtiment, les matériaux et les vivres — et se
  // calcule aux prix de référence. Voir devisGare().
  // ON N'ACHÈTE PAS DES COLONS. La gare n'apporte pas d'habitants : elle apporte
  // les CONDITIONS pour qu'il en vienne — des maisons vides, du travail, et de
  // quoi manger et s'équiper le temps que la filière locale se monte. La
  // population arrive ensuite d'elle-même, par la migration de frontière, si et
  // seulement si les trois baromètres tiennent.
  // UNE GARE N'EMPORTE PLUS RIEN, SAUF DU PAIN.
  //
  // Elle livrait dix maisons, trois exploitations et deux ans de vivres : c'était
  // acheter une colonie clé en main, pas la fonder. On n'y trouve désormais que
  // de quoi manger — un an de pain pour cinq ménages — et le prix suit.
  //
  // Tout le reste se bâtit sur place, avec des matériaux qui viennent de la ville
  // la plus proche et mettent longtemps à arriver (voir moisAcheminement). Et
  // c'est assez pour attirer du monde : une colonie qui offre du TRAVAIL et du
  // PAIN n'a pas besoin de produits manufacturés pour qu'on vienne s'y installer.
  menagesNourris: 5,           // combien de ménages la cargaison de pain nourrit
  moisDePain: 12,              // pendant combien de mois
  // LE DÉLAI D'ACHEMINEMENT. Un chantier ouvert dans une colonie non reliée
  // n'attend pas des ouvriers : il attend un convoi. Rien ne lui est livré
  // pendant ce délai, et les matériaux viennent ensuite du marché de la ville
  // fondatrice la plus proche. C'est ce qui rend la voie ferrée désirable pour
  // autre chose que le commerce : sans elle, on bâtit au ralenti.
  moisAcheminement: 10,
  // Combien de ménages viennent chaque mois du dehors de la carte, à
  // attractivité maximale. C'est un flux ABSOLU, en ménages : le taux de
  // croissance ordinaire est un pourcentage de la population présente, et zéro
  // pour cent de zéro ne peuple jamais un endroit vide.
  immigrationFrontiere: 0.8,
  moisDeVivres: 24,            // deux ans de nourriture et de produits, à 100 %
  exploitationsFournies: 3,    // ce que le stock de matériaux permet d'ouvrir
  // LA REMISE VA À LA TERRE DU DEHORS, PAS AU FONDATEUR.
  //
  // Le fondateur paie son carré PLEIN TARIF : il achète une terre qui vaut ce
  // qu'elle vaut, et l'affaire tient toute seule — mille quatre-vingt-neuf cases
  // qui prendront de la valeur à chaque palier de sa ville.
  //
  // La remise porte ailleurs, et c'est plus juste : sur les cases situées
  // AU-DELÀ DU CARRÉ MAXIMAL de toute ville. Aucune ville ne pourra jamais y
  // bâtir — c'est ce que garantit la règle d'écartement — et une terre sur
  // laquelle on ne peut rien poser ne vaut pas le prix d'une terre à bâtir. Elle
  // garde une valeur : le rail y passe, une gare peut s'y fonder un jour. Mais
  // pas celle-là.
  remiseHorsPerimetre: 0.70,
  coutGareNu: 2000,            // le bâtiment de gare seul, hors cargaison
  rayonGare: 16,               // le territoire qu'ouvre une gare, en cases
  // Une gare ne se pose pas contre une ville ni contre une autre gare : sans
  // cette distance, on annexerait le territoire du voisin au lieu de coloniser.
  distanceMinGare: 26,

  // Amorçage
  stockAmorcage: { planches: 3000, briques: 1500 },

  // Ce qu'on peut pousser la carte au-delà de ses bords, en fraction d'écran.
  // Sans ce débordement, une ville de lisière reste collée au bord et l'on ne
  // peut jamais la placer au milieu de la vue pour la regarder tranquillement.
  debordement: 0.20,

  // Carte — une seule grille pour tout le monde
  //
  // La taille n'est pas décorative : elle décide du dernier palier atteignable.
  // Une Métropole, c'est 2 000 ménages ; au plein emploi chacun réclame deux
  // postes, un poste occupe une case — cinq pour un bureau — et le logement en
  // prend une de plus. Il faut donc de l'ordre de 3 800 cases par territoire, et
  // les paliers de 1 000 et 2 000 ménages restaient décoratifs sur l'ancienne
  // grille de 190 × 130, où une ville saturait vers 400.
  largeurMonde: 380,
  hauteurMonde: 265,
  margeMonde: 22,              // on ne fonde pas une ville au bord de la carte
  rayonVille: 44,              // rayon moyen d'un territoire, dévié par ville
  distanceMinVilles: 94,       // de centre à centre : sans quoi le rail n'a pas de sens
  moisParCaseDeVoie: 0.24,     // durée d'un chantier, à la case de longueur
  // Ce que coûte une case de voie. Une ligne de cent cases revient donc à
  // 12 000 $, contre 16 520 $ pour la gare qu'elle dessert : relier coûte moins
  // cher que fonder, et c'est ce qui doit pousser à relier ce qu'on a fondé
  // plutôt qu'à essaimer sans fin.
  coutVoieParCase: 120,
  // Elle valait 0,42 quand les cinq lignes se construisaient EN PARALLÈLE. La
  // compagnie n'en pose plus qu'une à la fois, si bien que les durées
  // s'additionnent au lieu de se recouvrir : le réseau ne s'achevait qu'au mois
  // 312 à 366, et une ville sur deux mourait d'être restée isolée vingt-cinq
  // ans. Elle est ensuite passée de 0,12 à 0,24 quand la voie a cessé d'être
  // posée par ses deux bouts : une équipe qui part d'une seule gare met deux
  // fois plus longtemps à rejoindre l'autre, et le chiffre doit le dire.     // une ligne longue demande plus de travail
  menagesInitiaux: 55,         // avant le tempérament, qui l'étire de 0,80 à 1,20
};

// Le capital d'une case d'exploitation, déduit de la promesse « une case 1 rend
// zéro au prix de référence » : son entretien annuel égale exactement sa marge
// brute. C'est lui qui fixe les coûts de construction plus bas.
// Le capital d'une case d'exploitation. Il se déduisait de « marge brute =
// entretien » ; cette promesse n'a plus cours, la case 1 étant maintenant
// déficitaire par construction. On le pose donc directement, à la valeur que
// les mesures avaient retenue.
export const CAPITAL_CASE = 1920;

// --- Ressources -------------------------------------------------------------
// prix = prix de référence, celui qui s'établit quand la demande égale l'offre.
//
// CES PRIX SE DÉDUISENT, ILS NE SE POSENT PAS. Méthode du §4.1 :
//
//   prix = coût direct par unité ÷ part du salaire dans le prix
//   coût direct = salaires + intrants, à la production d'une case de QUALITÉ 1
//
// Ils valaient 1 $ le bois quand un ouvrier en sortait 30 par mois. Il n'en sort
// plus que 12 depuis que l'échelle des sols a été reposée, et le prix devait
// suivre : c'est le mécanisme de l'offre et de la demande, pas une décision.
//
// Les laisser périmés revenait à faire battre le marché contre un ancrage faux —
// la tension montait jusqu'au plafond de 2,50× sans jamais rétablir la marge, et
// le monde s'effondrait à zéro ménage par ville en vingt ans.
//
// Aux prix ci-dessous, un ouvrier sur une case 1 encaisse 24,10 $ contre 24 $ de
// salaire : l'équilibre exact, la case pauvre ne rapportant rien. Et le ménage
// paie son panier 46,98 $ pour un revenu de 48 $ au plein emploi — il boucle, il
// n'épargne pas. C'est très exactement la ville de sol pauvre : elle vit, elle
// ne prospère pas. Tout ce qui dépasse la qualité 1 devient de l'épargne.

export const RES = {
  bois:      { nom: 'Bois',      prix: 1.9,    couleur: '#7a6a4f', extractible: true  },
  argile:    { nom: 'Argile',    prix: 1.9,    couleur: '#a56b4a', extractible: true  },
  charbon:   { nom: 'Charbon',   prix: 1.9,    couleur: '#3d3d42', extractible: true  },
  minerai:   { nom: 'Minerai',   prix: 1.9,    couleur: '#6b5b73', extractible: true  },
  cereales:  { nom: 'Céréales',  prix: 1.9, couleur: '#c9a227', extractible: true  },
  betail:    { nom: 'Bétail',    prix: 1.9, couleur: '#b08968', extractible: true  },
  planches:  { nom: 'Planches',  prix: 6.83,    couleur: '#b5894f', extractible: false },
  briques:   { nom: 'Briques',   prix: 6.83,    couleur: '#9c4a35', extractible: false },
  acier:     { nom: 'Acier',     prix: 12.14,   couleur: '#5a7d8c', extractible: false },
  pain:      { nom: 'Pain',      prix: 6.83,   couleur: '#d9a441', extractible: false },
  viande:    { nom: 'Viande',    prix: 6.83,   couleur: '#a83f3f', extractible: false },
  // --- LES BIENS DE CONSOMMATION ---
  //
  // Le fourre-tout « produits manufacturés » est découpé. Il n'y a plus un bien
  // indistinct qu'on achète ou non, mais un PANIER dont on prend ce qu'on peut
  // s'offrir, en commençant par le nécessaire. C'est la même règle d'ordre des
  // dépenses qu'au § 5.8, appliquée à sept articles au lieu d'un.
  //
  // Tous les prix sont dérivés — coût direct ÷ (1 − taux de marge) — jamais
  // posés. Quatre biens partagent le prix des planches parce qu'ils partagent
  // exactement sa recette : deux ouvriers, quarante matières premières, vingt
  // unités en sortie.
  vaisselle: { nom: 'Vaisselle', prix: 6.83,    couleur: '#c98f6a', extractible: false },
  biere:     { nom: 'Bière',     prix: 6.83,    couleur: '#c9832b', extractible: false },
  savon:     { nom: 'Savon',     prix: 6.83,    couleur: '#cfc7a8', extractible: false },
  etoffes:   { nom: 'Étoffes',   prix: 6.83,    couleur: '#8a6f9e', extractible: false },
  papier:    { nom: 'Papier',    prix: 6.83,    couleur: '#d8d2be', extractible: false },
  meubles:   { nom: 'Meubles',   prix: 32.58,   couleur: '#4f7d5a', extractible: false },
  outillage: { nom: 'Outillage', prix: 37.62,   couleur: '#7c8ba0', extractible: false },
};

export const RESSOURCES = Object.keys(RES);

// Les deux nourritures sont substituables 1 pour 1 : le ménage veut une ration
// par mois, pas une demi-ration de chaque. Il mange ce qu'il y a.
export const NOURRITURES = ['pain', 'viande'];

// ---------------------------------------------------------------------------
// LE PANIER DU MÉNAGE — et la distinction qui commande tout le reste.
//
// BESOINS PRIMAIRES : l'emploi et la nourriture. Ils ne se négocient pas. En
// dessous du seuil, la ville se vide, et rien d'autre ne compte — ni le confort,
// ni l'épargne, ni la beauté des boutiques.
//
// BESOINS SECONDAIRES : tout le reste. On n'en meurt pas, on n'en part pas non
// plus ; on vit moins bien. Ils ne peuvent donc PAS vider une ville — mais ils
// pèsent sur son attractivité, et une ville qui les satisfait grandit plus vite
// qu'une ville qui se contente de nourrir ses habitants.
//
// Le rang passe avant le prix dans l'ordre d'achat, et c'est le point : sans
// rang, un ménage achèterait de la vaisselle avant du savon puisqu'ils coûtent
// le même prix, et l'on perdrait la hiérarchie de nécessité qui fait tout
// l'intérêt d'un panier.
//
//   rang 1 — le courant : ce qu'on rachète tous les mois
//   rang 2 — le durable : ce qu'on achète une fois l'an, et qu'on remarque
export const PANIER = [
  { res: 'savon',     qte: 0.50, rang: 1 },
  { res: 'biere',     qte: 0.50, rang: 1 },
  { res: 'papier',    qte: 0.50, rang: 1 },
  { res: 'etoffes',   qte: 0.35, rang: 1 },
  { res: 'vaisselle', qte: 0.25, rang: 1 },
  { res: 'outillage', qte: 0.08, rang: 2 },
  { res: 'meubles',   qte: 0.08, rang: 2 },
];

// Le poids de chaque bien dans le confort d'une ville : sa part du panier au
// prix de référence. Un ménage qui n'a que du savon est moins bien loti qu'un
// ménage qui a des meubles, et le baromètre doit le dire.
export const POIDS_PANIER = (() => {
  const p = {};
  let total = 0;
  for (const a of PANIER) { p[a.res] = a.qte * RES[a.res].prix; total += p[a.res]; }
  for (const r of Object.keys(p)) p[r] /= total;
  return p;
})();

export const BIENS_SECONDAIRES = PANIER.map(a => a.res);

// --- Bâtiments --------------------------------------------------------------
// cases : emprise. w × h : forme posée sur la carte.
// Les débits sont donnés PAR CASE : un bâtiment de n cases a n employés et
// produit n fois ces quantités. (§20 : « une case, un employé, une production »)

export const BAT = {
  // Les exploitations : UNE case, UN employé, dix marchandises sur une case de
  // qualité 1. Débit et coût sont posés, plus dérivés — la base est propre.
  coupe:       { nom: 'Coupe forestière', cases: 1, w: 1, h: 1, employes: 1, sort: 'bois',     debit: 10, intrants: {}, cout: 809, mat: { planches: 118 }, qual: 'bois',      cat: 'expl' },
  carriere:    { nom: 'Carrière',         cases: 1, w: 1, h: 1, employes: 1, sort: 'argile',   debit: 10, intrants: {}, cout: 809, mat: { planches: 118 }, qual: 'argile',    cat: 'expl' },
  mineCharbon: { nom: 'Mine de charbon',  cases: 1, w: 1, h: 1, employes: 1, sort: 'charbon',  debit: 10, intrants: {}, cout: 809, mat: { planches: 118 }, qual: 'charbon',   cat: 'expl' },
  mineFer:     { nom: 'Mine de fer',      cases: 1, w: 1, h: 1, employes: 1, sort: 'minerai',  debit: 10, intrants: {}, cout: 809, mat: { planches: 118 }, qual: 'minerai',   cat: 'expl' },
  ferme:       { nom: 'Ferme céréalière', cases: 1, w: 1, h: 1, employes: 1, sort: 'cereales', debit: 10, intrants: {}, cout: 809, mat: { planches: 118 }, qual: 'fertilite', cat: 'expl' },
  ranch:       { nom: 'Ranch',            cases: 1, w: 1, h: 1, employes: 1, sort: 'betail',   debit: 10, intrants: {}, cout: 809, mat: { planches: 118 }, qual: 'fertilite', cat: 'expl' },

  // La transformation simple : deux cases, deux employés, 40 intrants pour 20.
  scierie:     { nom: 'Scierie',      cases: 2, w: 2, h: 1, employes: 2, sort: 'planches', debit: 20, intrants: { bois: 40 },     cout: 691, mat: { planches: 51, briques: 51 }, cat: 'trans' },
  briqueterie: { nom: 'Briqueterie',  cases: 2, w: 2, h: 1, employes: 2, sort: 'briques',  debit: 20, intrants: { argile: 40 },   cout: 691, mat: { planches: 51, briques: 51 }, cat: 'trans' },
  minoterie:   { nom: 'Minoterie',    cases: 2, w: 2, h: 1, employes: 2, sort: 'pain',     debit: 20, intrants: { cereales: 40 }, cout: 691, mat: { planches: 51, briques: 51 }, cat: 'trans' },
  abattoir:    { nom: 'Abattoir',     cases: 2, w: 2, h: 1, employes: 2, sort: 'viande',   debit: 20, intrants: { betail: 40 },   cout: 691, mat: { planches: 51, briques: 51 }, cat: 'trans' },

  // L'aciérie : quatre cases, quatre employés, 60 intrants pour 20 aciers.
  acierie:     { nom: 'Aciérie',      cases: 4, w: 2, h: 2, employes: 4, sort: 'acier',    debit: 20, intrants: { charbon: 30, minerai: 30 }, cout: 1685, mat: { planches: 72, briques: 101, acier: 41 }, cat: 'trans' },
  // Les manufactures : quatre cases, quatre employés, 80 intrants pour 30 biens.
  // `manufacture` est l'ancienne manufacture, renommée : mêmes intrants, même
  // débit, même prix. Rien n'a été recalibré de ce côté.
  manufacture: { nom: 'Fabrique de meubles', cases: 4, w: 2, h: 2, employes: 4, sort: 'meubles',   debit: 30, intrants: { planches: 60, acier: 20 },  cout: 8107, mat: { planches: 426, briques: 383, acier: 213 }, cat: 'manu' },
  forge:       { nom: 'Forge',               cases: 4, w: 2, h: 2, employes: 4, sort: 'outillage', debit: 30, intrants: { acier: 60, charbon: 20 },   cout: 9392, mat: { planches: 573, briques: 516, acier: 161 }, cat: 'manu' },

  // Les ateliers de biens courants : la même recette que la scierie — deux
  // ouvriers, quarante matières, vingt unités — appliquée à quatre débouchés
  // que le modèle n'avait pas. Le bétail passe ainsi de une à trois issues et
  // le charbon de même : ce sont les deux matières que le jeu sous-employait.
  // LA PAPETERIE EST UN ATELIER, PAS UNE MANUFACTURE.
  //
  // Elle était bâtie sur le patron des quatre cases — 60 bois + 20 charbon pour
  // 30 papier — ce qui lui donnait un prix de référence de 10,31 $, une fois et
  // demie celui des autres biens courants. Conséquence mesurée : à une
  // demi-rame par mois, le papier pesait 6,60 $ sur les 19,98 $ de budget
  // secondaire d'un ménage — UN TIERS À LUI SEUL — et le rang 1 consommait la
  // totalité du budget, si bien qu'aucun ménage n'a jamais acheté un meuble ni
  // un outil, pas même dans un monde de cases 3.
  //
  // Ramenée à la recette commune — deux ouvriers, quarante matières, vingt
  // unités — elle sort à 6,83 $ comme le savon et la bière. Le charbon reste
  // dans la recette pour lui garder ses trois débouchés.
  papeterie:   { nom: 'Papeterie',    cases: 2, w: 2, h: 1, employes: 2, sort: 'papier',    debit: 20, intrants: { bois: 30, charbon: 10 }, cout: 691, mat: { planches: 51, briques: 51 }, cat: 'trans' },
  faiencerie:  { nom: 'Faïencerie',   cases: 2, w: 2, h: 1, employes: 2, sort: 'vaisselle', debit: 20, intrants: { argile: 40 },   cout: 683, mat: { planches: 50, briques: 50 }, cat: 'trans' },
  brasserie:   { nom: 'Brasserie',    cases: 2, w: 2, h: 1, employes: 2, sort: 'biere',     debit: 20, intrants: { cereales: 40 }, cout: 683, mat: { planches: 50, briques: 50 }, cat: 'trans' },
  savonnerie:  { nom: 'Savonnerie',   cases: 2, w: 2, h: 1, employes: 2, sort: 'savon',     debit: 20, intrants: { betail: 40 },   cout: 683, mat: { planches: 50, briques: 50 }, cat: 'trans' },
  filature:    { nom: 'Filature',     cases: 2, w: 2, h: 1, employes: 2, sort: 'etoffes',   debit: 20, intrants: { betail: 40 },   cout: 683, mat: { planches: 50, briques: 50 }, cat: 'trans' },

  // LES COMMERCES. Ni une usine ni un entrepôt : un intermédiaire.
  //
  // Il ne transforme rien et ne stocke rien. Il OUVRE l'accès — un ménage ne
  // peut acheter un bien secondaire que si une boutique de sa ville le tient —
  // et il prend une marge au passage. Une ville pleine d'usines et sans
  // boutiques ne vend rien à ses propres habitants : c'est le nouveau mode
  // d'échec, et il est le bon, parce qu'il crée une demande de capital qui ne
  // produit pas une once de marchandise.
  //
  // La nourriture n'y passe PAS. C'est un besoin primaire : le boulanger vend
  // son pain, et aucune ville ne doit pouvoir mourir de faim faute d'épicerie.
  //
  // Le débit se compte EN VALEUR, pas en unités — c'est la seule mesure juste
  // pour un détaillant, une unité de meubles pesant cinq unités de savon. Douze
  // cents dollars de marchandise par mois pour deux cases : de quoi servir cent
  // soixante-quinze ménages sur l'ordinaire.
  //
  // ET LA BOUTIQUE EST CALIBRÉE À SON ACTIVITÉ RÉELLE, PAS À SON PLEIN.
  //
  // C'est la différence avec un atelier, et elle est structurelle. Une usine
  // tourne à 90-100 % parce que sa production est poussée par ses intrants ; une
  // boutique tourne à 60-70 % parce que sa vente est tirée par un budget qui
  // fluctue. Calibrée au plein, elle ne rentre dans ses frais qu'au-dessus de
  // 75 % d'activité — et l'on mesurait alors 123 commerces déficitaires sur 123.
  //
  // Le capital se déduit donc d'un rendement de 20 % atteint à 70 % D'ACTIVITÉ.
  // Le seuil de rentabilité tombe à 43 %, ce qui laisse à une boutique de quoi
  // traverser un mauvais mois sans fermer.
  epicerie:      { nom: 'Épicerie',      cases: 2, w: 2, h: 1, employes: 2, debit: 1200, tient: ['biere', 'savon'],       cout: 1867, mat: { planches: 137, briques: 137 }, cat: 'com' },
  nouveautes:    { nom: 'Nouveautés',    cases: 2, w: 2, h: 1, employes: 2, debit: 1200, tient: ['etoffes', 'vaisselle'], cout: 1867, mat: { planches: 137, briques: 137 }, cat: 'com' },
  quincaillerie: { nom: 'Quincaillerie', cases: 2, w: 2, h: 1, employes: 2, debit: 1200, tient: ['outillage', 'papier'],  cout: 1867, mat: { planches: 137, briques: 137 }, cat: 'com' },
  ameublement:   { nom: 'Ameublement',   cases: 2, w: 2, h: 1, employes: 2, debit: 1200, tient: ['meubles'],              cout: 1867, mat: { planches: 137, briques: 137 }, cat: 'com' },
  grandMagasin:  { nom: 'Grand magasin', cases: 4, w: 2, h: 2, employes: 4, debit: 3600, tient: ['savon', 'biere', 'papier', 'etoffes', 'vaisselle', 'outillage', 'meubles'], cout: 7333, mat: { planches: 537, briques: 537 }, cat: 'com' },

  maison:    { nom: 'Maison',              cases: 1, w: 1, h: 1, menages: 1,  cout: 180, mat: { planches: 24, briques: 12 }, cat: 'loge' },
  immeuble:  { nom: 'Immeuble',            cases: 4, w: 2, h: 2, menages: 20, cout: 925, mat: { briques: 65, acier: 40 },    cat: 'loge' },
  bureaux:   { nom: 'Immeuble de bureaux', cases: 4, w: 2, h: 2, postes: 20,  cout: 500, mat: { briques: 40, acier: 20 },    cat: 'bur'  },
  entrepot:  { nom: 'Entrepôt',            cases: 4, employes: 4, w: 2, h: 2, capacite: 2000, cout: 100, mat: { planches: 20 },           cat: 'neg'  },
};

export const TYPES_BAT = Object.keys(BAT);

// ---------------------------------------------------------------------------
// LES FILIÈRES LOCALES
//
// Une ville n'est pas un tas de bâtiments sans maître. Chaque métier y est tenu
// d'un seul tenant, de la matière au produit fini, par une société qui porte le
// nom de la ville : la Meunerie de Roche-Noire possède les fermes ET les
// minoteries, la Forestière possède les coupes ET les scieries. C'est ce qui
// donne un sens au rachat — on ne prend pas une scierie, on prend une filière —
// et c'est ce qui rend l'OPA intéressante : le jour où l'on tient la Forestière,
// on tient le bois d'une ville entière.
//
// Ce qui n'est pas là est délibéré. Le LOGEMENT reste aux habitants : il ne se
// possède pas, il s'habite. L'ACIÉRIE et la MANUFACTURE ne sont pas non plus
// dans ce tableau — elles n'ont pas de filière propre, elles se rattachent à
// celle qui leur fournit un intrant et qui dégage la plus grosse marge. Une
// aciérie appartient donc aux Charbonnages ou à la Minière selon la ville, et
// jamais aux deux.
export const FILIERES_LOCALES = [
  { cle: 'bois',     nom: 'Forestière',   couleur: '#6f8f5a', types: ['coupe', 'scierie'] },
  { cle: 'argile',   nom: 'Argilière',    couleur: '#b07a4e', types: ['carriere', 'briqueterie', 'faiencerie'] },
  { cle: 'cereales', nom: 'Meunerie',     couleur: '#c9a227', types: ['ferme', 'minoterie', 'brasserie'] },
  { cle: 'elevage',  nom: 'Élevage',      couleur: '#a4614f', types: ['ranch', 'abattoir', 'savonnerie', 'filature'] },
  { cle: 'charbon',  nom: 'Charbonnages', couleur: '#6b6b76', types: ['mineCharbon'] },
  { cle: 'fer',      nom: 'Minière',      couleur: '#8a7fa8', types: ['mineFer'] },
  { cle: 'negoce',   nom: 'Comptoir',     couleur: '#4f8a97', types: ['bureaux', 'entrepot'] },
  // Le commerce est un métier, pas un appendice : il a sa société, sa
  // trésorerie et son cours, et c'est par elle qu'on prend le détail d'une
  // ville entière.
  { cle: 'boutique', nom: 'Maison de commerce', couleur: '#c47f9a',
    types: ['epicerie', 'nouveautes', 'quincaillerie', 'ameublement', 'grandMagasin'] },
];

// Où vont l'aciérie et la manufacture : la filière qui détient l'un de leurs
// intrants, et parmi celles-là, la plus profitable.
export const RATTACHEMENTS = {
  acierie:     ['charbon', 'fer'],
  manufacture: ['bois', 'acier'],   // 'acier' = la filière qui a hérité de l'aciérie
  papeterie:   ['bois', 'charbon'],
  forge:       ['acier', 'charbon'],
};

// Les ateliers de biens courants suivent la matière qu'ils mangent : la
// faïencerie est à l'Argilière comme la briqueterie, la brasserie à la Meunerie
// comme la minoterie, la savonnerie et la filature à l'Élevage comme l'abattoir.
// Rien à arbitrer : ils n'ont qu'un intrant.


// Coût total de construction d'un bâtiment, en quantités de matériaux.
// L'échelle ne concerne QUE l'exploitation. Une case de sol porte plusieurs
// ouvriers ; un atelier, non — il transforme ce qu'on lui livre, et sa taille
// est celle de ses murs.
//
// Essayé de l'étendre à la transformation, pour garder tous les rapports du
// barème : catastrophe mesurée sur neuf réglages, la meilleure combinaison
// laissant encore une ville sur quinze morte et les produits manufacturés à
// 32 %. Un atelier quatre fois plus gros consomme quatre fois plus d'intrants
// et coûte quatre fois plus cher à bâtir, ce qui étrangle la filière à ses deux
// bouts en même temps. Seule l'exploitation change d'échelle, et l'atelier
// s'ajuste en nombre.
// Conservée pour les appelants qui l'attendent encore : elle vaut 1 partout,
// l'échelle industrielle ayant été absorbée dans les débits et les effectifs.
export function echelleDe() { return 1; }

// Les matériaux d'un bâtiment sont écrits pour le BÂTIMENT ENTIER, plus par
// case : la base propre a supprimé le détour par l'échelle industrielle.
export function materiaux(type) {
  return { ...BAT[type].mat };
}

// Valeur des matériaux au prix de référence (sert de repère, pas de facture :
// la facture réelle est établie au prix du marché local du jour).
export function coutRef(type) {
  let t = 0;
  for (const [r, q] of Object.entries(materiaux(type))) t += q * RES[r].prix;
  return t;
}

// Entretien mensuel : 10 % / an de la valeur bâtie, foncier exclu.
// Il ne se contracte jamais — c'est lui qui borne les pertes.
export function entretien(type, valeurBatie) {
  return (valeurBatie ?? coutRef(type)) * P.entretienAnnuel / 12;
}

// COMBIEN DE BRAS IL FAUT POUR LE FAIRE TOURNER EN PLEIN.
//
// C'est le chiffre qui manque à toute décision de construction : un bâtiment
// qu'on élève dans une ville sans main-d'œuvre disponible ne tournera jamais à
// pleine capacité, et rien ne le disait avant de payer.
//
// Il ne dépend PLUS du sol pour une exploitation — quatre bras à la case, filon
// maigre ou gras — et il vaut le nombre de postes pour un immeuble de bureaux,
// qui n'emploie personne mais en loge vingt.
export function emploisRequis(type) {
  const b = BAT[type];
  if (b.cat === 'bur') return b.postes;
  if (b.cat === 'loge') return 0;
  return b.employes;
}

// LE DEVIS D'UNE GARE FONDATRICE.
//
// Ce qu'elle emporte, et ce qu'elle coûte. Les deux sont le même objet : le
// prix est la valeur de la cargaison aux prix de référence, plus le bâtiment.
// Un joueur ne paie donc jamais une gare « à vide » — il achète une colonie
// prête à vivre deux ans.
//
//   logements     une maison par ménage de colons
//   exploitations de quoi en ouvrir trois, l'archétype étant la coupe
//   vivres        un repas et un produit manufacturé par ménage et par mois,
//                 pendant vingt-quatre mois — de quoi tenir les trois baromètres
//                 au plein pendant que le hameau se met debout
// LE DEVIS D'UNE GARE — le quai, les vivres, ET LA TERRE.
//
// Fonder une ville, c'est acheter un territoire. Le fondateur devient
// propriétaire de TOUTES les cases libres du carré du Comptoir, et il les paie —
// remisées de 70 %, parce qu'il achète en gros, d'un seul tenant, une terre que
// personne ne convoitait et qui ne vaudra quelque chose que s'il la fait vivre.
// C'est le prix de la spéculation foncière : il tient mille quatre-vingt-neuf
// cases dont la valeur montera à chaque palier de sa ville.
//
// Le devis est SITE-DÉPENDANT dès qu'on lui donne un site : la terre ne vaut pas
// la même chose selon ce qu'elle porte. Sans site, il rend une estimation à la
// qualité de référence — c'est ce qu'affiche le menu, faute de savoir encore où
// l'on va poser.
export function devisGare(monde = null, x = 0, y = 0) {
  const vivres = { pain: P.menagesNourris * P.moisDePain };
  let vivresCout = 0;
  for (const [r, q] of Object.entries(vivres)) vivresCout += q * RES[r].prix;

  const r0 = P.rayonPalier[0];
  let terrain = 0, cases = 0;
  if (monde) {
    for (let dy = -r0; dy <= r0; dy++) for (let dx = -r0; dx <= r0; dx++) {
      const c = monde.caseAt(x + dx, y + dy);
      if (!c || c.ville || c.voie) continue;
      cases++;
      terrain += prixTerrain(1, Math.max(Math.abs(dx), Math.abs(dy)), qualiteMax(c));
    }
  } else {
    // L'estimation du menu : le carré plein, à la qualité de référence.
    for (let dy = -r0; dy <= r0; dy++) for (let dx = -r0; dx <= r0; dx++) {
      cases++;
      terrain += prixTerrain(1, Math.max(Math.abs(dx), Math.abs(dy)), 1);
    }
  }
  return {
    mat: {}, vivres, cases,
    quai: P.coutGareNu, vivresCout, terrainNu: terrain, fonciere: terrain,
    cout: P.coutGareNu + vivresCout + terrain,
    estimation: !monde,
  };
}

// Le rendement annuel que chaque palier est censé rendre, à cent pour cent
// d'utilisation et aux prix de référence, entretien déduit. C'est de lui que le
// barème déduit les coûts de construction — et c'est la seule référence qui
// permette de dire si un bâtiment tient sa promesse.
// ---------------------------------------------------------------------------
// LES VAGUES DE PRODUCTION, DÉRIVÉES DE LA FILIÈRE.
//
// Un atelier ne peut produire qu'après ceux qui le nourrissent : la scierie
// après la coupe, la manufacture après la scierie. L'ordre était écrit à la
// main, et c'était un piège — ajouter une usine sans l'inscrire dans la liste la
// laissait à zéro pour toujours, sans la moindre erreur. C'est arrivé aux sept
// nouvelles d'un coup.
//
// La profondeur se CALCULE : celle d'un bâtiment est un de plus que la plus
// grande profondeur des producteurs de ses intrants. On ne peut plus l'oublier.
export const VAGUES = (() => {
  const produitPar = {};
  for (const [t, d] of Object.entries(BAT)) if (d.sort) produitPar[d.sort] = t;

  const memo = {};
  const profondeur = (t, vus = new Set()) => {
    if (memo[t] !== undefined) return memo[t];
    if (vus.has(t)) return 0;                    // cycle : on coupe
    vus.add(t);
    let p = 0;
    for (const r of Object.keys(BAT[t].intrants || {})) {
      const amont = produitPar[r];
      if (amont && amont !== t) p = Math.max(p, profondeur(amont, vus) + 1);
    }
    vus.delete(t);
    return (memo[t] = p);
  };

  const parNiveau = [];
  for (const [t, d] of Object.entries(BAT)) {
    if (!d.sort) continue;                       // logement, bureaux, commerce
    const p = profondeur(t);
    (parNiveau[p] ||= []).push(t);
  }
  return parNiveau.map(x => x || []);
})();

export const RENDEMENT_VISE = {
  expl: 0.15, trans: 0.20, manu: 0.25, bur: 0.12, neg: 0, com: 0.20,
};

export function rendementVise(type) {
  const b = BAT[type];
  if (b.cat === 'loge') return type === 'maison' ? 0.15 : 0.20;
  return RENDEMENT_VISE[b.cat] ?? 0.15;
}

// --- Terrain ----------------------------------------------------------------

export const RELIEFS = {
  plaine:   { nom: 'Plaine',   couleur: '#7f9455', biais: { fertilite: 2.1, argile: 1.6, bois: 0.5, charbon: 0.20, minerai: 0.15 } },
  foret:    { nom: 'Forêt',    couleur: '#3f6238', biais: { fertilite: 0.9, argile: 0.6, bois: 2.5, charbon: 0.35, minerai: 0.25 } },
  colline:  { nom: 'Colline',  couleur: '#8d8055', biais: { fertilite: 0.6, argile: 1.0, bois: 0.9, charbon: 2.3, minerai: 1.0 } },
  montagne: { nom: 'Montagne', couleur: '#7d7a80', biais: { fertilite: 0.15, argile: 0.4, bois: 0.3, charbon: 1.2, minerai: 2.6 } },
};

export const QUALITES = ['fertilite', 'argile', 'bois', 'charbon', 'minerai'];

// Le niveau d'une ville, d'après son nombre de ménages.
export function niveauVille(menages) {
  let n = 1;
  for (let i = 0; i < P.seuilsNiveau.length; i++) if (menages >= P.seuilsNiveau[i]) n = i + 1;
  return Math.min(n, 5);
}

// Ce qu'une case de sol rend, rapporté à une terre moyenne.
//
// Le barème est calibré sur la qualité 3. Une proportionnalité stricte —
// sortie = base × q ÷ 3 — donnerait de 0,33 à 1,67, mais comme le salaire est
// un coût FIXE, ce facteur 5 sur l'écart de production devient un facteur 5
// sur la MARGE : une coupe forestière rapporterait 99 % l'an sur qualité 5 et
// perdrait 68 % sur qualité 1. La courbe est donc resserrée.
// Ce que vaut une case, rapporté à la terre moyenne.
//
// C'était une droite plate — 0,64 à q1, 1,36 à q5, un rapport de 2,1 — qui
// faisait de la qualité du sol un détail. Elle est désormais PROPORTIONNELLE à
// la qualité : une case de niveau 5 vaut exactement cinq cases de niveau 1.
//
// Ce facteur commande trois choses à la fois, et c'est ce qui rend le modèle
// cohérent : ce que la case PRODUIT, combien d'ouvriers elle EMPLOIE, et ce que
// son sol COÛTE. Une bonne case n'est donc pas une case plus rentable, c'est une
// case plus GRANDE — elle concentre cinq fois plus d'activité sur la même
// surface, et son prix capte cette concentration.
// L'échelle du sol, DÉRIVÉE des trois rendements visés — jamais posée à la main.
//
// On tient trois choses pour données : la case 1 rend zéro au prix de référence,
// la case 2 rend 5 %, la case 3 rend 15 % sur un cours à 60 %. Le reste se
// déduit, et c'est ce qui garantit que le barème et le code disent la même
// chose même si l'on retouche une cible.
//
//   capital d'une case      C  = 12 k (r − s) ÷ 0,10        « marge = entretien »
//   rendement d'une case    Y  = [12 k (r·g·i − s) − 0,10 C] ÷ (C + T·g)
//
// où k est l'effectif d'une case, r la recette mensuelle d'un ouvrier sur une
// case 1 au prix de référence, s le salaire, i l'indice du cours, g l'échelle
// qu'on cherche et T le prix d'une case de qualité 1.

function echelonPour(rendementVise, indicePrix) {
  const k = P.echelleIndustrielle, C = CAPITAL_CASE;
  const num = rendementVise * C + P.entretienAnnuel * C + 12 * k * P.salaireAttendu;
  const den = 12 * k * P.recetteOuvrierQ1 * indicePrix - rendementVise * P.terrainRef;
  return num / den;
}

// 0 · 1 · 1,09 · 2,13 — accélérée, parce que les cibles l'imposent.
// L'ÉCHELLE EST DÉSORMAIS POSÉE, PLUS DÉDUITE.
//
// Elle l'était : on partait des rendements visés et on en tirait la production.
// Cela donnait 1 · 1,07 · 2,06 — une case 2 produisait 7 % de plus qu'une case 1,
// ce qui rendait le palier intermédiaire invisible en jeu. On inverse : la
// production est la donnée, le rendement en est la conséquence.
//
//   1 · 2 · 5   →  une ferme sort 40, 80 puis 200 céréales par mois
//
// Le saut de 2 à 5 est ce qui fait la valeur d'un filon, et la marche de 1 à 2
// est enfin franche. `echelonPour` reste plus bas : il sert à documenter le
// rendement que chaque échelon produit, non à le fixer.
export const ECHELLE_SOL = [0, 1, 2, 5];

// Ce qu'une case SORT, rapporté à une case de qualité 1. Zéro à qualité zéro :
// pas de gisement, rien à extraire. La qualité d'un bâtiment étant la moyenne de
// ses cases, elle est fractionnaire — on interpole.
export function facteurQualite(q) {
  const n = ECHELLE_SOL.length - 1;
  const x = Math.max(0, Math.min(n, q));
  const bas = Math.floor(x);
  if (bas >= n) return ECHELLE_SOL[n];
  return ECHELLE_SOL[bas] + (x - bas) * (ECHELLE_SOL[bas + 1] - ECHELLE_SOL[bas]);
}

// Ce qu'une case VAUT, rapporté à une case de qualité 1 — le sol se paie ce
// qu'il rend, mais jamais rien : une case sans gisement garde sa valeur de
// terrain nu, sinon la moitié de la carte serait gratuite et le foncier
// cesserait d'être un arbitrage.
export function valeurSol(q) {
  return Math.max(P.solPlancher, facteurQualite(q));
}

// Prix d'une case de terrain.
//
//   100 $ × facteur de niveau × facteur de distance × facteur de richesse
//
// Le dernier terme est ce qui empêche la bonne terre d'être une rente gratuite :
// une case qui rend davantage vaut davantage, et la rente se capitalise dans le
// prix du sol au lieu de tomber dans la poche du premier arrivé. C'est aussi ce
// qui donne son sel à l'achat précoce — la terre est chère AVANT qu'on ait bâti.
export function prixTerrain(niveau, distanceGare, richesse = 1) {
  const fn = P.facteurNiveau[niveau - 1];
  const part = distanceGare / P.rayonPalier[niveau - 1];
  const fd = 1 / (1 + P.gradientFoncier[niveau - 1] * part);

  // HORS DU CARRÉ MAXIMAL, la terre est remisée. Aucune ville ne pourra jamais
  // y bâtir — la règle d'écartement des gares le garantit — et une terre sur
  // laquelle on ne peut rien poser ne vaut pas le prix d'une terre à bâtir.
  // Elle garde une valeur : le rail y passe, une gare peut s'y fonder un jour.
  const dehors = distanceGare > P.rayonPalier[P.rayonPalier.length - 1]
    ? (1 - P.remiseHorsPerimetre) : 1;
  // Le sol se paie EXACTEMENT ce qu'il rend : le facteur de richesse est la loi
  // de rendement elle-même, et non un barème séparé.
  //
  // Il y en avait un, réglé à 0,35 de plancher et 4 d'exposant, qui étalait le
  // prix de la terre sur un rapport de 15 entre la pire et la meilleure — quand
  // le rendement, lui, ne varie que d'un rapport de 2,1. La prime foncière valait
  // donc sept fois la rente qu'elle prétendait capitaliser.
  //
  // Tant que le sol était excellent presque partout, cela ne se voyait pas :
  // le terme était une quasi-constante. Depuis que les villes ont des vocations
  // tranchées, il domine tout — mesuré, 58 % du prix venait de la richesse et
  // 42 % seulement de la distance, si bien qu'une case de lisière sur un bon
  // filon coûtait plus cher qu'une case du centre sur une terre pauvre. La carte
  // du prix du sol montrait alors des villes au centre bon marché.
  const fq = valeurSol(richesse);
  return P.terrainRef * fn * fd * fq * dehors;
}

// Ce que cette case vaudra si la ville va au bout, rapporté à ce qu'elle vaut
// aujourd'hui.
//
// C'est le seul chiffre qui distingue le centre de la périphérie, puisque le
// rendement, lui, est le même partout à tout instant — le loyer étant indexé sur
// le foncier, il s'ajuste et le taux ne bouge pas. Ce qui diffère, c'est la
// PENTE : bâtir au centre en début de partie, c'est acheter un loyer qui
// quadruplera ; bâtir en lisière, c'est acheter un loyer qui gagnera 11 %.
export function potentielTerrain(niveau, distanceGare, richesse = 1) {
  const ici = prixTerrain(niveau, distanceGare, richesse);
  if (ici <= 0) return 1;
  return prixTerrain(P.facteurNiveau.length, distanceGare, richesse) / ici;
}

// La meilleure ressource d'une case décide de ce qu'elle vaut : le sol se paie
// à son meilleur usage, pas à celui qu'on en fait. Une case fictive — celle des
// devis, qui n'a pas encore de coordonnées — vaut la terre moyenne.
export function qualiteMax(c) {
  if (!c || !c.q) return 1;
  let m = 0;
  for (const q of QUALITES) if (c.q[q] > m) m = c.q[q];
  return m;
}

// Loyer mensuel d'un logement plein : il découle du foncier, pas d'un barème.
// loyer = rendement × (terrain + construction) ÷ 12 + entretien
export function loyer(type, terrain, construction) {
  const rdt = type === 'maison' ? 0.15 : 0.20;
  return rdt * (terrain + construction) / 12 + construction * P.entretienAnnuel / 12;
}
