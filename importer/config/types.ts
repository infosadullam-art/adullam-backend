// ============================================================
// Types for Adullam Import Pipeline
// ============================================================

// ---- Enums (mirroring Prisma) ----

export type ImportSource = "ALIBABA" | "ALIEXPRESS" | "DUBAI" | "TURKEY" | "USA" | "EUROPE" | "MANUAL";
export type ImportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type PipelineStage = "SEARCHED" | "ENRICHED" | "READY_FOR_CLEAN" | "CLEANED" | "PUBLISHED" | "REJECTED";

// ---- API Response Types ----

export interface AlibabaSearchResultItem {
  item?: {
    itemId?: string | number;
    title?: string;
    productUrl?: string;
    image?: string;
    images?: string[];
    sku?: {
      def?: {
        priceModule?: {
          price?: string;
          priceList?: Array<{ price: string; minQuantity?: number; maxQuantity?: number; unit?: string }>;
        };
        quantityModule?: {
          minOrder?: { quantity?: number };
        };
      };
    };
    [key: string]: unknown;
  };
  seller?: Record<string, unknown>;
  company?: Record<string, unknown>;
}

export interface AlibabaApiResponse {
  result?: {
    resultList?: AlibabaSearchResultItem[];
    items?: AlibabaApiProduct[];
    products?: AlibabaApiProduct[];
  };
  data?: AlibabaApiProduct[] | { items?: AlibabaApiProduct[]; products?: AlibabaApiProduct[] };
  items?: AlibabaApiProduct[];
  products?: AlibabaApiProduct[];
}

export interface AlibabaApiProduct {
  id?: string | number;
  productId?: string | number;
  product_id?: string | number;
  itemId?: string | number;
  title?: string;
  name?: string;
  description?: string;
  productUrl?: string;
  product_url?: string;
  url?: string;
  image?: string;
  mainImage?: string;
  main_image?: string;
  imageUrl?: string;
  image_url?: string;
  images?: string[];
  rawImages?: string[];
  price?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  currency?: string;
  category?: string;
  categoryName?: string;
  category_name?: string;
  weight?: string | number;
  productWeight?: string | number;
  product_weight?: string | number;
  volume?: string | number;
  productVolume?: string | number;
  moq?: number;
  minOrderQuantity?: number;
  min_order_quantity?: number;
  shopId?: string | number;
  shop_id?: string | number;
  sellerId?: string | number;
  seller_id?: string | number;
  skuId?: string | number;
  sku_id?: string | number;
  attributes?: Record<string, unknown>;
  specifications?: Record<string, unknown>;
  dimensions?: { length?: number; width?: number; height?: number };
  variants?: AlibabaVariant[];
  skus?: AlibabaVariant[];
  seller?: Record<string, unknown>;
  company?: Record<string, unknown>;
  item?: {
    itemId?: string | number;
    image?: string;
    sku?: {
      def?: {
        priceModule?: {
          price?: string;
          priceList?: Array<{ price: string; minQuantity?: number; maxQuantity?: number; unit?: string }>;
        };
        quantityModule?: {
          minOrder?: { quantity?: number };
        };
      };
    };
    [key: string]: unknown;
  };
  sku?: {
    def?: {
      priceModule?: {
        price?: string;
        priceList?: Array<{ price: string; minQuantity?: number; maxQuantity?: number; unit?: string }>;
      };
      quantityModule?: {
        minOrder?: { quantity?: number };
      };
    };
  };
  
  // ✅ NOUVEAU : Champs pour les vidéos
  videoUrl?: string;
  videos?: Array<{
    url?: string;
    thumbnail?: string;
    duration?: number;
  }>;
  
  // ✅ NOUVEAU : Champ pour le chemin complet de catégorie
  categoryPath?: string;
  
  // Detail API enrichment fields
  stock?: number;
  totalStock?: number;
  [key: string]: unknown;
}

export interface AlibabaVariant {
  skuId?: string | number;
  sku_id?: string | number;
  price?: string | number;
  currency?: string;
  stock?: number;
  image?: string;
  imageUrl?: string;
  weight?: string | number;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

// ---- Parsed Product Types ----

export interface ParsedVariant {
  externalSkuId: string;
  price: number;
  currency: string;
  stock?: number;
  attributes?: Record<string, unknown>;
  image?: string;
  weight?: number;
}

// ✅ NOUVEAU : Type pour les vidéos
export interface RawVideo {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  type: 'main' | 'gallery' | 'description';
  source: 'alibaba' | 'youtube' | 'custom';
}

export interface ParsedRawProduct {
  externalProductId: string;
  externalSkuId?: string;
  externalShopId?: string;
  source: ImportSource;
  sourceUrl?: string;
  rawTitle: string;
  rawDescription?: string;
  rawMinPrice: number;
  rawMaxPrice: number;
  rawCurrency: string;
  rawImages: string[];
  rawCategory?: string;
  rawAttributes?: Record<string, unknown>;
  weight: number | null;
  volume?: number | null;
  variants?: ParsedVariant[];
  
  // ✅ NOUVEAUX CHAMPS (AJOUTÉS À LA FIN, NE RIEN CASSENT)
  alibabaCategoryPath?: string;     // Chemin hiérarchique complet (ex: "Apparel>Men's Clothing>T-Shirts")
  alibabaCategoryId?: string;       // ID de la catégorie Alibaba
  rawVideos?: RawVideo[];           // Vidéos extraites
}

// ---- Clean Product Types ----

export interface CleanProductData {
  rawProductId: string;
  cleanedTitle: string;
  cleanedDesc?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  cleanedImages: string[];
  mockupImages: string[];
  suggestedPrice: number;
  suggestedCat?: string;
  suggestedMarginPercent: number;
  qualityScore: number;
}

// ---- Pipeline Stats ----

export interface PipelineStats {
  totalFetched: number;
  totalEnriched: number;
  totalParsed: number;
  totalValidated: number;
  totalCleaned: number;
  totalRejected: number;
  rejectionReasons: Record<string, number>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// ---- Validation Result ----

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}