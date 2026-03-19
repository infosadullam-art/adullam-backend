// scripts/range-products-pg.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

// ============================================================
// TOUTES LES CATÉGORIES (identiques au front)
// ============================================================
const ALL_CATEGORIES = [
  // ========== HOMME ==========
  { name: 'Homme', level: 'parent', keywords: ['homme', 'men', 'masculin'] },
  { name: 'T-Shirts Homme', level: 'child', parent: 'Homme', keywords: ['t-shirt homme', 'tshirt homme', 'men t-shirt', 'tee shirt homme', 'man tee', 'homme tshirt'] },
  { name: 'Chemises Homme', level: 'child', parent: 'Homme', keywords: ['chemise homme', 'men shirt', 'man shirt', 'dress shirt men'] },
  { name: 'Pantalons Homme', level: 'child', parent: 'Homme', keywords: ['pantalon homme', 'men pants', 'man pants', 'trousers men'] },
  { name: 'Jeans Homme', level: 'child', parent: 'Homme', keywords: ['jean homme', 'men jeans', 'denim homme'] },
  { name: 'Shorts Homme', level: 'child', parent: 'Homme', keywords: ['short homme', 'men shorts'] },
  { name: 'Manteaux Homme', level: 'child', parent: 'Homme', keywords: ['manteau homme', 'men coat', 'veste homme', 'jacket men'] },
  { name: 'Sweats Homme', level: 'child', parent: 'Homme', keywords: ['sweat homme', 'men sweatshirt', 'hoodie homme'] },
  { name: 'Costumes Homme', level: 'child', parent: 'Homme', keywords: ['costume homme', 'suit men'] },
  { name: 'Sous-vêtements Homme', level: 'child', parent: 'Homme', keywords: ['sous-vêtement homme', 'underwear men', 'boxer men'] },
  { name: 'Chaussettes Homme', level: 'child', parent: 'Homme', keywords: ['chaussette homme', 'socks men'] },
  
  // ========== FEMME ==========
  { name: 'Femme', level: 'parent', keywords: ['femme', 'women'] },
  { name: 'Robes', level: 'child', parent: 'Femme', keywords: ['robe', 'dress', 'women dress'] },
  { name: 'Tops Femme', level: 'child', parent: 'Femme', keywords: ['top femme', 'women top', 'blouse', 'crop top'] },
  { name: 'T-Shirts Femme', level: 'child', parent: 'Femme', keywords: ['t-shirt femme', 'women t-shirt'] },
  { name: 'Pantalons Femme', level: 'child', parent: 'Femme', keywords: ['pantalon femme', 'women pants', 'legging'] },
  { name: 'Jeans Femme', level: 'child', parent: 'Femme', keywords: ['jean femme', 'women jeans'] },
  { name: 'Jupes', level: 'child', parent: 'Femme', keywords: ['jupe', 'skirt'] },
  { name: 'Manteaux Femme', level: 'child', parent: 'Femme', keywords: ['manteau femme', 'women coat', 'veste femme'] },
  { name: 'Sweats Femme', level: 'child', parent: 'Femme', keywords: ['sweat femme', 'women sweatshirt', 'hoodie femme'] },
  { name: 'Sous-vêtements Femme', level: 'child', parent: 'Femme', keywords: ['sous-vêtement femme', 'bra', 'culotte', 'lingerie'] },
  { name: 'Collants & Chaussettes', level: 'child', parent: 'Femme', keywords: ['collant', 'tights', 'chaussette femme'] },
  
  // ========== ENFANT ==========
  { name: 'Enfant', level: 'parent', keywords: ['enfant', 'kids', 'child'] },
  { name: 'Bébé Fille', level: 'child', parent: 'Enfant', keywords: ['bébé fille', 'baby girl'] },
  { name: 'Bébé Garçon', level: 'child', parent: 'Enfant', keywords: ['bébé garçon', 'baby boy'] },
  { name: 'Fille 2-12 ans', level: 'child', parent: 'Enfant', keywords: ['fille', 'girl', 'kids girl'] },
  { name: 'Garçon 2-12 ans', level: 'child', parent: 'Enfant', keywords: ['garçon', 'boy', 'kids boy'] },
  { name: 'Chaussures Enfant', level: 'child', parent: 'Enfant', keywords: ['chaussure enfant', 'kids shoes'] },
  
  // ========== CHAUSSURES ==========
  { name: 'Chaussures', level: 'parent', keywords: ['chaussure', 'shoe', 'sneaker'] },
  { name: 'Baskets Homme', level: 'child', parent: 'Chaussures', keywords: ['basket homme', 'men sneakers', 'sneaker homme', 'athletic men'] },
  { name: 'Baskets Femme', level: 'child', parent: 'Chaussures', keywords: ['basket femme', 'women sneakers', 'sneaker femme', 'athletic women'] },
  { name: 'Baskets Enfant', level: 'child', parent: 'Chaussures', keywords: ['basket enfant', 'kids sneakers'] },
  { name: 'Chaussures Habillées Homme', level: 'child', parent: 'Chaussures', keywords: ['chaussure habillée homme', 'dress shoes men'] },
  { name: 'Chaussures Habillées Femme', level: 'child', parent: 'Chaussures', keywords: ['chaussure habillée femme', 'high heels', 'talon', 'pumps'] },
  { name: 'Bottes', level: 'child', parent: 'Chaussures', keywords: ['botte', 'boots'] },
  { name: 'Sandales', level: 'child', parent: 'Chaussures', keywords: ['sandale', 'sandal', 'tongs'] },
  
  // ========== ACCESSOIRES ==========
  { name: 'Accessoires', level: 'parent', keywords: ['accessoire', 'accessory'] },
  { name: 'Sacs & Maroquinerie', level: 'child', parent: 'Accessoires', keywords: ['sac', 'bag', 'handbag', 'backpack'] },
  { name: 'Montres', level: 'child', parent: 'Accessoires', keywords: ['montre', 'watch'] },
  { name: 'Bijoux', level: 'child', parent: 'Accessoires', keywords: ['bijou', 'jewelry', 'collier', 'bracelet'] },
  { name: 'Ceintures', level: 'child', parent: 'Accessoires', keywords: ['ceinture', 'belt'] },
  { name: 'Chapeaux & Casquettes', level: 'child', parent: 'Accessoires', keywords: ['chapeau', 'hat', 'casquette', 'cap'] },
  { name: 'Lunettes', level: 'child', parent: 'Accessoires', keywords: ['lunette', 'glasses', 'sunglasses'] },
  { name: 'Écharpes & Foulards', level: 'child', parent: 'Accessoires', keywords: ['écharpe', 'scarf'] },
  
  // ========== SPORT ==========
  { name: 'Sport', level: 'parent', keywords: ['sport', 'fitness'] },
  { name: 'Vêtements de Sport Homme', level: 'child', parent: 'Sport', keywords: ['sport homme', 'gym men', 'training men'] },
  { name: 'Vêtements de Sport Femme', level: 'child', parent: 'Sport', keywords: ['sport femme', 'gym women', 'yoga'] },
  { name: 'Vêtements de Sport Enfant', level: 'child', parent: 'Sport', keywords: ['sport enfant', 'kids sport'] },
  
  // ========== MAISON ==========
  { name: 'Maison', level: 'parent', keywords: ['maison', 'home'] },
  { name: 'Cuisine', level: 'child', parent: 'Maison', keywords: ['cuisine', 'kitchen', 'cookware', 'pan', 'casserole', 'poêle'] },
  { name: 'Literie', level: 'child', parent: 'Maison', keywords: ['literie', 'bedding', 'drap', 'sheet', 'pillow', 'oreiller'] },
  { name: 'Décoration', level: 'child', parent: 'Maison', keywords: ['décoration', 'decor', 'lampe', 'cadre'] },
  
  // ========== BEAUTÉ ==========
  { name: 'Beauté', level: 'parent', keywords: ['beauté', 'beauty'] },
  { name: 'Soins Visage', level: 'child', parent: 'Beauté', keywords: ['soin visage', 'skincare', 'face cream', 'serum', 'sérum'] },
  { name: 'Maquillage', level: 'child', parent: 'Beauté', keywords: ['maquillage', 'makeup', 'lipstick', 'mascara'] },
  { name: 'Parfums', level: 'child', parent: 'Beauté', keywords: ['parfum', 'perfume'] },
  
  // ========== ÉLECTRONIQUE ==========
  { name: 'Électronique', level: 'parent', keywords: ['électronique', 'electronic'] },
  { name: 'Téléphones', level: 'child', parent: 'Électronique', keywords: ['téléphone', 'smartphone', 'iphone', 'samsung', 'phone'] },
  { name: 'Ordinateurs', level: 'child', parent: 'Électronique', keywords: ['ordinateur', 'pc', 'laptop', 'computer'] },
  { name: 'Tablettes', level: 'child', parent: 'Électronique', keywords: ['tablette', 'tablet', 'ipad'] },
  { name: 'TV & Vidéo', level: 'child', parent: 'Électronique', keywords: ['tv', 'télévision', 'television'] },
  { name: 'Audio', level: 'child', parent: 'Électronique', keywords: ['casque', 'headphone', 'enceinte', 'speaker'] },
  
  // ========== LOISIRS ==========
  { name: 'Loisirs', level: 'parent', keywords: ['loisir', 'hobby'] },
  { name: 'Livres', level: 'child', parent: 'Loisirs', keywords: ['livre', 'book', 'roman'] },
  { name: 'Jeux & Jouets', level: 'child', parent: 'Loisirs', keywords: ['jeu', 'jouet', 'toy', 'peluche'] },
  
  // ========== ALIMENTATION ==========
  { name: 'Alimentation', level: 'parent', keywords: ['alimentation', 'food'] },
  { name: 'Épicerie', level: 'child', parent: 'Alimentation', keywords: ['épicerie', 'grocery'] },
  { name: 'Boissons', level: 'child', parent: 'Alimentation', keywords: ['boisson', 'drink'] },
  
  // ========== ANIMAUX ==========
  { name: 'Animaux', level: 'parent', keywords: ['animal', 'pet'] },
  { name: 'Chien', level: 'child', parent: 'Animaux', keywords: ['chien', 'dog'] },
  { name: 'Chat', level: 'child', parent: 'Animaux', keywords: ['chat', 'cat'] },
  
  // ========== AUTO-MOTO ==========
  { name: 'Auto-Moto', level: 'parent', keywords: ['auto', 'moto', 'car'] },
  { name: 'Accessoires Auto', level: 'child', parent: 'Auto-Moto', keywords: ['accessoire auto', 'car accessory'] },
  
  // ========== AUTRES ==========
  { name: 'Autres', level: 'parent', keywords: [] }
];

