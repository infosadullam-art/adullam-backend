// lib/weight-ranges.ts
// ============================================================================
// RÈGLES DE CRÉDIBILITÉ DES POIDS PAR CATÉGORIE - VERSION COMPLÈTE
// ============================================================================
// Ce fichier contient TOUTES les catégories possibles :
// - Tous les types de vêtements, chaussures, accessoires
// - Toute l'électronique (grand public, professionnelle, industrielle)
// - Tous les équipements maison, cuisine, jardin
// - Tous les produits de beauté, santé, médical
// - Tous les sports, loisirs, camping
// - Tous les jouets, jeux, puériculture
// - Tous les outils, bricolage, industrie, machines
// - Tous les accessoires auto, moto, véhicules
// - Toute la papeterie, fournitures de bureau
// - Tous les produits pour animaux
// - Tous les instruments de musique
// - Tous les livres, médias
// - Tous les équipements médicaux
// - Tous les équipements industriels lourds
// - Et bien plus encore...
// ============================================================================

export interface WeightRange {
  /** Mots-clés pour identifier la catégorie */
  keywords: string[];
  /** Poids minimum réaliste en kg */
  minWeight: number;
  /** Poids maximum réaliste en kg */
  maxWeight: number;
  /** Nom de la catégorie pour les logs */
  categoryName: string;
  /** Volume approximatif en m³ (optionnel) */
  typicalVolume?: number;
}

