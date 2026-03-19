// ============================================================
// Main Pipeline Orchestrator for Adullam
// Optimized for alibaba-datahub.p.rapidapi.com
// VERSION: 2.0 - Added category hierarchy and video support
// ============================================================

import { estimateWeightSmart } from "../utils/weight-estimator";
import type { PipelineStats, ImportSource, ParsedRawProduct, ParsedVariant } from "../config/types";
import { AlibabaSearchCollector } from "../collectors/alibaba-search";
import { AlibabaDetailCollector } from "../collectors/alibaba-detail";
import { RawProductParser } from "../parsers/raw-parser";
import { ProductTransformer } from "../transformers/product-transformer";
import { ProductValidator } from "../validators/product-validator";
import { RawStorage } from "../raw/raw-storage";
import { GraphService } from "../graph/graph-service";
import { DbService } from "../db/db-service";
import { CONFIG } from "../config";

export interface PipelineOptions {
  source: ImportSource;
  searchQuery: string;
  maxPages?: number;
  dryRun?: boolean;
}

export class Pipeline {
  private stats: PipelineStats;
  private searchCollector: AlibabaSearchCollector;
  private detailCollector: AlibabaDetailCollector;
  private parser: RawProductParser;
  private transformer: ProductTransformer;
  private validator: ProductValidator;
  private rawStorage: RawStorage;
  private graphService: GraphService;
  private db: DbService;

  constructor() {
    this.stats = this.initStats();
    this.searchCollector = new AlibabaSearchCollector();
    this.detailCollector = new AlibabaDetailCollector();
    this.parser = new RawProductParser();
    this.transformer = new ProductTransformer();
    this.validator = new ProductValidator();
    this.rawStorage = new RawStorage();
    this.graphService = new GraphService();
    this.db = new DbService();
    
    console.log("[Pipeline] Pipeline initialized with AlibabaDataHub API");
  }

  private initStats(): PipelineStats {
    return {
      totalFetched: 0,
      totalEnriched: 0,
      totalParsed: 0,
      totalValidated: 0,
      totalCleaned: 0,
      totalRejected: 0,
      rejectionReasons: {},
      startTime: new Date(),
    };
  }

