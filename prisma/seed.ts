import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import * as bcrypt from "bcryptjs"

// Configuration de la connexion PostgreSQL avec adaptateur
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper functions
async function upsertUser(data: {
  email: string
  password: string
  name: string
  phone?: string
  role: "ADMIN" | "USER"
}) {
  const hashedPassword = await bcrypt.hash(data.password, 12)

  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      phone: data.phone,
      role: data.role,
    },
    create: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: data.role,
    },
  })
}

async function upsertCategory(data: {
  name: string
  slug: string
  description?: string
  parentId?: string
  sortOrder?: number
}) {
  return prisma.category.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
    },
    create: data,
  })
}

async function upsertProduct(data: {
  sku: string
  slug: string
  title: string
  description?: string
  price: number
  supplierPriceUSD?: number
  sellingPriceUSD?: number
  grossProfitUSD?: number
  marginPercent?: number
  currency?: string
  images: string[]
  mockupImages?: string[]
  categoryId?: string
  tags: string[]
  attributes?: any
  stock: number
  status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED"
  featured?: boolean
  weight?: number
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
}) {
  // Calcul simple de marge si pas fourni
  const supplierPrice = data.supplierPriceUSD ?? data.price * 0.6
  const sellingPrice = data.sellingPriceUSD ?? data.price
  const grossProfit = data.grossProfitUSD ?? sellingPrice - supplierPrice
  const margin = data.marginPercent ?? (grossProfit / sellingPrice) * 100

  return prisma.product.upsert({
    where: { sku: data.sku },
    update: {
      title: data.title,
      description: data.description,
      price: data.price,
      supplierPriceUSD: supplierPrice,
      sellingPriceUSD: sellingPrice,
      grossProfitUSD: grossProfit,
      marginPercent: margin,
      currency: data.currency ?? "USD",
      images: data.images,
      mockupImages: data.mockupImages ?? [],
      tags: data.tags,
      attributes: data.attributes ?? {},
      stock: data.stock,
      status: data.status,
      featured: data.featured,
      weight: data.weight || 0,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords ?? [],
      category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
    },
    create: {
      sku: data.sku,
      slug: data.slug,
      title: data.title,
      description: data.description,
      price: data.price,
      supplierPriceUSD: supplierPrice,
      sellingPriceUSD: sellingPrice,
      grossProfitUSD: grossProfit,
      marginPercent: margin,
      currency: data.currency ?? "USD",
      images: data.images,
      mockupImages: data.mockupImages ?? [],
      tags: data.tags,
      attributes: data.attributes ?? {},
      stock: data.stock,
      status: data.status,
      featured: data.featured,
      weight: data.weight || 0,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords ?? [],
      category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
    },
  })
}

async function upsertConfig(key: string, value: unknown) {
  return prisma.systemConfig.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any },
  })
}

