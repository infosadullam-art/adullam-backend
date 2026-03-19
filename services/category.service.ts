import prisma from "@/lib/prisma"
import { generateSlug } from "@/lib/utils/slug"
import type { Prisma } from "@prisma/client"

export interface CreateCategoryInput {
  name: string
  description?: string
  image?: string
  parentId?: string
  sortOrder?: number
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export class CategoryService {
  async create(input: CreateCategoryInput) {
    const slug = generateSlug(input.name)

    let finalSlug = slug
    let counter = 1
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    return prisma.category.create({
      data: {
        name: input.name,
        slug: finalSlug,
        description: input.description,
        image: input.image,
        parentId: input.parentId,
        sortOrder: input.sortOrder ?? 0,
      },
    })
  }

  async update(id: string, input: UpdateCategoryInput) {
    const data: Prisma.CategoryUpdateInput = { ...input }

    if (input.name) {
      const slug = generateSlug(input.name)
      let finalSlug = slug
      let counter = 1
      const existing = await prisma.category.findUnique({ where: { slug: finalSlug } })
      while (existing && existing.id !== id) {
        finalSlug = `${slug}-${counter}`
        counter++
      }
      data.slug = finalSlug
    }

    return prisma.category.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    // Update products to remove category reference
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    })

    // Update child categories
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })

    return prisma.category.delete({ where: { id } })
  }

  async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    })
  }

  async getBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    })
  }

  async list() {
    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    })
  }

  async getTree() {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            children: {
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            },
          },
        },
        _count: { select: { products: true } },
      },
    })

    return categories
  }
}

export const categoryService = new CategoryService()