  async run(options: PipelineOptions): Promise<PipelineStats> {
    console.log("\n========================================");
    console.log("  🚀 ADULLAM IMPORT PIPELINE STARTED");
    console.log("========================================\n");
    console.log(`📦 Source: ${options.source}`);
    console.log(`🔍 Query: "${options.searchQuery}"`);
    console.log(`📄 Max Pages: ${options.maxPages || "unlimited"}`);
    console.log(`💨 Dry Run: ${options.dryRun ? "YES" : "NO"}`);
    console.log("\n----------------------------------------\n");

    this.stats = this.initStats();

    try {
      // ============================================
      // STEP 1: Create import batch
      // ============================================
      const batchId = await this.db.createImportBatch(options.source);
      console.log(`✅ [1/6] Import batch created: ${batchId}\n`);

      // ============================================
      // STEP 2: Collect products from SEARCH API
      // ============================================
      console.log(`🔍 [2/6] Collecting products from SEARCH API...`);
      
      const searchProducts = await this.searchCollector.collect(
        options.searchQuery,
        options.maxPages || 3
      );

      this.stats.totalFetched = searchProducts.length;
      console.log(`   📊 Search fetched: ${searchProducts.length} products\n`);

      if (searchProducts.length === 0) {
        console.log("⚠️ No products fetched. Exiting pipeline.");
        return this.finalize(batchId, "COMPLETED");
      }

      // ============================================
      // STEP 2.5: Enrich products via DETAIL API
      // ============================================
      console.log(`✨ [2.5/6] Enriching products via DETAIL API...`);
      
      const enrichedProducts = await this.detailCollector.enrich(searchProducts);
      this.stats.totalEnriched = enrichedProducts.length;
      
      console.log(`   📊 Enriched: ${enrichedProducts.length}/${searchProducts.length} products\n`);

      // ============================================
      // STEP 3: Parse raw products
      // ============================================
      console.log(`🔄 [3/6] Parsing raw products...`);
      
      const parsedProducts: ParsedRawProduct[] = [];

      for (const rawProduct of enrichedProducts) {
        // ✅ LOG AVANT PARSING
        console.log(`[Pipeline] Before parse - product has variants: ${rawProduct.variants?.length || 0}`);
        
        const parsed = this.parser.parse(rawProduct, options.source);
        if (!parsed) {
          this.recordRejection("PARSE_FAILED");
          continue;
        }
        
        // ✅ LOG APRÈS PARSING
        console.log(`[Pipeline] After parse - product ${parsed.product.externalProductId}: ${parsed.product.variants?.length || 0} variants`);
        
        this.stats.totalParsed++;
        parsedProducts.push(parsed.product);
      }

      console.log(`   📊 Parsed: ${parsedProducts.length} products\n`);

      // ============================================
      // STEP 3.5: Estimate weights
      // ============================================
      console.log(`⚖️ [3.5/6] Estimating weights for all variants and products...`);
      
      const productsWithWeight: ParsedRawProduct[] = [];

      for (const product of parsedProducts) {
        // ✅ LOG AVANT ESTIMATION
        console.log(`[Pipeline] Before weight estimation - product ${product.externalProductId}: ${product.variants?.length || 0} variants`);
        
        let variantsWithWeight: ParsedVariant[] = [];

        // 1️⃣ Estimate weight for each variant
        for (const variant of product.variants ?? []) {
          try {
            const estimatedWeight = await estimateWeightSmart(product, variant);
            variantsWithWeight.push({ ...variant, weight: estimatedWeight });
          } catch (err) {
            console.warn(`   ⚠️ Cannot estimate weight for variant ${variant.externalSkuId}: ${err}`);
            this.recordRejection("WEIGHT_ESTIMATION_FAILED");
            continue;
          }
        }

        // 2️⃣ If no variants with weight, estimate product weight directly
        if (variantsWithWeight.length === 0) {
          try {
            const estimatedProductWeight = await estimateWeightSmart(product);
            product.weight = estimatedProductWeight;
            
            // ✅ PROTECTION: Sécuriser le titre pour le log
            const safeTitle = product?.rawTitle || 'Unknown product';
            console.log(`   📦 Product weight estimated directly: ${safeTitle.substring(0, 50)}... = ${product.weight} kg`);
            
            productsWithWeight.push(product);
            continue;
          } catch (err) {
            console.warn(`   ⚠️ Cannot estimate weight for product ${product.externalProductId}: ${err}`);
            this.recordRejection("PRODUCT_NO_WEIGHT");
            continue;
          }
        }

        // 3️⃣ Set product weight = max of variant weights
        product.variants = variantsWithWeight;
        product.weight = Math.max(...variantsWithWeight.map(v => v.weight!));

        // ✅ LOG APRÈS ESTIMATION
        console.log(`[Pipeline] After weight estimation - product ${product.externalProductId}: ${product.variants?.length || 0} variants`);

        productsWithWeight.push(product);
      }

      console.log(`   📊 Products with estimated weight: ${productsWithWeight.length}/${parsedProducts.length}\n`);

      // ============================================
      // STEP 4: Validate products
      // ============================================
      console.log(`✅ [4/6] Validating products (strict mode)...`);
      
      const validProducts: ParsedRawProduct[] = [];

      for (const product of productsWithWeight) {
        // ✅ LOG AVANT VALIDATION
        console.log(`[Pipeline] Before validation - product ${product.externalProductId}: ${product.variants?.length || 0} variants`);
        
        const validation = this.validator.validate(product);
        if (validation.isValid) {
          validProducts.push(product);
        } else {
          for (const error of validation.errors) {
            this.recordRejection(error);
          }
        }
      }

      this.stats.totalValidated = validProducts.length;
      console.log(`   📊 Valid: ${validProducts.length}/${productsWithWeight.length} products\n`);

      if (validProducts.length === 0) {
        console.log("⚠️ No valid products after validation. Exiting pipeline.");
        return this.finalize(batchId, "COMPLETED");
      }

      // ============================================
      // STEP 5: Store, categorize and transform (MODIFIÉ)
      // ============================================
      console.log(`💾 [5/6] Storing, categorizing and transforming products...`);
      
      const cleanProducts: any[] = [];

      for (const [index, validProduct] of validProducts.entries()) {
        // Progress indicator
        if ((index + 1) % 10 === 0 || index === 0) {
          console.log(`   Processing product ${index + 1}/${validProducts.length}...`);
        }

        if (options.dryRun) {
          const clean = this.transformer.transform(validProduct, "dry-run-id");
          cleanProducts.push(clean);
          this.stats.totalCleaned++;
          continue;
        }

        // ✅ Vérifier que externalProductId existe
        if (!validProduct.externalProductId) {
          // ✅ PROTECTION: Sécuriser le titre pour le log
          const safeTitle = validProduct?.rawTitle || 'Unknown product';
          console.warn(`   ⚠️ Missing externalProductId for product: ${safeTitle.substring(0, 50)}...`);
          this.recordRejection("MISSING_EXTERNAL_ID");
          continue;
        }

        try {
          // 1️⃣ SAVE RAW PRODUCT
          const rawProduct = await this.db.saveRawProduct({
            source: options.source,
            supplierSku: validProduct.externalProductId,
            externalProductId: validProduct.externalProductId,
            externalSkuId: validProduct.externalSkuId,
            externalShopId: validProduct.externalShopId,
            rawTitle: validProduct.rawTitle || 'Untitled Product',
            rawDescription: validProduct.rawDescription || '',
            rawImages: validProduct.rawImages || [],
            rawCategory: validProduct.rawCategory || 'Uncategorized',
            rawCurrency: validProduct.rawCurrency || 'USD',
            rawMinPrice: validProduct.rawMinPrice || 0,
            rawMaxPrice: validProduct.rawMaxPrice || 0,
            rawAttributes: validProduct.rawAttributes || {},
            importBatchId: batchId,
            sourceUrl: validProduct.sourceUrl,
            status: 'PENDING',
            dataSourceType: 'DETAIL_ENRICHED',
          });

          if (!rawProduct?.id) {
            console.error(`   ❌ Failed to save raw product: ${validProduct.externalProductId}`);
            this.recordRejection("RAW_DB_INSERT_FAILED");
            continue;
          }

          const rawProductId = rawProduct.id;

          // ✅ Sauvegarder les RawVariant
          if (validProduct.variants && validProduct.variants.length > 0) {
            console.log(`   📦 Saving ${validProduct.variants.length} RawVariant for product ${validProduct.externalProductId}`);
            const savedVariants = await this.db.saveRawVariants(rawProductId, validProduct.variants);
            console.log(`   ✅ Saved ${savedVariants} RawVariant`);
          }
          
          // ============================================================
          // ✅ NOUVEAU: CRÉATION DE LA HIÉRARCHIE DE CATÉGORIES
          // ============================================================
          let categoryId: string | undefined;

          if (validProduct.alibabaCategoryPath) {
            // Utiliser le chemin hiérarchique complet
            try {
              categoryId = await this.db.createCategoryHierarchy(validProduct.alibabaCategoryPath, batchId);
              console.log(`   🏷️ Catégorie hiérarchique créée: ${categoryId} (${validProduct.alibabaCategoryPath})`);
            } catch (categoryError) {
              console.error(`   ⚠️ Failed to create category hierarchy: ${validProduct.alibabaCategoryPath}`, categoryError);
            }
          } else if (validProduct.rawCategory) {
            // Fallback sur l'ancienne méthode
            try {
              categoryId = await this.db.getOrCreateCategory(validProduct.rawCategory);
              console.log(`   🏷️ Catégorie simple créée: ${categoryId} (${validProduct.rawCategory})`);
            } catch (categoryError) {
              console.error(`   ⚠️ Failed to create category: ${validProduct.rawCategory}`, categoryError);
            }
          } else {
            // Pas de catégorie du tout
            categoryId = await this.db.getOrCreateCategory("Non catégorisé");
            console.log(`   🏷️ Catégorie par défaut: ${categoryId}`);
          }

          // 3️⃣ TRANSFORM TO CLEAN
          const clean = this.transformer.transform(validProduct, rawProductId);
          
          // 4️⃣ ASSIGNER LA CATÉGORIE DÉTECTÉE
          if (categoryId) {
            clean.suggestedCat = categoryId;
          }

          // 5️⃣ SAVE CLEAN PRODUCT
          const cleanProductId = await this.db.saveCleanProduct(clean);
          
          if (!cleanProductId) {
            console.error(`   ❌ Failed to save clean product for raw: ${rawProductId}`);
            this.recordRejection("CLEAN_STORAGE_FAILED");
            continue;
          }

          // ✅ AJOUT: Créer le produit final si auto-approve est activé
          if (CONFIG.autoApprove) {
            try {
              const finalProductId = await this.db.createFinalProduct(
                cleanProductId,
                clean,
                validProduct.weight || 0
              );
              
              if (finalProductId) {
                console.log(`   ✅ Final product created: ${finalProductId}`);
                
                // ============================================================
                // ✅ NOUVEAU: SAUVEGARDER LES VIDÉOS
                // ============================================================
                if (validProduct.rawVideos && validProduct.rawVideos.length > 0) {
                  const savedVideos = await this.db.saveProductVideos(
                    finalProductId,
                    validProduct.rawVideos
                  );
                  console.log(`   🎥 ${savedVideos} vidéos sauvegardées pour plus tard`);
                }
                
              } else {
                console.warn(`   ⚠️ Failed to create final product for clean product ${cleanProductId}`);
              }
            } catch (finalError) {
              console.error(`   ❌ Error creating final product:`, finalError);
            }
          }

          cleanProducts.push({ ...clean, id: cleanProductId });
          this.stats.totalCleaned++;

        } catch (dbError) {
          console.error(`   ❌ Database error for product ${validProduct.externalProductId}:`, dbError);
          this.recordRejection("DB_ERROR");
          continue;
        }
      }

      console.log(`   📊 Cleaned: ${this.stats.totalCleaned} products\n`);

      // ============================================
      // STEP 6: Push to graph
      // ============================================
      console.log(`🕸️ [6/6] Pushing clean products to graph...`);
      
      if (!options.dryRun && cleanProducts.length > 0) {
        try {
          const graphResults = await this.graphService.pushProducts(cleanProducts);
          console.log(`   ✅ Graph nodes created: ${graphResults.created}`);
          console.log(`   🔗 Graph edges created: ${graphResults.edges}\n`);
        } catch (graphError) {
          console.error(`   ❌ Graph push failed:`, graphError);
          this.recordRejection("GRAPH_PUSH_FAILED");
        }
      } else {
        console.log(`   ⏭️ Graph push skipped (dry run or no products)\n`);
      }

      return this.finalize(batchId, "COMPLETED");

    } catch (error) {
      console.error("\n❌ Pipeline critical error:", error);
      this.stats.totalRejected++;
      return this.finalize("error", "FAILED");
    }
  }