// ============================================================
// FONCTION DE CATÉGORISATION (COUVRE TOUTES LES CATÉGORIES)
// ============================================================
function guessCategory(title: string | null): string {
  if (!title) return 'Autres';
  
  const text = title.toLowerCase();
  
  // ===== 1. ÉLECTRONIQUE =====
  if (text.includes('tablet') || text.includes('ipad')) return 'Tablettes';
  if (text.includes('phone') || text.includes('iphone') || text.includes('samsung')) return 'Téléphones';
  if (text.includes('laptop') || text.includes('computer') || text.includes('pc')) return 'Ordinateurs';
  if (text.includes('tv') || text.includes('television')) return 'TV & Vidéo';
  if (text.includes('headphone') || text.includes('casque') || text.includes('speaker')) return 'Audio';
  
  // ===== 2. MAISON =====
  if (text.includes('kitchen') || text.includes('cuisine') || text.includes('cookware') || text.includes('pan')) return 'Cuisine';
  if (text.includes('bed') || text.includes('pillow') || text.includes('oreiller') || text.includes('drap')) return 'Literie';
  if (text.includes('decor') || text.includes('décoration') || text.includes('lampe')) return 'Décoration';
  
  // ===== 3. BEAUTÉ =====
  if (text.includes('skincare') || text.includes('face') || text.includes('serum') || text.includes('cream')) return 'Soins Visage';
  if (text.includes('makeup') || text.includes('lipstick') || text.includes('mascara')) return 'Maquillage';
  if (text.includes('perfume') || text.includes('parfum')) return 'Parfums';
  
  // ===== 4. CHAUSSURES =====
  if (text.includes('shoe') || text.includes('chaussure') || text.includes('sneaker')) {
    if (text.includes('women') || text.includes('femme')) return text.includes('athletic') ? 'Baskets Femme' : 'Chaussures';
    if (text.includes('men') || text.includes('homme')) return text.includes('athletic') ? 'Baskets Homme' : 'Chaussures';
    if (text.includes('kids') || text.includes('enfant')) return 'Baskets Enfant';
    return 'Chaussures';
  }
  
  // ===== 5. VÊTEMENTS =====
  if (text.includes('t-shirt') || text.includes('tshirt')) {
    if (text.includes('femme')) return 'T-Shirts Femme';
    if (text.includes('homme')) return 'T-Shirts Homme';
    return 'T-Shirts Homme';
  }
  if (text.includes('pants') || text.includes('pantalon')) {
    if (text.includes('femme')) return 'Pantalons Femme';
    return 'Pantalons Homme';
  }
  if (text.includes('jean') || text.includes('jeans')) {
    if (text.includes('femme')) return 'Jeans Femme';
    return 'Jeans Homme';
  }
  if (text.includes('dress') || text.includes('robe')) return 'Robes';
  if (text.includes('jacket') || text.includes('veste') || text.includes('coat')) {
    if (text.includes('femme')) return 'Manteaux Femme';
    return 'Manteaux Homme';
  }
  
  // ===== 6. ACCESSOIRES =====
  if (text.includes('bag') || text.includes('sac') || text.includes('handbag')) return 'Sacs & Maroquinerie';
  if (text.includes('watch') || text.includes('montre')) return 'Montres';
  if (text.includes('hat') || text.includes('cap') || text.includes('casquette')) return 'Chapeaux & Casquettes';
  if (text.includes('glasses') || text.includes('lunette')) return 'Lunettes';
  if (text.includes('belt') || text.includes('ceinture')) return 'Ceintures';
  if (text.includes('scarf') || text.includes('écharpe')) return 'Écharpes & Foulards';
  
  // ===== 7. SPORT =====
  if (text.includes('sport') || text.includes('gym') || text.includes('fitness')) {
    if (text.includes('femme')) return 'Vêtements de Sport Femme';
    if (text.includes('homme')) return 'Vêtements de Sport Homme';
    return 'Sport';
  }
  
  // ===== 8. LOISIRS =====
  if (text.includes('book') || text.includes('livre')) return 'Livres';
  if (text.includes('toy') || text.includes('jouet') || text.includes('peluche')) return 'Jeux & Jouets';
  
  // ===== 9. ANIMAUX =====
  if (text.includes('dog') || text.includes('chien')) return 'Chien';
  if (text.includes('cat') || text.includes('chat')) return 'Chat';
  
  // ===== 10. AUTO-MOTO =====
  if (text.includes('car') || text.includes('auto')) return 'Auto-Moto';
  
  return 'Autres';
}

