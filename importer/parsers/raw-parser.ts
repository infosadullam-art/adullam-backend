// ============================================================
// Raw Product Parser for Adullam
// Normalizes enriched API products into ParsedRawProduct format
// Optimized for alibaba-datahub.p.rapidapi.com
// VERSION: 4.4 - Enhanced weight extraction with material detection
// ============================================================

import type {
  AlibabaApiProduct,
  ImportSource,
  ParsedRawProduct,
  ParsedVariant,
  RawVideo,
} from "../config/types";
import { parseWeight, parseVolume, parsePrice, cleanImages } from "../utils";

export interface ParsedResult {
  product: ParsedRawProduct;
  priceTiers?: {
    minQuantity: number;
    maxQuantity: number;
    price: number;
    unit?: string;
  }[];
}

export class RawProductParser {
  /**
   * Parse an enriched API product into ParsedRawProduct format.
   * Returns null if mandatory fields are missing.
   * ✅ VERSION 4.4: Enhanced weight extraction with material detection
   */
  parse(apiProduct: AlibabaApiProduct, source: ImportSource): ParsedResult | null {
    try {
      // ✅ ÉTAPE 1: Extraire l'ID produit (MANDATORY)
      const externalProductId = this.extractId(apiProduct);
      if (!externalProductId) {
        console.warn("[Parser] Missing external product ID");
        return null;
      }

      // ✅ ÉTAPE 2: Extraire le titre (MANDATORY) - VERSION RENFORCÉE
      const rawTitle = this.extractTitle(apiProduct);
      if (!rawTitle) {
        console.warn("[Parser] Missing title for product:", externalProductId);
        return null;
      }

      // ✅ ÉTAPE 3: Extraire les images
      const rawImages = this.extractImages(apiProduct);

      // ✅ ÉTAPE 4: Extraire les prix
      const { minPrice, maxPrice, currency } = this.extractPrices(apiProduct);

      // ✅ ÉTAPE 5: Extraire le poids (VERSION AMÉLIORÉE)
      const weight = this.extractWeight(apiProduct);

      // ✅ ÉTAPE 6: Extraire les VARIANTES et PRIX PAR QUANTITÉ
      const { variants, priceTiers } = this.extractVariantsAndPricing(apiProduct);

      // ✅ ÉTAPE 7: Extraire les champs optionnels
      const rawDescription = this.extractDescription(apiProduct);
      const rawCategory = this.extractCategory(apiProduct);
      const rawAttributes = this.extractAttributes(apiProduct);
      const volume = this.extractVolume(apiProduct);
      const externalSkuId = this.extractSkuId(apiProduct);
      const externalShopId = this.extractShopId(apiProduct);
      const sourceUrl = this.extractUrl(apiProduct);
      
      // ✅ NOUVEAU: Extraire le chemin de catégorie Alibaba
      const alibabaCategoryPath = apiProduct.categoryPath;
      
      // ✅ NOUVEAU: Extraire l'ID de catégorie Alibaba
      const alibabaCategoryId = apiProduct.categoryId?.toString();
      
      // ✅ NOUVEAU: Extraire les vidéos
      const rawVideos = this.extractVideos(apiProduct);

      // ✅ ÉTAPE 8: Calculer les prix min/max à partir des variantes si nécessaire
      let finalMinPrice = minPrice;
      let finalMaxPrice = maxPrice;
      
      if (variants.length > 0) {
        const variantPrices = variants.map(v => v.price).filter(p => p > 0);
        if (variantPrices.length > 0) {
          finalMinPrice = Math.min(...variantPrices);
          finalMaxPrice = Math.max(...variantPrices);
        }
      }

      // ✅ ÉTAPE 9: Collecter toutes les images (produit + variantes)
      const allImages = new Set<string>();
      
      // Ajouter les images du produit
      if (rawImages && rawImages.length > 0) {
        rawImages.forEach(img => allImages.add(img));
      }
      
      // Ajouter les images des variantes
      variants.forEach(v => {
        if (v.image) allImages.add(v.image);
        if (v.images && v.images.length > 0) {
          v.images.forEach(img => allImages.add(img));
        }
      });

      const finalImages = Array.from(allImages);

      // ✅ ÉTAPE 10: Construire l'objet ParsedRawProduct avec les nouveaux champs
      const parsedProduct: ParsedRawProduct = {
        externalProductId,
        externalSkuId,
        externalShopId,
        source,
        sourceUrl,
        rawTitle,
        rawDescription,
        rawMinPrice: finalMinPrice || 0,
        rawMaxPrice: finalMaxPrice || finalMinPrice || 0,
        rawCurrency: currency || 'USD',
        rawImages: finalImages.length > 0 ? finalImages : [this.extractDefaultImage(apiProduct)],
        rawCategory: rawCategory || 'Uncategorized',
        rawAttributes: {
          ...(rawAttributes || {}),
          ...(priceTiers?.length > 0 ? { priceTiers } : {})
        },
        weight,
        volume,
        variants,
        // ✅ NOUVEAUX CHAMPS (AJOUTÉS À LA FIN)
        alibabaCategoryPath,
        alibabaCategoryId,
        rawVideos,
      };

      return {
        product: parsedProduct,
        priceTiers,
      };
    } catch (error) {
      console.error("[Parser] Error parsing product:", error);
      return null;
    }
  }

