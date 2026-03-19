// ============================================================
// Graph Service for Adullam
// Manages product nodes and relationships using real Prisma
// ============================================================

import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CleanProductData } from "../config/types";

export class GraphService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = (prismaClient || prisma) as PrismaClient;
  }

  /**
   * Push clean products to the graph.
   * Creates product nodes and establishes relationships.
   */
  async pushProducts(
    products: CleanProductData[]
  ): Promise<{ created: number; edges: number }> {
    let created = 0;
    let edges = 0;

    for (const product of products) {
      try {
        // Create product node
        const productNode = await this.createProductNode(product);
        if (productNode) {
          created++;
        }

        // Create category relationship
        if (product.suggestedCat) {
          const categoryNode = await this.ensureCategoryNode(product.suggestedCat);
          if (categoryNode && productNode) {
            await this.createEdge(productNode.id, categoryNode.id, "BELONGS_TO");
            edges++;
          }
        }

        // Create tag relationships
        for (const keyword of product.seoKeywords.slice(0, 5)) {
          const tagNode = await this.ensureTagNode(keyword);
          if (tagNode && productNode) {
            await this.createEdge(productNode.id, tagNode.id, "HAS_TAG");
            edges++;
          }
        }
      } catch (error) {
        console.error("[Graph] Error pushing product:", error);
      }
    }

    // Create SIMILAR relationships
    const similarEdges = await this.createSimilarityEdges(products);
    edges += similarEdges;

    return { created, edges };
  }

  private async createProductNode(product: CleanProductData) {
    try {
      const embedding = this.generateSimpleEmbedding(product);

      const node = await this.prisma.graphNode.upsert({
        where: {
          type_entityId: {
            type: "PRODUCT",
            entityId: product.rawProductId,
          },
        },
        create: {
          type: "PRODUCT",
          entityId: product.rawProductId,
          properties: {
            title: product.cleanedTitle,
            price: product.suggestedPrice,
            category: product.suggestedCat,
            qualityScore: product.qualityScore,
            keywords: product.seoKeywords,
            imageCount: product.cleanedImages.length,
          },
          embedding,
        },
        update: {
          properties: {
            title: product.cleanedTitle,
            price: product.suggestedPrice,
            category: product.suggestedCat,
            qualityScore: product.qualityScore,
            keywords: product.seoKeywords,
            imageCount: product.cleanedImages.length,
          },
          embedding,
        },
      });

      return node;
    } catch (error) {
      console.error("[Graph] Error creating product node:", error);
      return null;
    }
  }

  private async ensureCategoryNode(category: string) {
    try {
      const node = await this.prisma.graphNode.upsert({
        where: {
          type_entityId: {
            type: "CATEGORY",
            entityId: category.toLowerCase().replace(/\s+/g, "-"),
          },
        },
        create: {
          type: "CATEGORY",
          entityId: category.toLowerCase().replace(/\s+/g, "-"),
          properties: { name: category },
          embedding: [],
        },
        update: {},
      });
      return node;
    } catch (error) {
      console.error("[Graph] Error creating category node:", error);
      return null;
    }
  }

  private async ensureTagNode(tag: string) {
    try {
      const node = await this.prisma.graphNode.upsert({
        where: {
          type_entityId: {
            type: "TAG",
            entityId: tag.toLowerCase(),
          },
        },
        create: {
          type: "TAG",
          entityId: tag.toLowerCase(),
          properties: { name: tag },
          embedding: [],
        },
        update: {},
      });
      return node;
    } catch (error) {
      console.error("[Graph] Error creating tag node:", error);
      return null;
    }
  }

  private async createEdge(
    fromNodeId: string,
    toNodeId: string,
    type: "VIEWED" | "PURCHASED" | "SIMILAR" | "RELATED" | "BELONGS_TO" | "HAS_TAG" | "CO_PURCHASED",
    weight: number = 1,
    metadata?: Record<string, unknown>
  ) {
    try {
      const edge = await this.prisma.graphEdge.upsert({
        where: {
          fromNodeId_toNodeId_type: {
            fromNodeId,
            toNodeId,
            type,
          },
        },
        create: {
          fromNodeId,
          toNodeId,
          type,
          weight,
          metadata,
        },
        update: {
          weight,
          metadata,
        },
      });
      return edge;
    } catch (error) {
      console.error("[Graph] Error creating edge:", error);
      return null;
    }
  }

  private async createSimilarityEdges(products: CleanProductData[]): Promise<number> {
    let edgesCreated = 0;

    // Group by category
    const byCategory = new Map<string, CleanProductData[]>();
    for (const product of products) {
      const category = product.suggestedCat || "uncategorized";
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push(product);
    }

    // Create SIMILAR edges within each category
    for (const [, categoryProducts] of byCategory) {
      if (categoryProducts.length < 2) continue;

      for (let i = 0; i < categoryProducts.length; i++) {
        for (let j = i + 1; j < categoryProducts.length; j++) {
          const similarity = this.calculateSimilarity(categoryProducts[i], categoryProducts[j]);

          if (similarity >= 0.5) {
            // Find existing nodes
            const [node1, node2] = await Promise.all([
              this.prisma.graphNode.findUnique({
                where: {
                  type_entityId: {
                    type: "PRODUCT",
                    entityId: categoryProducts[i].rawProductId,
                  },
                },
              }),
              this.prisma.graphNode.findUnique({
                where: {
                  type_entityId: {
                    type: "PRODUCT",
                    entityId: categoryProducts[j].rawProductId,
                  },
                },
              }),
            ]);

            if (node1 && node2) {
              await this.createEdge(node1.id, node2.id, "SIMILAR", similarity);
              edgesCreated++;
            }
          }
        }
      }
    }

    return edgesCreated;
  }

  private calculateSimilarity(p1: CleanProductData, p2: CleanProductData): number {
    let score = 0;

    // Category match
    if (p1.suggestedCat && p1.suggestedCat === p2.suggestedCat) score += 0.3;

    // Price similarity
    const priceDiff = Math.abs(p1.suggestedPrice - p2.suggestedPrice);
    const avgPrice = (p1.suggestedPrice + p2.suggestedPrice) / 2;
    if (avgPrice > 0 && priceDiff / avgPrice < 0.3) score += 0.2;

    // Keyword overlap
    const kw1 = new Set(p1.seoKeywords);
    const kw2 = new Set(p2.seoKeywords);
    const intersection = [...kw1].filter((k) => kw2.has(k)).length;
    const union = new Set([...kw1, ...kw2]).size;
    const keywordSim = union > 0 ? intersection / union : 0;
    score += keywordSim * 0.5;

    return score;
  }

  private generateSimpleEmbedding(product: CleanProductData): number[] {
    const embedding = new Array(32).fill(0);

    embedding[0] = Math.min(product.suggestedPrice / 1000, 1);
    embedding[1] = product.qualityScore / 100;
    embedding[2] = Math.min(product.cleanedImages.length / 10, 1);

    for (let i = 0; i < product.seoKeywords.length && i < 10; i++) {
      const hash = this.simpleHash(product.seoKeywords[i]);
      embedding[3 + (hash % 20)] = 1;
    }

    if (product.suggestedCat) {
      const catHash = this.simpleHash(product.suggestedCat);
      embedding[23 + (catHash % 8)] = 1;
    }

    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
