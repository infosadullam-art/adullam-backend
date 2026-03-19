// collectors/alibaba-detail.ts
import { CONFIG } from "../config";
import type { AlibabaApiProduct, AlibabaVariant } from "../config/types";
import { rateLimiter } from "../core/rate-limiter";
import { retry } from "../utils";

export class AlibabaDetailCollector {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl = CONFIG.api.alibaba2.baseUrl;
    this.headers = {
      "x-rapidapi-host": CONFIG.api.alibaba2.host,
      "x-rapidapi-key": CONFIG.api.alibaba2.key,
    };
    console.log(`[DetailCollector] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Enrich products from search API with detail data
   */
  async enrich(products: AlibabaApiProduct[]): Promise<AlibabaApiProduct[]> {
    const enriched: AlibabaApiProduct[] = [];

    console.log(`[DetailCollector] Starting enrichment for ${products.length} products`);

    for (const product of products) {
      const itemId = product.itemId || 
                     product.id?.toString() || 
                     product.productId?.toString();

      if (!itemId) {
        console.warn(`[DetailCollector] Missing itemId for product, cannot enrich`);
        enriched.push(product);
        continue;
      }

      console.log(`[DetailCollector] Enriching product ${itemId}`);

      try {
        const details = await this.getProductDetailsById(itemId.toString());

        if (!details) {
          console.warn(`[DetailCollector] No details returned for ${itemId}`);
          enriched.push(product);
          continue;
        }

        const merged = this.mergeProductData(product, details);
        enriched.push(merged);

        console.log(`[DetailCollector] Successfully enriched ${itemId}: ${merged.images?.length || 0} images, ${merged.variants?.length || 0} variants`);
      } catch (err) {
        console.error(`[DetailCollector] Failed to enrich ${itemId}:`, err);
        enriched.push(product);
      }
    }

    console.log(`[DetailCollector] Enrichment complete: ${enriched.length}/${products.length} products enriched`);
    return enriched;
  }

  /**
   * Fetch product details by itemId
   */
  private async getProductDetailsById(
    itemId: string
  ): Promise<Partial<AlibabaApiProduct> | null> {
    await rateLimiter.acquire();

    const endpoint = `${this.baseUrl}/item_detail?itemId=${itemId}`;

    console.log(`[DetailCollector] Fetching details for itemId: ${itemId}`);

    try {
      const response = await retry(
        async () => {
          const res = await fetch(endpoint, { 
            method: "GET", 
            headers: this.headers 
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`[DetailCollector] API error: ${res.status}`, errorText);
            throw new Error(`HTTP ${res.status}: ${errorText}`);
          }
          
          return res.json();
        },
        CONFIG.processing.retryAttempts,
        CONFIG.processing.retryDelay
      );

      if (!response?.result?.item) {
        console.warn(`[DetailCollector] Invalid response format for itemId ${itemId}`);
        return null;
      }

      const item = response.result.item;
      
      return this.normalizeItemData(item);
      
    } catch (err) {
      console.error(`[DetailCollector] Error fetching details for itemId ${itemId}:`, err);
      return null;
    }
  }

  /**
   * ✅ NOUVELLE FONCTION : Extrait les vidéos de l'item
   */
  private extractVideos(item: any): { url: string; thumbnail?: string; duration?: number }[] {
    const videos: { url: string; thumbnail?: string; duration?: number }[] = [];

    // 1️⃣ Vidéo principale
    if (item.videoUrl) {
      videos.push({
        url: item.videoUrl.startsWith('//') ? 'https:' + item.videoUrl : item.videoUrl,
        thumbnail: item.videoThumbnail,
        duration: item.videoDuration
      });
    }

    // 2️⃣ Tableau de vidéos
    if (item.videos && Array.isArray(item.videos)) {
      item.videos.forEach((v: any) => {
        if (v.url) {
          videos.push({
            url: v.url.startsWith('//') ? 'https:' + v.url : v.url,
            thumbnail: v.thumbnail,
            duration: v.duration
          });
        }
      });
    }

    // 3️⃣ Vidéos dans la description
    if (item.description?.videos && Array.isArray(item.description.videos)) {
      item.description.videos.forEach((v: string) => {
        videos.push({
          url: v.startsWith('//') ? 'https:' + v : v
        });
      });
    }

    return videos;
  }

  /**
   * Normaliser les données de l'item
   */
  private normalizeItemData(item: any): Partial<AlibabaApiProduct> {
    // Extraire les variants (version corrigée avec vraies variantes)
    const variants = this.extractVariants(item);
    
    // Extraire les images
    const images = this.extractImages(item);
    
    // ✅ NOUVEAU : Extraire les vidéos
    const videos = this.extractVideos(item);
    
    // Extraire les attributs
    const attributes = this.extractAttributes(item);
    
    // Extraire la description
    const description = this.extractDescription(item);
    
    // Extraire les prix
    const { price, minPrice, maxPrice, currency } = this.extractPrices(item);

    // ✅ NOUVEAU : Récupérer le chemin de catégorie
    const categoryPath = item.categoryPath;

    return {
      itemId: item.itemId?.toString(),
      productId: item.itemId?.toString(),
      title: item.title,
      description: description,
      images: images,
      rawImages: images,
      variants: variants,
      price: price,
      minPrice: minPrice,
      maxPrice: maxPrice,
      currency: currency || 'USD',
      category: item.categoryName || 'Uncategorized',
      categoryName: item.categoryName,
      // ✅ NOUVEAU : Ajouter le chemin de catégorie
      categoryPath: categoryPath,
      // ✅ NOUVEAU : Ajouter les vidéos
      videos: videos,
      attributes: attributes,
      specifications: attributes,
      itemUrl: item.itemUrl,
      productUrl: item.itemUrl?.startsWith('//') ? 'https:' + item.itemUrl : item.itemUrl,
    };
  }

  /**
   * ✅ EXTRAIRE LES VARIANTES (VERSION CORRIGÉE)
   * Priorité 1: Vraies variantes depuis sku.base + sku.props
   * Priorité 2: Variantes de quantité depuis priceList
   */
  private extractVariants(item: any): AlibabaVariant[] {
    const variants: AlibabaVariant[] = [];

    // ============================================================
    // 1️⃣ VRAIES VARIANTES (couleurs, tailles, etc.)
    // ============================================================
    if (item.sku?.base && item.sku?.props) {
      const baseSkus = item.sku.base;
      const props = item.sku.props;
      
      // Créer un mapping des propriétés par ID
      const propMap: Record<string, { name: string; value: string; image?: string }> = {};
      props.forEach((prop: any) => {
        prop.values.forEach((val: any) => {
          // La clé est l'ID complet (ex: "191286172:28315")
          const key = val.id;
          propMap[key] = {
            name: prop.name,
            value: val.name,
            image: val.image
          };
        });
      });

      // Récupérer les prix par quantité (priceTiers)
      const priceTiers = item.sku?.def?.priceModule?.priceList || [];

      // Construire chaque variante
      baseSkus.forEach((sku: any) => {
        if (!sku.skuId) return;

        // Décoder le propMap (ex: "191284014:26762339;191286172:461058311;191288010:-1")
        const attributes: Record<string, any> = {};
        const propPairs = sku.propMap.split(';');
        
        propPairs.forEach((pair: string) => {
          // Le pair est déjà un ID complet (ex: "191286172:28315")
          const propInfo = propMap[pair];
          
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

        // Prix de base (prendre le premier palier)
        const basePrice = priceTiers.length > 0 
          ? parseFloat(priceTiers[0].price) 
          : 0;

        variants.push({
          skuId: sku.skuId.toString(),
          sku_id: sku.skuId.toString(),
          price: basePrice,
          currency: 'USD',
          stock: sku.stock || 100,
          attributes,  // ← Contient toutes les infos (couleur, taille, matière)
          image: attributes.color_image || item.images?.[0],
          images: attributes.color_image ? [attributes.color_image] : []
        });
      });

      console.log(`[DetailCollector] ✓ Extracted ${variants.length} real variants with attributes`);
    } 
    // ============================================================
    // 2️⃣ SINON : variantes de quantité (prix dégressifs)
    // ============================================================
    else {
      const priceList = item.sku?.def?.priceModule?.priceList;
      if (Array.isArray(priceList) && priceList.length > 0) {
        priceList.forEach((p: any, index: number) => {
          variants.push({
            skuId: `${item.itemId}_${index}`,
            sku_id: `${item.itemId}_${index}`,
            price: parseFloat(p.price) || 0,
            currency: 'USD',
            stock: 100,
            attributes: {
              minQuantity: p.minQuantity,
              maxQuantity: p.maxQuantity === -1 ? Infinity : p.maxQuantity,
              unit: p.unit || 'piece',
              quantityFormatted: p.quantityFormatted
            },
            image: item.images?.[0] || item.image
          });
        });
        console.log(`[DetailCollector] ✓ Extracted ${variants.length} quantity-based variants (no real variants)`);
      }
    }

    return variants;
  }

  /**
   * Extraire les images
   */
  private extractImages(item: any): string[] {
    const images: string[] = [];
    
    if (Array.isArray(item.images)) {
      images.push(...item.images);
    }
    if (item.image && !images.includes(item.image)) {
      images.push(item.image);
    }

    // Nettoyer les URLs
    return images.map(img => 
      img.startsWith('//') ? 'https:' + img : img
    );
  }

  /**
   * Extraire les attributs depuis properties.list
   */
  private extractAttributes(item: any): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};
    
    if (item.properties?.list && Array.isArray(item.properties.list)) {
      item.properties.list.forEach((prop: any) => {
        if (prop.name && prop.value) {
          const key = prop.name
            .toLowerCase()
            .replace(/[:\s]+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          attributes[key] = prop.value;
        }
      });
    }

    // Ajouter le MOQ
    if (item.sku?.def?.quantityModule?.minOrder) {
      attributes.moq = item.sku.def.quantityModule.minOrder.quantity;
      attributes.moq_unit = item.sku.def.quantityModule.minOrder.unit;
    }

    return attributes;
  }

  /**
   * Extraire la description
   */
  private extractDescription(item: any): string | undefined {
    if (item.description?.html) {
      return item.description.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return item.description || undefined;
  }

  /**
   * Extraire les prix
   */
  private extractPrices(item: any): {
    price: number | undefined;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    currency: string;
  } {
    let price: number | undefined;
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    let currency = 'USD';

    const priceList = item.sku?.def?.priceModule?.priceList;
    
    if (Array.isArray(priceList) && priceList.length > 0) {
      const prices = priceList
        .map((p: any) => parseFloat(p.price))
        .filter((p: number) => !isNaN(p));
      
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
        price = minPrice;
      }
    }

    return { price, minPrice, maxPrice, currency };
  }

  /**
   * Fusionner les données de recherche et les détails
   */
  private mergeProductData(
    searchProduct: AlibabaApiProduct,
    detailData: Partial<AlibabaApiProduct>
  ): AlibabaApiProduct {
    return {
      ...searchProduct,
      ...detailData,
      itemId: searchProduct.itemId || detailData.itemId,
      productId: searchProduct.productId || detailData.productId,
      variants: detailData.variants?.length 
        ? detailData.variants 
        : searchProduct.variants || [],
      images: this.mergeUniqueArrays(detailData.images, searchProduct.images),
      rawImages: this.mergeUniqueArrays(detailData.rawImages, searchProduct.rawImages),
      // ✅ NOUVEAU : Fusionner les vidéos
      videos: detailData.videos?.length 
        ? detailData.videos 
        : searchProduct.videos || [],
      // ✅ NOUVEAU : Garder le chemin de catégorie
      categoryPath: detailData.categoryPath || searchProduct.categoryPath,
      description: detailData.description || searchProduct.description,
      attributes: { 
        ...searchProduct.attributes, 
        ...detailData.attributes 
      },
    };
  }

  /**
   * Fusionner deux tableaux sans doublons
   */
  private mergeUniqueArrays<T>(arr1: T[] = [], arr2: T[] = []): T[] {
    const set = new Set<T>();
    arr1.forEach(item => set.add(item));
    arr2.forEach(item => set.add(item));
    return Array.from(set);
  }
}