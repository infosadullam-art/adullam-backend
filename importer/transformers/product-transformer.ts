// ============================================================
// Product Transformer for Adullam
// Converts ParsedRawProduct -> CleanProductData
// OPTIMIZED FOR: Professional cleaning at scale
// VERSION: 4.0 - Industrial-grade text cleaning
// ============================================================

import { CONFIG } from "../config";
import type { ParsedRawProduct, CleanProductData, ParsedVariant } from "../config/types";
import { applyMargin, stripHtml, extractKeywords, cleanImages } from "../utils";

// Structure hiérarchique des catégories
export interface CategoryNode {
  name: string;
  keywords: string[];
  subcategories?: CategoryNode[];
}

// Arbre des catégories avec mots-clés
const CATEGORY_TREE: CategoryNode[] = [
  {
    name: "Électronique",
    keywords: ["electronique", "electronic", "electro", "gadget", "tech"],
    subcategories: [
      {
        name: "Téléphones",
        keywords: ["telephone", "phone", "smartphone", "mobile", "cellulaire", "iphone", "samsung", "xiaomi", "huawei"],
      },
      {
        name: "Audio",
        keywords: ["audio", "son", "ecouteur", "earphone", "headphone", "casque", "speaker", "enceinte", "airpod", "bluetooth speaker"],
        subcategories: [
          { name: "Écouteurs", keywords: ["ecouteur", "earphone", "airpod", "earbud"] },
          { name: "Casques", keywords: ["casque", "headphone", "headset"] },
          { name: "Enceintes", keywords: ["enceinte", "speaker", "soundbar"] },
        ]
      },
      {
        name: "Accessoires Téléphone",
        keywords: ["accessoire telephone", "phone accessory", "coque", "case", "protection", "chargeur", "charger", "cable", "câble", "support", "holder"],
      },
      {
        name: "Wearables",
        keywords: ["wearable", "montre", "watch", "bracelet", "fitness", "smartwatch", "connected"],
      },
    ]
  },
  {
    name: "Mode",
    keywords: ["mode", "fashion", "vêtement", "cloth", "shirt", "chemise", "pantalon", "pants", "jean"],
    subcategories: [
      {
        name: "Vêtements Homme",
        keywords: ["homme", "men", "masculin", "t-shirt homme", "chemise homme", "pantalon homme"],
      },
      {
        name: "Vêtements Femme",
        keywords: ["femme", "women", "féminin", "robe", "dress", "jupe", "skirt", "blouse"],
      },
      {
        name: "Chaussures",
        keywords: ["chaussure", "shoe", "basket", "sneaker", "botte", "boot"],
      },
      {
        name: "Sacs",
        keywords: ["sac", "bag", "backpack", "sac à dos", "handbag", "maroquinerie"],
      },
    ]
  },
  {
    name: "Maison",
    keywords: ["maison", "home", "cuisine", "kitchen", "décoration", "decor", "meuble", "furniture"],
    subcategories: [
      {
        name: "Cuisine",
        keywords: ["cuisine", "kitchen", "ustensile", "casserole", "poêle", "pan", "couteau", "knife"],
      },
      {
        name: "Décoration",
        keywords: ["décoration", "decor", "lampe", "lamp", "coussin", "cushion", "rideau", "curtain"],
      },
      {
        name: "Rangement",
        keywords: ["rangement", "storage", "étagère", "shelf", "boîte", "box", "organisateur"],
      },
    ]
  },
  {
    name: "Beauté",
    keywords: ["beauté", "beauty", "cosmétique", "cosmetic", "maquillage", "makeup", "soin", "skin care"],
    subcategories: [
      {
        name: "Maquillage",
        keywords: ["maquillage", "makeup", "rouge à lèvres", "lipstick", "fond de teint", "foundation"],
      },
      {
        name: "Soin du visage",
        keywords: ["soin visage", "face care", "crème", "cream", "sérum", "serum"],
      },
      {
        name: "Parfums",
        keywords: ["parfum", "perfume", "eau de toilette"],
      },
    ]
  },
  {
    name: "Sports",
    keywords: ["sport", "fitness", "exercice", "entrainement", "gym", "yoga"],
    subcategories: [
      {
        name: "Fitness",
        keywords: ["fitness", "musculation", "poids", "weight", "haltere", "dumbbell"],
      },
      {
        name: "Sports d'extérieur",
        keywords: ["extérieur", "outdoor", "camping", "randonnée", "hiking"],
      },
      {
        name: "Vêtements de sport",
        keywords: ["vêtement sport", "sportswear", "legging", "short sport"],
      },
    ]
  },
  {
    name: "Jouets",
    keywords: ["jouet", "toy", "jeu", "game", "puzzle", "peluche", "plush"],
    subcategories: [
      {
        name: "Jeux éducatifs",
        keywords: ["éducatif", "educational", "apprentissage", "learning"],
      },
      {
        name: "Peluches",
        keywords: ["peluche", "plush", "doudou"],
      },
    ]
  },
  {
    name: "Auto-Moto",
    keywords: ["auto", "moto", "car", "voiture", "accessoire auto", "car accessory"],
    subcategories: [
      {
        name: "Accessoires intérieur",
        keywords: ["intérieur", "interior", "tapis", "mat", "siège", "seat"],
      },
      {
        name: "Accessoires extérieur",
        keywords: ["extérieur", "exterior", "phare", "light", "rétroviseur", "mirror"],
      },
    ]
  }
];