export const WEIGHT_RANGES: WeightRange[] = [

  // ==========================================================================
  // 1. CHAUSSURES - TOUS TYPES
  // ==========================================================================
  {
    keywords: ["sandal", "sandale", "tong", "flip flop", "tongs"],
    minWeight: 0.15,
    maxWeight: 1.5,
    categoryName: "Sandales",
    typicalVolume: 0.002
  },
  {
    keywords: ["slipper", "chausson", "mule", "babouche", "chaussons"],
    minWeight: 0.1,
    maxWeight: 1.0,
    categoryName: "Chaussons",
    typicalVolume: 0.002
  },
  {
    keywords: ["shoe", "chaussure", "derby", "richelieu", "mocassin", "espadrille", "richelieus", "mocassins"],
    minWeight: 0.2,
    maxWeight: 2.5,
    categoryName: "Chaussures",
    typicalVolume: 0.004
  },
  {
    keywords: ["boot", "botte", "bottine", "cuissarde", "bottes", "bottines", "après-ski"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Bottes",
    typicalVolume: 0.006
  },
  {
    keywords: ["sneaker", "basket", "running", "training", "sport", "jogging", "baskets", "sneakers"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Baskets",
    typicalVolume: 0.0045
  },
  {
    keywords: ["heel", "talon", "escarpin", "stiletto", "talons", "escarpins"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Talons",
    typicalVolume: 0.003
  },
  {
    keywords: ["wedge", "compensée", "compensées"],
    minWeight: 0.3,
    maxWeight: 2.0,
    categoryName: "Compensées",
    typicalVolume: 0.0035
  },
  {
    keywords: ["loafer", "richelieu"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Richelieus",
    typicalVolume: 0.003
  },
  {
    keywords: ["mocassin", "mocassins"],
    minWeight: 0.2,
    maxWeight: 1.2,
    categoryName: "Mocassins",
    typicalVolume: 0.003
  },
  {
    keywords: ["espadrille", "espadrilles"],
    minWeight: 0.15,
    maxWeight: 0.8,
    categoryName: "Espadrilles",
    typicalVolume: 0.002
  },
  {
    keywords: ["ballerine", "ballerines"],
    minWeight: 0.1,
    maxWeight: 0.6,
    categoryName: "Ballerines",
    typicalVolume: 0.0015
  },
  {
    keywords: ["bottillon", "bottillons"],
    minWeight: 0.4,
    maxWeight: 2.0,
    categoryName: "Bottillons",
    typicalVolume: 0.005
  },
  {
    keywords: ["après-ski"],
    minWeight: 0.8,
    maxWeight: 2.5,
    categoryName: "Après-ski",
    typicalVolume: 0.008
  },
  {
    keywords: ["chaussure de sécurité", "chaussure de travail", "chaussure de chantier"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Chaussures de sécurité",
    typicalVolume: 0.005
  },
  {
    keywords: ["chaussure de randonnée", "chaussure de marche"],
    minWeight: 0.4,
    maxWeight: 1.8,
    categoryName: "Chaussures de randonnée",
    typicalVolume: 0.005
  },
  {
    keywords: ["chaussure de ski", "chaussure de snowboard"],
    minWeight: 1.5,
    maxWeight: 3.5,
    categoryName: "Chaussures de ski",
    typicalVolume: 0.01
  },
  {
    keywords: ["chaussure de golf"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Chaussures de golf",
    typicalVolume: 0.004
  },
  {
    keywords: ["chaussure de danse"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Chaussures de danse",
    typicalVolume: 0.003
  },
  {
    keywords: ["chaussure de football", "crampons"],
    minWeight: 0.3,
    maxWeight: 1.2,
    categoryName: "Chaussures de football",
    typicalVolume: 0.004
  },

  // ==========================================================================
  // 2. VÊTEMENTS - TOUS TYPES
  // ==========================================================================
  {
    keywords: ["t-shirt", "tshirt", "tee-shirt", "tee shirt", "maillot", "t-shirts"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "T-shirts",
    typicalVolume: 0.0003
  },
  {
    keywords: ["shirt", "chemise", "chemises"],
    minWeight: 0.15,
    maxWeight: 0.4,
    categoryName: "Chemises",
    typicalVolume: 0.00045
  },
  {
    keywords: ["blouse", "chemisier", "blouses", "chemisiers"],
    minWeight: 0.1,
    maxWeight: 0.35,
    categoryName: "Blouses",
    typicalVolume: 0.00035
  },
  {
    keywords: ["dress", "robe", "robes"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Robes",
    typicalVolume: 0.0006
  },
  {
    keywords: ["jeans", "jean", "denim"],
    minWeight: 0.4,
    maxWeight: 0.9,
    categoryName: "Jeans",
    typicalVolume: 0.0007
  },
  {
    keywords: ["pants", "pantalon", "trousers", "chino", "slacks", "pantalons"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Pantalons",
    typicalVolume: 0.0006
  },
  {
    keywords: ["shorts", "short", "bermuda", "bermudas"],
    minWeight: 0.15,
    maxWeight: 0.4,
    categoryName: "Shorts",
    typicalVolume: 0.00035
  },
  {
    keywords: ["skirt", "jupe", "jupes"],
    minWeight: 0.15,
    maxWeight: 0.5,
    categoryName: "Jupes",
    typicalVolume: 0.0004
  },
  {
    keywords: ["jacket", "veste", "blouson", "blazer", "vestes", "blousons"],
    minWeight: 0.4,
    maxWeight: 1.5,
    categoryName: "Vestes",
    typicalVolume: 0.002
  },
  {
    keywords: ["coat", "manteau", "pardessus", "caban", "manteaux"],
    minWeight: 0.8,
    maxWeight: 2.5,
    categoryName: "Manteaux",
    typicalVolume: 0.004
  },
  {
    keywords: ["sweater", "pull", "chandail", "tricot", "pulls"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Pulls",
    typicalVolume: 0.001
  },
  {
    keywords: ["hoodie", "sweat", "sweatshirt", "sweats"],
    minWeight: 0.4,
    maxWeight: 1.2,
    categoryName: "Sweats",
    typicalVolume: 0.0012
  },
  {
    keywords: ["underwear", "sous-vêtement", "sous-vêtements", "caleçon", "boxer", "culotte", "slip", "string"],
    minWeight: 0.03,
    maxWeight: 0.15,
    categoryName: "Sous-vêtements",
    typicalVolume: 0.0001
  },
  {
    keywords: ["bra", "soutien-gorge", "soutif", "soutiens-gorge"],
    minWeight: 0.03,
    maxWeight: 0.15,
    categoryName: "Soutiens-gorge",
    typicalVolume: 0.0002
  },
  {
    keywords: ["socks", "chaussette", "chaussettes", "socquette"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Chaussettes",
    typicalVolume: 0.0001
  },
  {
    keywords: ["stockings", "bas", "collant", "collants"],
    minWeight: 0.03,
    maxWeight: 0.15,
    categoryName: "Bas/Collants",
    typicalVolume: 0.00015
  },
  {
    keywords: ["leggings"],
    minWeight: 0.15,
    maxWeight: 0.4,
    categoryName: "Leggings",
    typicalVolume: 0.00035
  },
  {
    keywords: ["swimwear", "maillot de bain", "bikini", "une pièce", "maillots"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Maillots de bain",
    typicalVolume: 0.00025
  },
  {
    keywords: ["lingerie", "nuisette", "babydoll"],
    minWeight: 0.03,
    maxWeight: 0.15,
    categoryName: "Lingerie",
    typicalVolume: 0.00015
  },
  {
    keywords: ["veste de costume", "veste de tailleur"],
    minWeight: 0.4,
    maxWeight: 1.2,
    categoryName: "Vestes de costume",
    typicalVolume: 0.0018
  },
  {
    keywords: ["costume", "complet"],
    minWeight: 1.0,
    maxWeight: 2.5,
    categoryName: "Costumes",
    typicalVolume: 0.003
  },
  {
    keywords: ["combinaison", "jumpsuit", "salopette", "combinaisons"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Combinaisons",
    typicalVolume: 0.0008
  },
  {
    keywords: ["gilet", "gilets"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Gilets",
    typicalVolume: 0.0006
  },
  {
    keywords: ["cardigan", "cardigans"],
    minWeight: 0.3,
    maxWeight: 0.9,
    categoryName: "Cardigans",
    typicalVolume: 0.0008
  },
  {
    keywords: ["kimono", "kimonos"],
    minWeight: 0.4,
    maxWeight: 1.2,
    categoryName: "Kimonos",
    typicalVolume: 0.001
  },
  {
    keywords: ["poncho", "ponchos"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Ponchos",
    typicalVolume: 0.0015
  },
  {
    keywords: ["écharpe", "foulard", "scarf", "cache-cou", "écharpes", "foulards"],
    minWeight: 0.08,
    maxWeight: 0.3,
    categoryName: "Écharpes",
    typicalVolume: 0.0004
  },
  {
    keywords: ["gants", "gloves", "mitaines"],
    minWeight: 0.03,
    maxWeight: 0.2,
    categoryName: "Gants",
    typicalVolume: 0.0002
  },
  {
    keywords: ["ceinture", "belt", "ceintures"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Ceintures",
    typicalVolume: 0.00025
  },
  {
    keywords: ["cravate", "necktie", "cravates"],
    minWeight: 0.03,
    maxWeight: 0.1,
    categoryName: "Cravates",
    typicalVolume: 0.0001
  },
  {
    keywords: ["noeud papillon", "bow tie", "neuds papillon"],
    minWeight: 0.02,
    maxWeight: 0.08,
    categoryName: "Nœuds papillon",
    typicalVolume: 0.00005
  },
  {
    keywords: ["chapeau", "hat", "chapeaux"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Chapeaux",
    typicalVolume: 0.0006
  },
  {
    keywords: ["casquette", "cap", "baseball cap", "casquettes"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Casquettes",
    typicalVolume: 0.0005
  },
  {
    keywords: ["béret", "bérets"],
    minWeight: 0.04,
    maxWeight: 0.15,
    categoryName: "Bérets",
    typicalVolume: 0.0004
  },
  {
    keywords: ["bonnet", "beanie", "bonnets"],
    minWeight: 0.04,
    maxWeight: 0.15,
    categoryName: "Bonnets",
    typicalVolume: 0.00035
  },
  {
    keywords: ["polaire", "fleece"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Polaires",
    typicalVolume: 0.001
  },
  {
    keywords: ["doudoune"],
    minWeight: 0.3,
    maxWeight: 1.2,
    categoryName: "Doudounes",
    typicalVolume: 0.002
  },
  {
    keywords: ["parka"],
    minWeight: 0.5,
    maxWeight: 1.8,
    categoryName: "Parkas",
    typicalVolume: 0.003
  },
  {
    keywords: ["imperméable", "k-way"],
    minWeight: 0.2,
    maxWeight: 0.6,
    categoryName: "Imperméables",
    typicalVolume: 0.0008
  },
  {
    keywords: ["veste de costume"],
    minWeight: 0.4,
    maxWeight: 1.2,
    categoryName: "Vestes de costume",
    typicalVolume: 0.0015
  },
  {
    keywords: ["pantalon de costume"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Pantalons de costume",
    typicalVolume: 0.0008
  },
  {
    keywords: ["gilet de costume"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Gilets de costume",
    typicalVolume: 0.0005
  },
  {
    keywords: ["tenue de cérémonie"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Tenues de cérémonie",
    typicalVolume: 0.002
  },
  {
    keywords: ["uniforme"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Uniformes",
    typicalVolume: 0.0015
  },
  {
    keywords: ["tablier"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Tabliers",
    typicalVolume: 0.0004
  },
  {
    keywords: ["blouse de travail"],
    minWeight: 0.2,
    maxWeight: 0.7,
    categoryName: "Blouses de travail",
    typicalVolume: 0.0006
  },

  // ==========================================================================
  // 3. ACCESSOIRES - TOUS TYPES
  // ==========================================================================
  {
    keywords: ["sac", "bag", "handbag", "sac à main", "tote", "sacs"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Sacs",
    typicalVolume: 0.006
  },
  {
    keywords: ["sac à dos", "backpack", "sacs à dos"],
    minWeight: 0.4,
    maxWeight: 2.0,
    categoryName: "Sacs à dos",
    typicalVolume: 0.025
  },
  {
    keywords: ["sacoche", "messenger bag", "sacoches"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Sacoches",
    typicalVolume: 0.008
  },
  {
    keywords: ["pochette", "clutch", "purse", "pochettes"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Pochettes",
    typicalVolume: 0.002
  },
  {
    keywords: ["portefeuille", "wallet", "porte-cartes", "portefeuilles"],
    minWeight: 0.03,
    maxWeight: 0.2,
    categoryName: "Portefeuilles",
    typicalVolume: 0.0001
  },
  {
    keywords: ["valise", "suitcase", "luggage", "valises"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Valises",
    typicalVolume: 0.05
  },
  {
    keywords: ["trousse", "trousse de toilette", "trousses"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Trousses",
    typicalVolume: 0.001
  },
  {
    keywords: ["étui", "case", "étuis"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Étuis",
    typicalVolume: 0.0005
  },
  {
    keywords: ["montre", "watch", "montres"],
    minWeight: 0.03,
    maxWeight: 0.2,
    categoryName: "Montres",
    typicalVolume: 0.00008
  },
  {
    keywords: ["bracelet de montre", "watch band"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Bracelets de montre",
    typicalVolume: 0.00003
  },
  {
    keywords: ["lunettes", "glasses", "lunettes de vue"],
    minWeight: 0.02,
    maxWeight: 0.08,
    categoryName: "Lunettes",
    typicalVolume: 0.00015
  },
  {
    keywords: ["lunettes de soleil", "sunglasses"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Lunettes de soleil",
    typicalVolume: 0.0002
  },
  {
    keywords: ["bijoux", "jewelry", "bijou"],
    minWeight: 0.002,
    maxWeight: 0.1,
    categoryName: "Bijoux",
    typicalVolume: 0.00003
  },
  {
    keywords: ["collier", "necklace", "colliers"],
    minWeight: 0.005,
    maxWeight: 0.1,
    categoryName: "Colliers",
    typicalVolume: 0.00005
  },
  {
    keywords: ["bracelet", "bracelets"],
    minWeight: 0.005,
    maxWeight: 0.08,
    categoryName: "Bracelets",
    typicalVolume: 0.00003
  },
  {
    keywords: ["bague", "ring", "bagues"],
    minWeight: 0.002,
    maxWeight: 0.02,
    categoryName: "Bagues",
    typicalVolume: 0.000005
  },
  {
    keywords: ["boucle d'oreille", "earring", "boucles d'oreilles"],
    minWeight: 0.001,
    maxWeight: 0.03,
    categoryName: "Boucles d'oreilles",
    typicalVolume: 0.00001
  },
  {
    keywords: ["parure"],
    minWeight: 0.01,
    maxWeight: 0.2,
    categoryName: "Parures",
    typicalVolume: 0.0001
  },
  {
    keywords: ["montre connectée", "smartwatch", "montres connectées"],
    minWeight: 0.03,
    maxWeight: 0.1,
    categoryName: "Montres connectées",
    typicalVolume: 0.00006
  },
  {
    keywords: ["fitness tracker", "bracelet connecté"],
    minWeight: 0.02,
    maxWeight: 0.06,
    categoryName: "Trackers fitness",
    typicalVolume: 0.00004
  },
  {
    keywords: ["casque audio", "headphone", "casques"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Casques audio",
    typicalVolume: 0.001
  },
  {
    keywords: ["écouteurs", "earbuds", "airpods"],
    minWeight: 0.03,
    maxWeight: 0.1,
    categoryName: "Écouteurs",
    typicalVolume: 0.0001
  },
  {
    keywords: ["enceinte", "speaker", "enceintes"],
    minWeight: 0.2,
    maxWeight: 5.0,
    categoryName: "Enceintes",
    typicalVolume: 0.002
  },
  {
    keywords: ["enceinte bluetooth", "bluetooth speaker"],
    minWeight: 0.15,
    maxWeight: 1.0,
    categoryName: "Enceintes Bluetooth",
    typicalVolume: 0.001
  },
  {
    keywords: ["barre de son", "soundbar"],
    minWeight: 1.5,
    maxWeight: 5.0,
    categoryName: "Barres de son",
    typicalVolume: 0.008
  },
  {
    keywords: ["parapluie", "umbrella", "parapluies"],
    minWeight: 0.2,
    maxWeight: 0.6,
    categoryName: "Parapluies",
    typicalVolume: 0.002
  },
  {
    keywords: ["ombrelle"],
    minWeight: 0.15,
    maxWeight: 0.5,
    categoryName: "Ombrelles",
    typicalVolume: 0.0015
  },

  // ==========================================================================
  // 4. ÉLECTRONIQUE - TOUS TYPES
  // ==========================================================================
  {
    keywords: ["smartphone", "téléphone", "phone", "iphone", "samsung", "xiaomi", "huawei", "oneplus"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Smartphones",
    typicalVolume: 0.0002
  },
  {
    keywords: ["tablet", "tablette", "ipad", "samsung tab"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Tablettes",
    typicalVolume: 0.001
  },
  {
    keywords: ["laptop", "ordinateur portable", "pc portable", "macbook", "ultrabook"],
    minWeight: 1.0,
    maxWeight: 3.5,
    categoryName: "Ordinateurs portables",
    typicalVolume: 0.005
  },
  {
    keywords: ["ordinateur de bureau", "desktop", "pc fixe", "tour"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Ordinateurs de bureau",
    typicalVolume: 0.02
  },
  {
    keywords: ["monitor", "écran", "moniteur"],
    minWeight: 2.0,
    maxWeight: 10.0,
    categoryName: "Écrans",
    typicalVolume: 0.025
  },
  {
    keywords: ["télévision", "tv", "television", "écran plat"],
    minWeight: 3.0,
    maxWeight: 30.0,
    categoryName: "Téléviseurs",
    typicalVolume: 0.05
  },
  {
    keywords: ["appareil photo", "camera", "reflex", "hybride", "compact"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Appareils photo",
    typicalVolume: 0.001
  },
  {
    keywords: ["caméra", "camcorder", "caméscope"],
    minWeight: 0.3,
    maxWeight: 2.5,
    categoryName: "Caméras",
    typicalVolume: 0.002
  },
  {
    keywords: ["drone"],
    minWeight: 0.2,
    maxWeight: 3.0,
    categoryName: "Drones",
    typicalVolume: 0.004
  },
  {
    keywords: ["projecteur", "projector", "vidéoprojecteur"],
    minWeight: 0.5,
    maxWeight: 5.0,
    categoryName: "Projecteurs",
    typicalVolume: 0.006
  },
  {
    keywords: ["casque vr", "vr headset", "réalité virtuelle"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Casques VR",
    typicalVolume: 0.004
  },
  {
    keywords: ["console de jeux", "gaming console", "playstation", "xbox", "nintendo"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Consoles de jeux",
    typicalVolume: 0.01
  },
  {
    keywords: ["manette", "controller"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Manettes",
    typicalVolume: 0.0008
  },
  {
    keywords: ["routeur", "router"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Routeurs",
    typicalVolume: 0.001
  },
  {
    keywords: ["modem"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Modems",
    typicalVolume: 0.0012
  },
  {
    keywords: ["switch réseau", "network switch"],
    minWeight: 0.3,
    maxWeight: 2.0,
    categoryName: "Switches réseau",
    typicalVolume: 0.002
  },
  {
    keywords: ["serveur", "server"],
    minWeight: 5.0,
    maxWeight: 30.0,
    categoryName: "Serveurs",
    typicalVolume: 0.05
  },
  {
    keywords: ["disque dur", "hard drive", "hdd"],
    minWeight: 0.15,
    maxWeight: 1.0,
    categoryName: "Disques durs",
    typicalVolume: 0.0004
  },
  {
    keywords: ["ssd"],
    minWeight: 0.03,
    maxWeight: 0.2,
    categoryName: "SSD",
    typicalVolume: 0.00005
  },
  {
    keywords: ["clé usb", "usb", "usb flash drive"],
    minWeight: 0.005,
    maxWeight: 0.05,
    categoryName: "Clés USB",
    typicalVolume: 0.00001
  },
  {
    keywords: ["carte mémoire", "memory card", "sd card"],
    minWeight: 0.001,
    maxWeight: 0.01,
    categoryName: "Cartes mémoire",
    typicalVolume: 0.000002
  },
  {
    keywords: ["batterie externe", "power bank"],
    minWeight: 0.1,
    maxWeight: 0.8,
    categoryName: "Batteries externes",
    typicalVolume: 0.0003
  },
  {
    keywords: ["chargeur", "charger"],
    minWeight: 0.03,
    maxWeight: 0.3,
    categoryName: "Chargeurs",
    typicalVolume: 0.0001
  },
  {
    keywords: ["câble", "cable"],
    minWeight: 0.01,
    maxWeight: 0.2,
    categoryName: "Câbles",
    typicalVolume: 0.00005
  },
  {
    keywords: ["adaptateur", "adapter"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Adaptateurs",
    typicalVolume: 0.00006
  },
  {
    keywords: ["souris", "mouse"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Souris",
    typicalVolume: 0.00012
  },
  {
    keywords: ["clavier", "keyboard"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Claviers",
    typicalVolume: 0.0015
  },
  {
    keywords: ["webcam"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Webcams",
    typicalVolume: 0.00015
  },
  {
    keywords: ["microphone"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Microphones",
    typicalVolume: 0.0005
  },
  {
    keywords: ["imprimante", "printer"],
    minWeight: 3.0,
    maxWeight: 10.0,
    categoryName: "Imprimantes",
    typicalVolume: 0.02
  },
  {
    keywords: ["scanner"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Scanners",
    typicalVolume: 0.015
  },
  {
    keywords: ["photocopieur"],
    minWeight: 20.0,
    maxWeight: 100.0,
    categoryName: "Photocopieurs",
    typicalVolume: 0.2
  },
  {
    keywords: ["tablette graphique"],
    minWeight: 0.2,
    maxWeight: 1.5,
    categoryName: "Tablettes graphiques",
    typicalVolume: 0.001
  },
  {
    keywords: ["liseuse", "kindle"],
    minWeight: 0.15,
    maxWeight: 0.3,
    categoryName: "Liseuses",
    typicalVolume: 0.0005
  },
  {
    keywords: ["montre connectée", "smartwatch"],
    minWeight: 0.03,
    maxWeight: 0.1,
    categoryName: "Montres connectées",
    typicalVolume: 0.00006
  },
  {
    keywords: ["casque audio", "headphones"],
    minWeight: 0.15,
    maxWeight: 0.5,
    categoryName: "Casques audio",
    typicalVolume: 0.001
  },
  {
    keywords: ["enceinte connectée", "smart speaker"],
    minWeight: 0.2,
    maxWeight: 1.5,
    categoryName: "Enceintes connectées",
    typicalVolume: 0.002
  },
  {
    keywords: ["station d'accueil", "docking station"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Stations d'accueil",
    typicalVolume: 0.0015
  },

  // ==========================================================================
  // 5. ÉLECTRONIQUE PROFESSIONNELLE & INDUSTRIELLE
  // ==========================================================================
  {
    keywords: ["oscilloscope"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Oscilloscopes",
    typicalVolume: 0.008
  },
  {
    keywords: ["multimètre", "multimeter"],
    minWeight: 0.15,
    maxWeight: 0.5,
    categoryName: "Multimètres",
    typicalVolume: 0.0004
  },
  {
    keywords: ["générateur de signaux", "signal generator"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Générateurs de signaux",
    typicalVolume: 0.004
  },
  {
    keywords: ["alimentation de laboratoire", "power supply"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Alimentations",
    typicalVolume: 0.005
  },
  {
    keywords: ["analyseur de spectre", "spectrum analyzer"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Analyseurs de spectre",
    typicalVolume: 0.01
  },
  {
    keywords: ["compteur geiger"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Compteurs Geiger",
    typicalVolume: 0.001
  },
  {
    keywords: ["détecteur de métaux", "metal detector"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Détecteurs de métaux",
    typicalVolume: 0.01
  },
  {
    keywords: ["caméra thermique", "thermal camera"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Caméras thermiques",
    typicalVolume: 0.002
  },
  {
    keywords: ["niveau laser", "laser level"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Niveaux laser",
    typicalVolume: 0.0015
  },
  {
    keywords: ["télémètre", "rangefinder"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Télémètres",
    typicalVolume: 0.0005
  },
  {
    keywords: ["station totale", "total station"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Stations totales",
    typicalVolume: 0.015
  },
  {
    keywords: ["gps professionnel"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "GPS professionnels",
    typicalVolume: 0.001
  },

  // ==========================================================================
  // 6. ÉQUIPEMENTS AUDIO & VIDÉO PROFESSIONNELS
  // ==========================================================================
  {
    keywords: ["table de mixage", "mixing console"],
    minWeight: 3.0,
    maxWeight: 15.0,
    categoryName: "Tables de mixage",
    typicalVolume: 0.02
  },
  {
    keywords: ["amplificateur", "amplifier"],
    minWeight: 2.0,
    maxWeight: 10.0,
    categoryName: "Amplificateurs",
    typicalVolume: 0.015
  },
  {
    keywords: ["enceinte studio", "studio monitor"],
    minWeight: 3.0,
    maxWeight: 15.0,
    categoryName: "Enceintes studio",
    typicalVolume: 0.02
  },
  {
    keywords: ["microphone studio"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Microphones studio",
    typicalVolume: 0.0008
  },
  {
    keywords: ["pied de micro", "microphone stand"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Pieds de micro",
    typicalVolume: 0.01
  },
  {
    keywords: ["casque studio"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Casques studio",
    typicalVolume: 0.001
  },
  {
    keywords: ["interface audio"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Interfaces audio",
    typicalVolume: 0.001
  },
  {
    keywords: ["processeur audio"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Processeurs audio",
    typicalVolume: 0.005
  },
  {
    keywords: ["enregistreur", "recorder"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Enregistreurs",
    typicalVolume: 0.001
  },
  {
    keywords: ["caméra professionnelle", "caméra broadcast"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Caméras professionnelles",
    typicalVolume: 0.01
  },
  {
    keywords: ["trépied", "tripod"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Trépieds",
    typicalVolume: 0.02
  },
  {
    keywords: ["moniteur de terrain"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Moniteurs de terrain",
    typicalVolume: 0.004
  },

  // ==========================================================================
  // 7. MAISON & CUISINE - TOUS TYPES
  // ==========================================================================
  {
    keywords: ["mug", "tasse"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Mugs",
    typicalVolume: 0.0005
  },
  {
    keywords: ["cup", "verre"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Verres",
    typicalVolume: 0.0004
  },
  {
    keywords: ["plate", "assiette", "assiettes"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Assiettes",
    typicalVolume: 0.001
  },
  {
    keywords: ["bowl", "bol", "bols"],
    minWeight: 0.15,
    maxWeight: 0.7,
    categoryName: "Bols",
    typicalVolume: 0.0008
  },
  {
    keywords: ["cutlery", "couverts"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Couverts",
    typicalVolume: 0.0001
  },
  {
    keywords: ["knife", "couteau", "couteaux"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Couteaux",
    typicalVolume: 0.0003
  },
  {
    keywords: ["fourchette", "fork"],
    minWeight: 0.02,
    maxWeight: 0.08,
    categoryName: "Fourchettes",
    typicalVolume: 0.00008
  },
  {
    keywords: ["cuillère", "spoon"],
    minWeight: 0.02,
    maxWeight: 0.08,
    categoryName: "Cuillères",
    typicalVolume: 0.00008
  },
  {
    keywords: ["pan", "poêle", "poêles"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Poêles",
    typicalVolume: 0.004
  },
  {
    keywords: ["pot", "casserole", "casseroles", "marmite"],
    minWeight: 0.8,
    maxWeight: 3.0,
    categoryName: "Casseroles",
    typicalVolume: 0.007
  },
  {
    keywords: ["faitout"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Faitouts",
    typicalVolume: 0.01
  },
  {
    keywords: ["cocotte"],
    minWeight: 2.0,
    maxWeight: 6.0,
    categoryName: "Cocottes",
    typicalVolume: 0.008
  },
  {
    keywords: ["kettle", "bouilloire", "bouilloires"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Bouilloires",
    typicalVolume: 0.003
  },
  {
    keywords: ["blender", "mixeur", "blenders"],
    minWeight: 1.0,
    maxWeight: 3.5,
    categoryName: "Mixeurs",
    typicalVolume: 0.006
  },
  {
    keywords: ["toaster", "grille-pain"],
    minWeight: 0.8,
    maxWeight: 2.0,
    categoryName: "Grille-pain",
    typicalVolume: 0.005
  },
  {
    keywords: ["coffee maker", "cafetière", "cafetières"],
    minWeight: 1.5,
    maxWeight: 5.0,
    categoryName: "Cafetières",
    typicalVolume: 0.01
  },
  {
    keywords: ["machine à café", "espresso"],
    minWeight: 3.0,
    maxWeight: 10.0,
    categoryName: "Machines à café",
    typicalVolume: 0.015
  },
  {
    keywords: ["microwave", "micro-ondes"],
    minWeight: 8.0,
    maxWeight: 20.0,
    categoryName: "Micro-ondes",
    typicalVolume: 0.045
  },
  {
    keywords: ["four"],
    minWeight: 15.0,
    maxWeight: 50.0,
    categoryName: "Fours",
    typicalVolume: 0.08
  },
  {
    keywords: ["réfrigérateur", "frigo", "fridge"],
    minWeight: 30.0,
    maxWeight: 100.0,
    categoryName: "Réfrigérateurs",
    typicalVolume: 0.3
  },
  {
    keywords: ["congélateur", "freezer"],
    minWeight: 25.0,
    maxWeight: 80.0,
    categoryName: "Congélateurs",
    typicalVolume: 0.25
  },
  {
    keywords: ["lave-vaisselle", "dishwasher"],
    minWeight: 30.0,
    maxWeight: 60.0,
    categoryName: "Lave-vaisselle",
    typicalVolume: 0.2
  },
  {
    keywords: ["lave-linge", "machine à laver"],
    minWeight: 40.0,
    maxWeight: 80.0,
    categoryName: "Lave-linge",
    typicalVolume: 0.25
  },
  {
    keywords: ["sèche-linge"],
    minWeight: 30.0,
    maxWeight: 60.0,
    categoryName: "Sèche-linge",
    typicalVolume: 0.2
  },
  {
    keywords: ["air fryer", "friteuse à air"],
    minWeight: 3.0,
    maxWeight: 7.0,
    categoryName: "Friteuses à air",
    typicalVolume: 0.025
  },
  {
    keywords: ["friteuse"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Friteuses",
    typicalVolume: 0.015
  },
  {
    keywords: ["rice cooker", "cuiseur à riz"],
    minWeight: 1.5,
    maxWeight: 4.0,
    categoryName: "Cuiseurs à riz",
    typicalVolume: 0.01
  },
  {
    keywords: ["autocuiseur", "cocotte minute"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Autocuiseurs",
    typicalVolume: 0.01
  },
  {
    keywords: ["robot culinaire", "food processor"],
    minWeight: 2.0,
    maxWeight: 6.0,
    categoryName: "Robots culinaires",
    typicalVolume: 0.012
  },
  {
    keywords: ["batteur", "mixeur sur socle"],
    minWeight: 2.5,
    maxWeight: 7.0,
    categoryName: "Batteurs",
    typicalVolume: 0.01
  },
  {
    keywords: ["hachoir"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Hachoirs",
    typicalVolume: 0.003
  },
  {
    keywords: ["balance de cuisine", "kitchen scale"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Balances de cuisine",
    typicalVolume: 0.0005
  },
  {
    keywords: ["minuteur", "timer"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Minuteurs",
    typicalVolume: 0.0002
  },
  {
    keywords: ["thermomètre de cuisine"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Thermomètres de cuisine",
    typicalVolume: 0.00015
  },
  {
    keywords: ["passoire"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Passoires",
    typicalVolume: 0.002
  },
  {
    keywords: ["égouttoir"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Égouttoirs",
    typicalVolume: 0.003
  },
  {
    keywords: ["planche à découper", "cutting board"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Planches à découper",
    typicalVolume: 0.002
  },
  {
    keywords: ["rouleau à pâtisserie"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Rouleaux à pâtisserie",
    typicalVolume: 0.0008
  },
  {
    keywords: ["emporte-pièce"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Emporte-pièces",
    typicalVolume: 0.00005
  },
  {
    keywords: ["poche à douille"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Poches à douille",
    typicalVolume: 0.0003
  },
  {
    keywords: ["douille à pâtisserie"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Douilles à pâtisserie",
    typicalVolume: 0.00002
  },
  {
    keywords: ["moule à gâteau"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Moules à gâteau",
    typicalVolume: 0.002
  },
  {
    keywords: ["moule à muffin"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Moules à muffin",
    typicalVolume: 0.0015
  },
  {
    keywords: ["plaque de cuisson"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Plaques de cuisson",
    typicalVolume: 0.003
  },
  {
    keywords: ["grille de four"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Grilles de four",
    typicalVolume: 0.002
  },
  {
    keywords: ["lèchefrite"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Lèchefrites",
    typicalVolume: 0.002
  },
  {
    keywords: ["plat à gratin"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Plats à gratin",
    typicalVolume: 0.0025
  },
  {
    keywords: ["saladier"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Saladiers",
    typicalVolume: 0.002
  },
  {
    keywords: ["pichet", "carafe"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Pichets",
    typicalVolume: 0.0015
  },
  {
    keywords: ["thermos"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Thermos",
    typicalVolume: 0.0008
  },
  {
    keywords: ["gourde", "water bottle"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Gourdes",
    typicalVolume: 0.0006
  },
  {
    keywords: ["boîte de conservation", "food container"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Boîtes de conservation",
    typicalVolume: 0.0008
  },
  {
    keywords: ["film alimentaire"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Film alimentaire",
    typicalVolume: 0.0003
  },
  {
    keywords: ["papier aluminium"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Papier aluminium",
    typicalVolume: 0.0004
  },
  {
    keywords: ["sac congélation"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Sacs congélation",
    typicalVolume: 0.0002
  },

  // ==========================================================================
  // 8. LITERIE & TEXTILE MAISON
  // ==========================================================================
  {
    keywords: ["drap", "drap plat", "drap-housse", "bedsheet"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Draps",
    typicalVolume: 0.004
  },
  {
    keywords: ["housse de couette", "duvet cover"],
    minWeight: 0.8,
    maxWeight: 2.0,
    categoryName: "Housses de couette",
    typicalVolume: 0.006
  },
  {
    keywords: ["taie d'oreiller", "pillowcase"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Taies d'oreiller",
    typicalVolume: 0.0005
  },
  {
    keywords: ["couette", "duvet"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Couettes",
    typicalVolume: 0.02
  },
  {
    keywords: ["oreiller", "pillow"],
    minWeight: 0.4,
    maxWeight: 1.5,
    categoryName: "Oreillers",
    typicalVolume: 0.02
  },
  {
    keywords: ["traversin"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Traversins",
    typicalVolume: 0.015
  },
  {
    keywords: ["couverture", "blanket"],
    minWeight: 0.8,
    maxWeight: 3.0,
    categoryName: "Couvertures",
    typicalVolume: 0.007
  },
  {
    keywords: ["plaid"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Plaids",
    typicalVolume: 0.004
  },
  {
    keywords: ["jeté de lit"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Jetés de lit",
    typicalVolume: 0.004
  },
  {
    keywords: ["alèse"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Alèses",
    typicalVolume: 0.002
  },
  {
    keywords: ["protège-matelas"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Protège-matelas",
    typicalVolume: 0.005
  },
  {
    keywords: ["matelas", "mattress"],
    minWeight: 5.0,
    maxWeight: 30.0,
    categoryName: "Matelas",
    typicalVolume: 0.2
  },
  {
    keywords: ["sommier"],
    minWeight: 10.0,
    maxWeight: 40.0,
    categoryName: "Sommiers",
    typicalVolume: 0.3
  },
  {
    keywords: ["surmatelas"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Surmatelas",
    typicalVolume: 0.05
  },

  // ==========================================================================
  // 9. DÉCORATION & ART
  // ==========================================================================
  {
    keywords: ["poster"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Posters",
    typicalVolume: 0.0015
  },
  {
    keywords: ["tableau", "painting", "toile"],
    minWeight: 0.3,
    maxWeight: 5.0,
    categoryName: "Tableaux",
    typicalVolume: 0.015
  },
  {
    keywords: ["cadre", "picture frame"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Cadres",
    typicalVolume: 0.004
  },
  {
    keywords: ["stickeur", "wall sticker", "autocollant mural"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Stickers muraux",
    typicalVolume: 0.0004
  },
  {
    keywords: ["tapisserie", "tapestry"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Tapisseries",
    typicalVolume: 0.002
  },
  {
    keywords: ["tapis", "rug"],
    minWeight: 1.0,
    maxWeight: 10.0,
    categoryName: "Tapis",
    typicalVolume: 0.02
  },
  {
    keywords: ["carpette"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Carpettes",
    typicalVolume: 0.01
  },
  {
    keywords: ["paillasson"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Paillassons",
    typicalVolume: 0.002
  },
  {
    keywords: ["pot de fleurs", "plant pot"],
    minWeight: 0.2,
    maxWeight: 3.0,
    categoryName: "Pots de fleurs",
    typicalVolume: 0.003
  },
  {
    keywords: ["plante artificielle", "artificial plant"],
    minWeight: 0.1,
    maxWeight: 2.0,
    categoryName: "Plantes artificielles",
    typicalVolume: 0.006
  },
  {
    keywords: ["fleur artificielle"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Fleurs artificielles",
    typicalVolume: 0.001
  },
  {
    keywords: ["bougie", "candle"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Bougies",
    typicalVolume: 0.0005
  },
  {
    keywords: ["bougeoir", "candlestick"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Bougeoirs",
    typicalVolume: 0.0008
  },
  {
    keywords: ["photophore"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Photophores",
    typicalVolume: 0.0006
  },
  {
    keywords: ["lanterne", "lantern"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Lanternes",
    typicalVolume: 0.002
  },
  {
    keywords: ["guirlande lumineuse", "string lights"],
    minWeight: 0.1,
    maxWeight: 0.8,
    categoryName: "Guirlandes lumineuses",
    typicalVolume: 0.001
  },
  {
    keywords: ["lampe", "lamp"],
    minWeight: 0.3,
    maxWeight: 3.0,
    categoryName: "Lampes",
    typicalVolume: 0.004
  },
  {
    keywords: ["lampadaire"],
    minWeight: 2.0,
    maxWeight: 6.0,
    categoryName: "Lampadaires",
    typicalVolume: 0.02
  },
  {
    keywords: ["applique murale"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Appliques murales",
    typicalVolume: 0.002
  },
  {
    keywords: ["lustre", "chandelier"],
    minWeight: 2.0,
    maxWeight: 10.0,
    categoryName: "Lustres",
    typicalVolume: 0.02
  },
  {
    keywords: ["horloge", "clock"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Horloges",
    typicalVolume: 0.002
  },
  {
    keywords: ["réveil", "alarm clock"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Réveils",
    typicalVolume: 0.0006
  },
  {
    keywords: ["miroir", "mirror"],
    minWeight: 0.5,
    maxWeight: 5.0,
    categoryName: "Miroirs",
    typicalVolume: 0.01
  },
  {
    keywords: ["vase"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Vases",
    typicalVolume: 0.002
  },
  {
    keywords: ["sculpture", "figurine"],
    minWeight: 0.05,
    maxWeight: 1.0,
    categoryName: "Sculptures",
    typicalVolume: 0.001
  },
  {
    keywords: ["statuette"],
    minWeight: 0.1,
    maxWeight: 2.0,
    categoryName: "Statuettes",
    typicalVolume: 0.002
  },
  {
    keywords: ["bouddha"],
    minWeight: 0.2,
    maxWeight: 5.0,
    categoryName: "Bouddhas",
    typicalVolume: 0.004
  },
  {
    keywords: ["angelot"],
    minWeight: 0.1,
    maxWeight: 1.0,
    categoryName: "Angelots",
    typicalVolume: 0.001
  },

  // ==========================================================================
  // 10. BEAUTÉ & SOINS
  // ==========================================================================
  {
    keywords: ["maquillage", "makeup"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Maquillage",
    typicalVolume: 0.0001
  },
  {
    keywords: ["rouge à lèvres", "lipstick"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Rouges à lèvres",
    typicalVolume: 0.00003
  },
  {
    keywords: ["mascara"],
    minWeight: 0.01,
    maxWeight: 0.04,
    categoryName: "Mascaras",
    typicalVolume: 0.00002
  },
  {
    keywords: ["eyeliner"],
    minWeight: 0.005,
    maxWeight: 0.02,
    categoryName: "Eyeliner",
    typicalVolume: 0.00001
  },
  {
    keywords: ["fond de teint", "foundation"],
    minWeight: 0.03,
    maxWeight: 0.15,
    categoryName: "Fonds de teint",
    typicalVolume: 0.00006
  },
  {
    keywords: ["correcteur", "concealer"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Correcteurs",
    typicalVolume: 0.00002
  },
  {
    keywords: ["poudre", "powder"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Poudres",
    typicalVolume: 0.00004
  },
  {
    keywords: ["fard à paupières", "eyeshadow"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Fards à paupières",
    typicalVolume: 0.00005
  },
  {
    keywords: ["palette de maquillage"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Palettes de maquillage",
    typicalVolume: 0.0002
  },
  {
    keywords: ["pinceau de maquillage", "makeup brush"],
    minWeight: 0.005,
    maxWeight: 0.05,
    categoryName: "Pinceaux de maquillage",
    typicalVolume: 0.00005
  },
  {
    keywords: ["éponge de maquillage"],
    minWeight: 0.005,
    maxWeight: 0.03,
    categoryName: "Éponges de maquillage",
    typicalVolume: 0.00004
  },
  {
    keywords: ["parfum", "perfume"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Parfums",
    typicalVolume: 0.0003
  },
  {
    keywords: ["eau de toilette"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Eaux de toilette",
    typicalVolume: 0.0003
  },
  {
    keywords: ["déodorant", "deodorant"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Déodorants",
    typicalVolume: 0.0002
  },
  {
    keywords: ["crème", "cream"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Crèmes",
    typicalVolume: 0.00012
  },
  {
    keywords: ["lotion"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Lotions",
    typicalVolume: 0.00025
  },
  {
    keywords: ["sérum", "serum"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Sérums",
    typicalVolume: 0.00006
  },
  {
    keywords: ["masque visage", "face mask"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Masques visage",
    typicalVolume: 0.0001
  },
  {
    keywords: ["gommage", "scrub"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Gommages",
    typicalVolume: 0.0002
  },
  {
    keywords: ["shampooing", "shampoo"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Shampooings",
    typicalVolume: 0.0005
  },
  {
    keywords: ["après-shampooing", "conditioner"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Après-shampooings",
    typicalVolume: 0.0005
  },
  {
    keywords: ["masque capillaire"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Masques capillaires",
    typicalVolume: 0.0004
  },
  {
    keywords: ["huile capillaire"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Huiles capillaires",
    typicalVolume: 0.00015
  },
  {
    keywords: ["laque", "hairspray"],
    minWeight: 0.2,
    maxWeight: 0.6,
    categoryName: "Laques",
    typicalVolume: 0.0004
  },
  {
    keywords: ["gel coiffant"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Gels coiffants",
    typicalVolume: 0.00025
  },
  {
    keywords: ["cire capillaire"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Cires capillaires",
    typicalVolume: 0.00015
  },
  {
    keywords: ["sèche-cheveux", "hair dryer"],
    minWeight: 0.4,
    maxWeight: 1.2,
    categoryName: "Sèche-cheveux",
    typicalVolume: 0.002
  },
  {
    keywords: ["lisseur", "straightener"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Lisseurs",
    typicalVolume: 0.0012
  },
  {
    keywords: ["fer à boucler", "curler"],
    minWeight: 0.2,
    maxWeight: 0.6,
    categoryName: "Fers à boucler",
    typicalVolume: 0.001
  },
  {
    keywords: ["brosse à cheveux"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Brosses à cheveux",
    typicalVolume: 0.0005
  },
  {
    keywords: ["peigne"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Peignes",
    typicalVolume: 0.0002
  },
  {
    keywords: ["rasoir", "razor"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Rasoirs",
    typicalVolume: 0.0001
  },
  {
    keywords: ["lames de rasoir"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Lames de rasoir",
    typicalVolume: 0.00005
  },
  {
    keywords: ["crème à raser"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Crèmes à raser",
    typicalVolume: 0.0002
  },
  {
    keywords: ["après-rasage"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Après-rasage",
    typicalVolume: 0.0002
  },
  {
    keywords: ["savon", "soap"],
    minWeight: 0.08,
    maxWeight: 0.3,
    categoryName: "Savons",
    typicalVolume: 0.00015
  },
  {
    keywords: ["gel douche", "shower gel"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Gels douche",
    typicalVolume: 0.0004
  },
  {
    keywords: ["bain moussant"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Bains moussants",
    typicalVolume: 0.0004
  },
  {
    keywords: ["éponge", "sponge"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Éponges",
    typicalVolume: 0.0002
  },
  {
    keywords: ["gant de toilette"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Gants de toilette",
    typicalVolume: 0.00015
  },
  {
    keywords: ["serviette de toilette", "towel"],
    minWeight: 0.15,
    maxWeight: 0.8,
    categoryName: "Serviettes de toilette",
    typicalVolume: 0.0015
  },
  {
    keywords: ["peignoir", "bathrobe"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Peignoirs",
    typicalVolume: 0.003
  },
  {
    keywords: ["tapis de bain"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Tapis de bain",
    typicalVolume: 0.002
  },

  // ==========================================================================
  // 11. SOINS & MÉDICAL
  // ==========================================================================
  {
    keywords: ["trousse de secours", "first aid kit"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Trousses de secours",
    typicalVolume: 0.003
  },
  {
    keywords: ["thermomètre", "thermometer"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Thermomètres",
    typicalVolume: 0.0001
  },
  {
    keywords: ["tensiomètre", "blood pressure monitor"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Tensiomètres",
    typicalVolume: 0.001
  },
  {
    keywords: ["oxymètre", "pulse oximeter"],
    minWeight: 0.02,
    maxWeight: 0.06,
    categoryName: "Oxymètres",
    typicalVolume: 0.00006
  },
  {
    keywords: ["glucomètre"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Glucomètres",
    typicalVolume: 0.0002
  },
  {
    keywords: ["inhalateur"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Inhalateurs",
    typicalVolume: 0.0003
  },
  {
    keywords: ["nébuliseur"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Nébuliseurs",
    typicalVolume: 0.0015
  },
  {
    keywords: ["fauteuil roulant", "wheelchair"],
    minWeight: 10.0,
    maxWeight: 25.0,
    categoryName: "Fauteuils roulants",
    typicalVolume: 0.2
  },
  {
    keywords: ["déambulateur", "walker"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Déambulateurs",
    typicalVolume: 0.05
  },
  {
    keywords: ["béquilles", "crutches"],
    minWeight: 0.8,
    maxWeight: 2.0,
    categoryName: "Béquilles",
    typicalVolume: 0.01
  },
  {
    keywords: ["canne", "cane"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Cannes",
    typicalVolume: 0.001
  },
  {
    keywords: ["lit médicalisé"],
    minWeight: 50.0,
    maxWeight: 150.0,
    categoryName: "Lits médicalisés",
    typicalVolume: 0.5
  },
  {
    keywords: ["lève-personne"],
    minWeight: 20.0,
    maxWeight: 50.0,
    categoryName: "Lève-personnes",
    typicalVolume: 0.3
  },
  {
    keywords: ["chaise percée"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Chaises percées",
    typicalVolume: 0.08
  },
  {
    keywords: ["bassin"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Bassins",
    typicalVolume: 0.002
  },
  {
    keywords: ["urinal"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Urinaux",
    typicalVolume: 0.001
  },
  {
    keywords: ["genouillère", "knee brace"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Genouillères",
    typicalVolume: 0.0006
  },
  {
    keywords: ["chevillère", "ankle brace"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Chevillières",
    typicalVolume: 0.0004
  },
  {
    keywords: ["poignet", "wrist brace"],
    minWeight: 0.03,
    maxWeight: 0.2,
    categoryName: "Poignets",
    typicalVolume: 0.0002
  },
  {
    keywords: ["lombostat", "back brace"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Lombostats",
    typicalVolume: 0.0008
  },
  {
    keywords: ["minerve", "neck brace"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Minerves",
    typicalVolume: 0.0005
  },
  {
    keywords: ["écharpe de maintien", "sling"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Écharpes de maintien",
    typicalVolume: 0.0004
  },
  {
    keywords: ["bas de contention"],
    minWeight: 0.03,
    maxWeight: 0.1,
    categoryName: "Bas de contention",
    typicalVolume: 0.0002
  },
  {
    keywords: ["bouillotte"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Bouillottes",
    typicalVolume: 0.0006
  },
  {
    keywords: ["coussin chauffant"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Coussins chauffants",
    typicalVolume: 0.001
  },
  {
    keywords: ["poche de glace"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Poches de glace",
    typicalVolume: 0.0008
  },
  {
    keywords: ["masque chirurgical"],
    minWeight: 0.001,
    maxWeight: 0.01,
    categoryName: "Masques chirurgicaux",
    typicalVolume: 0.00001
  },
  {
    keywords: ["gants médicaux"],
    minWeight: 0.002,
    maxWeight: 0.02,
    categoryName: "Gants médicaux",
    typicalVolume: 0.00002
  },
  {
    keywords: ["seringue", "syringe"],
    minWeight: 0.005,
    maxWeight: 0.02,
    categoryName: "Seringues",
    typicalVolume: 0.00001
  },
  {
    keywords: ["aiguille", "needle"],
    minWeight: 0.001,
    maxWeight: 0.005,
    categoryName: "Aiguilles",
    typicalVolume: 0.000001
  },
  {
    keywords: ["bande", "bandage"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Bandages",
    typicalVolume: 0.0002
  },
  {
    keywords: ["compresse"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Compresses",
    typicalVolume: 0.0001
  },
  {
    keywords: ["sparadrap"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Sparadraps",
    typicalVolume: 0.00005
  },

  // ==========================================================================
  // 12. SPORTS & LOISIRS
  // ==========================================================================
  {
    keywords: ["tapis de yoga", "yoga mat"],
    minWeight: 0.8,
    maxWeight: 2.5,
    categoryName: "Tapis de yoga",
    typicalVolume: 0.006
  },
  {
    keywords: ["haltère", "dumbbell", "haltères"],
    minWeight: 1.0,
    maxWeight: 25.0,
    categoryName: "Haltères",
    typicalVolume: 0.003
  },
  {
    keywords: ["barre de musculation", "barbell"],
    minWeight: 5.0,
    maxWeight: 30.0,
    categoryName: "Barres de musculation",
    typicalVolume: 0.01
  },
  {
    keywords: ["poids", "weight"],
    minWeight: 0.5,
    maxWeight: 20.0,
    categoryName: "Poids",
    typicalVolume: 0.001
  },
  {
    keywords: ["kettlebell"],
    minWeight: 2.0,
    maxWeight: 20.0,
    categoryName: "Kettlebells",
    typicalVolume: 0.005
  },
  {
    keywords: ["élastique", "resistance band"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Élastiques",
    typicalVolume: 0.0003
  },
  {
    keywords: ["corde à sauter", "jump rope"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Cordes à sauter",
    typicalVolume: 0.0004
  },
  {
    keywords: ["ballon de fitness", "exercise ball"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Ballons de fitness",
    typicalVolume: 0.01
  },
  {
    keywords: ["rouleau de massage", "foam roller"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Rouleaux de massage",
    typicalVolume: 0.002
  },
  {
    keywords: ["vélo", "bicycle", "bike"],
    minWeight: 8.0,
    maxWeight: 18.0,
    categoryName: "Vélos",
    typicalVolume: 0.2
  },
  {
    keywords: ["vélo électrique"],
    minWeight: 15.0,
    maxWeight: 25.0,
    categoryName: "Vélos électriques",
    typicalVolume: 0.25
  },
  {
    keywords: ["trottinette", "scooter"],
    minWeight: 3.0,
    maxWeight: 15.0,
    categoryName: "Trottinettes",
    typicalVolume: 0.04
  },
  {
    keywords: ["trottinette électrique", "electric scooter"],
    minWeight: 10.0,
    maxWeight: 25.0,
    categoryName: "Trottinettes électriques",
    typicalVolume: 0.06
  },
  {
    keywords: ["skateboard"],
    minWeight: 1.5,
    maxWeight: 3.5,
    categoryName: "Skateboards",
    typicalVolume: 0.012
  },
  {
    keywords: ["longboard"],
    minWeight: 2.0,
    maxWeight: 4.0,
    categoryName: "Longboards",
    typicalVolume: 0.015
  },
  {
    keywords: ["rollers", "roller skates"],
    minWeight: 1.5,
    maxWeight: 3.0,
    categoryName: "Rollers",
    typicalVolume: 0.008
  },
  {
    keywords: ["patins à glace", "ice skates"],
    minWeight: 1.0,
    maxWeight: 2.0,
    categoryName: "Patins à glace",
    typicalVolume: 0.006
  },
  {
    keywords: ["ski"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Skis",
    typicalVolume: 0.03
  },
  {
    keywords: ["snowboard"],
    minWeight: 2.5,
    maxWeight: 4.5,
    categoryName: "Snowboards",
    typicalVolume: 0.025
  },
  {
    keywords: ["bâtons de ski"],
    minWeight: 0.5,
    maxWeight: 1.0,
    categoryName: "Bâtons de ski",
    typicalVolume: 0.005
  },
  {
    keywords: ["casque de ski"],
    minWeight: 0.3,
    maxWeight: 0.8,
    categoryName: "Casques de ski",
    typicalVolume: 0.005
  },
  {
    keywords: ["lunettes de ski"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Lunettes de ski",
    typicalVolume: 0.0004
  },
  {
    keywords: ["raquette de tennis", "tennis racket"],
    minWeight: 0.25,
    maxWeight: 0.4,
    categoryName: "Raquettes de tennis",
    typicalVolume: 0.004
  },
  {
    keywords: ["balle de tennis"],
    minWeight: 0.05,
    maxWeight: 0.06,
    categoryName: "Balles de tennis",
    typicalVolume: 0.0001
  },
  {
    keywords: ["raquette de badminton"],
    minWeight: 0.08,
    maxWeight: 0.15,
    categoryName: "Raquettes de badminton",
    typicalVolume: 0.002
  },
  {
    keywords: ["volant de badminton"],
    minWeight: 0.005,
    maxWeight: 0.01,
    categoryName: "Volants de badminton",
    typicalVolume: 0.00002
  },
  {
    keywords: ["raquette de tennis de table"],
    minWeight: 0.15,
    maxWeight: 0.25,
    categoryName: "Raquettes de tennis de table",
    typicalVolume: 0.0008
  },
  {
    keywords: ["balle de tennis de table"],
    minWeight: 0.002,
    maxWeight: 0.003,
    categoryName: "Balles de tennis de table",
    typicalVolume: 0.000005
  },
  {
    keywords: ["club de golf", "golf club"],
    minWeight: 0.3,
    maxWeight: 0.6,
    categoryName: "Clubs de golf",
    typicalVolume: 0.003
  },
  {
    keywords: ["balle de golf"],
    minWeight: 0.04,
    maxWeight: 0.05,
    categoryName: "Balles de golf",
    typicalVolume: 0.00005
  },
  {
    keywords: ["sac de golf"],
    minWeight: 1.5,
    maxWeight: 3.0,
    categoryName: "Sacs de golf",
    typicalVolume: 0.02
  },
  {
    keywords: ["ballon de football", "football", "soccer ball"],
    minWeight: 0.4,
    maxWeight: 0.5,
    categoryName: "Ballons de football",
    typicalVolume: 0.006
  },
  {
    keywords: ["ballon de basket", "basketball"],
    minWeight: 0.5,
    maxWeight: 0.7,
    categoryName: "Ballons de basket",
    typicalVolume: 0.008
  },
  {
    keywords: ["ballon de volley", "volleyball"],
    minWeight: 0.25,
    maxWeight: 0.35,
    categoryName: "Ballons de volley",
    typicalVolume: 0.005
  },
  {
    keywords: ["ballon de rugby", "rugby ball"],
    minWeight: 0.4,
    maxWeight: 0.5,
    categoryName: "Ballons de rugby",
    typicalVolume: 0.005
  },
  {
    keywords: ["ballon de handball"],
    minWeight: 0.4,
    maxWeight: 0.5,
    categoryName: "Ballons de handball",
    typicalVolume: 0.005
  },
  {
    keywords: ["tente", "tent"],
    minWeight: 1.5,
    maxWeight: 6.0,
    categoryName: "Tentes",
    typicalVolume: 0.02
  },
  {
    keywords: ["sac de couchage", "sleeping bag"],
    minWeight: 0.8,
    maxWeight: 2.5,
    categoryName: "Sacs de couchage",
    typicalVolume: 0.01
  },
  {
    keywords: ["matelas de sol"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Matelas de sol",
    typicalVolume: 0.005
  },
  {
    keywords: ["chaise de camping", "camping chair"],
    minWeight: 1.5,
    maxWeight: 4.0,
    categoryName: "Chaises de camping",
    typicalVolume: 0.02
  },
  {
    keywords: ["table de camping"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Tables de camping",
    typicalVolume: 0.03
  },
  {
    keywords: ["réchaud de camping"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Réchauds de camping",
    typicalVolume: 0.002
  },
  {
    keywords: ["lampe torche", "flashlight"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Lampes torches",
    typicalVolume: 0.0004
  },
  {
    keywords: ["lampe frontale"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Lampes frontales",
    typicalVolume: 0.0003
  },
  {
    keywords: ["jumelles", "binoculars"],
    minWeight: 0.3,
    maxWeight: 1.2,
    categoryName: "Jumelles",
    typicalVolume: 0.001
  },
  {
    keywords: ["télescope"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Télescopes",
    typicalVolume: 0.01
  },
  {
    keywords: ["canne à pêche", "fishing rod"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Cannes à pêche",
    typicalVolume: 0.005
  },
  {
    keywords: ["moulinet", "fishing reel"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Moulinets",
    typicalVolume: 0.0005
  },
  {
    keywords: ["boîte de pêche"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Boîtes de pêche",
    typicalVolume: 0.002
  },

  // ==========================================================================
  // 13. JOUETS & PUÉRICULTURE
  // ==========================================================================
  {
    keywords: ["jouet", "toy"],
    minWeight: 0.02,
    maxWeight: 2.0,
    categoryName: "Jouets",
    typicalVolume: 0.002
  },
  {
    keywords: ["peluche", "plush toy", "doudou"],
    minWeight: 0.05,
    maxWeight: 1.0,
    categoryName: "Peluches",
    typicalVolume: 0.005
  },
  {
    keywords: ["figurine", "action figure"],
    minWeight: 0.02,
    maxWeight: 0.3,
    categoryName: "Figurines",
    typicalVolume: 0.0005
  },
  {
    keywords: ["poupée", "doll"],
    minWeight: 0.1,
    maxWeight: 0.8,
    categoryName: "Poupées",
    typicalVolume: 0.002
  },
  {
    keywords: ["lego"],
    minWeight: 0.05,
    maxWeight: 2.0,
    categoryName: "Lego",
    typicalVolume: 0.005
  },
  {
    keywords: ["puzzle"],
    minWeight: 0.2,
    maxWeight: 1.5,
    categoryName: "Puzzles",
    typicalVolume: 0.002
  },
  {
    keywords: ["jeu de société", "board game"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Jeux de société",
    typicalVolume: 0.005
  },
  {
    keywords: ["jeu de cartes", "card game"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Jeux de cartes",
    typicalVolume: 0.0005
  },
  {
    keywords: ["voiture télécommandée", "rc car"],
    minWeight: 0.3,
    maxWeight: 3.0,
    categoryName: "Voitures télécommandées",
    typicalVolume: 0.008
  },
  {
    keywords: ["drone télécommandé"],
    minWeight: 0.1,
    maxWeight: 1.0,
    categoryName: "Drones télécommandés",
    typicalVolume: 0.002
  },
  {
    keywords: ["bateau télécommandé"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Bateaux télécommandés",
    typicalVolume: 0.005
  },
  {
    keywords: ["hélicoptère télécommandé"],
    minWeight: 0.1,
    maxWeight: 1.0,
    categoryName: "Hélicoptères télécommandés",
    typicalVolume: 0.002
  },
  {
    keywords: ["jeu de construction"],
    minWeight: 0.1,
    maxWeight: 2.0,
    categoryName: "Jeux de construction",
    typicalVolume: 0.003
  },
  {
    keywords: ["maquette", "model kit"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Maquettes",
    typicalVolume: 0.002
  },
  {
    keywords: ["jeu éducatif"],
    minWeight: 0.1,
    maxWeight: 1.0,
    categoryName: "Jeux éducatifs",
    typicalVolume: 0.001
  },
  {
    keywords: ["jouet bébé", "baby toy"],
    minWeight: 0.02,
    maxWeight: 0.3,
    categoryName: "Jouets bébé",
    typicalVolume: 0.0005
  },
  {
    keywords: ["hochet", "rattle"],
    minWeight: 0.02,
    maxWeight: 0.15,
    categoryName: "Hochets",
    typicalVolume: 0.0002
  },
  {
    keywords: ["anneau de dentition", "teether"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Anneaux de dentition",
    typicalVolume: 0.0001
  },
  {
    keywords: ["biberon", "baby bottle"],
    minWeight: 0.08,
    maxWeight: 0.25,
    categoryName: "Biberons",
    typicalVolume: 0.00035
  },
  {
    keywords: ["tétine", "pacifier"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Tétines",
    typicalVolume: 0.00005
  },
  {
    keywords: ["bavoir", "bib"],
    minWeight: 0.01,
    maxWeight: 0.08,
    categoryName: "Bavoirs",
    typicalVolume: 0.0001
  },
  {
    keywords: ["couche", "diaper"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Couches",
    typicalVolume: 0.0002
  },
  {
    keywords: ["sac à langer", "diaper bag"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Sacs à langer",
    typicalVolume: 0.01
  },
  {
    keywords: ["poussette", "stroller"],
    minWeight: 6.0,
    maxWeight: 15.0,
    categoryName: "Poussettes",
    typicalVolume: 0.1
  },
  {
    keywords: ["siège auto", "car seat"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Sièges auto",
    typicalVolume: 0.05
  },
  {
    keywords: ["porte-bébé", "baby carrier"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Porte-bébés",
    typicalVolume: 0.002
  },
  {
    keywords: ["balancelle"],
    minWeight: 5.0,
    maxWeight: 12.0,
    categoryName: "Balancelles",
    typicalVolume: 0.04
  },
  {
    keywords: ["parc", "playpen"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Parcs",
    typicalVolume: 0.08
  },
  {
    keywords: ["lit bébé", "baby crib"],
    minWeight: 10.0,
    maxWeight: 30.0,
    categoryName: "Lits bébé",
    typicalVolume: 0.2
  },

  // ==========================================================================
  // 14. OUTILS & BRICOLAGE
  // ==========================================================================
  {
    keywords: ["tournevis", "screwdriver"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Tournevis",
    typicalVolume: 0.0003
  },
  {
    keywords: ["marteau", "hammer"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Marteaux",
    typicalVolume: 0.0006
  },
  {
    keywords: ["clé", "wrench"],
    minWeight: 0.1,
    maxWeight: 0.8,
    categoryName: "Clés",
    typicalVolume: 0.0003
  },
  {
    keywords: ["pince", "pliers"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Pinces",
    typicalVolume: 0.0004
  },
  {
    keywords: ["perceuse", "drill"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Perceuses",
    typicalVolume: 0.004
  },
  {
    keywords: ["visseuse"],
    minWeight: 0.8,
    maxWeight: 2.0,
    categoryName: "Visseuses",
    typicalVolume: 0.003
  },
  {
    keywords: ["scie", "saw"],
    minWeight: 0.3,
    maxWeight: 2.0,
    categoryName: "Scies",
    typicalVolume: 0.003
  },
  {
    keywords: ["scie circulaire"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Scies circulaires",
    typicalVolume: 0.008
  },
  {
    keywords: ["scie sauteuse"],
    minWeight: 1.5,
    maxWeight: 3.0,
    categoryName: "Scies sauteuses",
    typicalVolume: 0.005
  },
  {
    keywords: ["ponceuse", "sander"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Ponceuses",
    typicalVolume: 0.004
  },
  {
    keywords: ["meuleuse", "grinder"],
    minWeight: 1.5,
    maxWeight: 4.0,
    categoryName: "Meuleuses",
    typicalVolume: 0.005
  },
  {
    keywords: ["défonceuse"],
    minWeight: 2.0,
    maxWeight: 4.0,
    categoryName: "Défonceuses",
    typicalVolume: 0.006
  },
  {
    keywords: ["rabot"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Rabots",
    typicalVolume: 0.005
  },
  {
    keywords: ["niveau", "level"],
    minWeight: 0.2,
    maxWeight: 1.5,
    categoryName: "Niveaux",
    typicalVolume: 0.001
  },
  {
    keywords: ["mètre", "tape measure"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Mètres",
    typicalVolume: 0.0002
  },
  {
    keywords: ["équerre"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Équerres",
    typicalVolume: 0.0003
  },
  {
    keywords: ["règle"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Règles",
    typicalVolume: 0.0002
  },
  {
    keywords: ["cutter"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Cutters",
    typicalVolume: 0.0001
  },
  {
    keywords: ["pistolet à colle", "glue gun"],
    minWeight: 0.15,
    maxWeight: 0.5,
    categoryName: "Pistolets à colle",
    typicalVolume: 0.0006
  },
  {
    keywords: ["fer à souder", "soldering iron"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Fers à souder",
    typicalVolume: 0.0004
  },
  {
    keywords: ["station de soudage"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Stations de soudage",
    typicalVolume: 0.0015
  },
  {
    keywords: ["multimètre", "multimeter"],
    minWeight: 0.15,
    maxWeight: 0.5,
    categoryName: "Multimètres",
    typicalVolume: 0.0004
  },
  {
    keywords: ["pince ampèremétrique"],
    minWeight: 0.2,
    maxWeight: 0.6,
    categoryName: "Pinces ampèremétriques",
    typicalVolume: 0.0005
  },
  {
    keywords: ["testeur"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Testeurs",
    typicalVolume: 0.0003
  },
  {
    keywords: ["échafaudage"],
    minWeight: 20.0,
    maxWeight: 100.0,
    categoryName: "Échafaudages",
    typicalVolume: 0.5
  },
  {
    keywords: ["échelle", "ladder"],
    minWeight: 3.0,
    maxWeight: 15.0,
    categoryName: "Échelles",
    typicalVolume: 0.05
  },
  {
    keywords: ["escabeau"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Escabeaux",
    typicalVolume: 0.02
  },
  {
    keywords: ["brouette"],
    minWeight: 8.0,
    maxWeight: 20.0,
    categoryName: "Brouettes",
    typicalVolume: 0.1
  },
  {
    keywords: ["pelle"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Pelles",
    typicalVolume: 0.005
  },
  {
    keywords: ["pioche"],
    minWeight: 2.0,
    maxWeight: 4.0,
    categoryName: "Pioches",
    typicalVolume: 0.006
  },
  {
    keywords: ["râteau"],
    minWeight: 1.0,
    maxWeight: 2.5,
    categoryName: "Râteaux",
    typicalVolume: 0.004
  },
  {
    keywords: ["sécateur"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Sécateurs",
    typicalVolume: 0.0005
  },
  {
    keywords: ["tondeuse à gazon"],
    minWeight: 10.0,
    maxWeight: 30.0,
    categoryName: "Tondeuses à gazon",
    typicalVolume: 0.08
  },
  {
    keywords: ["taille-haie"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Taille-haies",
    typicalVolume: 0.01
  },
  {
    keywords: ["tronçonneuse", "chainsaw"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Tronçonneuses",
    typicalVolume: 0.015
  },
  {
    keywords: ["débroussailleuse"],
    minWeight: 4.0,
    maxWeight: 8.0,
    categoryName: "Débroussailleuses",
    typicalVolume: 0.02
  },
  {
    keywords: ["souffleur", "leaf blower"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Souffleurs",
    typicalVolume: 0.01
  },
  {
    keywords: ["coupe-bordure"],
    minWeight: 2.0,
    maxWeight: 4.0,
    categoryName: "Coupe-bordures",
    typicalVolume: 0.008
  },

  // ==========================================================================
  // 15. ÉQUIPEMENTS INDUSTRIELS & MACHINES
  // ==========================================================================
  {
    keywords: ["moteur", "motor"],
    minWeight: 1.0,
    maxWeight: 200.0,
    categoryName: "Moteurs",
    typicalVolume: 0.05
  },
  {
    keywords: ["pompe", "pump"],
    minWeight: 1.0,
    maxWeight: 100.0,
    categoryName: "Pompes",
    typicalVolume: 0.03
  },
  {
    keywords: ["compresseur", "compressor"],
    minWeight: 5.0,
    maxWeight: 200.0,
    categoryName: "Compresseurs",
    typicalVolume: 0.1
  },
  {
    keywords: ["générateur", "generator"],
    minWeight: 10.0,
    maxWeight: 500.0,
    categoryName: "Générateurs",
    typicalVolume: 0.2
  },
  {
    keywords: ["transformateur", "transformer"],
    minWeight: 2.0,
    maxWeight: 100.0,
    categoryName: "Transformateurs",
    typicalVolume: 0.05
  },
  {
    keywords: ["moteur électrique"],
    minWeight: 1.0,
    maxWeight: 200.0,
    categoryName: "Moteurs électriques",
    typicalVolume: 0.05
  },
  {
    keywords: ["moteur thermique"],
    minWeight: 5.0,
    maxWeight: 300.0,
    categoryName: "Moteurs thermiques",
    typicalVolume: 0.1
  },
  {
    keywords: ["réducteur"],
    minWeight: 2.0,
    maxWeight: 100.0,
    categoryName: "Réducteurs",
    typicalVolume: 0.03
  },
  {
    keywords: ["variateu", "variator"],
    minWeight: 1.0,
    maxWeight: 50.0,
    categoryName: "Variateur",
    typicalVolume: 0.02
  },
  {
    keywords: ["onduleur", "inverter"],
    minWeight: 1.0,
    maxWeight: 50.0,
    categoryName: "Onduleurs",
    typicalVolume: 0.02
  },
  {
    keywords: ["chargeur industriel"],
    minWeight: 1.0,
    maxWeight: 30.0,
    categoryName: "Chargeurs industriels",
    typicalVolume: 0.01
  },
  {
    keywords: ["batterie industrielle"],
    minWeight: 5.0,
    maxWeight: 200.0,
    categoryName: "Batteries industrielles",
    typicalVolume: 0.05
  },
  {
    keywords: ["presse hydraulique"],
    minWeight: 50.0,
    maxWeight: 1000.0,
    categoryName: "Presses hydrauliques",
    typicalVolume: 0.5
  },
  {
    keywords: ["presse mécanique"],
    minWeight: 30.0,
    maxWeight: 800.0,
    categoryName: "Presses mécaniques",
    typicalVolume: 0.4
  },
  {
    keywords: ["cisaille"],
    minWeight: 20.0,
    maxWeight: 500.0,
    categoryName: "Cisailles",
    typicalVolume: 0.3
  },
  {
    keywords: ["plieuse"],
    minWeight: 30.0,
    maxWeight: 800.0,
    categoryName: "Plieuses",
    typicalVolume: 0.5
  },
  {
    keywords: ["rouleuse"],
    minWeight: 40.0,
    maxWeight: 1000.0,
    categoryName: "Rouleuses",
    typicalVolume: 0.6
  },
  {
    keywords: ["perceuse à colonne"],
    minWeight: 20.0,
    maxWeight: 200.0,
    categoryName: "Perceuses à colonne",
    typicalVolume: 0.1
  },
  {
    keywords: ["fraiseuse", "milling machine"],
    minWeight: 50.0,
    maxWeight: 1000.0,
    categoryName: "Fraiseuses",
    typicalVolume: 0.3
  },
  {
    keywords: ["tour", "lathe"],
    minWeight: 50.0,
    maxWeight: 1500.0,
    categoryName: "Tours",
    typicalVolume: 0.5
  },
  {
    keywords: ["rectifieuse"],
    minWeight: 30.0,
    maxWeight: 800.0,
    categoryName: "Rectifieuses",
    typicalVolume: 0.2
  },
  {
    keywords: ["scie à ruban"],
    minWeight: 30.0,
    maxWeight: 400.0,
    categoryName: "Scies à ruban",
    typicalVolume: 0.2
  },
  {
    keywords: ["scie circulaire industrielle"],
    minWeight: 20.0,
    maxWeight: 300.0,
    categoryName: "Scies circulaires industrielles",
    typicalVolume: 0.15
  },
  {
    keywords: ["ponceuse industrielle"],
    minWeight: 10.0,
    maxWeight: 100.0,
    categoryName: "Ponceuses industrielles",
    typicalVolume: 0.05
  },
  {
    keywords: ["sableuse"],
    minWeight: 10.0,
    maxWeight: 200.0,
    categoryName: "Sableuses",
    typicalVolume: 0.1
  },
  {
    keywords: ["poste à souder", "welder"],
    minWeight: 5.0,
    maxWeight: 50.0,
    categoryName: "Postes à souder",
    typicalVolume: 0.02
  },
  {
    keywords: ["chalumeau"],
    minWeight: 1.0,
    maxWeight: 10.0,
    categoryName: "Chalumeaux",
    typicalVolume: 0.005
  },
  {
    keywords: ["compresseur industriel"],
    minWeight: 50.0,
    maxWeight: 500.0,
    categoryName: "Compresseurs industriels",
    typicalVolume: 0.3
  },
  {
    keywords: ["séchoir industriel"],
    minWeight: 30.0,
    maxWeight: 300.0,
    categoryName: "Séchoirs industriels",
    typicalVolume: 0.2
  },
  {
    keywords: ["four industriel"],
    minWeight: 50.0,
    maxWeight: 1000.0,
    categoryName: "Fours industriels",
    typicalVolume: 0.5
  },
  {
    keywords: ["étuve"],
    minWeight: 20.0,
    maxWeight: 200.0,
    categoryName: "Étuves",
    typicalVolume: 0.15
  },
  {
    keywords: ["autoclave"],
    minWeight: 30.0,
    maxWeight: 500.0,
    categoryName: "Autoclaves",
    typicalVolume: 0.25
  },
  {
    keywords: ["stérilisateur"],
    minWeight: 10.0,
    maxWeight: 100.0,
    categoryName: "Stérilisateurs",
    typicalVolume: 0.05
  },
  {
    keywords: ["centrifugeuse industrielle"],
    minWeight: 20.0,
    maxWeight: 300.0,
    categoryName: "Centrifugeuses industrielles",
    typicalVolume: 0.15
  },
  {
    keywords: ["malaxeur"],
    minWeight: 20.0,
    maxWeight: 500.0,
    categoryName: "Malaxeurs",
    typicalVolume: 0.2
  },
  {
    keywords: ["mélangeur industriel"],
    minWeight: 15.0,
    maxWeight: 400.0,
    categoryName: "Mélangeurs industriels",
    typicalVolume: 0.18
  },
  {
    keywords: ["broyeur"],
    minWeight: 20.0,
    maxWeight: 600.0,
    categoryName: "Broyeurs",
    typicalVolume: 0.25
  },
  {
    keywords: ["concasseur"],
    minWeight: 100.0,
    maxWeight: 5000.0,
    categoryName: "Concasseurs",
    typicalVolume: 2.0
  },
  {
    keywords: ["crible"],
    minWeight: 50.0,
    maxWeight: 1000.0,
    categoryName: "Cribles",
    typicalVolume: 0.5
  },
  {
    keywords: ["tamis"],
    minWeight: 5.0,
    maxWeight: 50.0,
    categoryName: "Tamiseurs",
    typicalVolume: 0.03
  },
  {
    keywords: ["convoyeur"],
    minWeight: 20.0,
    maxWeight: 500.0,
    categoryName: "Convoyeurs",
    typicalVolume: 0.3
  },
  {
    keywords: ["élévateur"],
    minWeight: 30.0,
    maxWeight: 800.0,
    categoryName: "Élévateurs",
    typicalVolume: 0.4
  },
  {
    keywords: ["transpalette"],
    minWeight: 20.0,
    maxWeight: 80.0,
    categoryName: "Transpalettes",
    typicalVolume: 0.1
  },
  {
    keywords: ["chariot élévateur"],
    minWeight: 500.0,
    maxWeight: 3000.0,
    categoryName: "Chariots élévateurs",
    typicalVolume: 2.0
  },
  {
    keywords: ["gerbeur"],
    minWeight: 100.0,
    maxWeight: 500.0,
    categoryName: "Gerbeurs",
    typicalVolume: 0.5
  },
  {
    keywords: ["palette"],
    minWeight: 10.0,
    maxWeight: 30.0,
    categoryName: "Palettes",
    typicalVolume: 0.1
  },
  {
    keywords: ["conteneur"],
    minWeight: 2000.0,
    maxWeight: 4000.0,
    categoryName: "Conteneurs",
    typicalVolume: 30.0
  },

  // ==========================================================================
  // 16. AUTO-MOTO & VÉHICULES
  // ==========================================================================
  {
    keywords: ["pneu", "tire"],
    minWeight: 6.0,
    maxWeight: 15.0,
    categoryName: "Pneus",
    typicalVolume: 0.05
  },
  {
    keywords: ["jante", "wheel"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Jantes",
    typicalVolume: 0.03
  },
  {
    keywords: ["batterie auto", "car battery"],
    minWeight: 10.0,
    maxWeight: 20.0,
    categoryName: "Batteries auto",
    typicalVolume: 0.02
  },
  {
    keywords: ["pare-chocs", "bumper"],
    minWeight: 3.0,
    maxWeight: 10.0,
    categoryName: "Pare-chocs",
    typicalVolume: 0.02
  },
  {
    keywords: ["rétroviseur", "mirror"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Rétroviseurs",
    typicalVolume: 0.003
  },
  {
    keywords: ["phare", "headlight"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Phares",
    typicalVolume: 0.005
  },
  {
    keywords: ["feu arrière", "taillight"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Feux arrière",
    typicalVolume: 0.003
  },
  {
    keywords: ["siège auto", "car seat"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Sièges auto",
    typicalVolume: 0.05
  },
  {
    keywords: ["housse de siège", "seat cover"],
    minWeight: 0.8,
    maxWeight: 2.5,
    categoryName: "Housses de siège",
    typicalVolume: 0.006
  },
  {
    keywords: ["tapis de sol", "car mat"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Tapis de sol",
    typicalVolume: 0.006
  },
  {
    keywords: ["volant", "steering wheel"],
    minWeight: 1.5,
    maxWeight: 3.0,
    categoryName: "Volants",
    typicalVolume: 0.004
  },
  {
    keywords: ["housse de volant"],
    minWeight: 0.2,
    maxWeight: 0.5,
    categoryName: "Housses de volant",
    typicalVolume: 0.0005
  },
  {
    keywords: ["levier de vitesse"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Levier de vitesse",
    typicalVolume: 0.0008
  },
  {
    keywords: ["pédalier"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Pédaliers",
    typicalVolume: 0.002
  },
  {
    keywords: ["pot d'échappement", "exhaust"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Pots d'échappement",
    typicalVolume: 0.03
  },
  {
    keywords: ["silencieux"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Silencieux",
    typicalVolume: 0.02
  },
  {
    keywords: ["filtre à air"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Filtres à air",
    typicalVolume: 0.001
  },
  {
    keywords: ["filtre à huile"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Filtres à huile",
    typicalVolume: 0.0005
  },
  {
    keywords: ["filtre à carburant"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Filtres à carburant",
    typicalVolume: 0.0006
  },
  {
    keywords: ["bougie d'allumage"],
    minWeight: 0.05,
    maxWeight: 0.1,
    categoryName: "Bougies d'allumage",
    typicalVolume: 0.0001
  },
  {
    keywords: ["plaquette de frein"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Plaquettes de frein",
    typicalVolume: 0.0008
  },
  {
    keywords: ["disque de frein"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Disques de frein",
    typicalVolume: 0.005
  },
  {
    keywords: ["amortisseur", "shock absorber"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Amortisseurs",
    typicalVolume: 0.008
  },
  {
    keywords: ["ressort"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Ressorts",
    typicalVolume: 0.004
  },
  {
    keywords: ["triangle de suspension"],
    minWeight: 2.0,
    maxWeight: 6.0,
    categoryName: "Triangles de suspension",
    typicalVolume: 0.007
  },
  {
    keywords: ["rotule"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Rotules",
    typicalVolume: 0.0005
  },
  {
    keywords: ["cardan"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Cardans",
    typicalVolume: 0.01
  },
  {
    keywords: ["arbre de transmission"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Arbres de transmission",
    typicalVolume: 0.02
  },
  {
    keywords: ["radiateur", "radiator"],
    minWeight: 2.0,
    maxWeight: 6.0,
    categoryName: "Radiateurs",
    typicalVolume: 0.01
  },
  {
    keywords: ["ventilateur"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Ventilateurs",
    typicalVolume: 0.005
  },
  {
    keywords: ["moteur auto"],
    minWeight: 80.0,
    maxWeight: 200.0,
    categoryName: "Moteurs auto",
    typicalVolume: 0.3
  },
  {
    keywords: ["boîte de vitesses"],
    minWeight: 30.0,
    maxWeight: 80.0,
    categoryName: "Boîtes de vitesses",
    typicalVolume: 0.15
  },
  {
    keywords: ["embrayage"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Embrayages",
    typicalVolume: 0.02
  },
  {
    keywords: ["differential"],
    minWeight: 20.0,
    maxWeight: 50.0,
    categoryName: "Différentiels",
    typicalVolume: 0.08
  },
  {
    keywords: ["pont"],
    minWeight: 40.0,
    maxWeight: 100.0,
    categoryName: "Ponts",
    typicalVolume: 0.2
  },
  {
    keywords: ["alternateur"],
    minWeight: 3.0,
    maxWeight: 8.0,
    categoryName: "Alternateurs",
    typicalVolume: 0.01
  },
  {
    keywords: ["démarreur"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Démarreurs",
    typicalVolume: 0.008
  },
  {
    keywords: ["courroie"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Courroies",
    typicalVolume: 0.0003
  },
  {
    keywords: ["chaîne"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Chaînes",
    typicalVolume: 0.001
  },
  {
    keywords: ["casque moto", "motorcycle helmet"],
    minWeight: 1.0,
    maxWeight: 2.0,
    categoryName: "Casques moto",
    typicalVolume: 0.01
  },
  {
    keywords: ["blouson moto"],
    minWeight: 1.5,
    maxWeight: 4.0,
    categoryName: "Blousons moto",
    typicalVolume: 0.01
  },
  {
    keywords: ["pantalon moto"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Pantalons moto",
    typicalVolume: 0.008
  },
  {
    keywords: ["bottes moto"],
    minWeight: 1.5,
    maxWeight: 3.0,
    categoryName: "Bottes moto",
    typicalVolume: 0.006
  },
  {
    keywords: ["gants moto"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Gants moto",
    typicalVolume: 0.0006
  },

  // ==========================================================================
  // 17. BUREAU & PAPETERIE
  // ==========================================================================
  {
    keywords: ["stylo", "pen"],
    minWeight: 0.005,
    maxWeight: 0.03,
    categoryName: "Stylos",
    typicalVolume: 0.00002
  },
  {
    keywords: ["crayon", "pencil"],
    minWeight: 0.005,
    maxWeight: 0.02,
    categoryName: "Crayons",
    typicalVolume: 0.00001
  },
  {
    keywords: ["marqueur", "marker"],
    minWeight: 0.01,
    maxWeight: 0.03,
    categoryName: "Marqueurs",
    typicalVolume: 0.00004
  },
  {
    keywords: ["surligneur", "highlighter"],
    minWeight: 0.01,
    maxWeight: 0.03,
    categoryName: "Surligneurs",
    typicalVolume: 0.00004
  },
  {
    keywords: ["gomme", "eraser"],
    minWeight: 0.005,
    maxWeight: 0.02,
    categoryName: "Gommes",
    typicalVolume: 0.00002
  },
  {
    keywords: ["taille-crayon", "sharpener"],
    minWeight: 0.005,
    maxWeight: 0.03,
    categoryName: "Taille-crayons",
    typicalVolume: 0.00003
  },
  {
    keywords: ["règle", "ruler"],
    minWeight: 0.01,
    maxWeight: 0.1,
    categoryName: "Règles",
    typicalVolume: 0.0001
  },
  {
    keywords: ["cahier", "notebook"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Cahiers",
    typicalVolume: 0.0006
  },
  {
    keywords: ["carnet"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Carnets",
    typicalVolume: 0.0005
  },
  {
    keywords: ["agenda", "planner"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Agendas",
    typicalVolume: 0.001
  },
  {
    keywords: ["classeur", "binder"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Classeurs",
    typicalVolume: 0.002
  },
  {
    keywords: ["chemise", "folder"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Chemises",
    typicalVolume: 0.0004
  },
  {
    keywords: ["intercalaire"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Intercalaires",
    typicalVolume: 0.0002
  },
  {
    keywords: ["protège-cahier"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Protège-cahiers",
    typicalVolume: 0.0003
  },
  {
    keywords: ["agrafeuse", "stapler"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Agrafeuses",
    typicalVolume: 0.0004
  },
  {
    keywords: ["perforatrice", "hole punch"],
    minWeight: 0.1,
    maxWeight: 0.4,
    categoryName: "Perforatrices",
    typicalVolume: 0.0004
  },
  {
    keywords: ["ciseaux", "scissors"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Ciseaux",
    typicalVolume: 0.0002
  },
  {
    keywords: ["cutteur"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Cutters",
    typicalVolume: 0.00015
  },
  {
    keywords: ["colle", "glue"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Colles",
    typicalVolume: 0.0002
  },
  {
    keywords: ["ruban adhésif", "tape"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Rubans adhésifs",
    typicalVolume: 0.0002
  },
  {
    keywords: ["trombone", "paper clip"],
    minWeight: 0.001,
    maxWeight: 0.01,
    categoryName: "Trombones",
    typicalVolume: 0.00001
  },
  {
    keywords: ["punaise"],
    minWeight: 0.001,
    maxWeight: 0.01,
    categoryName: "Punaises",
    typicalVolume: 0.00001
  },
  {
    keywords: ["calculatrice", "calculator"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Calculatrices",
    typicalVolume: 0.0003
  },
  {
    keywords: ["correcteur", "correction fluid"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Correcteurs",
    typicalVolume: 0.00005
  },
  {
    keywords: ["post-it"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Post-it",
    typicalVolume: 0.0001
  },
  {
    keywords: ["enveloppe", "envelope"],
    minWeight: 0.005,
    maxWeight: 0.05,
    categoryName: "Enveloppes",
    typicalVolume: 0.0001
  },
  {
    keywords: ["papier", "paper"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Papier",
    typicalVolume: 0.004
  },
  {
    keywords: ["ramette"],
    minWeight: 2.0,
    maxWeight: 3.0,
    categoryName: "Ramettes",
    typicalVolume: 0.003
  },
  {
    keywords: ["tableau blanc", "whiteboard"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Tableaux blancs",
    typicalVolume: 0.015
  },
  {
    keywords: ["tableau d'affichage"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Tableaux d'affichage",
    typicalVolume: 0.012
  },
  {
    keywords: ["chevalet", "easel"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Chevalets",
    typicalVolume: 0.02
  },
  {
    keywords: ["pupitre"],
    minWeight: 2.0,
    maxWeight: 6.0,
    categoryName: "Pupitres",
    typicalVolume: 0.015
  },
  {
    keywords: ["corbeille", "waste basket"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Corbeilles",
    typicalVolume: 0.005
  },
  {
    keywords: ["classeur à levier"],
    minWeight: 0.3,
    maxWeight: 1.0,
    categoryName: "Classeurs à levier",
    typicalVolume: 0.002
  },

  // ==========================================================================
  // 18. ANIMAUX & ACCESSOIRES
  // ==========================================================================
  {
    keywords: ["nourriture chien", "dog food"],
    minWeight: 0.5,
    maxWeight: 15.0,
    categoryName: "Nourriture chien",
    typicalVolume: 0.005
  },
  {
    keywords: ["nourriture chat", "cat food"],
    minWeight: 0.5,
    maxWeight: 10.0,
    categoryName: "Nourriture chat",
    typicalVolume: 0.004
  },
  {
    keywords: ["friandise", "treat"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Friandises",
    typicalVolume: 0.0003
  },
  {
    keywords: ["gamelle", "pet bowl"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Gamelles",
    typicalVolume: 0.0006
  },
  {
    keywords: ["distributeur", "feeder"],
    minWeight: 0.3,
    maxWeight: 2.0,
    categoryName: "Distributeurs",
    typicalVolume: 0.002
  },
  {
    keywords: ["fontaine à eau"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Fontaines à eau",
    typicalVolume: 0.003
  },
  {
    keywords: ["panier chien", "dog bed"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Paniers chien",
    typicalVolume: 0.025
  },
  {
    keywords: ["panier chat", "cat bed"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Paniers chat",
    typicalVolume: 0.015
  },
  {
    keywords: ["couverture animal"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Couvertures animal",
    typicalVolume: 0.004
  },
  {
    keywords: ["collier chien", "dog collar"],
    minWeight: 0.03,
    maxWeight: 0.2,
    categoryName: "Colliers chien",
    typicalVolume: 0.0001
  },
  {
    keywords: ["collier chat", "cat collar"],
    minWeight: 0.01,
    maxWeight: 0.05,
    categoryName: "Colliers chat",
    typicalVolume: 0.00005
  },
  {
    keywords: ["laisse", "leash"],
    minWeight: 0.05,
    maxWeight: 0.3,
    categoryName: "Laisses",
    typicalVolume: 0.0003
  },
  {
    keywords: ["harnais", "harness"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Harnais",
    typicalVolume: 0.0005
  },
  {
    keywords: ["muselière"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Muselières",
    typicalVolume: 0.0002
  },
  {
    keywords: ["cage de transport", "pet carrier"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Cages de transport",
    typicalVolume: 0.04
  },
  {
    keywords: ["cage chien"],
    minWeight: 2.0,
    maxWeight: 10.0,
    categoryName: "Cages chien",
    typicalVolume: 0.08
  },
  {
    keywords: ["cage chat"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Cages chat",
    typicalVolume: 0.03
  },
  {
    keywords: ["jouet chien", "dog toy"],
    minWeight: 0.02,
    maxWeight: 0.3,
    categoryName: "Jouets chien",
    typicalVolume: 0.0004
  },
  {
    keywords: ["jouet chat", "cat toy"],
    minWeight: 0.01,
    maxWeight: 0.2,
    categoryName: "Jouets chat",
    typicalVolume: 0.0003
  },
  {
    keywords: ["os", "bone"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Os",
    typicalVolume: 0.0005
  },
  {
    keywords: ["balle"],
    minWeight: 0.02,
    maxWeight: 0.2,
    categoryName: "Balles",
    typicalVolume: 0.0002
  },
  {
    keywords: ["frisbee"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Frisbees",
    typicalVolume: 0.0005
  },
  {
    keywords: ["arbre à chat", "cat tree"],
    minWeight: 5.0,
    maxWeight: 25.0,
    categoryName: "Arbres à chat",
    typicalVolume: 0.15
  },
  {
    keywords: ["griffoir"],
    minWeight: 1.0,
    maxWeight: 5.0,
    categoryName: "Griffoirs",
    typicalVolume: 0.01
  },
  {
    keywords: ["tunnel"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Tunnels",
    typicalVolume: 0.008
  },
  {
    keywords: ["litière", "cat litter"],
    minWeight: 2.0,
    maxWeight: 15.0,
    categoryName: "Litières",
    typicalVolume: 0.008
  },
  {
    keywords: ["bac à litière", "litter box"],
    minWeight: 1.0,
    maxWeight: 4.0,
    categoryName: "Bacs à litière",
    typicalVolume: 0.01
  },
  {
    keywords: ["pelle à litière"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Pelles à litière",
    typicalVolume: 0.0003
  },
  {
    keywords: ["aquarium"],
    minWeight: 2.0,
    maxWeight: 30.0,
    categoryName: "Aquariums",
    typicalVolume: 0.05
  },
  {
    keywords: ["filtre aquarium"],
    minWeight: 0.3,
    maxWeight: 2.0,
    categoryName: "Filtres aquarium",
    typicalVolume: 0.0015
  },
  {
    keywords: ["pompe aquarium"],
    minWeight: 0.2,
    maxWeight: 1.5,
    categoryName: "Pompes aquarium",
    typicalVolume: 0.001
  },
  {
    keywords: ["chauffage aquarium"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Chauffages aquarium",
    typicalVolume: 0.0005
  },
  {
    keywords: ["éclairage aquarium"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Éclairages aquarium",
    typicalVolume: 0.001
  },
  {
    keywords: ["nourriture poisson", "fish food"],
    minWeight: 0.05,
    maxWeight: 0.5,
    categoryName: "Nourriture poisson",
    typicalVolume: 0.0003
  },
  {
    keywords: ["cage oiseau", "bird cage"],
    minWeight: 1.0,
    maxWeight: 8.0,
    categoryName: "Cages oiseau",
    typicalVolume: 0.06
  },
  {
    keywords: ["perchoir"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Perchoirs",
    typicalVolume: 0.0008
  },
  {
    keywords: ["nourriture oiseau"],
    minWeight: 0.2,
    maxWeight: 2.0,
    categoryName: "Nourriture oiseau",
    typicalVolume: 0.001
  },
  {
    keywords: ["cage rongeur"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Cages rongeur",
    typicalVolume: 0.02
  },
  {
    keywords: ["cage hamster"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Cages hamster",
    typicalVolume: 0.015
  },
  {
    keywords: ["cage lapin"],
    minWeight: 2.0,
    maxWeight: 8.0,
    categoryName: "Cages lapin",
    typicalVolume: 0.04
  },
  {
    keywords: ["litière rongeur"],
    minWeight: 0.5,
    maxWeight: 3.0,
    categoryName: "Litières rongeur",
    typicalVolume: 0.002
  },
  {
    keywords: ["roue", "wheel"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Roues",
    typicalVolume: 0.0008
  },
  {
    keywords: ["terrarium"],
    minWeight: 2.0,
    maxWeight: 15.0,
    categoryName: "Terrariums",
    typicalVolume: 0.03
  },
  {
    keywords: ["lampe chauffante"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Lampes chauffantes",
    typicalVolume: 0.0008
  },

  // ==========================================================================
  // 19. MUSIQUE & INSTRUMENTS
  // ==========================================================================
  {
    keywords: ["guitare", "guitar"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Guitares",
    typicalVolume: 0.08
  },
  {
    keywords: ["guitare acoustique"],
    minWeight: 1.5,
    maxWeight: 4.0,
    categoryName: "Guitares acoustiques",
    typicalVolume: 0.07
  },
  {
    keywords: ["guitare électrique"],
    minWeight: 2.5,
    maxWeight: 5.0,
    categoryName: "Guitares électriques",
    typicalVolume: 0.08
  },
  {
    keywords: ["guitare basse", "bass guitar"],
    minWeight: 3.0,
    maxWeight: 6.0,
    categoryName: "Guitares basses",
    typicalVolume: 0.09
  },
  {
    keywords: ["ukulélé", "ukulele"],
    minWeight: 0.4,
    maxWeight: 0.8,
    categoryName: "Ukulélés",
    typicalVolume: 0.015
  },
  {
    keywords: ["violon", "violin"],
    minWeight: 0.4,
    maxWeight: 0.6,
    categoryName: "Violons",
    typicalVolume: 0.015
  },
  {
    keywords: ["alto", "viola"],
    minWeight: 0.5,
    maxWeight: 0.8,
    categoryName: "Altos",
    typicalVolume: 0.02
  },
  {
    keywords: ["violoncelle", "cello"],
    minWeight: 2.0,
    maxWeight: 4.0,
    categoryName: "Violoncelles",
    typicalVolume: 0.08
  },
  {
    keywords: ["contrebasse", "double bass"],
    minWeight: 5.0,
    maxWeight: 10.0,
    categoryName: "Contrebasses",
    typicalVolume: 0.2
  },
  {
    keywords: ["piano"],
    minWeight: 100.0,
    maxWeight: 500.0,
    categoryName: "Pianos",
    typicalVolume: 1.0
  },
  {
    keywords: ["piano numérique"],
    minWeight: 5.0,
    maxWeight: 25.0,
    categoryName: "Pianos numériques",
    typicalVolume: 0.1
  },
  {
    keywords: ["synthétiseur", "synthesizer"],
    minWeight: 2.0,
    maxWeight: 10.0,
    categoryName: "Synthétiseurs",
    typicalVolume: 0.03
  },
  {
    keywords: ["clavier", "keyboard"],
    minWeight: 3.0,
    maxWeight: 15.0,
    categoryName: "Claviers",
    typicalVolume: 0.05
  },
  {
    keywords: ["batterie", "drum"],
    minWeight: 10.0,
    maxWeight: 40.0,
    categoryName: "Batteries",
    typicalVolume: 0.2
  },
  {
    keywords: ["caisse claire", "snare"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Caisses claires",
    typicalVolume: 0.02
  },
  {
    keywords: ["grosse caisse"],
    minWeight: 5.0,
    maxWeight: 10.0,
    categoryName: "Grosses caisses",
    typicalVolume: 0.05
  },
  {
    keywords: ["tom"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Toms",
    typicalVolume: 0.02
  },
  {
    keywords: ["cymbale", "cymbal"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Cymbales",
    typicalVolume: 0.008
  },
  {
    keywords: ["baguette", "drum stick"],
    minWeight: 0.05,
    maxWeight: 0.15,
    categoryName: "Baguettes",
    typicalVolume: 0.0003
  },
  {
    keywords: ["trompette", "trumpet"],
    minWeight: 1.0,
    maxWeight: 2.0,
    categoryName: "Trompettes",
    typicalVolume: 0.008
  },
  {
    keywords: ["trombone", "trombone"],
    minWeight: 1.5,
    maxWeight: 3.0,
    categoryName: "Trombones",
    typicalVolume: 0.012
  },
  {
    keywords: ["cor", "french horn"],
    minWeight: 2.0,
    maxWeight: 4.0,
    categoryName: "Cors",
    typicalVolume: 0.02
  },
  {
    keywords: ["tuba"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Tubas",
    typicalVolume: 0.08
  },
  {
    keywords: ["saxophone", "sax"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Saxophones",
    typicalVolume: 0.02
  },
  {
    keywords: ["clarinette", "clarinet"],
    minWeight: 0.5,
    maxWeight: 1.0,
    categoryName: "Clarinettes",
    typicalVolume: 0.005
  },
  {
    keywords: ["flûte", "flute"],
    minWeight: 0.3,
    maxWeight: 0.6,
    categoryName: "Flûtes",
    typicalVolume: 0.002
  },
  {
    keywords: ["flûte à bec", "recorder"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Flûtes à bec",
    typicalVolume: 0.001
  },
  {
    keywords: ["harmonica"],
    minWeight: 0.05,
    maxWeight: 0.2,
    categoryName: "Harmonicas",
    typicalVolume: 0.0004
  },
  {
    keywords: ["accordéon", "accordion"],
    minWeight: 5.0,
    maxWeight: 15.0,
    categoryName: "Accordéons",
    typicalVolume: 0.08
  },
  {
    keywords: ["microphone"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Microphones",
    typicalVolume: 0.0005
  },
  {
    keywords: ["pied de micro", "mic stand"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Pieds de micro",
    typicalVolume: 0.01
  },
  {
    keywords: ["support guitare", "guitar stand"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Supports guitare",
    typicalVolume: 0.005
  },
  {
    keywords: ["étui guitare", "guitar case"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Étuis guitare",
    typicalVolume: 0.02
  },
  {
    keywords: ["sangle guitare"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Sangles guitare",
    typicalVolume: 0.0005
  },
  {
    keywords: ["corde guitare", "guitar string"],
    minWeight: 0.05,
    maxWeight: 0.15,
    categoryName: "Cordes guitare",
    typicalVolume: 0.0001
  },
  {
    keywords: ["médiator", "guitar pick"],
    minWeight: 0.001,
    maxWeight: 0.005,
    categoryName: "Médiators",
    typicalVolume: 0.000002
  },
  {
    keywords: ["capodastre", "capo"],
    minWeight: 0.02,
    maxWeight: 0.08,
    categoryName: "Capodastres",
    typicalVolume: 0.0001
  },
  {
    keywords: ["accordeur", "tuner"],
    minWeight: 0.02,
    maxWeight: 0.1,
    categoryName: "Accordeurs",
    typicalVolume: 0.0001
  },
  {
    keywords: ["métronome"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Métronomes",
    typicalVolume: 0.0004
  },
  {
    keywords: ["pupitre", "music stand"],
    minWeight: 0.8,
    maxWeight: 2.5,
    categoryName: "Pupitres",
    typicalVolume: 0.006
  },

  // ==========================================================================
  // 20. LIVRES & MÉDIAS
  // ==========================================================================
  {
    keywords: ["livre", "book"],
    minWeight: 0.15,
    maxWeight: 1.5,
    categoryName: "Livres",
    typicalVolume: 0.001
  },
  {
    keywords: ["poche", "paperback"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Livres de poche",
    typicalVolume: 0.0005
  },
  {
    keywords: ["broché"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Livres brochés",
    typicalVolume: 0.0008
  },
  {
    keywords: ["relié", "hardcover"],
    minWeight: 0.3,
    maxWeight: 1.5,
    categoryName: "Livres reliés",
    typicalVolume: 0.0012
  },
  {
    keywords: ["magazine"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Magazines",
    typicalVolume: 0.0004
  },
  {
    keywords: ["bande dessinée", "comic"],
    minWeight: 0.1,
    maxWeight: 0.25,
    categoryName: "BD",
    typicalVolume: 0.00035
  },
  {
    keywords: ["manga"],
    minWeight: 0.1,
    maxWeight: 0.3,
    categoryName: "Mangas",
    typicalVolume: 0.0004
  },
  {
    keywords: ["dvd"],
    minWeight: 0.08,
    maxWeight: 0.15,
    categoryName: "DVD",
    typicalVolume: 0.0002
  },
  {
    keywords: ["blu-ray"],
    minWeight: 0.08,
    maxWeight: 0.15,
    categoryName: "Blu-ray",
    typicalVolume: 0.0002
  },
  {
    keywords: ["cd"],
    minWeight: 0.05,
    maxWeight: 0.1,
    categoryName: "CD",
    typicalVolume: 0.00015
  },
  {
    keywords: ["vinyle", "vinyl"],
    minWeight: 0.15,
    maxWeight: 0.25,
    categoryName: "Vinyles",
    typicalVolume: 0.0015
  },
  {
    keywords: ["jeu vidéo", "video game"],
    minWeight: 0.05,
    maxWeight: 0.15,
    categoryName: "Jeux vidéo",
    typicalVolume: 0.0002
  },

  // ==========================================================================
  // 21. ALIMENTATION & ÉPICERIE
  // ==========================================================================
  {
    keywords: ["conserves"],
    minWeight: 0.2,
    maxWeight: 1.0,
    categoryName: "Conserves",
    typicalVolume: 0.0005
  },
  {
    keywords: ["boîte de conserve"],
    minWeight: 0.2,
    maxWeight: 0.8,
    categoryName: "Boîtes de conserve",
    typicalVolume: 0.0004
  },
  {
    keywords: ["bouteille", "bottle"],
    minWeight: 0.5,
    maxWeight: 1.5,
    categoryName: "Bouteilles",
    typicalVolume: 0.001
  },
  {
    keywords: ["bouteille verre"],
    minWeight: 0.5,
    maxWeight: 1.2,
    categoryName: "Bouteilles verre",
    typicalVolume: 0.0008
  },
  {
    keywords: ["bouteille plastique"],
    minWeight: 0.1,
    maxWeight: 0.5,
    categoryName: "Bouteilles plastique",
    typicalVolume: 0.0006
  },
  {
    keywords: ["canette", "can"],
    minWeight: 0.2,
    maxWeight: 0.4,
    categoryName: "Canettes",
    typicalVolume: 0.0003
  },
  {
    keywords: ["pack de boissons"],
    minWeight: 2.0,
    maxWeight: 5.0,
    categoryName: "Packs de boissons",
    typicalVolume: 0.005
  },
  {
    keywords: ["caisse"],
    minWeight: 1.0,
    maxWeight: 3.0,
    categoryName: "Caisses",
    typicalVolume: 0.004
  },
  {
    keywords: ["carton"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Cartons",
    typicalVolume: 0.003
  },
  {
    keywords: ["cagette"],
    minWeight: 0.5,
    maxWeight: 2.0,
    categoryName: "Cagettes",
    typicalVolume: 0.003
  },

  // ==========================================================================
  // CATÉGORIE PAR DÉFAUT (toujours en dernier)
  // ==========================================================================
  {
    keywords: ["default"],
    minWeight: 0.05,
    maxWeight: 50.0,
    categoryName: "Autres",
    typicalVolume: 0.001
  }
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Trouve la plage de poids correspondant à un titre
 */
export function findWeightRange(title: string): WeightRange {
  const lowerTitle = title.toLowerCase();
  
  // Chercher la première correspondance
  for (const range of WEIGHT_RANGES) {
    for (const keyword of range.keywords) {
      if (lowerTitle.includes(keyword)) {
        return range;
      }
    }
  }
  
  // Retourner la catégorie par défaut (la dernière)
  return WEIGHT_RANGES[WEIGHT_RANGES.length - 1];
}

/**
 * Vérifie si un poids est crédible pour un titre donné
 */
export function isWeightCredible(weight: number, title: string): boolean {
  const range = findWeightRange(title);
  const isCredible = weight >= range.minWeight && weight <= range.maxWeight;
  
  console.log(`🔍 ${title.substring(0, 50)}... ${weight}kg → ${isCredible ? '✅' : '❌'} (${range.categoryName}: ${range.minWeight}-${range.maxWeight}kg)`);
  
  return isCredible;
}

/**
 * Obtient la plage de poids recommandée pour un titre
 */
export function getRecommendedWeightRange(title: string): { min: number; max: number; category: string } {
  const range = findWeightRange(title);
  return {
    min: range.minWeight,
    max: range.maxWeight,
    category: range.categoryName
  };
}

/**
 * Calcule le poids estimé (milieu de la fourchette)
 */
export function getEstimatedWeight(title: string): number {
  const range = findWeightRange(title);
  return (range.minWeight + range.maxWeight) / 2;
}