  // ============================================================
  // ✅ VERSION AMÉLIORÉE D'EXTRACTWEIGHT (À REMPLACER)
  // ============================================================
  
  /**
   * ✅ VERSION 4.4: Extraction intelligente du poids avec détection du matériau
   */
  private extractWeight(product: AlibabaApiProduct): number | null {
    // 1️⃣ Extraction directe (priorité max)
    let weight =
      parseWeight(product.weight) ||
      parseWeight(product.productWeight) ||
      parseWeight(product.product_weight);
    if (weight) {
      console.log(`[Parser] ⚖️ Direct weight: ${weight}kg`);
      return weight;
    }

    // 2️⃣ Chercher dans les attributs du produit
    if (product.attributes) {
      for (const [key, value] of Object.entries(product.attributes)) {
        if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('poids')) {
          weight = parseWeight(value);
          if (weight) {
            console.log(`[Parser] ⚖️ Weight from attributes: ${weight}kg`);
            return weight;
          }
        }
      }
    }

    // 3️⃣ Chercher dans les spécifications
    if (product.specifications) {
      for (const [key, value] of Object.entries(product.specifications)) {
        if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('poids')) {
          weight = parseWeight(value);
          if (weight) {
            console.log(`[Parser] ⚖️ Weight from specifications: ${weight}kg`);
            return weight;
          }
        }
      }
    }

    // 4️⃣ Chercher dans les variantes
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.weight) {
          weight = parseWeight(variant.weight);
          if (weight) {
            console.log(`[Parser] ⚖️ Weight from variant: ${weight}kg`);
            return weight;
          }
        }
        if (variant.attributes) {
          for (const [key, value] of Object.entries(variant.attributes)) {
            if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('poids')) {
              weight = parseWeight(value);
              if (weight) {
                console.log(`[Parser] ⚖️ Weight from variant attributes: ${weight}kg`);
                return weight;
              }
            }
          }
        }
      }
    }

    // 5️⃣ Extraction depuis les dimensions avec densité intelligente
    const dimensions = this.extractDimensions(product);
    if (dimensions) {
      const volumeM3 = (dimensions.length * dimensions.width * dimensions.height) / 1000000;
      
      // Détecter le type de produit pour choisir la densité
      const productText = this.buildProductText(product);
      
      // Densités par type de produit (kg/m³)
      const density = this.detectMaterialDensity(productText);
      const fillFactor = this.detectFillFactor(productText);
      
      weight = volumeM3 * density * fillFactor;
      const roundedWeight = Math.round(weight * 1000) / 1000;
      
      console.log(`[Parser] ⚖️ Calculated from dimensions: ${roundedWeight}kg (density: ${density}, fill: ${fillFactor})`);
      return roundedWeight;
    }

    // 6️⃣ Estimation par catégorie
    const category = this.extractCategory(product)?.toLowerCase() || '';
    const categoryWeight = this.estimateWeightByCategory(category);
    if (categoryWeight) {
      console.log(`[Parser] ⚖️ Estimated by category: ${categoryWeight}kg`);
      return categoryWeight;
    }

    // 7️⃣ Fallback - analyser le titre
    const titleWeight = this.estimateWeightByTitle(product.title || product.name || '');
    if (titleWeight) {
      console.log(`[Parser] ⚖️ Estimated by title: ${titleWeight}kg`);
      return titleWeight;
    }

    console.log(`[Parser] ⚖️ No weight found for product`);
    return null;
  }

  /**
   * Construit un texte complet pour l'analyse
   */
  private buildProductText(product: AlibabaApiProduct): string {
    const parts = [
      product.title,
      product.name,
      product.category,
      product.categoryName,
      JSON.stringify(product.attributes),
      JSON.stringify(product.specifications)
    ];
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Détecte la densité du matériau (kg/m³)
   */
  private detectMaterialDensity(text: string): number {
    // Métaux
    if (text.includes('steel') || text.includes('acier')) return 7800;
    if (text.includes('iron') || text.includes('fer')) return 7800;
    if (text.includes('aluminum') || text.includes('aluminium')) return 2700;
    if (text.includes('copper') || text.includes('cuivre')) return 8900;
    if (text.includes('brass') || text.includes('laiton')) return 8500;
    if (text.includes('zinc')) return 7100;
    if (text.includes('titanium') || text.includes('titane')) return 4500;
    if (text.includes('metal')) return 7000;

    // Plastiques
    if (text.includes('plastic') || text.includes('plastique')) return 950;
    if (text.includes('pvc')) return 1400;
    if (text.includes('abs')) return 1050;
    if (text.includes('polycarbonate') || text.includes('pc')) return 1200;
    if (text.includes('acrylic') || text.includes('acrylique')) return 1190;
    if (text.includes('nylon')) return 1140;
    if (text.includes('polyester')) return 1390;
    if (text.includes('polyethylene') || text.includes('pe')) return 950;
    if (text.includes('polypropylene') || text.includes('pp')) return 900;
    if (text.includes('polystyrene') || text.includes('ps')) return 1050;
    if (text.includes('silicone')) return 1100;
    if (text.includes('rubber') || text.includes('caoutchouc')) return 1100;
    if (text.includes('eva')) return 950;
    if (text.includes('foam') || text.includes('mousse')) return 300;

    // Bois
    if (text.includes('wood') || text.includes('bois')) return 600;
    if (text.includes('bamboo') || text.includes('bambou')) return 400;
    if (text.includes('plywood') || text.includes('contreplaqué')) return 550;
    if (text.includes('mdf')) return 750;

    // Verre & Céramique
    if (text.includes('glass') || text.includes('verre')) return 2500;
    if (text.includes('ceramic') || text.includes('céramique')) return 2300;
    if (text.includes('porcelain') || text.includes('porcelaine')) return 2400;

    // Textiles
    if (text.includes('cotton') || text.includes('coton')) return 550;
    if (text.includes('leather') || text.includes('cuir')) return 900;
    if (text.includes('wool') || text.includes('laine')) return 350;
    if (text.includes('silk') || text.includes('soie')) return 400;
    if (text.includes('linen') || text.includes('lin')) return 500;
    if (text.includes('denim')) return 600;

    // Papier
    if (text.includes('paper') || text.includes('papier')) return 700;
    if (text.includes('cardboard') || text.includes('carton')) return 500;

    // Par défaut (densité moyenne)
    return 500;
  }

  /**
   * Détecte si le produit est creux ou solide
   */
  private detectFillFactor(text: string): number {
    // Mots-clés pour produits solides
    const solidKeywords = [
      'solid', 'massive', 'thick', 'heavy', 'épais', 'massif', 'solide',
      'block', 'brick', 'ingot', 'bar', 'rod', 'plate'
    ];
    
    // Mots-clés pour produits creux/légers
    const hollowKeywords = [
      'hollow', 'light', 'thin', 'foldable', 'inflatable', 'creux', 'léger',
      'shell', 'case', 'cover', 'bag', 'sac', 'pouch', 'envelope',
      'flexible', 'soft', 'tissu', 'fabric', 'cloth', 'textile'
    ];
    
    for (const kw of solidKeywords) {
      if (text.includes(kw)) return 0.8;
    }
    for (const kw of hollowKeywords) {
      if (text.includes(kw)) return 0.3;
    }
    
    // Par défaut : estimation moyenne
    if (text.includes('plastic') || text.includes('plastique')) return 0.5;
    if (text.includes('wood') || text.includes('bois')) return 0.6;
    if (text.includes('metal')) return 0.7;
    
    return 0.5;
  }

  /**
   * Estimation par catégorie (kg)
   */
  private estimateWeightByCategory(category: string): number | null {
    const cat = category.toLowerCase();
    
    // Électronique
    if (cat.includes('phone') || cat.includes('smartphone')) return 0.18;
    if (cat.includes('tablet') || cat.includes('ipad')) return 0.5;
    if (cat.includes('laptop') || cat.includes('ordinateur')) return 2.0;
    if (cat.includes('earphone') || cat.includes('écouteur')) return 0.05;
    if (cat.includes('headphone') || cat.includes('casque')) return 0.25;
    if (cat.includes('speaker') || cat.includes('enceinte')) return 0.5;
    if (cat.includes('charger') || cat.includes('chargeur')) return 0.1;
    if (cat.includes('cable') || cat.includes('câble')) return 0.05;
    if (cat.includes('watch') || cat.includes('montre')) return 0.08;
    if (cat.includes('camera') || cat.includes('appareil')) return 0.6;
    
    // Vêtements
    if (cat.includes('t-shirt') || cat.includes('shirt') || cat.includes('chemise')) return 0.2;
    if (cat.includes('dress') || cat.includes('robe')) return 0.3;
    if (cat.includes('jeans') || cat.includes('pantalon')) return 0.5;
    if (cat.includes('jacket') || cat.includes('veste')) return 0.7;
    if (cat.includes('coat') || cat.includes('manteau')) return 1.2;
    if (cat.includes('sweater') || cat.includes('pull')) return 0.4;
    if (cat.includes('hoodie') || cat.includes('sweat')) return 0.6;
    
    // Chaussures
    if (cat.includes('shoe') || cat.includes('chaussure')) {
      if (cat.includes('boot') || cat.includes('botte')) return 1.2;
      if (cat.includes('sneaker') || cat.includes('basket')) return 0.8;
      if (cat.includes('sandal') || cat.includes('sandale')) return 0.3;
      return 0.7;
    }
    
    // Accessoires
    if (cat.includes('bag') || cat.includes('sac')) {
      if (cat.includes('backpack') || cat.includes('sac à dos')) return 0.8;
      if (cat.includes('handbag') || cat.includes('sac à main')) return 0.5;
      if (cat.includes('purse') || cat.includes('portefeuille')) return 0.2;
      return 0.5;
    }
    if (cat.includes('belt') || cat.includes('ceinture')) return 0.2;
    if (cat.includes('hat') || cat.includes('casquette')) return 0.1;
    if (cat.includes('scarf') || cat.includes('écharpe')) return 0.15;
    if (cat.includes('glove') || cat.includes('gant')) return 0.1;
    if (cat.includes('sunglass') || cat.includes('lunette')) return 0.04;
    if (cat.includes('jewelry') || cat.includes('bijou')) return 0.05;
    
    return null;
  }

  /**
   * Estimation par analyse du titre
   */
  private estimateWeightByTitle(title: string): number | null {
    const t = title.toLowerCase();
    
    // Très légers
    if (t.includes('earring') || t.includes('boucle')) return 0.01;
    if (t.includes('ring') || t.includes('bague')) return 0.005;
    if (t.includes('sticker') || t.includes('autocollant')) return 0.02;
    if (t.includes('patch') || t.includes('écusson')) return 0.03;
    if (t.includes('pin') || t.includes('broche')) return 0.02;
    
    // Légers
    if (t.includes('t-shirt') || t.includes('tshirt')) return 0.2;
    if (t.includes('shirt') || t.includes('chemise')) return 0.25;
    if (t.includes('dress') || t.includes('robe')) return 0.3;
    if (t.includes('skirt') || t.includes('jupe')) return 0.25;
    if (t.includes('shorts') || t.includes('short')) return 0.2;
    
    // Moyens
    if (t.includes('pants') || t.includes('pantalon')) return 0.5;
    if (t.includes('jeans')) return 0.6;
    if (t.includes('sweater') || t.includes('pull')) return 0.4;
    if (t.includes('jacket') || t.includes('veste')) return 0.7;
    if (t.includes('shoes') || t.includes('chaussures')) return 0.8;
    if (t.includes('sneakers') || t.includes('baskets')) return 0.8;
    if (t.includes('boots') || t.includes('bottes')) return 1.2;
    
    // Lourds
    if (t.includes('laptop') || t.includes('ordinateur')) return 2.0;
    if (t.includes('tablet') || t.includes('tablette')) return 0.5;
    if (t.includes('speaker') || t.includes('enceinte')) return 0.5;
    if (t.includes('headphone') || t.includes('casque')) return 0.25;
    
    return null;
  }

  // ============================================================
  // AUTRES MÉTHODES (INCHANGÉES)
  // ============================================================

  private extractVideos(product: AlibabaApiProduct): RawVideo[] | undefined {
    const videos: RawVideo[] = [];

    // 1️⃣ Vidéo principale
    if (product.videoUrl) {
      videos.push({
        url: product.videoUrl.startsWith('//') ? 'https:' + product.videoUrl : product.videoUrl,
        type: 'main',
        source: 'alibaba'
      });
    }

    // 2️⃣ Tableau de vidéos
    if (product.videos && Array.isArray(product.videos)) {
      product.videos.forEach((v: any) => {
        if (v.url) {
          videos.push({
            url: v.url.startsWith('//') ? 'https:' + v.url : v.url,
            thumbnailUrl: v.thumbnail,
            duration: v.duration,
            type: 'gallery',
            source: 'alibaba'
          });
        }
      });
    }

    // 3️⃣ Vidéos dans la description
    if (product.description?.videos && Array.isArray(product.description.videos)) {
      product.description.videos.forEach((v: string) => {
        videos.push({
          url: v.startsWith('//') ? 'https:' + v : v,
          type: 'description',
          source: 'alibaba'
        });
      });
    }

    return videos.length > 0 ? videos : undefined;
  }

  private extractTitle(product: AlibabaApiProduct): string | null {
    // 1. Titre direct (format item_search)
    if (product.title) return product.title.trim();
    
    // 2. Nom (format alternatif)
    if (product.name) return product.name.trim();
    
    // 3. Titre dans item (format item_detail après enrichissement)
    if (product.item?.title) return product.item.title.trim();
    
    // 4. Chercher dans les variantes
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.attributes?.title) return variant.attributes.title;
        if (variant.attributes?.name) return variant.attributes.name;
        if (variant.title) return variant.title;
        if (variant.name) return variant.name;
      }
    }
    
    // 5. Utiliser l'ID comme dernier recours
    if (product.itemId) return `Product ${product.itemId}`;
    if (product.id) return `Product ${product.id}`;
    
    return null;
  }

  private extractVariantsAndPricing(product: AlibabaApiProduct): {
    variants: ParsedVariant[];
    priceTiers?: { minQuantity: number; maxQuantity: number; price: number; unit?: string; }[];
  } {
    const variants: ParsedVariant[] = [];
    let priceTiers: { minQuantity: number; maxQuantity: number; price: number; unit?: string; }[] = [];

    // ============================================================
    // 1️⃣ PRIORITÉ MAXIMALE: Utiliser les variantes déjà préparées par DetailCollector
    // ============================================================
    if (product.variants && product.variants.length > 0) {
      console.log(`[Parser] 📦 Found ${product.variants.length} pre-extracted variants from DetailCollector`);
      
      // Extraire les priceTiers si disponibles
      if (product.sku?.def?.priceModule?.priceList) {
        priceTiers = product.sku.def.priceModule.priceList.map((tier: any) => ({
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity === -1 ? Infinity : tier.maxQuantity,
          price: parseFloat(tier.price),
          unit: tier.unit || product.sku?.def?.unitModule?.single || 'piece',
        }));
      }

      // Convertir les variantes existantes au format ParsedVariant
      product.variants.forEach((v: any) => {
        variants.push({
          externalSkuId: v.skuId?.toString() || v.sku_id?.toString() || `var_${variants.length}`,
          price: v.price || 0,
          currency: v.currency || product.currency || 'USD',
          stock: v.stock || 100,
          attributes: v.attributes || {},
          image: v.image,
          images: v.images || (v.image ? [v.image] : []),
        });
      });

      console.log(`[Parser] ✓ Using ${variants.length} real variants with ${priceTiers.length} price tiers`);
      return { variants, priceTiers };
    }

    // ============================================================
    // 2️⃣ SINON: Extraire depuis sku.base et sku.props (construction manuelle)
    // ============================================================
    if (product.sku?.base && product.sku?.props) {
      const baseSkus = product.sku.base;
      const props = product.sku.props;
      
      // Créer un mapping des propriétés par ID
      const propMap: Record<string, { name: string; value: string; image?: string }> = {};
      props.forEach((prop: any) => {
        prop.values.forEach((val: any) => {
          propMap[val.id] = {
            name: prop.name,
            value: val.name,
            image: val.image
          };
        });
      });

      // Extraire les prix par quantité (communs à toutes les variantes)
      if (product.sku?.def?.priceModule?.priceList) {
        priceTiers = product.sku.def.priceModule.priceList.map((tier: any) => ({
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity === -1 ? Infinity : tier.maxQuantity,
          price: parseFloat(tier.price),
          unit: tier.unit || product.sku?.def?.unitModule?.single || 'piece',
        }));
      }

      // Construire chaque variante
      baseSkus.forEach((sku: any) => {
        if (!sku.skuId) return;

        // Décoder le propMap (ex: "191284014:26762339;191286172:461058311;191288010:-1")
        const attributes: Record<string, any> = {};
        const propPairs = sku.propMap.split(';');
        
        propPairs.forEach((pair: string) => {
          const [propId, valueId] = pair.split(':');
          const fullId = `${propId}:${valueId}`;
          const propInfo = propMap[fullId];
          
          if (propInfo) {
            const key = propInfo.name
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '');
            
            attributes[key] = propInfo.value;
            
            // Si c'est une couleur, garder l'image
            if (propInfo.name.toLowerCase().includes('color') && propInfo.image) {
              attributes[`${key}_image`] = propInfo.image;
            }
          }
        });

        // Prix de base (prendre le premier palier comme référence)
        const basePrice = priceTiers.length > 0 ? priceTiers[0].price : 0;

        variants.push({
          externalSkuId: sku.skuId.toString(),
          price: basePrice,
          currency: product.currency || "USD",
          stock: 100,
          attributes,
          image: attributes.color_image || 
                 this.findVariantImage(product, attributes) || 
                 product.images?.[0],
        });
      });

      console.log(`[Parser] ✓ Extracted ${variants.length} real variants from sku data with ${priceTiers.length} price tiers`);
      return { variants, priceTiers };
    } 
    
    // ============================================================
    // 3️⃣ SINON: Créer des variantes à partir des prix (quantity-based)
    // ============================================================
    else {
      const priceList = product.sku?.def?.priceModule?.priceList;
      if (Array.isArray(priceList) && priceList.length > 0) {
        priceList.forEach((tier: any, index: number) => {
          const price = parseFloat(tier.price);
          if (isNaN(price)) return;

          variants.push({
            externalSkuId: `${product.itemId || product.id}_tier_${index}`,
            price,
            currency: product.currency || "USD",
            stock: 100,
            attributes: {
              minQuantity: tier.minQuantity,
              maxQuantity: tier.maxQuantity === -1 ? Infinity : tier.maxQuantity,
              unit: tier.unit || 'piece',
              quantityFormatted: tier.quantityFormatted,
            },
            image: product.images?.[0] || product.image,
          });
        });

        console.log(`[Parser] ✓ Extracted ${variants.length} quantity-based variants (no real variants)`);
      }
    }

    return { variants, priceTiers };
  }

  private findVariantImage(product: AlibabaApiProduct, attributes: Record<string, any>): string | undefined {
    if (product.sku?.props) {
      for (const prop of product.sku.props) {
        if (prop.name.toLowerCase().includes('color')) {
          for (const val of prop.values) {
            if (val.name === attributes.color || val.name === attributes.couleur) {
              return val.image;
            }
          }
        }
      }
    }
    return undefined;
  }

  private extractId(product: AlibabaApiProduct): string | null {
    if (product.itemId) return product.itemId.toString();
    if (product.id) return product.id.toString();
    if (product.productId) return product.productId.toString();
    if (product.product_id) return product.product_id.toString();
    if (product.item?.itemId) return product.item.itemId.toString();
    return null;
  }

  private extractDimensions(product: AlibabaApiProduct): { length: number; width: number; height: number } | null {
    if (product.attributes) {
      const attrs = product.attributes as Record<string, any>;
      for (const [key, value] of Object.entries(attrs)) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('dimension') || keyLower.includes('size') || keyLower.includes('taille')) {
          const dims = this.parseDimensionsString(value?.toString() || '');
          if (dims) return dims;
        }
      }
    }
    return null;
  }

  private parseDimensionsString(str: string): { length: number; width: number; height: number } | null {
    const match = str.match(/(\d+)[xX×](\d+)[xX×](\d+)/);
    if (match) {
      return {
        length: parseFloat(match[1]),
        width: parseFloat(match[2]),
        height: parseFloat(match[3])
      };
    }
    return null;
  }

  private extractVolume(product: AlibabaApiProduct): number | null {
    let volume = parseVolume(product.volume) || parseVolume(product.productVolume);
    if (volume) return volume;

    const dimensions = this.extractDimensions(product);
    if (dimensions) {
      return (dimensions.length * dimensions.width * dimensions.height) / 1000000;
    }

    return null;
  }

  private extractImages(product: AlibabaApiProduct): string[] {
    const images = new Set<string>();

    if (Array.isArray(product.images)) {
      product.images.forEach(img => this.addImage(images, img));
    }

    if (Array.isArray(product.rawImages)) {
      product.rawImages.forEach(img => this.addImage(images, img));
    }

    if (product.image) this.addImage(images, product.image);
    if (product.mainImage) this.addImage(images, product.mainImage);
    if (product.main_image) this.addImage(images, product.main_image);
    if (product.imageUrl) this.addImage(images, product.imageUrl);
    if (product.image_url) this.addImage(images, product.image_url);

    if (product.variants) {
      product.variants.forEach(v => {
        if (v.image) this.addImage(images, v.image);
        if (v.imageUrl) this.addImage(images, v.imageUrl);
      });
    }

    if (product.description?.images && Array.isArray(product.description.images)) {
      product.description.images.forEach(img => this.addImage(images, img));
    }

    return cleanImages(Array.from(images));
  }

  private extractDefaultImage(product: AlibabaApiProduct): string {
    if (product.image) return this.normalizeImageUrl(product.image);
    if (product.item?.image) return this.normalizeImageUrl(product.item.image);
    return 'https://via.placeholder.com/300?text=No+Image';
  }

  private addImage(images: Set<string>, url: string): void {
    if (!url) return;
    images.add(this.normalizeImageUrl(url));
  }

  private normalizeImageUrl(url: string): string {
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return 'https://www.alibaba.com' + url;
    return url;
  }

  private extractPrices(product: AlibabaApiProduct): {
    minPrice: number | null;
    maxPrice: number | null;
    currency: string;
  } {
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    const currency = product.currency || 'USD';

    const priceList = product.sku?.def?.priceModule?.priceList;
    if (Array.isArray(priceList) && priceList.length > 0) {
      const prices = priceList
        .map(p => parseFloat(p.price))
        .filter(p => !isNaN(p));
      
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
      }
    }

    if (!minPrice && product.sku?.def?.priceModule?.price) {
      const priceStr = product.sku.def.priceModule.price;
      const prices = priceStr
        .split('-')
        .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
        .filter(p => !isNaN(p));
      
      if (prices.length === 2) {
        minPrice = prices[0];
        maxPrice = prices[1];
      } else if (prices.length === 1) {
        minPrice = maxPrice = prices[0];
      }
    }

    if (!minPrice) {
      minPrice = parsePrice(product.price) || parsePrice(product.minPrice);
    }
    if (!maxPrice) {
      maxPrice = parsePrice(product.maxPrice) || minPrice;
    }

    return { minPrice, maxPrice, currency };
  }

  private extractDescription(product: AlibabaApiProduct): string | undefined {
    if (product.description) {
      if (typeof product.description === 'object' && product.description.html) {
        return this.cleanHtml(product.description.html);
      }
      if (typeof product.description === 'string') {
        return this.cleanHtml(product.description);
      }
    }
    return undefined;
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractCategory(product: AlibabaApiProduct): string | undefined {
    return product.category || 
           product.categoryName || 
           product.category_name || 
           product.item?.categoryName ||
           undefined;
  }

  private extractAttributes(product: AlibabaApiProduct): Record<string, unknown> | undefined {
    const attrs: Record<string, unknown> = {};

    if (product.attributes) {
      Object.assign(attrs, product.attributes);
    }

    if (product.specifications) {
      Object.assign(attrs, product.specifications);
    }

    if (product.properties?.list && Array.isArray(product.properties.list)) {
      product.properties.list.forEach((prop: any) => {
        if (prop.name && prop.value) {
          const key = prop.name
            .toLowerCase()
            .replace(/[:\s]+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          attrs[key] = prop.value;
        }
      });
    }

    const moq = product.moq || 
                product.minOrderQuantity || 
                product.min_order_quantity ||
                product.sku?.def?.quantityModule?.minOrder?.quantity;
    if (moq) attrs.moq = moq;

    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  private extractShopId(product: AlibabaApiProduct): string | undefined {
    const shopId = product.shopId || 
                   product.shop_id || 
                   product.sellerId || 
                   product.seller_id ||
                   product.seller?.sellerId;
    return shopId?.toString() || undefined;
  }

  private extractSkuId(product: AlibabaApiProduct): string | undefined {
    if (product.skuId) return product.skuId.toString();
    if (product.sku_id) return product.sku_id.toString();

    const variants = product.variants || product.skus;
    if (variants && variants.length > 0) {
      if (variants[0].skuId) return variants[0].skuId.toString();
      if (variants[0].sku_id) return variants[0].sku_id.toString();
    }

    if (product.itemId) return `${product.itemId}_default`;
    if (product.id) return `${product.id}_default`;

    return undefined;
  }

  private extractUrl(product: AlibabaApiProduct): string | undefined {
    const url = product.productUrl || 
                product.product_url || 
                product.url || 
                product.itemUrl ||
                product.item?.itemUrl;
    
    if (!url) return undefined;
    
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return 'https://www.alibaba.com' + url;
    return url;
  }
}