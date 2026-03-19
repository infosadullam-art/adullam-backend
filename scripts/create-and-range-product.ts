// scripts/create-and-range-product.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

// ============================================================
// TOUTES LES CATÉGORIES POSSILES (parents et enfants)
// ============================================================
const ALL_CATEGORIES = [
  // ========== HOMME ==========
  { name: 'Homme', level: 'parent', keywords: ['homme', 'men', 'masculin'] },
  { name: 'T-Shirts Homme', level: 'child', parent: 'Homme', keywords: ['t-shirt homme', 'tshirt homme', 'men t-shirt', 'tee shirt homme', 'man tee', 'homme tshirt'] },
  { name: 'Chemises Homme', level: 'child', parent: 'Homme', keywords: ['chemise homme', 'men shirt', 'man shirt', 'chemise casual homme', 'chemise business homme'] },
  { name: 'Pantalons Homme', level: 'child', parent: 'Homme', keywords: ['pantalon homme', 'men pants', 'man pants', 'slacks homme', 'chino homme'] },
  { name: 'Jeans Homme', level: 'child', parent: 'Homme', keywords: ['jean homme', 'men jeans', 'man jeans', 'denim homme'] },
  { name: 'Shorts Homme', level: 'child', parent: 'Homme', keywords: ['short homme', 'men shorts', 'man shorts', 'bermuda homme'] },
  { name: 'Manteaux Homme', level: 'child', parent: 'Homme', keywords: ['manteau homme', 'men coat', 'man coat', 'veste homme', 'jacket homme'] },
  { name: 'Sweats Homme', level: 'child', parent: 'Homme', keywords: ['sweat homme', 'men sweatshirt', 'hoodie homme', 'pull homme'] },
  { name: 'Costumes Homme', level: 'child', parent: 'Homme', keywords: ['costume homme', 'complet homme', 'veste costume', 'pantalon costume'] },
  { name: 'Maillots de bain Homme', level: 'child', parent: 'Homme', keywords: ['maillot de bain homme', 'short de bain homme', 'bermuda de bain'] },
  { name: 'Pyjamas Homme', level: 'child', parent: 'Homme', keywords: ['pyjama homme', 't shirt de nuit homme', 'pantalon de nuit homme'] },
  { name: 'Sous-vêtements Homme', level: 'child', parent: 'Homme', keywords: ['sous-vêtement homme', 'caleçon homme', 'boxer homme', 'slip homme'] },
  { name: 'Chaussettes Homme', level: 'child', parent: 'Homme', keywords: ['chaussette homme', 'socquette homme'] },
  
  // ========== FEMME ==========
  { name: 'Femme', level: 'parent', keywords: ['femme', 'women', 'féminin'] },
  { name: 'Robes', level: 'child', parent: 'Femme', keywords: ['robe', 'dress', 'women dress', 'robe femme', 'fashion dress'] },
  { name: 'Tops Femme', level: 'child', parent: 'Femme', keywords: ['top femme', 'women top', 'blouse femme', 'chemisier', 'crop top'] },
  { name: 'T-Shirts Femme', level: 'child', parent: 'Femme', keywords: ['t-shirt femme', 'tshirt femme', 'women t-shirt', 'tee shirt femme'] },
  { name: 'Pantalons Femme', level: 'child', parent: 'Femme', keywords: ['pantalon femme', 'women pants', 'pants femme', 'legging'] },
  { name: 'Jeans Femme', level: 'child', parent: 'Femme', keywords: ['jean femme', 'women jeans', 'denim femme'] },
  { name: 'Jupes', level: 'child', parent: 'Femme', keywords: ['jupe', 'skirt', 'women skirt', 'jupe femme'] },
  { name: 'Manteaux Femme', level: 'child', parent: 'Femme', keywords: ['manteau femme', 'women coat', 'veste femme', 'jacket femme'] },
  { name: 'Sweats Femme', level: 'child', parent: 'Femme', keywords: ['sweat femme', 'women sweatshirt', 'hoodie femme', 'pull femme'] },
  { name: 'Combinaisons', level: 'child', parent: 'Femme', keywords: ['combinaison', 'jumpsuit', 'salopette'] },
  { name: 'Maillots de bain Femme', level: 'child', parent: 'Femme', keywords: ['maillot de bain femme', 'bikini', 'une pièce'] },
  { name: 'Pyjamas Femme', level: 'child', parent: 'Femme', keywords: ['pyjama femme', 'nuisette', 'chemise de nuit'] },
  { name: 'Sous-vêtements Femme', level: 'child', parent: 'Femme', keywords: ['sous-vêtement femme', 'soutien-gorge', 'culotte', 'string'] },
  { name: 'Collants & Chaussettes', level: 'child', parent: 'Femme', keywords: ['collant', 'bas', 'chaussette femme'] },
  
  // ========== ENFANT ==========
  { name: 'Enfant', level: 'parent', keywords: ['enfant', 'kids', 'junior'] },
  { name: 'Bébé Fille', level: 'child', parent: 'Enfant', keywords: ['bébé fille', 'baby girl', 'bebe fille', 'newborn girl'] },
  { name: 'Bébé Garçon', level: 'child', parent: 'Enfant', keywords: ['bébé garçon', 'baby boy', 'bebe garcon', 'newborn boy'] },
  { name: 'Fille 2-12 ans', level: 'child', parent: 'Enfant', keywords: ['fille', 'girl', 'fillette', 'junior fille', 'kids girl'] },
  { name: 'Garçon 2-12 ans', level: 'child', parent: 'Enfant', keywords: ['garçon', 'boy', 'junior garçon', 'kids boy'] },
  { name: 'Bébé mixte', level: 'child', parent: 'Enfant', keywords: ['bébé mixte', 'baby unisexe', 'layette'] },
  { name: 'Vêtements Fille', level: 'child', parent: 'Enfant', keywords: ['vêtement fille', 'robe fille', 't shirt fille', 'pantalon fille'] },
  { name: 'Vêtements Garçon', level: 'child', parent: 'Enfant', keywords: ['vêtement garçon', 't shirt garçon', 'pantalon garçon'] },
  { name: 'Chaussures Enfant', level: 'child', parent: 'Enfant', keywords: ['chaussure enfant', 'basket enfant', 'sandal enfant'] },
  
  // ========== CHAUSSURES ==========
  { name: 'Chaussures', level: 'parent', keywords: ['chaussure', 'shoe', 'sneaker'] },
  { name: 'Baskets Homme', level: 'child', parent: 'Chaussures', keywords: ['basket homme', 'men sneakers', 'sneaker homme', 'chaussure sport homme'] },
  { name: 'Baskets Femme', level: 'child', parent: 'Chaussures', keywords: ['basket femme', 'women sneakers', 'sneaker femme', 'chaussure sport femme'] },
  { name: 'Baskets Enfant', level: 'child', parent: 'Chaussures', keywords: ['basket enfant', 'kids sneakers', 'sneaker enfant', 'chaussure enfant'] },
  { name: 'Chaussures Habillées Homme', level: 'child', parent: 'Chaussures', keywords: ['chaussure habillée homme', 'derby homme', 'richelieu homme', 'mocassin homme'] },
  { name: 'Chaussures Habillées Femme', level: 'child', parent: 'Chaussures', keywords: ['chaussure habillée femme', 'escarpin', 'talon', 'sandale femme'] },
  { name: 'Bottes', level: 'child', parent: 'Chaussures', keywords: ['botte', 'boots', 'bottine'] },
  { name: 'Sandales', level: 'child', parent: 'Chaussures', keywords: ['sandale', 'tongs', 'claquette'] },
  { name: 'Chaussures de Sport', level: 'child', parent: 'Chaussures', keywords: ['chaussure de sport', 'running', 'football', 'basket'] },
  { name: 'Mules & Sabots', level: 'child', parent: 'Chaussures', keywords: ['mule', 'sabot', 'clog'] },
  
  // ========== ACCESSOIRES ==========
  { name: 'Accessoires', level: 'parent', keywords: ['accessoire', 'accessory'] },
  { name: 'Sacs & Maroquinerie', level: 'child', parent: 'Accessoires', keywords: ['sac', 'bag', 'handbag', 'maroquinerie', 'sac à main', 'sacoche'] },
  { name: 'Montres', level: 'child', parent: 'Accessoires', keywords: ['montre', 'watch', 'chronographe'] },
  { name: 'Bijoux', level: 'child', parent: 'Accessoires', keywords: ['bijou', 'jewelry', 'collier', 'bracelet', 'bague', 'boucle d\'oreille'] },
  { name: 'Ceintures', level: 'child', parent: 'Accessoires', keywords: ['ceinture', 'belt'] },
  { name: 'Chapeaux & Casquettes', level: 'child', parent: 'Accessoires', keywords: ['chapeau', 'hat', 'casquette', 'cap'] },
  { name: 'Lunettes', level: 'child', parent: 'Accessoires', keywords: ['lunette', 'glasses', 'sunglasses'] },
  { name: 'Gants', level: 'child', parent: 'Accessoires', keywords: ['gant', 'gloves', 'mitaine'] },
  { name: 'Écharpes & Foulards', level: 'child', parent: 'Accessoires', keywords: ['écharpe', 'foulard', 'scarf'] },
  { name: 'Parapluies', level: 'child', parent: 'Accessoires', keywords: ['parapluie', 'umbrella'] },
  { name: 'Portefeuilles', level: 'child', parent: 'Accessoires', keywords: ['portefeuille', 'wallet', 'porte-cartes'] },
  
  // ========== SPORT ==========
  { name: 'Sport', level: 'parent', keywords: ['sport', 'fitness', 'training'] },
  { name: 'Vêtements de Sport Homme', level: 'child', parent: 'Sport', keywords: ['sport homme', 'gym homme', 'training homme', 'fitness homme'] },
  { name: 'Vêtements de Sport Femme', level: 'child', parent: 'Sport', keywords: ['sport femme', 'gym femme', 'training femme', 'fitness femme', 'yoga'] },
  { name: 'Vêtements de Sport Enfant', level: 'child', parent: 'Sport', keywords: ['sport enfant', 'gym enfant', 'training enfant'] },
  { name: 'Chaussures de Sport', level: 'child', parent: 'Sport', keywords: ['chaussure sport', 'running', 'training shoe'] },
  { name: 'Accessoires de Sport', level: 'child', parent: 'Sport', keywords: ['accessoire sport', 'gourde', 'tapis de yoga', 'haltère'] },
  { name: 'Sports d\'équipe', level: 'child', parent: 'Sport', keywords: ['football', 'basketball', 'rugby', 'handball'] },
  { name: 'Sports de raquette', level: 'child', parent: 'Sport', keywords: ['tennis', 'badminton', 'squash'] },
  { name: 'Sports d\'hiver', level: 'child', parent: 'Sport', keywords: ['ski', 'snowboard', 'après-ski'] },
  
  // ========== MAISON ==========
  { name: 'Maison', level: 'parent', keywords: ['maison', 'home'] },
  { name: 'Maison & Décoration', level: 'child', parent: 'Maison', keywords: ['maison', 'home', 'décoration', 'decoration', 'linge de maison'] },
  { name: 'Literie', level: 'child', parent: 'Maison', keywords: ['lit', 'bed', 'couette', 'oreiller', 'drap'] },
  { name: 'Cuisine', level: 'child', parent: 'Maison', keywords: ['cuisine', 'casserole', 'poêle', 'robot'] },
  { name: 'Salle de bain', level: 'child', parent: 'Maison', keywords: ['salle de bain', 'serviette', 'tapis de bain'] },
  { name: 'Meubles', level: 'child', parent: 'Maison', keywords: ['meuble', 'table', 'chaise', 'armoire', 'étagère'] },
  { name: 'Électroménager', level: 'child', parent: 'Maison', keywords: ['électroménager', 'frigo', 'four', 'micro-ondes', 'lave-linge'] },
  { name: 'Linge de maison', level: 'child', parent: 'Maison', keywords: ['linge de maison', 'nappe', 'torchon'] },
  { name: 'Décoration', level: 'child', parent: 'Maison', keywords: ['décoration', 'decoration', 'lampe', 'cadre', 'bougie'] },
  
  // ========== BEAUTÉ ==========
  { name: 'Beauté', level: 'parent', keywords: ['beauté', 'beauty'] },
  { name: 'Parfums', level: 'child', parent: 'Beauté', keywords: ['parfum', 'perfume', 'eau de toilette'] },
  { name: 'Maquillage', level: 'child', parent: 'Beauté', keywords: ['maquillage', 'makeup', 'rouge à lèvres', 'mascara', 'fond de teint'] },
  { name: 'Soins Visage', level: 'child', parent: 'Beauté', keywords: ['soin visage', 'skincare', 'crème visage', 'sérum'] },
  { name: 'Soins Corps', level: 'child', parent: 'Beauté', keywords: ['soin corps', 'body care', 'crème corps', 'gel douche'] },
  { name: 'Soins Cheveux', level: 'child', parent: 'Beauté', keywords: ['soin cheveux', 'shampoing', 'après-shampoing'] },
  { name: 'Hygiène', level: 'child', parent: 'Beauté', keywords: ['hygiène', 'dentifrice', 'déodorant'] },
  
  // ========== ÉLECTRONIQUE ==========
  { name: 'Électronique', level: 'parent', keywords: ['électronique', 'electronic'] },
  { name: 'Téléphones', level: 'child', parent: 'Électronique', keywords: ['téléphone', 'smartphone', 'iphone', 'samsung'] },
  { name: 'Ordinateurs', level: 'child', parent: 'Électronique', keywords: ['ordinateur', 'pc', 'laptop', 'macbook'] },
  { name: 'Tablettes', level: 'child', parent: 'Électronique', keywords: ['tablette', 'ipad'] },
  { name: 'TV & Vidéo', level: 'child', parent: 'Électronique', keywords: ['tv', 'télévision', 'écran'] },
  { name: 'Audio', level: 'child', parent: 'Électronique', keywords: ['casque', 'enceinte', 'barre de son', 'écouteur'] },
  { name: 'Photo & Caméra', level: 'child', parent: 'Électronique', keywords: ['appareil photo', 'caméra', 'gopro'] },
  { name: 'Gaming', level: 'child', parent: 'Électronique', keywords: ['console', 'jeu vidéo', 'manette'] },
  { name: 'Accessoires Électronique', level: 'child', parent: 'Électronique', keywords: ['chargeur', 'câble', 'adaptateur', 'powerbank'] },
  
  // ========== LOISIRS ==========
  { name: 'Loisirs', level: 'parent', keywords: ['loisir', 'hobby'] },
  { name: 'Livres', level: 'child', parent: 'Loisirs', keywords: ['livre', 'book', 'roman', 'manga'] },
  { name: 'Jeux & Jouets', level: 'child', parent: 'Loisirs', keywords: ['jeu', 'jouet', 'toy', 'peluche', 'puzzle'] },
  { name: 'Jeux de société', level: 'child', parent: 'Loisirs', keywords: ['jeu de société', 'board game'] },
  { name: 'Instruments de musique', level: 'child', parent: 'Loisirs', keywords: ['guitare', 'piano', 'batterie'] },
  
  // ========== ALIMENTATION ==========
  { name: 'Alimentation', level: 'parent', keywords: ['alimentation', 'food'] },
  { name: 'Épicerie', level: 'child', parent: 'Alimentation', keywords: ['épicerie', 'gourmandise'] },
  { name: 'Boissons', level: 'child', parent: 'Alimentation', keywords: ['boisson', 'soda', 'jus', 'eau'] },
  { name: 'Confiserie', level: 'child', parent: 'Alimentation', keywords: ['bonbon', 'chocolat', 'confiserie'] },
  { name: 'Produits régionaux', level: 'child', parent: 'Alimentation', keywords: ['produit régional', 'terroir'] },
  
  // ========== ANIMAUX ==========
  { name: 'Animaux', level: 'parent', keywords: ['animal', 'pet'] },
  { name: 'Chien', level: 'child', parent: 'Animaux', keywords: ['chien', 'dog', 'croquette chien'] },
  { name: 'Chat', level: 'child', parent: 'Animaux', keywords: ['chat', 'cat', 'croquette chat'] },
  { name: 'Poissons', level: 'child', parent: 'Animaux', keywords: ['poisson', 'aquarium'] },
  { name: 'Oiseaux', level: 'child', parent: 'Animaux', keywords: ['oiseau', 'cage oiseau'] },
  { name: 'Accessoires Animaux', level: 'child', parent: 'Animaux', keywords: ['accessoire animal', 'panier', 'laisse'] },
  
  // ========== AUTO-MOTO ==========
  { name: 'Auto-Moto', level: 'parent', keywords: ['auto', 'moto', 'voiture'] },
  { name: 'Accessoires Auto', level: 'child', parent: 'Auto-Moto', keywords: ['accessoire auto', 'gps', 'embauchoir'] },
  { name: 'Entretien Auto', level: 'child', parent: 'Auto-Moto', keywords: ['entretien auto', 'huile'] },
  { name: 'Équipement Moto', level: 'child', parent: 'Auto-Moto', keywords: ['casque moto', 'gant moto'] },
  
  // ========== AUTRES ==========
  { name: 'Autres', level: 'parent', keywords: [] }
];