export interface CleanVariantData {
  externalSkuId: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  weight?: number | null;
  attributes: Record<string, any>;
  image?: string;
  images?: string[];
  variantType: 'attribute' | 'quantity' | 'other';
  specifications: Record<string, any>;
}

export interface EnhancedCleanProductData extends CleanProductData {
  variants: CleanVariantData[];
  priceTiers?: {
    minQuantity: number;
    maxQuantity: number;
    price: number;
    unit?: string;
  }[];
  specifications: {
    label: string;
    value: string;
  }[];
  features: string[];
  boxContents: string[];
  seoSlug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  categoryPath: {           
    main: string;
    sub?: string;
    subsub?: string;
  };
  brand?: string;
  transformerVersion: string;
}

export class ProductTransformer {
  private readonly VERSION = '4.0.0';

  /**
   * Transform a validated ParsedRawProduct into EnhancedCleanProductData.
   */
  transform(product: ParsedRawProduct, rawProductId: string): EnhancedCleanProductData {
    const brand = this.extractBrand(product);
    
    // ✅ Titre propre (sans HTML/CSS)
    const cleanedTitle = this.cleanTitle(product.rawTitle);
    
    // ✅ SEO title optimisé
    const seoTitle = this.generateSeoTitle(cleanedTitle, brand);
    
    const categoryPath = this.detectCategoryPath(product);
    const suggestedCat = categoryPath.subsub || categoryPath.sub || categoryPath.main;

    // ✅ Description propre (sans HTML/CSS) - conserve le tableau Alibaba
    const cleanedDesc = product.rawDescription
      ? this.cleanDescription(product.rawDescription)
      : undefined;

    const supplierPrice = product.rawMinPrice;
    const suggestedPrice = applyMargin(supplierPrice, CONFIG.pricing.marginPercent);

    const metaTitle = this.generateMetaTitle(seoTitle, brand);
    const metaDescription = this.generateMetaDescription(seoTitle, cleanedDesc);
    const metaKeywords = this.generateMetaKeywords(product, seoTitle, brand, categoryPath);
    const seoSlug = this.generateSeoSlug(seoTitle);

    const cleanedImages = cleanImages(product.rawImages);

    const { variants, priceTiers } = this.transformVariants(product.variants || []);
    
    // ✅ Extraction des spécifications depuis le tableau Alibaba
    const specifications = this.extractSpecifications(product, variants, brand);
    
    // ✅ Extraction des features (caractéristiques principales)
    const features = this.extractFeatures(product, variants);
    
    // ✅ Extraction du contenu de la boîte
    const boxContents = this.extractBoxContents(product, variants);

    const qualityScore = this.calculateQualityScore(
      product, 
      cleanedImages, 
      variants,
      brand,
      categoryPath
    );

    return {
      rawProductId,
      cleanedTitle,
      cleanedDesc,        // ✅ Description complète avec tableau conservé
      seoTitle,
      seoDescription: metaDescription,
      seoKeywords: metaKeywords,
      cleanedImages,
      mockupImages: [],
      suggestedPrice,
      suggestedCat,
      suggestedMarginPercent: CONFIG.pricing.marginPercent,
      qualityScore,
      variants,
      priceTiers,
      specifications,      // ✅ Spécifications extraites du tableau
      features,            // ✅ Features extraites
      boxContents,         // ✅ Contenu boîte extrait
      seoSlug,
      metaTitle,
      metaDescription,
      metaKeywords,
      categoryPath,
      brand,
      weight: product.weight,
      transformerVersion: this.VERSION,
    };
  }

