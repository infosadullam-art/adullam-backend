// Alibaba API Collector for Adullam - Fixed

import { CONFIG } from "../config";
import type { AlibabaApiProduct, AlibabaApiResponse } from "../config/types";
import { rateLimiter } from "../core/rate-limiter";
import { retry } from "../utils";

export class AlibabaCollector {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl = CONFIG.api.alibaba.baseUrl;
    this.headers = {
      "x-rapidapi-host": CONFIG.api.alibaba.host,
      "x-rapidapi-key": CONFIG.api.alibaba.key,
    };
  }

  /**
   * Collect products from Alibaba API
   */
  async collect(query: string, maxPages: number = 3): Promise<AlibabaApiProduct[]> {
    const allProducts: AlibabaApiProduct[] = [];
    const seenIds = new Set<string>();

    console.log(`[Collector] Starting collection for query: "${query}"`);
    console.log(`[Collector] Rate limit status:`, rateLimiter.getStats());

    for (let page = 1; page <= maxPages; page++) {
      console.log(`[Collector] Fetching page ${page}/${maxPages}...`);

      try {
        const products = await this.fetchPage(query, page);

        if (!products || products.length === 0) {
          console.log(`[Collector] No more products on page ${page}. Stopping.`);
          break;
        }

        // Deduplicate by itemId
        for (const product of products) {
          const id = this.extractId(product);
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allProducts.push(product);
          }
        }

        console.log(`[Collector] Page ${page}: ${products.length} products (${allProducts.length} total unique)`);
      } catch (error) {
        console.error(`[Collector] Error on page ${page}:`, error);
      }
    }

    console.log(`[Collector] Collection complete: ${allProducts.length} unique products`);
    return allProducts;
  }

  /**
   * Fetch a single page of products
   */
  private async fetchPage(query: string, page: number): Promise<AlibabaApiProduct[]> {
    await rateLimiter.acquire();

    const url = `${this.baseUrl}/item_search?q=${encodeURIComponent(query)}&page=${page}`;

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
   * Extract products array from API response
   */
  private extractProducts(response: AlibabaApiResponse): AlibabaApiProduct[] {
    // Cas Alibaba API actuel
    if (response.result?.resultList) {
      // On garde l'objet complet : item + seller + company
      return response.result.resultList.map(r => ({
        ...r.item,
        seller: r.seller,
        company: r.company
      }));
    }

    // Autres formats possibles
    if (Array.isArray(response)) return response;
    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data.items) return response.data.items;
      if (response.data.products) return response.data.products;
    }
    if (response.items) return response.items;
    if (response.products) return response.products;
    if (response.result?.items) return response.result.items;
    if (response.result?.products) return response.result.products;

    console.warn("[Collector] Unknown response format:", Object.keys(response));
    return [];
  }

  /**
   * Extract product ID from itemId (fix)
   */
  private extractId(product: AlibabaApiProduct): string | null {
    return product.itemId?.toString() || product.id?.toString() || product.productId?.toString() || null;
  }

  /**
   * Get detailed product info
   */
  async getProductDetails(productId: string): Promise<AlibabaApiProduct | null> {
    await rateLimiter.acquire();
    const url = `${this.baseUrl}/item_detail?id=${productId}`;

    try {
      const response = await retry(
        async () => {
          const res = await fetch(url, {
            method: "GET",
            headers: this.headers,
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
        CONFIG.processing.retryAttempts,
        CONFIG.processing.retryDelay
      );

      return response.data || response.product || response.item || response;
    } catch (error) {
      console.error(`[Collector] Failed to get details for ${productId}:`, error);
      return null;
    }
  }

  /**
   * Collect products by category
   */
  async collectByCategory(categoryId: string, maxPages: number = 3): Promise<AlibabaApiProduct[]> {
    const allProducts: AlibabaApiProduct[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= maxPages; page++) {
      await rateLimiter.acquire();

      const url = `${this.baseUrl}/item_search?categoryId=${categoryId}&page=${page}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: this.headers,
        });

        if (!res.ok) continue;

        const response = await res.json() as AlibabaApiResponse;
        const products = this.extractProducts(response);

        for (const product of products) {
          const id = this.extractId(product);
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allProducts.push(product);
          }
        }

        if (products.length === 0) break;
      } catch (error) {
        console.error(`[Collector] Category fetch error:`, error);
      }
    }

    return allProducts;
  }
}