// ============================================================
// FONCTION POUR CRÉER LES CATÉGORIES MANQUANTES
// ============================================================
async function ensureCategoriesExist() {
  console.log('\n========================================');
  console.log('  🏷️  VÉRIFICATION DES CATÉGORIES');
  console.log('========================================');
  
  const parentMap = new Map();
  
  // 1️⃣ Vérifier/créer les parents
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
  
  // 2️⃣ Vérifier/créer les enfants
  let enfantsCréés = 0;
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
      console.log(`   + ${cat.name} → ${cat.parent}`);
    }
  }
  
  console.log(`\n✅ Enfants créés: ${enfantsCréés}`);
  return parentMap;
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================
async function run() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    await ensureCategoriesExist();
    
    const products = await client.query(`
      SELECT p.id, p.title, p."categoryId", c.name as current_category
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
    `);
    
    console.log(`\n📦 ${products.rows.length} produits à traiter\n`);
    
    let updated = 0;
    let unchanged = 0;
    const categoryCache = new Map();
    
    for (let i = 0; i < products.rows.length; i++) {
      const p = products.rows[i];
      
      if (i % 100 === 0) console.log(`   Traitement ${i + 1}/${products.rows.length}...`);
      
      const categoryName = guessCategory(p.title);
      
      let categoryId = categoryCache.get(categoryName);
      if (!categoryId) {
        const catRes = await client.query('SELECT id FROM "Category" WHERE name = $1', [categoryName]);
        if (catRes.rows[0]) {
          categoryId = catRes.rows[0].id;
          categoryCache.set(categoryName, categoryId);
        }
      }
      
      if (categoryId) {
        if (p.categoryId !== categoryId) {
          await client.query(`UPDATE "Product" SET "categoryId" = $1, "updatedAt" = NOW() WHERE id = $2`, [categoryId, p.id]);
          updated++;
        } else {
          unchanged++;
        }
      }
    }
    
    console.log('\n========================================');
    console.log('  📊 STATISTIQUES FINALES');
    console.log('========================================');
    console.log(`✅ Produits mis à jour: ${updated}`);
    console.log(`ℹ️ Produits inchangés: ${unchanged}`);

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnexion PostgreSQL');
  }
}

run().catch(console.error);