  /**
   * ✅ NETTOYAGE INDUSTRIEL DES TITRES
   */
  private cleanTitle(rawTitle: string): string {
    if (!rawTitle) return '';
    
    try {
      let title = rawTitle;
      
      // 1. Enlever les tags HTML
      title = title.replace(/<[^>]*>/g, ' ');
      
      // 2. Enlever les entités HTML
      title = title.replace(/&[a-z]+;/g, ' ');
      
      // 3. Enlever le CSS (propriétés entre {})
      title = title.replace(/\{[^}]*\}/g, ' ');
      
      // 4. Enlever les classes .magic-*
      title = title.replace(/\.magic-[\d]+/g, ' ');
      
      // 5. Enlever les ID css
      title = title.replace(/#[a-zA-Z0-9_-]+/g, ' ');
      
      // 6. Enlever les chiffres isolés
      title = title.replace(/\b\d+\b/g, ' ');
      
      // 7. Normaliser les espaces
      title = title.replace(/\s+/g, ' ').trim();
      
      // 8. Capitaliser la première lettre
      if (title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      }
      
      return title || rawTitle.substring(0, 100);
      
    } catch (error) {
      console.warn("[Transformer] Error cleaning title:", error);
      return rawTitle.substring(0, 100);
    }
  }

  /**
   * ✅ NETTOYAGE DES DESCRIPTIONS - CONSERVE LE TABLEAU ALIBABA
   */
  private cleanDescription(rawDescription: string): string {
    if (!rawDescription) return '';
    
    try {
      let desc = rawDescription;
      
      // 1. Enlever tous les tags HTML MAIS GARDER LE TEXTE
      desc = desc.replace(/<[^>]*>/g, '');
      
      // 2. Enlever les entités HTML (&nbsp;, &amp;, etc.) en les remplaçant par des espaces
      desc = desc.replace(/&[a-z]+;/g, ' ');
      
      // 3. Enlever TOUT le CSS (sélecteurs .magic-* et propriétés entre {})
      desc = desc.replace(/\.magic-[\d]+\s*{[^}]*}/g, '');
      desc = desc.replace(/#[a-zA-Z0-9_-]+\s*{[^}]*}/g, '');
      desc = desc.replace(/@[^{]+{[^}]*}/g, '');
      desc = desc.replace(/\{[^}]*\}/g, '');
      
      // 4. Enlever les classes CSS isolées
      desc = desc.replace(/\.magic-[\d]+/g, '');
      
      // 5. Enlever les ID CSS
      desc = desc.replace(/#[a-zA-Z0-9_-]+/g, '');
      
      // 6. Normaliser les espaces et retours à la ligne (garder la structure)
      desc = desc.replace(/[ \t]+/g, ' '); // Espaces multiples → un seul espace
      desc = desc.replace(/\n\s*\n\s*\n/g, '\n\n'); // 3+ sauts de ligne → 2 sauts
      
      // 7. Conserver les tableaux (caractères | et - pour les séparateurs)
      // NE PAS SUPPRIMER LES | ET - CAR C'EST LA STRUCTURE DU TABLEAU
      
      return desc.trim();
      
    } catch (error) {
      console.warn("[Transformer] Error cleaning description:", error);
      return rawDescription.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  /**
   * ✅ GÉNÈRE UN TITRE SEO OPTIMISÉ
   */
  private generateSeoTitle(cleanedTitle: string, brand?: string): string {
    // Mots à supprimer (stop words)
    const stopWords = [
      'nouveau', 'nouvelle', 'new', 'hot', 'sale', 'vente', 'promo', 'promotion',
      'meilleur', 'best', 'top', 'qualité', 'quality', 'original', 'authentique',
      'prix', 'price', 'pas cher', 'cheap', 'discount', 'offre', 'offer',
      'gratuit', 'free', 'livraison', 'shipping', 'dropshipping', 'wholesale',
      '2024', '2025', '2026', 'dernier', 'last', 'modèle', 'model', 'type'
    ];

    let title = cleanedTitle;

    // Si on a la marque, on l'enlève temporairement pour éviter la répétition
    if (brand) {
      title = title.replace(new RegExp(brand, 'gi'), '').trim();
    }

    // Nettoyer les stop words
    stopWords.forEach(word => {
      title = title.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });

    // Garder les mots importants (max 5-6 mots)
    const words = title
      .split(/[\s,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 2)
      .filter(w => !/^\d+$/.test(w))
      .slice(0, 6);

    // Reconstruire le titre
    let finalTitle = words.join(' ');
    
    // Ajouter la marque au début
    if (brand) {
      finalTitle = `${brand} ${finalTitle}`;
    }

    return finalTitle || (brand || 'Produit');
  }

  /**
   * ✅ TRANSFORMATION INTELLIGENTE DES VARIANTES
   */
  private transformVariants(variants: ParsedVariant[]): { 
    variants: CleanVariantData[]; 
    priceTiers?: { minQuantity: number; maxQuantity: number; price: number; unit?: string; }[] 
  } {
    const cleanVariants: CleanVariantData[] = [];
    const priceTiers: { minQuantity: number; maxQuantity: number; price: number; unit?: string; }[] = [];

    const VARIANT_KEYWORDS = [
      'color', 'colour', 'couleur',
      'size', 'taille', 'dimension',
      'material', 'matériau', 'matiere',
      'pattern', 'motif',
      'style', 'fit', 'coupe',
      'sleeve', 'manche', 'length', 'longueur',
      'capacity', 'capacité', 'storage', 'mémoire',
      'model', 'modèle',
      'edition', 'édition',
      'design', 'shape', 'forme',
      'finish', 'finition',
      'grade', 'qualité'
    ];

    for (const v of variants) {
      const attributes = v.attributes || {};
      const attributeKeys = Object.keys(attributes);
      
      const name = v.name || this.generateVariantName(attributes);
      let variantType: 'attribute' | 'quantity' | 'other' = 'other';

      if (attributes.minQuantity !== undefined) {
        variantType = 'quantity';
        
        priceTiers.push({
          minQuantity: attributes.minQuantity,
          maxQuantity: attributes.maxQuantity === -1 ? Infinity : attributes.maxQuantity,
          price: v.price,
          unit: attributes.unit || 'piece'
        });
      } else {
        const hasVariantKeyword = attributeKeys.some(key => 
          VARIANT_KEYWORDS.some(keyword => key.toLowerCase().includes(keyword))
        );
        
        if (hasVariantKeyword || attributeKeys.length > 0) {
          variantType = 'attribute';
        }
      }

      // Nettoyer les attributs
      const cleanAttributes: Record<string, any> = {};
      Object.entries(attributes).forEach(([key, value]) => {
        // Nettoyer la clé
        const cleanKey = key
          .toLowerCase()
          .replace(/[:\s]+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        
        // Nettoyer la valeur si c'est une string
        let cleanValue = value;
        if (typeof value === 'string') {
          cleanValue = value
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        cleanAttributes[cleanKey] = cleanValue;
      });

      cleanVariants.push({
        externalSkuId: v.externalSkuId,
        name,
        price: v.price,
        currency: v.currency || 'USD',
        stock: v.stock || 0,
        weight: v.weight,
        attributes: cleanAttributes,
        variantType,
        specifications: cleanAttributes,
        image: v.image,
        images: v.images,
      });
    }

    return {
      variants: cleanVariants,
      priceTiers: priceTiers.length > 0 ? priceTiers : undefined,
    };
  }

  /**
   * ✅ GÉNÈRE UN NOM LISIBLE POUR LA VARIANTE
   */
  private generateVariantName(attributes: any): string {
    if (!attributes || Object.keys(attributes).length === 0) {
      return 'Default';
    }

    if (attributes.minQuantity !== undefined) {
      const minQty = attributes.minQuantity;
      const maxQty = attributes.maxQuantity;
      const unit = attributes.unit || 'pièces';
      
      if (maxQty === -1) {
        return `≥ ${minQty} ${unit}`;
      } else {
        return `${minQty} - ${maxQty} ${unit}`;
      }
    }

    const priorityAttributes = [
      'color', 'colour', 'couleur',
      'size', 'taille',
      'material', 'matériau',
      'capacity', 'capacité'
    ];

    const parts: string[] = [];
    
    for (const priority of priorityAttributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (key.toLowerCase().includes(priority) && value) {
          parts.push(String(value).trim());
          break;
        }
      }
    }

    if (parts.length > 0) {
      return parts.join(' - ');
    }

    const firstValue = Object.values(attributes)[0];
    return firstValue ? String(firstValue).trim() : 'Default';
  }

  /**
   * ✅ EXTRAIT LES SPÉCIFICATIONS DU TABLEAU ALIBABA
   */
  private extractSpecifications(
    product: ParsedRawProduct,
    variants: CleanVariantData[],
    brand?: string
  ): { label: string; value: string }[] {
    const specs: { label: string; value: string }[] = [];

    if (brand) {
      specs.push({ label: 'Marque', value: brand });
    }

    // Extraire les spécifications depuis la description (tableau Alibaba)
    if (product.rawDescription) {
      const desc = product.rawDescription;
      
      // Chercher les tableaux au format Alibaba (lignes avec |)
      const tableLines = desc.split('\n').filter(line => line.includes('|'));
      
      for (const line of tableLines) {
        // Format: | Caractéristique | Valeur |
        const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 2) {
          // Nettoyer les caractères spéciaux
          const label = parts[0].replace(/[#*_]/g, '').trim();
          const value = parts[1].replace(/[#*_]/g, '').trim();
          
          if (label && value && label.length < 50 && value.length < 100) {
            specs.push({ label, value });
          }
        }
      }
      
      // Si pas de tableau, chercher les paires clé:valeur
      if (specs.length === 0) {
        const lines = desc.split('\n');
        for (const line of lines) {
          // Format: "Clé: Valeur" ou "Clé - Valeur"
          const colonMatch = line.match(/^[•\-\*]?\s*([^:]+):\s*(.+)$/);
          if (colonMatch) {
            const label = colonMatch[1].trim();
            const value = colonMatch[2].trim();
            if (label && value && label.length < 50 && value.length < 100) {
              specs.push({ label, value });
            }
          } else {
            const dashMatch = line.match(/^[•\-\*]?\s*([^-]+)[-–—]\s*(.+)$/);
            if (dashMatch) {
              const label = dashMatch[1].trim();
              const value = dashMatch[2].trim();
              if (label && value && label.length < 50 && value.length < 100) {
                specs.push({ label, value });
              }
            }
          }
        }
      }
    }

    // Si pas de specs trouvées, utiliser les attributs
    if (specs.length === 0 && product.rawAttributes) {
      const attrs = product.rawAttributes as Record<string, any>;
      for (const [key, value] of Object.entries(attrs)) {
        if (key && value && typeof value === 'string' && value.length < 100) {
          specs.push({ 
            label: key.charAt(0).toUpperCase() + key.slice(1), 
            value: String(value) 
          });
        }
      }
    }

    return specs;
  }

  /**
   * ✅ EXTRAIT LES CARACTÉRISTIQUES PRINCIPALES
   */
  private extractFeatures(
    product: ParsedRawProduct,
    variants: CleanVariantData[]
  ): string[] {
    const features: string[] = [];

    // Chercher dans la description les lignes avec des puces
    if (product.rawDescription) {
      const lines = product.rawDescription.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Détecter les lignes qui commencent par •, -, *, ou des chiffres avec points
        if (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
          // Enlever le symbole de puce
          const feature = trimmed.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
          if (feature && feature.length < 100 && !features.includes(feature)) {
            features.push(feature);
          }
        }
      }
    }

    // Limiter à 8 caractéristiques max
    return features.slice(0, 8);
  }

  /**
   * ✅ EXTRAIT LE CONTENU DE LA BOÎTE
   */
  private extractBoxContents(
    product: ParsedRawProduct,
    variants: CleanVariantData[]
  ): string[] {
    const contents: string[] = [];

    // Chercher dans la description la section "Contenu de la boîte" ou similaire
    if (product.rawDescription) {
      const desc = product.rawDescription;
      
      // Chercher des sections comme "Contenu de la boîte", "Package includes", etc.
      const boxSectionMatch = desc.match(/(?:Contenu de la bo[îi]te|Package includes|What'?s in the box|Includes|Contenu)[\s:]*(.*?)(?=\n\s*\n|$)/is);
      
      if (boxSectionMatch && boxSectionMatch[1]) {
        const section = boxSectionMatch[1];
        const lines = section.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          // Détecter les lignes avec des puces ou des numéros
          if (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
            const item = trimmed.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
            if (item && item.length < 100) {
              contents.push(item);
            }
          } else if (trimmed.match(/\d+\s*x\s+/i) || trimmed.match(/\d+\s+[a-zA-Z]/)) {
            // Détecter les formats comme "1x écouteurs" ou "1 paire"
            if (trimmed.length < 100) {
              contents.push(trimmed);
            }
          }
        }
      }
    }

    return contents;
  }

  private generateMetaDescription(title: string, description?: string): string {
    const base = description || title;
    let metaDesc = base
      .replace(/\s+/g, ' ')
      .trim();
    
    if (metaDesc.length > 155) {
      metaDesc = metaDesc.slice(0, 152) + '...';
    }
    
    return metaDesc;
  }

  private extractBrand(product: ParsedRawProduct): string | undefined {
    if (product.rawAttributes) {
      const attrs = product.rawAttributes as Record<string, any>;
      const brandKeys = ['brand', 'marque', 'Marke', 'marca', 'бренд'];
      
      for (const key of brandKeys) {
        if (attrs[key]) {
          return String(attrs[key]).trim();
        }
        for (const [attrKey, value] of Object.entries(attrs)) {
          if (attrKey.toLowerCase() === key) {
            return String(value).trim();
          }
        }
      }
    }

    const title = product.rawTitle;
    const commonBrands = [
      'samsung', 'apple', 'huawei', 'xiaomi', 'oppo', 'vivo', 'oneplus',
      'nokia', 'sony', 'lg', 'panasonic', 'philips', 'bose', 'jbl',
      'beats', 'anker', 'belkin', 'logitech', 'dell', 'hp', 'lenovo',
      'asus', 'acer', 'msi', 'gigabyte', 'canon', 'nikon', 'fujifilm'
    ];

    for (const brand of commonBrands) {
      if (title.toLowerCase().includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }

    return undefined;
  }

  private detectCategoryPath(product: ParsedRawProduct): { main: string; sub?: string; subsub?: string } {
    const textToAnalyze = [
      product.rawTitle,
      product.rawDescription,
      JSON.stringify(product.rawAttributes)
    ].join(' ').toLowerCase();

    let bestMatch = { main: 'Autre', score: 0 };
    let bestSubMatch = { sub: undefined as string | undefined, score: 0 };
    let bestSubSubMatch = { subsub: undefined as string | undefined, score: 0 };

    for (const mainCat of CATEGORY_TREE) {
      let mainScore = 0;
      for (const keyword of mainCat.keywords) {
        if (textToAnalyze.includes(keyword)) mainScore += 1;
        if (product.rawTitle.toLowerCase().includes(keyword)) mainScore += 2;
      }

      if (mainScore > bestMatch.score) {
        bestMatch = { main: mainCat.name, score: mainScore };
      }

      if (mainCat.subcategories) {
        for (const subCat of mainCat.subcategories) {
          let subScore = 0;
          for (const keyword of subCat.keywords) {
            if (textToAnalyze.includes(keyword)) subScore += 1;
            if (product.rawTitle.toLowerCase().includes(keyword)) subScore += 2;
          }

          if (subScore > bestSubMatch.score) {
            bestSubMatch = { sub: subCat.name, score: subScore };
          }

          if (subCat.subcategories) {
            for (const subSubCat of subCat.subcategories) {
              let subSubScore = 0;
              for (const keyword of subSubCat.keywords) {
                if (textToAnalyze.includes(keyword)) subSubScore += 1;
                if (product.rawTitle.toLowerCase().includes(keyword)) subSubScore += 2;
              }

              if (subSubScore > bestSubSubMatch.score) {
                bestSubSubMatch = { subsub: subSubCat.name, score: subSubScore };
              }
            }
          }
        }
      }
    }

    return {
      main: bestMatch.main,
      sub: bestSubMatch.sub,
      subsub: bestSubSubMatch.subsub
    };
  }

  private generateMetaTitle(shortTitle: string, brand?: string): string {
    let metaTitle = shortTitle;
    
    if (metaTitle.length < 40 && brand) {
      metaTitle = `${brand} ${metaTitle}`;
    }

    if (metaTitle.length > 60) {
      metaTitle = metaTitle.slice(0, 57) + '...';
    }

    return metaTitle;
  }

  private generateMetaKeywords(
    product: ParsedRawProduct, 
    shortTitle: string, 
    brand?: string,
    categoryPath?: { main: string; sub?: string; subsub?: string }
  ): string[] {
    const keywords = new Set<string>();
    
    if (brand) keywords.add(brand.toLowerCase());

    shortTitle.split(' ').forEach(word => {
      if (word.length > 3) keywords.add(word.toLowerCase());
    });

    if (categoryPath) {
      keywords.add(categoryPath.main.toLowerCase());
      if (categoryPath.sub) keywords.add(categoryPath.sub.toLowerCase());
      if (categoryPath.subsub) keywords.add(categoryPath.subsub.toLowerCase());
    }

    keywords.add('achat');
    keywords.add('prix');
    keywords.add('pas cher');
    keywords.add('livraison');

    return Array.from(keywords).slice(0, 15);
  }

  private generateSeoSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private calculateQualityScore(
    product: ParsedRawProduct,
    cleanedImages: string[],
    variants: CleanVariantData[],
    brand?: string,
    categoryPath?: { main: string; sub?: string; subsub?: string }
  ): number {
    let score = 0;

    if (brand) score += 15;
    
    if (categoryPath?.subsub) score += 20;
    else if (categoryPath?.sub) score += 15;
    else if (categoryPath?.main !== 'Autre') score += 10;
    
    score += Math.min(cleanedImages.length * 5, 20);
    
    if (variants.length > 0) score += 20;
    if (variants.some(v => v.image)) score += 10;
    
    if (this.generateSeoTitle(product.rawTitle, brand).length < 60) score += 15;

    return Math.min(score, 100);
  }

  transformBatch(
    products: ParsedRawProduct[],
    rawProductIds: string[]
  ): EnhancedCleanProductData[] {
    return products.map((product, index) =>
      this.transform(product, rawProductIds[index])
    );
  }
}