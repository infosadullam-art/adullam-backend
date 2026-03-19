// ============================================================
// Configuration for Adullam Import Pipeline
// ============================================================

export const CONFIG = {
  api: {
    // Alibaba Search API (collector principal)
    alibaba: {
      baseUrl: "https://alibaba-datahub.p.rapidapi.com",
      host: "alibaba-datahub.p.rapidapi.com",
      key: process.env.ALIBABA_RAPIDAPI_KEY || "c780def0cfmsh624af52ab9c98a3p1231b0jsn4871e86d5f49", // ✅ NOUVELLE CLÉ ACTIVE
    },
    // Alibaba Product Detail API (enrichissement)
    alibaba2: {
      baseUrl: "https://alibaba-datahub.p.rapidapi.com",
      host: "alibaba-datahub.p.rapidapi.com",
      key: process.env.ALIBABA_RAPIDAPI_KEY || "c780def0cfmsh624af52ab9c98a3p1231b0jsn4871e86d5f49", // ✅ MÊME CLÉ ACTIVE
    },
  },
  rateLimit: {
    maxRequestsPerMinute: 25,
    maxRequestsPerDay: 2000,
    delayBetweenRequests: 1200,
  },
  processing: {
    retryAttempts: 3,
    retryDelay: 2000,
    batchSize: 10,
    maxProductsPerDay: 3000,
  },
  pricing: {
    marginPercent: 30,
    defaultCurrency: "USD",
  },
  validation: {
    minTitleLength: 5,
    minPrice: 0.01,
    maxPrice: 50000,
    minImages: 1,
    minQualityScore: 20,
  },
} as const;