// ============================================================
// FONCTION POUR CRÉER TOUTES LES CATÉGORIES (parents + enfants)
// ============================================================
async function createAllCategories() {
  console.log('\n========================================');
  console.log('  🏷️  CRÉATION DE TOUTES LES CATÉGORIES');
  console.log('========================================');
  
  const parentMap = new Map(); // nom parent -> id
  
  // 1️⃣ Créer d'abord tous les parents
  let parentsCreated = 0;
  for (const cat of ALL_CATEGORIES) {
    if (cat.level !== 'parent') continue;
    
    const catRes = await client.query(
      'SELECT id FROM "Category" WHERE name = $1',
      [cat.name]
    );
    
    if (catRes.rows.length === 0) {
      const slug = cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
        
      const newCat = await client.query(
        `INSERT INTO "Category" (id, name, slug, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
         RETURNING id`,
        [cat.name, slug]
      );
      parentMap.set(cat.name, newCat.rows[0].id);
      parentsCreated++;
      console.log(`✅ Parent créé: ${cat.name}`);
    } else {
      parentMap.set(cat.name, catRes.rows[0].id);
      console.log(`ℹ️ Parent existant: ${cat.name}`);
    }
  }
  
  console.log(`\n📊 Parents créés: ${parentsCreated}`);
  console.log(`📊 Total parents: ${parentMap.size}`);
  
  // 2️⃣ Créer tous les enfants
  let enfantsCréés = 0;
  let enfantsExistants = 0;
  
  for (const cat of ALL_CATEGORIES) {
    if (cat.level !== 'child' || !cat.parent) continue;
    
    const parentId = parentMap.get(cat.parent);
    if (!parentId) {
      console.log(`⚠️ Parent ${cat.parent} non trouvé pour ${cat.name}`);
      continue;
    }
    
    const catRes = await client.query(
      'SELECT id FROM "Category" WHERE name = $1',
      [cat.name]
    );
    
    if (catRes.rows.length === 0) {
      const slug = cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
        
      await client.query(
        `INSERT INTO "Category" (id, name, slug, "parentId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
        [cat.name, slug, parentId]
      );
      enfantsCréés++;
      if (enfantsCréés <= 10) console.log(`   + ${cat.name} → ${cat.parent}`);
    } else {
      enfantsExistants++;
    }
  }
  
  console.log(`\n✅ Enfants créés: ${enfantsCréés}`);
  console.log(`ℹ️ Enfants existants: ${enfantsExistants}`);
  console.log(`📊 TOTAL catégories: ${parentsCreated + enfantsCréés + enfantsExistants + (parentMap.size - parentsCreated)}`);
}

// ============================================================
// FONCTION DE CATÉGORISATION (retourne la sous-catégorie)
// ============================================================
function guessCategory(title: string | null, description: string | null = null): string {
  if (!title) return 'Autres';
  
  const textToAnalyze = (title + ' ' + (description || '')).toLowerCase();
  
  // Chercher dans toutes les sous-catégories (enfants) d'abord
  for (const cat of ALL_CATEGORIES) {
    if (cat.level !== 'child') continue;
    for (const kw of cat.keywords) {
      if (kw && textToAnalyze.includes(kw.toLowerCase())) {
        return cat.name;
      }
    }
  }
  
  // Règles de secours
  if (textToAnalyze.includes('t-shirt') || textToAnalyze.includes('tshirt')) {
    if (textToAnalyze.includes('femme')) return 'T-Shirts Femme';
    if (textToAnalyze.includes('enfant')) return 'Baskets Enfant';
    return 'T-Shirts Homme';
  }
  
  if (textToAnalyze.includes('chemise')) return 'Chemises Homme';
  if (textToAnalyze.includes('pantalon')) {
    if (textToAnalyze.includes('femme')) return 'Pantalons Femme';
    return 'Pantalons Homme';
  }
  if (textToAnalyze.includes('jean')) {
    if (textToAnalyze.includes('femme')) return 'Jeans Femme';
    return 'Jeans Homme';
  }
  if (textToAnalyze.includes('robe')) return 'Robes';
  if (textToAnalyze.includes('chaussure') || textToAnalyze.includes('basket')) {
    if (textToAnalyze.includes('enfant')) return 'Baskets Enfant';
    if (textToAnalyze.includes('femme')) return 'Baskets Femme';
    return 'Baskets Homme';
  }
  
  return 'Autres';
}

// ============================================================
// FONCTION POUR GÉNÉRER UN SKU UNIQUE (seule modification)
// ============================================================
function generateSku(title: string): string {
  const base = title
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 12);
  const unique = Date.now().toString().slice(-8);
  return `${base}-${unique}`;
}

// ============================================================
// FONCTION POUR CRÉER UN NOUVEAU PRODUIT
// ============================================================
async function createProduct(productData: {
  title: string;
  description?: string;
  priceUSD: number;
  image?: string;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}) {
  try {
    console.log('\n========================================');
    console.log('  🆕 CRÉATION D\'UN NOUVEAU PRODUIT');
    console.log('========================================');
    console.log(`Titre: ${productData.title}`);
    console.log(`Description: ${productData.description || 'N/A'}`);
    console.log(`Prix: $${productData.priceUSD}`);
    
    // Deviner la catégorie
    const categoryName = guessCategory(productData.title, productData.description);
    console.log(`\n🔍 Catégorie devinée: ${categoryName}`);
    
    // Récupérer l'ID de la catégorie
    let catRes = await client.query(
      'SELECT id FROM "Category" WHERE name = $1',
      [categoryName]
    );
    
    if (catRes.rows.length === 0) {
      console.log(`❌ Catégorie ${categoryName} non trouvée dans la base!`);
      console.log(`   Lancez d'abord la création des catégories.`);
      return null;
    }
    
    const categoryId = catRes.rows[0].id;
    
    // Créer le produit avec SKU généré
    const productId = crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    
    const sku = generateSku(productData.title);
    
    const result = await client.query(
      `INSERT INTO "Product" (
        id, sku, title, description, price, currency,
        images, status, "categoryId",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, title, "categoryId"`,
      [
        productId,
        sku,
        productData.title,
        productData.description || null,
        productData.priceUSD,
        'USD',
        productData.image ? [productData.image] : [],
        productData.status || 'ACTIVE',
        categoryId
      ]
    );
    
    console.log('\n✅ PRODUIT CRÉÉ AVEC SUCCÈS !');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   SKU: ${sku}`);
    console.log(`   Titre: ${result.rows[0].title}`);
    console.log(`   Catégorie: ${categoryName}`);
    
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    throw error;
  }
}

// ============================================================
// FONCTION PRINCIPALE AVEC LOGS
// ============================================================
async function run() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // ============================================================
    // ÉTAPE 1 : CRÉER TOUTES LES CATÉGORIES (parents + enfants)
    // ============================================================
    await createAllCategories();
    
    // ============================================================
    // ÉTAPE 2 : CRÉER DES PRODUITS EXEMPLES
    // ============================================================
    console.log('\n========================================');
    console.log('  📦 CRÉATION DES PRODUITS EXEMPLES');
    console.log('========================================');
    
    await createProduct({
      title: 'T-Shirt Homme 100% Coton - Gris Chiné',
      description: 'T-shirt homme en coton biologique, idéal pour le quotidien.',
      priceUSD: 24.99,
      status: 'ACTIVE'
    });
    
    await createProduct({
      title: 'Baskets Nike Air Max 270 - Noir/Blanc',
      description: 'Chaussures de sport Nike Air Max 270, amorti exceptionnel.',
      priceUSD: 149.99,
      status: 'ACTIVE'
    });
    
    await createProduct({
      title: 'Robe d\'été imprimée - Collection 2025',
      description: 'Robe femme légère et fluide, idéale pour l\'été.',
      priceUSD: 39.99,
      status: 'ACTIVE'
    });
    
    // ============================================================
    // STATISTIQUES FINALES
    // ============================================================
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM "Product") as total_products,
        (SELECT COUNT(*) FROM "Category") as total_categories,
        (SELECT COUNT(*) FROM "Category" WHERE "parentId" IS NULL) as parents,
        (SELECT COUNT(*) FROM "Category" WHERE "parentId" IS NOT NULL) as enfants
    `);
    
    console.log('\n========================================');
    console.log('  📊 STATISTIQUES FINALES');
    console.log('========================================');
    console.log(`📦 Total produits: ${stats.rows[0].total_products}`);
    console.log(`🏷️  Total catégories: ${stats.rows[0].total_categories}`);
    console.log(`   ├─ Parents: ${stats.rows[0].parents}`);
    console.log(`   └─ Enfants: ${stats.rows[0].enfants}`);

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnexion PostgreSQL');
  }
}

// ============================================================
// EXPOSER LES FONCTIONS POUR IMPORT
// ============================================================
export { createProduct, guessCategory, createAllCategories };

// Lancer le script si exécuté directement
run().catch(console.error);