// ============================================================
// Alibaba Search Collector for Adullam
// Endpoint 1: item_search - collects raw product listings
// ============================================================

import { CONFIG } from "../config";
import type { AlibabaApiProduct, AlibabaApiResponse, AlibabaSearchResultItem } from "../config/types";
import { rateLimiter } from "../core/rate-limiter";
import { retry } from "../utils";

export class AlibabaSearchCollector {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl = CONFIG.api.alibaba.baseUrl;
    this.headers = {
      "x-rapidapi-host": CONFIG.api.alibaba.host,
      "x-rapidapi-key": CONFIG.api.alibaba.key,
    };
    console.log(`[SearchCollector] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Collect products from Alibaba Search API
   * Returns raw search results (partial data)
   */
  async collect(query: string, maxPages: number = 3): Promise<AlibabaApiProduct[]> {
    const allProducts: AlibabaApiProduct[] = [];
    const seenIds = new Set<string>();

    console.log(`[SearchCollector] Starting search for: "${query}"`);
    console.log(`[SearchCollector] Rate limit:`, rateLimiter.getStats());

    for (let page = 1; page <= maxPages; page++) {
      console.log(`[SearchCollector] Fetching page ${page}/${maxPages}...`);

      try {
        const products = await this.fetchPage(query, page);

        if (!products || products.length === 0) {
          console.log(`[SearchCollector] No more products on page ${page}. Stopping.`);
          break;
        }

        for (const product of products) {
          const id = this.extractId(product);
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allProducts.push(product);
          }
        }

        console.log(`[SearchCollector] Page ${page}: ${products.length} products (${allProducts.length} total unique)`);
        
        // ⭐ AMÉLIORATION: Petite pause entre les pages
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`[SearchCollector] Error on page ${page}:`, error);
      }
    }

    console.log(`[SearchCollector] Collection complete: ${allProducts.length} unique products`);
    return allProducts;
  }

  /**
   * Fetch a single page of search results
   */
  private async fetchPage(query: string, page: number): Promise<AlibabaApiProduct[]> {
    await rateLimiter.acquire();

    const url = `${this.baseUrl}/item_search?q=${encodeURIComponent(query)}&page=${page}`;

    console.log(`[SearchCollector] Fetching URL: ${url}`);

    const response = await retry(
      async () => {
        const res = await fetch(url, {
          method: "GET",
          headers: this.headers,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return res.json() as Promise<AlibabaApiResponse>;
      },
      CONFIG.processing.retryAttempts,
      CONFIG.processing.retryDelay
    );

    return this.extractProducts(response);
  }

  /**
   * Extract products array from various API response formats
   */
  private extractProducts(response: AlibabaApiResponse): AlibabaApiProduct[] {
    // Primary format: result.resultList (Alibaba DataHub)
    if (response.result?.resultList) {
      return response.result.resultList.map((r: AlibabaSearchResultItem) => {
        const transformedProduct: AlibabaApiProduct = {
          // ✅ Transférer toutes les propriétés de l'item
          ...r.item,
          // ✅ CRITIQUE: Transférer itemUrl vers productUrl
          productUrl: r.item?.itemUrl,
          // ✅ Assurer que les images sont un tableau
          images: r.item?.images || (r.item?.image ? [r.item.image] : []),
          // ✅ Extraire le prix du sku.def.priceModule
          price: this.extractPriceFromSku(r.item?.sku),
          minPrice: this.extractMinPrice(r.item?.sku),
          maxPrice: this.extractMaxPrice(r.item?.sku),
          currency: 'USD',
          // ✅ Conserver les infos vendeur et compagnie
          seller: r.seller,
          company: r.company,
        };
        
        return transformedProduct;
      }) as AlibabaApiProduct[];
    }

    // Fallback formats (inchangé)
    if (Array.isArray(response)) return response as unknown as AlibabaApiProduct[];
    if (response.data) {
      if (Array.isArray(response.data)) return response.data as unknown as AlibabaApiProduct[];
      const d = response.data as { items?: AlibabaApiProduct[]; products?: AlibabaApiProduct[] };
      if (d.items) return d.items;
      if (d.products) return d.products;
    }
    if (response.items) return response.items;
    if (response.products) return response.products;
    if (response.result?.items) return response.result.items;
    if (response.result?.products) return response.result.products;

    console.warn("[SearchCollector] Unknown response format:", Object.keys(response));
    return [];
  }

  /**
   * ⭐ NOUVEAU: Extract min price from SKU
   */
  private extractMinPrice(sku: any): number | undefined {
    if (!sku?.def?.priceModule) return undefined;
    
    const priceModule = sku.def.priceModule;
    
    // Priorité 1: priceList
    if (priceModule.priceList && Array.isArray(priceModule.priceList) && priceModule.priceList.length > 0) {
      const prices = priceModule.priceList
        .map((p: any) => parseFloat(p.price))
        .filter((p: number) => !isNaN(p));
      if (prices.length > 0) {
        return Math.min(...prices);
      }
    }
    
    // Priorité 2: price string with range
    if (priceModule.price) {
      const match = priceModule.price.match(/(\d+\.?\d*)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return undefined;
  }

  /**
   * ⭐ NOUVEAU: Extract max price from SKU
   */
  private extractMaxPrice(sku: any): number | undefined {
    if (!sku?.def?.priceModule) return undefined;
    
    const priceModule = sku.def.priceModule;
    
    // Priorité 1: priceList
    if (priceModule.priceList && Array.isArray(priceModule.priceList) && priceModule.priceList.length > 0) {
      const prices = priceModule.priceList
        .map((p: any) => parseFloat(p.price))
        .filter((p: number) => !isNaN(p));
      if (prices.length > 0) {
        return Math.max(...prices);
      }
    }
    
    // Priorité 2: price string with range
    if (priceModule.price) {
      const match = priceModule.price.match(/-(\d+\.?\d*)/);
      if (match) {
        return parseFloat(match[1]);
      }
      // Single price
      const singleMatch = priceModule.price.match(/(\d+\.?\d*)/);
      if (singleMatch) {
        return parseFloat(singleMatch[1]);
      }
    }
    
    return undefined;
  }

  /**
   * Extract price from SKU price module (string or number)
   */
  private extractPriceFromSku(sku: any): string | number | undefined {
    if (!sku?.def?.priceModule) return undefined;
    
    const priceModule = sku.def.priceModule;
    
    // Priorité 1: price (ex: "5.05-5.65")
    if (priceModule.price) {
      return priceModule.price;
    }
    
    // Priorité 2: priceList[0].price
    if (priceModule.priceList && Array.isArray(priceModule.priceList) && priceModule.priceList.length > 0) {
      return priceModule.priceList[0].price;
    }
    
    return undefined;
  }

  /**
   * Extract product ID from search result
   */
  private extractId(product: AlibabaApiProduct): string | null {
    return (
      product.itemId?.toString() ||
      product.id?.toString() ||
      product.productId?.toString() ||
      product.item?.itemId?.toString() ||
      null
    );
  }
}