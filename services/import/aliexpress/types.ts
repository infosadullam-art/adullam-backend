/* -------------------------------------------------------------------------- */
/*                                RAW INPUT                                   */
/* -------------------------------------------------------------------------- */

/**
 * Produit brut venant d’AliExpress (scraping / API)
 * 👉 C’EST CE TYPE QUI MANQUAIT
 */
export interface AliExpressRawProduct {
  id: string
  title: string
  price: number

  description?: string

  images?: string[]

  category?: string
  subCategory?: string
  categoryPath?: string[]

  orders?: number
  rating?: number
  reviews?: number

  shipping?: {
    weight?: number
  }

  variants?: Array<{
    sku?: string
    price?: number
    weight?: number
    image?: string
    attributes?: {
      Color?: string
      Colour?: string
      Size?: string
      [key: string]: string | undefined
    }
    length?: number
    width?: number
    height?: number
  }>
}

/* -------------------------------------------------------------------------- */
/*                              CLEANED OUTPUT                                */
/* -------------------------------------------------------------------------- */

/**
 * Produit nettoyé, normalisé, prêt pour l’import
 */
export interface CleanAliExpressProduct {
  source: "aliexpress"
  sourceProductId: string

  title: {
    raw: string
    clean: string
    short: string
    seo: string
  }

  description: {
    cleanHtml: string
    bulletPoints: string[]
  }

  category: {
    path: string[]
    main: string
    sub?: string
  }

  pricing: {
    currency: "USD"
    basePrice: number
    marginRate: number
    finalPrice: number
  }

  shipping: {
    weightKg: number
    lengthCm?: number
    widthCm?: number
    heightCm?: number
    volumetricWeightKg?: number
  }

  variants: AliExpressVariant[]

  images: {
    main: string[]
    variants: Record<string, string[]>
  }

  attributes: Record<string, string>

  stats: {
    orders: number
    rating?: number
    reviews?: number
  }

  flags: {
    hasVariants: boolean
    hasWeight: true
    isDuplicate: boolean
    isFake: boolean
  }
}

/* -------------------------------------------------------------------------- */
/*                                 VARIANT                                    */
/* -------------------------------------------------------------------------- */

export interface AliExpressVariant {
  key: string
  sku: string
  options: {
    color?: string
    size?: string
    [key: string]: string | undefined
  }
  priceDelta?: number
  stock: number
  weightKg: number
  image?: string
}
