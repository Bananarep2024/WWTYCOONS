// ---------------------------------------------------------------------------
// Le barème de référence, en code. Voir docs/00-BAREME.md — ce fichier en est
// la transcription littérale. Aucune valeur numérique du jeu ne doit exister
// ailleurs que dans ce fichier.
// ---------------------------------------------------------------------------

export const P = {
  moisParSeconde: 10,          // 1 mois = 10 s réelles
  salaireCase: 20,             // $ / mois, l'unité de compte de tout le jeu
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
  seuilsCritiques: { nourriture: 0.90, emploi: 0.50 },
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

  // --- Les compagnies de chemin de fer ---
  //
  // Une liaison EST une société : on y souscrit pendant les travaux, elle entre
  // en bourse le jour où la ligne s'ouvre, et elle vit ensuite d'un péage sur le
  // trafic qu'elle porte. C'est la valeur de croissance du jeu : son bénéfice
  // monte mécaniquement avec les villes qu'elle dessert.
  capitalParCaseDeVoie: 150,   // capital nominal d'une ligne, par case de longueur
  prixNominalAction: 10,       // une action de compagnie ferroviaire
  peageRail: 0.010,            // 1 % du chiffre d'affaires du marché desservi
  entretienVoie: 0.04,         // 4 % / an du capital nominal

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
  attenuationDistance: [0.0280, 0.0364, 0.0504, 0.0728, 0.1120],
  partIndependants: 0.30,
  surprixIndependants: 1.20,   // ce qu'un indépendant fait payer sur une CASE
  anneesDeProfit: 3,           // un bâtiment vaut son terrain + 3 ans de profit
  // — le plancher est le terrain lui-même : voir prixRachatIndependant

  chantiersVilleParMois: 6,       // ce qu'une ville peut lancer en un mois
  dispersionDepart: 12,        // points d'écart tolérés à la pose initiale
  casesParMenage: 3.0,         // logement + postes : ce qu'un ménage occupe
  aisanceUrbaine: 1.20,        // marge sur le rayon utile — d'où les trous
  porteeExploitations: 2.2,    // une ferme a le droit de s'éloigner
  margeFondation: 2.4,         // le rayon de fondation anticipe le parc complet
  ampleurSurcapacite: 4.0,     // ×4 la surcapacité du tempérament, en excès d'offre
  dispersionVille: 18,         // et ensuite, quand la ville bâtit d'elle-même
  rendementMinimalPourBatir: 0.05,  // sous ce rendement attendu, on ne bâtit pas

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
  logementsGare: 10,           // maisons vides montées le jour de la fondation
  // Combien de ménages viennent chaque mois du dehors de la carte, à
  // attractivité maximale. C'est un flux ABSOLU, en ménages : le taux de
  // croissance ordinaire est un pourcentage de la population présente, et zéro
  // pour cent de zéro ne peuple jamais un endroit vide.
  immigrationFrontiere: 0.8,
  moisDeVivres: 24,            // deux ans de nourriture et de produits, à 100 %
  exploitationsFournies: 3,    // ce que le stock de matériaux permet d'ouvrir
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
P.recetteOuvrierQ1 = P.salaireAttendu + P.margeOuvrierQ1;
export const CAPITAL_CASE = 120 * P.echelleIndustrielle * P.margeOuvrierQ1;

// --- Ressources -------------------------------------------------------------
// prix = prix de référence, celui qui s'établit quand la demande égale l'offre.

export const RES = {
  bois:      { nom: 'Bois',      prix: 1,    couleur: '#7a6a4f', extractible: true  },
  argile:    { nom: 'Argile',    prix: 1,    couleur: '#a56b4a', extractible: true  },
  charbon:   { nom: 'Charbon',   prix: 1,    couleur: '#3d3d42', extractible: true  },
  minerai:   { nom: 'Minerai',   prix: 1,    couleur: '#6b5b73', extractible: true  },
  cereales:  { nom: 'Céréales',  prix: 2.40, couleur: '#c9a227', extractible: true  },
  betail:    { nom: 'Bétail',    prix: 2.40, couleur: '#b08968', extractible: true  },
  planches:  { nom: 'Planches',  prix: 5,    couleur: '#b5894f', extractible: false },
  briques:   { nom: 'Briques',   prix: 5,    couleur: '#9c4a35', extractible: false },
  acier:     { nom: 'Acier',     prix: 15,   couleur: '#5a7d8c', extractible: false },
  pain:      { nom: 'Pain',      prix: 12,   couleur: '#d9a441', extractible: false },
  viande:    { nom: 'Viande',    prix: 12,   couleur: '#a83f3f', extractible: false },
  produits:  { nom: 'Produits',  prix: 17,   couleur: '#4f7d5a', extractible: false },
};

export const RESSOURCES = Object.keys(RES);

// Les deux nourritures sont substituables 1 pour 1 : le ménage veut une ration
// par mois, pas une demi-ration de chaque. Il mange ce qu'il y a.
export const NOURRITURES = ['pain', 'viande'];

// --- Bâtiments --------------------------------------------------------------
// cases : emprise. w × h : forme posée sur la carte.
// Les débits sont donnés PAR CASE : un bâtiment de n cases a n employés et
// produit n fois ces quantités. (§20 : « une case, un employé, une production »)

export const BAT = {
  coupe:       { nom: 'Coupe forestière', cases: 1, w: 1, h: 1, sort: 'bois',     debit: 30, intrants: {}, cout: 700, mat: { planches: 35 }, qual: 'bois',      cat: 'expl' },
  carriere:    { nom: 'Carrière',         cases: 1, w: 1, h: 1, sort: 'argile',   debit: 30, intrants: {}, cout: 700, mat: { planches: 35 }, qual: 'argile',    cat: 'expl' },
  mineCharbon: { nom: 'Mine de charbon',  cases: 1, w: 1, h: 1, sort: 'charbon',  debit: 30, intrants: {}, cout: 700, mat: { planches: 35 }, qual: 'charbon',   cat: 'expl' },
  mineFer:     { nom: 'Mine de fer',      cases: 1, w: 1, h: 1, sort: 'minerai',  debit: 30, intrants: {}, cout: 700, mat: { planches: 35 }, qual: 'minerai',   cat: 'expl' },
  ferme:       { nom: 'Ferme céréalière', cases: 2, w: 2, h: 1, sort: 'cereales', debit: 12.5, intrants: {}, cout: 700, mat: { planches: 35 }, qual: 'fertilite', cat: 'expl' },
  ranch:       { nom: 'Ranch',            cases: 2, w: 2, h: 1, sort: 'betail',   debit: 12.5, intrants: {}, cout: 700, mat: { planches: 35 }, qual: 'fertilite', cat: 'expl' },

  scierie:     { nom: 'Scierie',      cases: 2, w: 2, h: 1, sort: 'planches', debit: 12, intrants: { bois: 24 },              cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  briqueterie: { nom: 'Briqueterie',  cases: 2, w: 2, h: 1, sort: 'briques',  debit: 12, intrants: { argile: 24 },            cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  minoterie:   { nom: 'Minoterie',    cases: 2, w: 2, h: 1, sort: 'pain',     debit: 5,  intrants: { cereales: 10 },          cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  abattoir:    { nom: 'Abattoir',     cases: 2, w: 2, h: 1, sort: 'viande',   debit: 5,  intrants: { betail: 10 },            cout: 575, mat: { planches: 60, briques: 55 }, cat: 'trans' },
  acierie:     { nom: 'Aciérie',      cases: 4, w: 2, h: 2, sort: 'acier',    debit: 6,  intrants: { charbon: 24, minerai: 24 }, cout: 810, mat: { planches: 30, briques: 42, acier: 30 }, cat: 'trans' },
  manufacture: { nom: 'Manufacture',  cases: 4, w: 2, h: 2, sort: 'produits', debit: 6,  intrants: { planches: 6, acier: 2 }, cout: 680, mat: { planches: 40, briques: 36, acier: 20 }, cat: 'manu' },

  maison:    { nom: 'Maison',              cases: 1, w: 1, h: 1, menages: 1,  cout: 180, mat: { planches: 24, briques: 12 }, cat: 'loge' },
  immeuble:  { nom: 'Immeuble',            cases: 4, w: 2, h: 2, menages: 20, cout: 925, mat: { briques: 65, acier: 40 },    cat: 'loge' },
  bureaux:   { nom: 'Immeuble de bureaux', cases: 4, w: 2, h: 2, postes: 20,  cout: 500, mat: { briques: 40, acier: 20 },    cat: 'bur'  },
  entrepot:  { nom: 'Entrepôt',            cases: 4, w: 2, h: 2, capacite: 2000, cout: 100, mat: { planches: 20 },           cat: 'neg'  },
};

// --- Calibrage des exploitations --------------------------------------------
// Débit et coût de construction ne sont pas écrits à la main : ils DÉCOULENT de
// la promesse « une case 1 rend zéro au prix de référence ».
//
//   débit  : ce qu'un ouvrier doit sortir pour encaisser recetteOuvrierQ1
//            dollars — donc d'autant moins que la marchandise est chère
//   coût   : celui dont l'entretien annuel égale la marge brute d'une case 1
//
// Les six exploitations sont ainsi rigoureusement équivalentes à qualité égale,
// quelle que soit la marchandise : même recette par ouvrier, même capital par
// case, même rendement. Ce qui les distingue, c'est le sol qu'on leur trouve.
for (const b of Object.values(BAT)) {
  if (b.cat !== 'expl') continue;
  b.debit = P.recetteOuvrierQ1 / RES[b.sort].prix;
  // materiaux() multiplie par cases × échelle : on écrit donc la quantité par
  // case et par ouvrier.
  const parCaseEtOuvrier = CAPITAL_CASE / P.echelleIndustrielle;
  let ref = 0;
  for (const [r, part] of Object.entries(b.mat)) ref += part * RES[r].prix;
  for (const r of Object.keys(b.mat)) b.mat[r] *= parCaseEtOuvrier / ref;
  b.cout = CAPITAL_CASE * b.cases;
}

export const TYPES_BAT = Object.keys(BAT);

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
export function echelleDe(type) {
  return BAT[type].cat === 'expl' ? P.echelleIndustrielle : 1;
}

export function materiaux(type) {
  const b = BAT[type], out = {}, k = echelleDe(type);
  for (const [r, q] of Object.entries(b.mat)) out[r] = q * b.cases * k;
  return out;
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
export function devisGare() {
  const mat = {};
  const ajouter = (m, k) => {
    for (const [r, q] of Object.entries(m)) mat[r] = (mat[r] || 0) + q * k;
  };
  ajouter(materiaux('maison'), P.logementsGare);
  ajouter(materiaux('coupe'), P.exploitationsFournies);

  const rations = P.logementsGare * P.moisDeVivres;
  const vivres = { pain: rations, produits: rations };

  let cout = P.coutGareNu;
  for (const [r, q] of Object.entries(mat)) cout += q * RES[r].prix;
  for (const [r, q] of Object.entries(vivres)) cout += q * RES[r].prix;
  return { mat, vivres, cout };
}

// Le rendement annuel que chaque palier est censé rendre, à cent pour cent
// d'utilisation et aux prix de référence, entretien déduit. C'est de lui que le
// barème déduit les coûts de construction — et c'est la seule référence qui
// permette de dire si un bâtiment tient sa promesse.
export const RENDEMENT_VISE = {
  expl: 0.15, trans: 0.20, manu: 0.25, bur: 0.12, neg: 0,
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
export const ECHELLE_SOL = [
  0, 1,
  echelonPour(P.rendementQ2, 1),
  echelonPour(P.rendementQ3, P.prixEffondre),
];

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
  const fd = 1 / (1 + P.attenuationDistance[niveau - 1] * distanceGare);
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
  return P.terrainRef * fn * fd * fq;
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