  private recordRejection(reason: string): void {
    this.stats.totalRejected++;
    this.stats.rejectionReasons[reason] = (this.stats.rejectionReasons[reason] || 0) + 1;
  }

  private async finalize(batchId: string, status: "COMPLETED" | "FAILED"): Promise<PipelineStats> {
    this.stats.endTime = new Date();
    this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

    if (batchId !== "error") {
      try {
        await this.db.updateImportBatch(batchId, {
          status,
          processed: this.stats.totalCleaned,
          failed: this.stats.totalRejected,
        });
        console.log(`📝 Batch ${batchId} updated: ${status}`);
      } catch (batchError) {
        console.error(`❌ Failed to update batch ${batchId}:`, batchError);
      }
    }

    this.printSummary();
    return { ...this.stats };
  }

  private printSummary(): void {
    const successRate = this.stats.totalFetched > 0 
      ? ((this.stats.totalCleaned / this.stats.totalFetched) * 100).toFixed(1)
      : '0.0';

    console.log("\n========================================");
    console.log("  📊 PIPELINE SUMMARY");
    console.log("========================================\n");
    console.log(`📥 Total Fetched:    ${this.stats.totalFetched}`);
    console.log(`🔄 Total Enriched:   ${this.stats.totalEnriched}`);
    console.log(`🔄 Total Parsed:     ${this.stats.totalParsed}`);
    console.log(`✅ Total Validated:  ${this.stats.totalValidated}`);
    console.log(`✨ Total Cleaned:    ${this.stats.totalCleaned}`);
    console.log(`❌ Total Rejected:   ${this.stats.totalRejected}`);
    console.log(`⏱️  Duration:         ${(this.stats.duration || 0) / 1000}s`);
    console.log(`📈 Success Rate:     ${successRate}%`);

    if (Object.keys(this.stats.rejectionReasons).length > 0) {
      console.log("\n⚠️ Rejection Reasons:");
      for (const [reason, count] of Object.entries(this.stats.rejectionReasons)) {
        const percentage = ((count / this.stats.totalRejected) * 100).toFixed(1);
        console.log(`   - ${reason}: ${count} (${percentage}%)`);
      }
    }
    console.log("\n========================================\n");
  }

  getStats(): PipelineStats {
    return { ...this.stats };
  }
}