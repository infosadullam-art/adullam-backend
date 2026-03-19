// ============================================================
// Product Validator for Adullam (FINAL VERSION WITH DEBUG)
// ============================================================

import { CONFIG } from "../config";
import type { ParsedRawProduct, ValidationResult } from "../config/types";

export class ProductValidator {
  /**
   * Validate a parsed product with STRICT rules.
   */
  validate(product: ParsedRawProduct): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ============================================================
    // 🔍 LOG DE DÉBOGAGE - VOIR CE QUE LE VALIDATEUR REÇOIT
    // ============================================================
    console.log(`\n[Validator] 🔍 Analyzing product ${product.externalProductId || 'unknown'}:`);
    console.log(`[Validator]   - rawTitle: "${product.rawTitle?.substring(0, 30)}..."`);
    console.log(`[Validator]   - variants count: ${product.variants?.length || 0}`);
    
    if (product.variants && product.variants.length > 0) {
      console.log(`[Validator]   - first variant price: ${product.variants[0].price}`);
      console.log(`[Validator]   - first variant image: ${product.variants[0].image ? 'yes' : 'no'}`);
    }

    // Helper pour obtenir la première valeur disponible dans les variantes
    const getFirstVariantValue = <T>(getter: (v: any) => T | undefined): T | undefined => {
      for (const variant of product.variants || []) {
        const value = getter(variant);
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
      return undefined;
    };

    // 1️⃣ TITRE - Warning seulement (pas bloquant)
    const title = product.rawTitle || 
                  getFirstVariantValue(v => v.attributes?.title) ||
                  getFirstVariantValue(v => v.attributes?.name) ||
                  'Unknown';
    
    if (!title || title.trim().length < CONFIG.validation.minTitleLength) {
      warnings.push("TITLE_MISSING_OR_SHORT");
    }

    // 2️⃣ PRIX - CRITIQUE
    const prices = (product.variants || [])
      .map(v => v.price)
      .filter(p => p && p > 0);
    
    const minPrice = product.rawMinPrice || (prices.length > 0 ? Math.min(...prices) : 0);
    
    console.log(`[Validator]   - minPrice: ${minPrice} (from ${prices.length} variants)`);
    
    if (!minPrice || minPrice <= 0) {
      errors.push("PRICE_INVALID");
    } else if (minPrice > CONFIG.validation.maxPrice) {
      errors.push("PRICE_TOO_HIGH");
    }

    // 3️⃣ IMAGES - CRITIQUE
    const allImages = [
      ...(product.rawImages || []),
      ...(product.variants || []).flatMap(v => v.images || []),
      ...(product.variants || []).map(v => v.image).filter(Boolean)
    ];
    
    const uniqueImages = [...new Set(allImages)].filter(img => img && img.trim() !== '');
    
    console.log(`[Validator]   - images: ${uniqueImages.length} unique (from ${allImages.length} total)`);
    
    if (uniqueImages.length < CONFIG.validation.minImages) {
      errors.push("NO_IMAGES");
    }

    // 4️⃣ EXTERNAL ID - CRITIQUE
    if (!product.externalProductId) {
      console.log(`[Validator]   - ❌ NO_EXTERNAL_ID`);
      errors.push("NO_EXTERNAL_ID");
    } else {
      console.log(`[Validator]   - ✅ externalProductId: ${product.externalProductId}`);
    }

    // 5️⃣ POIDS - Warning seulement
    const weights = (product.variants || [])
      .map(v => v.weight)
      .filter(w => w && w > 0);
    
    const hasValidWeight = (product.weight && product.weight > 0) || weights.length > 0;
    
    if (!hasValidWeight) {
      warnings.push("WEIGHT_MISSING");
    } else {
      const maxWeight = Math.max(product.weight || 0, ...weights);
      if (maxWeight > 200) {
        warnings.push("WEIGHT_SUSPICIOUS");
      }
    }

    // 6️⃣ CURRENCY - Warning seulement
    const validCurrencies = ["USD", "EUR", "GBP", "CNY", "JPY", "AED", "TRY", "XOF"];
    const currency = product.rawCurrency || 
                    getFirstVariantValue(v => v.currency) || 
                    'USD';
    
    if (!validCurrencies.includes(currency.toUpperCase())) {
      warnings.push("UNKNOWN_CURRENCY");
    }

    // 7️⃣ URL - Warning seulement
    if (!product.sourceUrl) {
      warnings.push("NO_SOURCE_URL");
    }

    // 8️⃣ DESCRIPTION - Warning seulement
    if (!product.rawDescription && !getFirstVariantValue(v => v.attributes?.description)) {
      warnings.push("NO_DESCRIPTION");
    }

    // ============================================================
    // 🔍 RÉSULTAT DE LA VALIDATION
    // ============================================================
    console.log(`[Validator]   - ✅ Valid: ${errors.length === 0 ? 'YES' : 'NO'}`);
    if (errors.length > 0) {
      console.log(`[Validator]   - ❌ Errors: ${errors.join(', ')}`);
    }
    if (warnings.length > 0) {
      console.log(`[Validator]   - ⚠️ Warnings: ${warnings.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Batch validate products
   */
  validateBatch(products: ParsedRawProduct[]): {
    valid: ParsedRawProduct[];
    rejected: Array<{ product: ParsedRawProduct; errors: string[] }>;
  } {
    const valid: ParsedRawProduct[] = [];
    const rejected: Array<{ product: ParsedRawProduct; errors: string[] }> = [];

    for (const product of products) {
      const result = this.validate(product);
      if (result.isValid) {
        valid.push(product);
      } else {
        rejected.push({ product, errors: result.errors });
      }
    }

    console.log(`\n[Validator] 📊 Batch validation complete:`);
    console.log(`   - Valid: ${valid.length}`);
    console.log(`   - Rejected: ${rejected.length}`);

    return { valid, rejected };
  }
}