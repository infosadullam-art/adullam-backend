import { prisma } from "@/lib/prisma"
import { cleanAliExpressProduct } from "./clean-aliexpress-product"
import { generateSlug } from "@/lib/utils/slug"
import type { ImportSource } from "@prisma/client"

export interface AliExpressRawProduct {
  id: string
  title: string
  price: number
  currency?: string
  images: string[]
  variants?: any[]
  description?: string
  category?: string
  subCategory?: string
  categoryPath?: string[]
  shipping?: { weight?: number }
  orders?: number
  rating?: number
  reviews?: number
}

export class AliExpressImportService {
  async importProducts(rawProducts: AliExpressRawProduct[], source: ImportSource) {
    const results: { success: any[]; failed: any[] } = { success: [], failed: [] }

    for (const raw of rawProducts) {
      try {
        const product = cleanAliExpressProduct(raw)
        const slug = generateSlug(product.title.clean)

        // Check doublons
        const existing = await prisma.product.findUnique({ where: { slug } })
        if (existing) {
          product.flags.isDuplicate = true
          results.failed.push({ raw, reason: "Duplicate" })
          continue
        }

        // Catégories
        let categoryId: string | undefined
        if (product.category.main) {
          let category = await prisma.category.findFirst({ where: { name: product.category.main } })
          if (!category) {
            category = await prisma.category.create({
              data: { name: product.category.main, slug: generateSlug(product.category.main) },
            })
          }

          if (product.category.sub) {
            let subCat = await prisma.category.findFirst({
              where: { name: product.category.sub, parentId: category.id },
            })
            if (!subCat) {
              subCat = await prisma.category.create({
                data: {
                  name: product.category.sub,
                  slug: generateSlug(product.category.sub),
                  parentId: category.id,
                },
              })
            }
            categoryId = subCat.id
          } else {
            categoryId = category.id
          }
        }

        // Création produit
        const createdProduct = await prisma.product.create({
          data: {
            title: product.title.clean,
            slug,
            description: product.description.cleanHtml,
            price: product.pricing.finalPrice,
            currency: product.pricing.currency,
            category: categoryId ? { connect: { id: categoryId } } : undefined,
            images: product.images.main,
            source,
            status: "DRAFT",
            stock: 0,
            weight: product.shipping.weightKg,
            variants: {
              create: product.variants.map((v) => ({
                sku: v.sku,
                price: (v.priceDelta ?? 0) + product.pricing.finalPrice,
                weight: v.weightKg,
                size: v.options.size,
                color: v.options.color,
                image: v.image,
              })),
            },
          },
        })

        results.success.push(createdProduct)
      } catch (error) {
        results.failed.push({
          raw,
          reason: error instanceof Error ? error.message : error,
        })
      }
    }

    return results
  }
}

export const aliExpressImportService = new AliExpressImportService()
