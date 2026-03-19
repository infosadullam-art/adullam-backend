import prisma from "../lib/prisma"
import { generateSlug, generateSku } from "../lib/utils/slug"
import type { ProductStatus, Prisma } from "@prisma/client"

export interface CreateProductInput {
  title: string
  description?: string
  price: number
  compareAtPrice?: number
  costPrice?: number
  images?: string[]
  mockupImages?: string[]
  categoryId?: string
  tags?: string[]
  attributes?: Record<string, unknown>
  stock?: number
  status?: ProductStatus
  featured?: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  // ✅ AJOUT: Variantes à la création
  variants?: Array<{
    sku: string
    name?: string
    price: number
    weight?: number
    image?: string
    attributes?: Record<string, unknown>
    stock?: number
  }>
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export interface ProductFilters {
  status?: ProductStatus
  categoryId?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  search?: string
  tags?: string[]
  inStock?: boolean
}

export class ProductService {
  async create(input: CreateProductInput) {
    const slugBase = generateSlug(input.title)
    const sku = generateSku()

    let finalSlug = slugBase
    let counter = 1
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slugBase}-${counter++}`
    }

    // Création du productData TS-safe
    const productData: Prisma.ProductCreateInput = {
      sku,
      slug: finalSlug,
      title: input.title,
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPrice: input.costPrice,
      images: input.images ?? [],
      mockupImages: input.mockupImages ?? [],
      tags: input.tags ?? [],
      attributes: input.attributes as Prisma.InputJsonValue,
      stock: input.stock ?? 0,
      status: input.status ?? "DRAFT",
      featured: input.featured ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords ?? [],
    }

    // ✅ AJOUT: Création des variantes si présentes
    if (input.variants && input.variants.length > 0) {
      productData.variants = {
        create: input.variants.map(v => ({
          sku: v.sku || generateSku(),
          name: v.name,
          price: v.price,
          weight: v.weight,
          image: v.image,
          attributes: v.attributes as Prisma.InputJsonValue,
          stock: v.stock ?? 0
        }))
      }
    }

    // Connexion à la catégorie si categoryId fourni
    if (input.categoryId) {
      productData.category = { connect: { id: input.categoryId } }
    }

    return prisma.product.create({
      data: productData,
      include: { 
        category: true,
        variants: true // ✅ Inclure les variantes dans la réponse
      },
    })
  }

  async update(id: string, input: UpdateProductInput) {
    const data: Prisma.ProductUpdateInput = {}

    if (input.title) {
      const slugBase = generateSlug(input.title)
      let finalSlug = slugBase
      let counter = 1

      while ((await prisma.product.findUnique({ where: { slug: finalSlug } }))?.id !== id) {
        finalSlug = `${slugBase}-${counter++}`
      }

      data.title = input.title
      data.slug = finalSlug
    }

    if (input.description !== undefined) data.description = input.description
    if (input.price !== undefined) data.price = input.price
    if (input.compareAtPrice !== undefined) data.compareAtPrice = input.compareAtPrice
    if (input.costPrice !== undefined) data.costPrice = input.costPrice
    if (input.images !== undefined) data.images = input.images
    if (input.mockupImages !== undefined) data.mockupImages = input.mockupImages
    if (input.tags !== undefined) data.tags = input.tags
    if (input.attributes !== undefined) data.attributes = input.attributes as Prisma.InputJsonValue
    if (input.stock !== undefined) data.stock = input.stock
    if (input.status !== undefined) data.status = input.status
    if (input.featured !== undefined) data.featured = input.featured
    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription
    if (input.seoKeywords !== undefined) data.seoKeywords = input.seoKeywords

    // ✅ AJOUT: Mise à jour des variantes
    if (input.variants !== undefined) {
      // Supprimer toutes les variantes existantes
      data.variants = { deleteMany: {} }
      
      // Créer les nouvelles variantes
      if (input.variants.length > 0) {
        data.variants = {
          deleteMany: {},
          create: input.variants.map(v => ({
            sku: v.sku || generateSku(),
            name: v.name,
            price: v.price,
            weight: v.weight,
            image: v.image,
            attributes: v.attributes as Prisma.InputJsonValue,
            stock: v.stock ?? 0
          }))
        }
      }
    }

    // TS-safe category connect/disconnect
    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        data.category = { connect: { id: input.categoryId } }
      } else {
        data.category = { disconnect: true }
      }
    }

    return prisma.product.update({
      where: { id },
      data,
      include: { 
        category: true,
        variants: true // ✅ Inclure les variantes dans la réponse
      },
    })
  }

  async delete(id: string) {
    // ✅ Supprimer d'abord les variantes (automatique avec onDelete: Cascade)
    return prisma.product.delete({ where: { id } })
  }

  async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { 
        category: true, 
        videos: true,
        variants: { // ✅ AJOUT: Inclure les variantes
          orderBy: { sortOrder: "asc" }
        }
      },
    })
  }

  async getBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        videos: { where: { status: "READY" }, orderBy: { sortOrder: "asc" } },
        variants: { // ✅ AJOUT: Inclure les variantes
          orderBy: { sortOrder: "asc" }
        },
      },
    })
  }

  async list(filters: ProductFilters, page = 1, limit = 20) {
    const where: Prisma.ProductWhereInput = {}

    if (filters.status) where.status = filters.status
    if (filters.featured !== undefined) where.featured = filters.featured
    if (filters.categoryId) where.category = { id: filters.categoryId }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {}
      if (filters.minPrice) where.price.gte = filters.minPrice
      if (filters.maxPrice) where.price.lte = filters.maxPrice
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    if (filters.tags?.length) where.tags = { hasSome: filters.tags }
    if (filters.inStock) where.stock = { gt: 0 }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { 
          category: true,
          variants: true // ✅ Inclure les variantes
        },
      }),
      prisma.product.count({ where }),
    ])

    return { products, total }
  }

  async updateStock(id: string, quantity: number) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) throw new Error("Product not found")

    const newStock = product.stock + quantity
    if (newStock < 0) throw new Error("Insufficient stock")

    return prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
        status: newStock === 0 ? "OUT_OF_STOCK" : product.status,
      },
      include: { variants: true },
    })
  }

  async incrementViewCount(id: string) {
    return prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
  }

  async getStats() {
    const [total, byStatus] = await Promise.all([
      prisma.product.count(),
      prisma.product.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count._all }),
        {} as Record<ProductStatus, number>
      ),
    }
  }
}

export const productService = new ProductService()