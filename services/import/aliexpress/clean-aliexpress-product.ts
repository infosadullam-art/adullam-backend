import { generateSku } from "@/lib/utils/slug"
import type { CleanAliExpressProduct, AliExpressVariant } from "@/services/import/aliexpress/types"

/* -------------------------------------------------------------------------- */
/*                                RAW INPUT                                   */
/* -------------------------------------------------------------------------- */
export interface AliExpressRawProduct {
  id: string
  title: string
  description?: string
  price: number
  images?: string[]

  category?: string
  subCategory?: string
  categoryPath?: string[]

  shipping?: {
    weight?: number
  }

  orders?: number
  rating?: number
  reviews?: number

  variants?: Array<{
    sku?: string
    price?: number
    weight?: number
    image?: string
    length?: number
    width?: number
    height?: number
    attributes?: {
      Color?: string
      Colour?: string
      Size?: string
      [key: string]: string | undefined
    }
  }>
}

/* -------------------------------------------------------------------------- */
/*                                 CONFIG                                     */
/* -------------------------------------------------------------------------- */
const MAX_IMAGES = 6
const MAX_COLORS = 10
const DEFAULT_WEIGHT = 0.3
const MARGIN_RATE = 0.1

/* -------------------------------------------------------------------------- */
/*                              MAIN CLEANER                                  */
/* -------------------------------------------------------------------------- */
export function cleanAliExpressProduct(
  raw: AliExpressRawProduct
): CleanAliExpressProduct {
  if (!raw?.title || !raw.price || raw.price <= 0) {
    throw new Error("Invalid raw product")
  }

  /* ------------------------------ TITLE ----------------------------------- */
  const cleanTitle = raw.title
    .replace(/[\[\]\(\)\|]/g, "")
    .replace(/(\bfree shipping\b|\bbest seller\b)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)

  /* ------------------------------ IMAGES ---------------------------------- */
  const mainImages = Array.from(new Set(raw.images || [])).slice(0, MAX_IMAGES)
  if (mainImages.length < 3) {
    throw new Error("Not enough images")
  }

  /* ------------------------------ VARIANTS -------------------------------- */
  const variants: AliExpressVariant[] = []
  const colorSet = new Set<string>()
  let validWeightFound = false

  for (const v of raw.variants || []) {
    const color = v.attributes?.Color || v.attributes?.Colour
    const size = v.attributes?.Size

    if (color) colorSet.add(color)

    const weight = v.weight ?? raw.shipping?.weight ?? DEFAULT_WEIGHT
    if (weight <= 0) continue
    validWeightFound = true

    const sku = v.sku || generateSku()
    variants.push({
      key: sku,
      sku,
      options: {
        ...(color ? { color } : {}),
        ...(size ? { size } : {}),
      },
      priceDelta: (v.price ?? raw.price) - raw.price,
      stock: 0,
      weightKg: weight,
      image: v.image,
    })
  }

  if (!variants.length) throw new Error("No valid variants")
  if (!validWeightFound) throw new Error("Weight missing")
  if (colorSet.size > MAX_COLORS) throw new Error("Too many colors")

  /* ------------------------------ DESCRIPTION ----------------------------- */
  const descriptionHtml = `
<h2>${cleanTitle}</h2>
<ul>
${Array.from(colorSet).map((c) => `<li>Color: ${c}</li>`).join("")}
</ul>
<p>${raw.description?.slice(0, 1200) ?? ""}</p>
`.trim()

  /* ------------------------------ PRICING --------------------------------- */
  const basePrice = raw.price
  const finalPrice = Number((basePrice * (1 + MARGIN_RATE)).toFixed(2))

  /* ------------------------------ FINAL ----------------------------------- */
  return {
    source: "aliexpress",
    sourceProductId: raw.id,

    title: {
      raw: raw.title,
      clean: cleanTitle,
      short: cleanTitle.slice(0, 60),
      seo: cleanTitle,
    },

    description: {
      cleanHtml: descriptionHtml,
      bulletPoints: Array.from(colorSet).map((c) => `Color: ${c}`),
    },

    category: {
      path: raw.categoryPath || [],
      main: raw.category || "Uncategorized",
      sub: raw.subCategory,
    },

    pricing: {
      currency: "USD",
      basePrice,
      marginRate: MARGIN_RATE,
      finalPrice,
    },

    shipping: {
      weightKg: variants[0].weightKg,
      lengthCm: raw.variants?.[0]?.length,
      widthCm: raw.variants?.[0]?.width,
      heightCm: raw.variants?.[0]?.height,
    },

    variants,

    images: {
      main: mainImages,
      variants: {},
    },

    attributes: {},

    stats: {
      orders: raw.orders ?? 0,
      rating: raw.rating,
      reviews: raw.reviews,
    },

    flags: {
      hasVariants: variants.length > 1,
      hasWeight: true,
      isDuplicate: false,
      isFake: false,
    },
  }
}