async function main() {
  console.log("🌱 Starting seed...")

  // ==================== SYSTEM CONFIG ====================
  console.log("📝 Creating system config...")

  await upsertConfig("app_name", "Adullam")
  await upsertConfig("currency", "XOF")
  await upsertConfig("import_sources", ["ALIBABA", "ALIEXPRESS", "DUBAI", "TURKEY", "USA", "EUROPE"])
  await upsertConfig("notification_channels", ["WHATSAPP", "SMS", "EMAIL", "PUSH"])
  await upsertConfig("ads_platforms", ["META", "TIKTOK", "GOOGLE"])
  await upsertConfig("daily_import_target", 2000)
  await upsertConfig("markup_percentage", 50)

  // ==================== USERS ====================
  console.log("👤 Creating users...")

  const admin = await upsertUser({
    email: "admin@adullam.com",
    password: "Admin123@",
    name: "Admin Adullam",
    phone: "+225070000000",
    role: "ADMIN",
  })
  console.log(`   ✓ Admin: ${admin.email}`)

  const user1 = await upsertUser({
    email: "user@adullam.com",
    password: "User123!",
    name: "Test User",
    phone: "+225071111111",
    role: "USER",
  })
  console.log(`   ✓ User: ${user1.email}`)

  const user2 = await upsertUser({
    email: "buyer@adullam.com",
    password: "Buyer123!",
    name: "Test Buyer",
    phone: "+225072222222",
    role: "USER",
  })
  console.log(`   ✓ User: ${user2.email}`)

  // ==================== CATEGORIES ====================
  console.log("📁 Creating categories...")

  const electronicsCategory = await upsertCategory({
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and gadgets",
    sortOrder: 1,
  })

  const fashionCategory = await upsertCategory({
    name: "Fashion",
    slug: "fashion",
    description: "Clothing, shoes and accessories",
    sortOrder: 2,
  })

  const homeCategory = await upsertCategory({
    name: "Home & Garden",
    slug: "home-garden",
    description: "Home decor and garden supplies",
    sortOrder: 3,
  })

  const beautyCategory = await upsertCategory({
    name: "Beauty",
    slug: "beauty",
    description: "Beauty and personal care products",
    sortOrder: 4,
  })

  // Sub-categories
  const phonesCategory = await upsertCategory({
    name: "Phones & Tablets",
    slug: "phones-tablets",
    description: "Smartphones and tablet devices",
    parentId: electronicsCategory.id,
    sortOrder: 1,
  })

  const accessoriesCategory = await upsertCategory({
    name: "Accessories",
    slug: "electronics-accessories",
    description: "Electronic accessories",
    parentId: electronicsCategory.id,
    sortOrder: 2,
  })

  const menFashionCategory = await upsertCategory({
    name: "Men's Fashion",
    slug: "mens-fashion",
    description: "Men's clothing and accessories",
    parentId: fashionCategory.id,
    sortOrder: 1,
  })

  const womenFashionCategory = await upsertCategory({
    name: "Women's Fashion",
    slug: "womens-fashion",
    description: "Women's clothing and accessories",
    parentId: fashionCategory.id,
    sortOrder: 2,
  })

  console.log("   ✓ Categories created")

  // ==================== PRODUCTS ====================
  console.log("📦 Creating products...")

  const product1 = await upsertProduct({
    sku: "ADU-PHONE-001",
    slug: "smartphone-pro-max-256gb",
    title: "Smartphone Pro Max 256GB",
    description: "High-end smartphone with 256GB storage, 6.7 inch OLED display, triple camera system, and 5G connectivity.",
    price: 450000,
    supplierPriceUSD: 300000,
    sellingPriceUSD: 450000,
    images: ["/generic-premium-smartphone.png"],
    mockupImages: ["/mockup-smartphone-1.jpg", "/mockup-smartphone-2.jpg"],
    categoryId: phonesCategory.id,
    tags: ["smartphone", "5G", "high-end", "256GB"],
    attributes: { storage: "256GB", ram: "12GB", color: "Black" },
    stock: 50,
    status: "ACTIVE",
    featured: true,
    weight: 0.2,
    seoTitle: "Premium Smartphone 256GB - Buy Now",
    seoDescription: "Best smartphone with 256GB storage, 5G, and premium features",
    seoKeywords: ["smartphone", "5G", "256GB", "premium phone"]
  })

  const product2 = await upsertProduct({
    sku: "ADU-EARBUDS-001",
    slug: "wireless-earbuds-pro",
    title: "Wireless Earbuds Pro",
    description: "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and immersive sound quality.",
    price: 75000,
    supplierPriceUSD: 45000,
    sellingPriceUSD: 75000,
    images: ["/wireless-earbuds.png"],
    mockupImages: ["/mockup-earbuds-1.jpg"],
    categoryId: accessoriesCategory.id,
    tags: ["earbuds", "wireless", "noise-cancellation", "audio"],
    attributes: { battery: "30h", color: "White", connectivity: "Bluetooth 5.3" },
    stock: 200,
    status: "ACTIVE",
    featured: true,
    weight: 0.05
  })

  const product3 = await upsertProduct({
    sku: "ADU-WATCH-001",
    slug: "smart-watch-ultra",
    title: "Smart Watch Ultra",
    description: "Advanced smartwatch with health monitoring, GPS, water resistance, and 7-day battery life.",
    price: 180000,
    supplierPriceUSD: 120000,
    sellingPriceUSD: 180000,
    images: ["/smartwatch-ultra.jpg"],
    mockupImages: ["/mockup-watch-1.jpg", "/mockup-watch-2.jpg"],
    categoryId: accessoriesCategory.id,
    tags: ["smartwatch", "fitness", "health", "GPS"],
    attributes: { battery: "7 days", waterResistance: "50m", gps: true },
    stock: 75,
    status: "ACTIVE",
    featured: false,
    weight: 0.08
  })

  const product4 = await upsertProduct({
    sku: "ADU-SHIRT-001",
    slug: "premium-cotton-shirt-white",
    title: "Premium Cotton Shirt - White",
    description: "High-quality 100% cotton shirt, perfect for business or casual wear. Available in multiple sizes.",
    price: 25000,
    supplierPriceUSD: 12000,
    sellingPriceUSD: 25000,
    images: ["/white-cotton-shirt.jpg"],
    mockupImages: ["/mockup-shirt-1.jpg"],
    categoryId: menFashionCategory.id,
    tags: ["shirt", "cotton", "formal", "white"],
    attributes: { material: "100% Cotton", sizes: ["S", "M", "L", "XL"], color: "White" },
    stock: 150,
    status: "ACTIVE",
    featured: false,
    weight: 0.3
  })

  const product5 = await upsertProduct({
    sku: "ADU-DRESS-001",
    slug: "elegant-evening-dress-black",
    title: "Elegant Evening Dress - Black",
    description: "Stunning black evening dress with elegant design, perfect for special occasions.",
    price: 85000,
    supplierPriceUSD: 50000,
    sellingPriceUSD: 85000,
    images: ["/black-evening-dress.jpg"],
    mockupImages: ["/mockup-dress-1.jpg", "/mockup-dress-2.jpg"],
    categoryId: womenFashionCategory.id,
    tags: ["dress", "evening", "elegant", "black"],
    attributes: { material: "Silk", sizes: ["XS", "S", "M", "L"], color: "Black" },
    stock: 40,
    status: "ACTIVE",
    featured: true,
    weight: 0.5
  })

  const product6 = await upsertProduct({
    sku: "ADU-LAMP-001",
    slug: "modern-led-desk-lamp",
    title: "Modern LED Desk Lamp",
    description: "Sleek LED desk lamp with adjustable brightness, USB charging port, and touch controls.",
    price: 35000,
    supplierPriceUSD: 18000,
    sellingPriceUSD: 35000,
    images: ["/modern-desk-lamp.png"],
    mockupImages: ["/mockup-lamp-1.jpg"],
    categoryId: homeCategory.id,
    tags: ["lamp", "LED", "desk", "modern"],
    attributes: { power: "12W", colorTemperature: "3000K-6000K", usb: true },
    stock: 100,
    status: "ACTIVE",
    featured: false,
    weight: 1.2
  })

  const product7 = await upsertProduct({
    sku: "ADU-SKINCARE-001",
    slug: "vitamin-c-serum-30ml",
    title: "Vitamin C Serum 30ml",
    description: "Brightening vitamin C serum with hyaluronic acid for radiant and hydrated skin.",
    price: 22000,
    supplierPriceUSD: 10000,
    sellingPriceUSD: 22000,
    images: ["/vitamin-c-serum.png"],
    mockupImages: ["/mockup-serum-1.jpg"],
    categoryId: beautyCategory.id,
    tags: ["skincare", "serum", "vitamin-c", "brightening"],
    attributes: { volume: "30ml", skinType: "All", mainIngredient: "Vitamin C" },
    stock: 200,
    status: "ACTIVE",
    featured: false,
    weight: 0.1
  })

  const product8 = await upsertProduct({
    sku: "ADU-TABLET-001",
    slug: "tablet-pro-128gb",
    title: "Tablet Pro 128GB",
    description: "Powerful tablet with 11-inch display, 128GB storage, and all-day battery life.",
    price: 350000,
    supplierPriceUSD: 230000,
    sellingPriceUSD: 350000,
    images: ["/tablet-pro.png"],
    mockupImages: ["/mockup-tablet-1.jpg", "/mockup-tablet-2.jpg"],
    categoryId: phonesCategory.id,
    tags: ["tablet", "128GB", "portable", "productivity"],
    attributes: { storage: "128GB", screen: "11 inch", battery: "All day" },
    stock: 30,
    status: "ACTIVE",
    featured: true,
    weight: 0.5
  })

  console.log("   ✓ 8 products created")

  // ==================== PRODUCT VIDEOS ====================
  console.log("🎬 Creating product videos...")

  await prisma.productVideo.upsert({
    where: { id: "video-1" },
    update: {},
    create: {
      id: "video-1",
      productId: product1.id,
      videoUrl: "https://example.com/videos/smartphone-demo.mp4",
      thumbnailUrl: "/smartphone-video-thumbnail.png",
      duration: 45,
      status: "READY",
      viewCount: 1250,
      likeCount: 89,
      shareCount: 12,
      sortOrder: 1,
    },
  })

  await prisma.productVideo.upsert({
    where: { id: "video-2" },
    update: {},
    create: {
      id: "video-2",
      productId: product2.id,
      videoUrl: "https://example.com/videos/earbuds-demo.mp4",
      thumbnailUrl: "/earbuds-video-thumbnail.png",
      duration: 30,
      status: "READY",
      viewCount: 890,
      likeCount: 67,
      shareCount: 8,
      sortOrder: 1,
    },
  })

  await prisma.productVideo.upsert({
    where: { id: "video-3" },
    update: {},
    create: {
      id: "video-3",
      productId: product5.id,
      videoUrl: "https://example.com/videos/dress-demo.mp4",
      thumbnailUrl: "/dress-video-thumbnail.jpg",
      duration: 60,
      status: "READY",
      viewCount: 2100,
      likeCount: 156,
      shareCount: 34,
      sortOrder: 1,
    },
  })

  console.log("   ✓ 3 product videos created")

  // ==================== IMPORT BATCH (Sample) ====================
  console.log("📥 Creating sample import batch...")

  const importBatch = await prisma.importBatch.upsert({
    where: { id: "batch-sample-1" },
    update: {},
    create: {
      id: "batch-sample-1",
      source: "ALIBABA",
      status: "COMPLETED",
      totalItems: 5,
      processed: 5,
      failed: 0,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
    },
  })

  // ==================== RAW PRODUCTS (corrigé avec supplierSku) ====================
  console.log("📋 Creating raw products...")
  
  for (let i = 1; i <= 5; i++) {
    await prisma.rawProduct.upsert({
      where: { id: `raw-product-${i}` },
      update: {},
      create: {
        id: `raw-product-${i}`,
        source: "ALIBABA",
        supplierSku: `SUPPLIER-SKU-${100000 + i}`, // Champ requis
        externalProductId: `ALI-${100000 + i}`,
        externalSkuId: `SKU-ALI-${100000 + i}`,
        importBatchId: importBatch.id, // Utilisez importBatchId au lieu de connect
        rawTitle: `Sample Imported Product ${i}`,
        rawDescription: `This is a sample imported product description for item ${i}.`,
        rawMinPrice: 10 + i * 5,
        rawMaxPrice: 10 + i * 5,
        rawCurrency: "USD",
        rawImages: [`/placeholder.svg?height=500&width=500&query=imported product ${i}`],
        rawCategory: "Electronics",
        rawAttributes: { color: "Black", weight: `${100 + i * 50}g` },
        status: "COMPLETED",
        isDuplicate: false,
        isFake: false,
      },
    })
  }

  console.log("   ✓ Import batch with 5 raw products created")

  // ==================== CLEAN PRODUCTS (optionnel) ====================
  console.log("✨ Creating clean products...")
  
  // Créez un clean product pour le premier raw product
  const firstRawProduct = await prisma.rawProduct.findFirst()
  if (firstRawProduct) {
    await prisma.cleanProduct.upsert({
      where: { rawProductId: firstRawProduct.id },
      update: {},
      create: {
        rawProductId: firstRawProduct.id,
        cleanedTitle: "Cleaned: " + firstRawProduct.rawTitle,
        cleanedDesc: "This product has been cleaned and processed.",
        seoTitle: "SEO Optimized Title",
        seoDescription: "SEO optimized description for better search visibility",
        seoKeywords: ["electronics", "gadget", "tech"],
        cleanedImages: ["/cleaned-image-1.jpg"],
        mockupImages: ["/mockup-1.jpg"],
        suggestedPrice: 99.99,
        suggestedCat: "Electronics",
        qualityScore: 85.5,
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: admin.id,
        suggestedMarginPercent: 40,
      },
    })
    console.log("   ✓ 1 clean product created")
  }

  // ==================== SAMPLE ORDER ====================
  console.log("🛒 Creating sample orders...")

  const order1 = await prisma.order.upsert({
    where: { orderNumber: "ORD-20260101-SAMPLE1" },
    update: {},
    create: {
      orderNumber: "ORD-20260101-SAMPLE1",
      userId: user1.id,
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "MOBILE_MONEY",
      subtotal: 525000,
      shippingCost: 5000,
      tax: 0,
      discount: 0,
      total: 530000,
      currency: "XOF",
      shippingAddress: {
        name: "Test User",
        phone: "+225071111111",
        address: "123 Main Street",
        city: "Abidjan",
        country: "Côte d'Ivoire",
      },
      trackingNumber: "TRK-123456789",
      deliveredAt: new Date(Date.now() - 86400000 * 2),
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            unitPrice: 450000,
            totalPrice: 450000,
          },
          {
            productId: product2.id,
            quantity: 1,
            unitPrice: 75000,
            totalPrice: 75000,
          },
        ],
      },
    },
  })

  // Ajouter l'historique des statuts
  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order1.id, status: "PENDING", note: "Order placed", createdAt: new Date(Date.now() - 86400000 * 5) },
      { orderId: order1.id, status: "CONFIRMED", note: "Payment received", createdAt: new Date(Date.now() - 86400000 * 4) },
      { orderId: order1.id, status: "PROCESSING", note: "Preparing order", createdAt: new Date(Date.now() - 86400000 * 3) },
      { orderId: order1.id, status: "SHIPPED", note: "Order shipped", createdAt: new Date(Date.now() - 86400000 * 2) },
      { orderId: order1.id, status: "DELIVERED", note: "Order delivered", createdAt: new Date(Date.now() - 86400000) },
    ],
  })

  const order2 = await prisma.order.upsert({
    where: { orderNumber: "ORD-20260102-SAMPLE2" },
    update: {},
    create: {
      orderNumber: "ORD-20260102-SAMPLE2",
      userId: user2.id,
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      subtotal: 85000,
      shippingCost: 3000,
      tax: 0,
      discount: 0,
      total: 88000,
      currency: "XOF",
      shippingAddress: {
        name: "Test Buyer",
        phone: "+225072222222",
        address: "456 Commerce Ave",
        city: "Abidjan",
        country: "Côte d'Ivoire",
      },
      items: {
        create: [
          {
            productId: product5.id,
            quantity: 1,
            unitPrice: 85000,
            totalPrice: 85000,
          },
        ],
      },
    },
  })

  // Ajouter l'historique des statuts
  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order2.id, status: "PENDING", note: "Order placed", createdAt: new Date(Date.now() - 86400000) },
      { orderId: order2.id, status: "CONFIRMED", note: "Payment received", createdAt: new Date(Date.now() - 43200000) },
      { orderId: order2.id, status: "PROCESSING", note: "Preparing order", createdAt: new Date() },
    ],
  })

  console.log("   ✓ 2 sample orders created")

  // ==================== INTERACTIONS ====================
  console.log("👆 Creating sample interactions...")

  const interactionTypes = ["VIEW", "CLICK", "ADD_TO_CART", "PURCHASE"]
  const contexts = ["FEED", "FOR_YOU", "SEARCH", "PRODUCT_PAGE"]
  const products = [product1, product2, product3, product4, product5, product6, product7, product8]
  const users = [user1, user2]

  for (const user of users) {
    for (let i = 0; i < 20; i++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)] as any
      const context = contexts[Math.floor(Math.random() * contexts.length)] as any

      await prisma.interaction.create({
        data: {
          userId: user.id,
          productId: product.id,
          type,
          context,
          sessionId: `session-${user.id}-${Math.floor(i / 5)}`,
          deviceType: Math.random() > 0.5 ? "mobile" : "desktop",
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 7),
        },
      })
    }
  }

  console.log("   ✓ 40 sample interactions created")

  // ==================== FOR YOU SCORES ====================
  console.log("⭐ Creating for you scores...")
  
  for (const user of users) {
    for (const product of products.slice(0, 4)) {
      await prisma.forYouScore.create({
        data: {
          userId: user.id,
          productId: product.id,
          score: Math.random() * 100,
          factors: { views: Math.floor(Math.random() * 10), clicks: Math.floor(Math.random() * 5) },
          version: 1,
          calculatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000 * 7),
        },
      })
    }
  }
  console.log("   ✓ 8 for you scores created")

  // ==================== FEED SCORES ====================
  console.log("📊 Creating feed scores...")
  
  for (const user of users) {
    for (const product of products.slice(4)) {
      await prisma.feedScore.create({
        data: {
          userId: user.id,
          productId: product.id,
          score: Math.random() * 100,
          engagement: Math.random() * 10,
          factors: { popularity: Math.random() * 100, recency: Math.random() * 100 },
          version: 1,
          calculatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000 * 7),
        },
      })
    }
  }
  console.log("   ✓ 8 feed scores created")

  // ==================== NOTIFICATIONS ====================
  console.log("🔔 Creating sample notifications...")

  await prisma.notification.create({
    data: {
      id: "notif-1",
      userId: user1.id,
      type: "ORDER_CONFIRMATION",
      channel: "WHATSAPP",
      status: "DELIVERED",
      title: "Order Confirmed",
      message: "Your order #ORD-20260101-SAMPLE1 has been confirmed.",
      data: { orderId: order1.id },
      sentAt: new Date(Date.now() - 86400000 * 5),
      deliveredAt: new Date(Date.now() - 86400000 * 5),
    },
  })

  await prisma.notification.create({
    data: {
      id: "notif-2",
      userId: user1.id,
      type: "ORDER_DELIVERED",
      channel: "WHATSAPP",
      status: "READ",
      title: "Order Delivered",
      message: "Your order #ORD-20260101-SAMPLE1 has been delivered.",
      data: { orderId: order1.id },
      sentAt: new Date(Date.now() - 86400000),
      deliveredAt: new Date(Date.now() - 86400000),
      readAt: new Date(Date.now() - 43200000),
    },
  })

  await prisma.notification.create({
    data: {
      id: "notif-3",
      userId: user2.id,
      type: "ORDER_CONFIRMATION",
      channel: "WHATSAPP",
      status: "SENT",
      title: "Order Confirmed",
      message: "Your order #ORD-20260102-SAMPLE2 has been confirmed.",
      data: { orderId: order2.id },
      sentAt: new Date(Date.now() - 43200000),
    },
  })

  console.log("   ✓ 3 sample notifications created")

  // ==================== ADS EVENTS ====================
  console.log("📊 Creating sample ads events...")

  const adsPlatforms = ["META", "TIKTOK", "GOOGLE"]
  const adsEventTypes = ["IMPRESSION", "CLICK", "CONVERSION", "PURCHASE"]

  for (let i = 0; i < 50; i++) {
    const platform = adsPlatforms[Math.floor(Math.random() * adsPlatforms.length)] as any
    const eventType = adsEventTypes[Math.floor(Math.random() * adsEventTypes.length)] as any
    const product = products[Math.floor(Math.random() * products.length)]

    await prisma.adsEvent.create({
      data: {
        platform,
        eventType,
        productId: product.id,
        campaignId: `CAMP-${platform}-001`,
        adSetId: `ADSET-${i % 5}`,
        adId: `AD-${i}`,
        cost: eventType === "IMPRESSION" ? 10 : eventType === "CLICK" ? 50 : 0,
        revenue: eventType === "PURCHASE" ? product.price : 0,
        currency: "XOF",
        deviceType: Math.random() > 0.5 ? "mobile" : "desktop",
        country: "CI",
        occurredAt: new Date(Date.now() - Math.random() * 86400000 * 7),
      },
    })
  }

  console.log("   ✓ 50 sample ads events created")

  // ==================== JOB LOGS ====================
  console.log("⚙️ Creating sample job logs...")

  const jobTypes = [
    "IMPORT_PRODUCTS",
    "DEDUPLICATION",
    "FAKE_DETECTION",
    "CLEAN_PRODUCTS",
    "FOR_YOU_SCORING",
    "FEED_SCORING",
  ] as any[]

  for (const jobType of jobTypes) {
    await prisma.jobLog.create({
      data: {
        type: jobType,
        status: "COMPLETED",
        payload: { triggered: "seed" },
        result: { success: true, processed: Math.floor(Math.random() * 100) + 10 },
        progress: 100,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 1800000),
      },
    })
  }

  console.log("   ✓ 6 sample job logs created")

  // ==================== GRAPH NODES & EDGES ====================
  console.log("🕸️ Creating sample graph nodes & edges...")

  // Supprime les anciens nodes et edges
  await prisma.graphEdge.deleteMany({})
  await prisma.graphNode.deleteMany({})

  // Création de nodes pour catégories
  const dbCategories = await prisma.category.findMany()
  const categoryNodes: Record<string, any> = {}
  for (const category of dbCategories) {
    categoryNodes[category.id] = await prisma.graphNode.create({
      data: {
        type: "CATEGORY",
        entityId: category.id,
        properties: { name: category.name || "" },
        embedding: Array(1536).fill(0), // Embedding vide de la bonne taille
      },
    })
  }

  // Création de nodes pour produits
  const productsList = await prisma.product.findMany()
  const productNodes: Record<string, any> = {}
  for (const product of productsList) {
    productNodes[product.id] = await prisma.graphNode.create({
      data: {
        type: "PRODUCT",
        entityId: product.id,
        properties: {
          title: product.title || "",
          categoryId: product.categoryId || null,
          tags: product.tags || [],
        },
        embedding: Array(1536).fill(0), // Embedding vide de la bonne taille
      },
    })
  }

  // Crée des edges entre produits et catégories
  for (const product of productsList) {
    if (product.categoryId && productNodes[product.id] && categoryNodes[product.categoryId]) {
      await prisma.graphEdge.create({
        data: {
          fromNodeId: productNodes[product.id].id,
          toNodeId: categoryNodes[product.categoryId].id,
          type: "BELONGS_TO",
          weight: 1,
        },
      })
    }
  }

  // Crée des edges entre catégories parent/enfant
  for (const category of dbCategories) {
    if (category.parentId && categoryNodes[category.id] && categoryNodes[category.parentId]) {
      await prisma.graphEdge.create({
        data: {
          fromNodeId: categoryNodes[category.id].id,
          toNodeId: categoryNodes[category.parentId].id,
          type: "BELONGS_TO",
          weight: 1,
        },
      })
    }
  }

  console.log("   ✓ Graph nodes & edges created safely")

  console.log("")
  console.log("✅ Seed completed successfully!")
  console.log("")
  console.log("📋 Summary:")
  console.log("   - 3 users (1 admin, 2 regular users)")
  console.log("   - 8 categories (4 main + 4 sub)")
  console.log("   - 8 products with full details")
  console.log("   - 3 product videos")
  console.log("   - 1 import batch with 5 raw products")
  console.log("   - 1 clean product")
  console.log("   - 2 orders with status history")
  console.log("   - 40 interactions")
  console.log("   - 8 for you scores")
  console.log("   - 8 feed scores")
  console.log("   - 3 notifications")
  console.log("   - 50 ads events")
  console.log("   - 6 job logs")
  console.log("   - Graph nodes & edges")
  console.log("")
  console.log("🔐 Admin credentials:")
  console.log("   Email: admin@adullam.com")
  console.log("   Password: Admin123@")
  console.log("")
  console.log("👤 Test user credentials:")
  console.log("   Email: user@adullam.com")
  console.log("   Password: User123!")
  console.log("")
  console.log("🎯 Ready to use!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })