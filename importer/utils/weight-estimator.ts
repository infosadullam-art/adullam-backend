// lib/weight-estimator.ts
// ============================================================================
// ULTIMATE WEIGHT & VOLUME ESTIMATOR - AI-Powered with Multi-Source Fusion
// ============================================================================
// This estimator NEVER returns a single default weight. It uses multiple
// strategies to provide the most accurate estimation possible for any product.
// ============================================================================

/* =====================================================
   TYPES
===================================================== */
export interface ParsedRawProduct {
  rawTitle: string;
  rawCategory?: string;
  rawDescription?: string;
  rawAttributes?: Record<string, string | number>;
  rawImages?: string[];
  rawPrice?: number;
  rawMinOrder?: number;
}

export interface ParsedVariant {
  sku?: string;
  attributes?: Record<string, string | number>;
  price?: number;
  stock?: number;
  images?: string[];
}

export interface EstimationResult {
  weightKg: number;
  volumeM3: number;
  confidence: "high" | "medium" | "low";
  source: string;
  reasoning: string;
  minWeightKg: number;
  maxWeightKg: number;
  minVolumeM3: number;
  maxVolumeM3: number;
}

interface WeightRange {
  min: number;
  max: number;
  typical: number;
  volumeMin: number;
  volumeMax: number;
  volumeTypical: number;
}

interface MaterialDensity {
  densityKgPerCm3: number;
  name: string;
}

interface SizeModifier {
  keyword: string;
  weightMultiplier: number;
  volumeMultiplier: number;
}

interface VolumeRange {
  min: number;
  max: number;
  typical: number;
}

/* =====================================================
   CONFIGURATION - API KEYS
===================================================== */
const GOOGLE_RAPIDAPI_KEY = process.env.GOOGLE_RAPIDAPI_KEY;
const OPENAI_RAPIDAPI_KEY = process.env.OPENAI_RAPIDAPI_KEY;

/* =====================================================
   ✅ BASE DE DONNÉES COMPLÈTE - POIDS ET VOLUMES PAR CATÉGORIE
===================================================== */
const CATEGORY_WEIGHT_DATABASE: Record<string, WeightRange> = {
  // Électronique
  "smartphone": { min: 0.12, max: 0.25, typical: 0.18, volumeMin: 0.00015, volumeMax: 0.0003, volumeTypical: 0.0002 },
  "phone case": { min: 0.02, max: 0.08, typical: 0.04, volumeMin: 0.00005, volumeMax: 0.00015, volumeTypical: 0.0001 },
  "earphones": { min: 0.005, max: 0.05, typical: 0.015, volumeMin: 0.00002, volumeMax: 0.0001, volumeTypical: 0.00005 },
  "earbuds": { min: 0.04, max: 0.08, typical: 0.055, volumeMin: 0.00005, volumeMax: 0.00015, volumeTypical: 0.0001 },
  "headphones": { min: 0.15, max: 0.4, typical: 0.25, volumeMin: 0.0005, volumeMax: 0.002, volumeTypical: 0.001 },
  "tablet": { min: 0.3, max: 0.7, typical: 0.5, volumeMin: 0.0005, volumeMax: 0.0015, volumeTypical: 0.001 },
  "laptop": { min: 1.2, max: 3.0, typical: 2.0, volumeMin: 0.003, volumeMax: 0.008, volumeTypical: 0.005 },
  "smartwatch": { min: 0.03, max: 0.08, typical: 0.05, volumeMin: 0.00003, volumeMax: 0.0001, volumeTypical: 0.00006 },
  "power bank": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "charger": { min: 0.03, max: 0.15, typical: 0.08, volumeMin: 0.00003, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "cable": { min: 0.02, max: 0.1, typical: 0.05, volumeMin: 0.00002, volumeMax: 0.0001, volumeTypical: 0.00005 },
  "usb cable": { min: 0.02, max: 0.08, typical: 0.04, volumeMin: 0.00002, volumeMax: 0.00008, volumeTypical: 0.00004 },
  "speaker": { min: 0.2, max: 2.0, typical: 0.5, volumeMin: 0.0003, volumeMax: 0.003, volumeTypical: 0.001 },
  "bluetooth speaker": { min: 0.15, max: 1.0, typical: 0.4, volumeMin: 0.0002, volumeMax: 0.002, volumeTypical: 0.0008 },
  "camera": { min: 0.3, max: 1.5, typical: 0.6, volumeMin: 0.0003, volumeMax: 0.002, volumeTypical: 0.001 },
  "webcam": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.00005, volumeMax: 0.0003, volumeTypical: 0.00015 },
  "mouse": { min: 0.06, max: 0.15, typical: 0.1, volumeMin: 0.00008, volumeMax: 0.0002, volumeTypical: 0.00012 },
  "keyboard": { min: 0.3, max: 1.2, typical: 0.6, volumeMin: 0.0008, volumeMax: 0.003, volumeTypical: 0.0015 },
  "monitor": { min: 2.0, max: 8.0, typical: 4.5, volumeMin: 0.01, volumeMax: 0.05, volumeTypical: 0.025 },
  "router": { min: 0.2, max: 0.8, typical: 0.4, volumeMin: 0.0003, volumeMax: 0.002, volumeTypical: 0.001 },
  "hard drive": { min: 0.15, max: 0.8, typical: 0.4, volumeMin: 0.0001, volumeMax: 0.0008, volumeTypical: 0.0004 },
  "ssd": { min: 0.03, max: 0.1, typical: 0.05, volumeMin: 0.00002, volumeMax: 0.0001, volumeTypical: 0.00005 },
  "usb flash drive": { min: 0.008, max: 0.03, typical: 0.015, volumeMin: 0.000005, volumeMax: 0.00003, volumeTypical: 0.00001 },
  "memory card": { min: 0.001, max: 0.005, typical: 0.002, volumeMin: 0.000001, volumeMax: 0.000005, volumeTypical: 0.000002 },
  "drone": { min: 0.2, max: 2.0, typical: 0.8, volumeMin: 0.001, volumeMax: 0.01, volumeTypical: 0.004 },
  "vr headset": { min: 0.3, max: 0.8, typical: 0.5, volumeMin: 0.002, volumeMax: 0.006, volumeTypical: 0.004 },
  "gaming console": { min: 2.0, max: 5.0, typical: 3.5, volumeMin: 0.005, volumeMax: 0.015, volumeTypical: 0.01 },
  "projector": { min: 0.5, max: 4.0, typical: 2.0, volumeMin: 0.002, volumeMax: 0.015, volumeTypical: 0.006 },
  "led strip": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "ring light": { min: 0.3, max: 1.5, typical: 0.7, volumeMin: 0.001, volumeMax: 0.005, volumeTypical: 0.002 },
  
  // Vêtements & Accessoires
  "t-shirt": { min: 0.1, max: 0.25, typical: 0.15, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "shirt": { min: 0.15, max: 0.35, typical: 0.25, volumeMin: 0.0003, volumeMax: 0.0006, volumeTypical: 0.00045 },
  "dress": { min: 0.15, max: 0.5, typical: 0.3, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "jeans": { min: 0.4, max: 0.8, typical: 0.55, volumeMin: 0.0005, volumeMax: 0.001, volumeTypical: 0.0007 },
  "pants": { min: 0.25, max: 0.6, typical: 0.4, volumeMin: 0.0004, volumeMax: 0.0008, volumeTypical: 0.0006 },
  "shorts": { min: 0.15, max: 0.35, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "jacket": { min: 0.4, max: 1.5, typical: 0.8, volumeMin: 0.001, volumeMax: 0.004, volumeTypical: 0.002 },
  "coat": { min: 0.8, max: 2.5, typical: 1.5, volumeMin: 0.002, volumeMax: 0.006, volumeTypical: 0.004 },
  "sweater": { min: 0.25, max: 0.6, typical: 0.4, volumeMin: 0.0005, volumeMax: 0.0015, volumeTypical: 0.001 },
  "hoodie": { min: 0.35, max: 0.8, typical: 0.55, volumeMin: 0.0008, volumeMax: 0.002, volumeTypical: 0.0012 },
  "underwear": { min: 0.03, max: 0.1, typical: 0.05, volumeMin: 0.00005, volumeMax: 0.00015, volumeTypical: 0.0001 },
  "socks": { min: 0.03, max: 0.1, typical: 0.05, volumeMin: 0.00005, volumeMax: 0.00015, volumeTypical: 0.0001 },
  "shoes": { min: 0.3, max: 1.2, typical: 0.7, volumeMin: 0.002, volumeMax: 0.006, volumeTypical: 0.004 },
  "sneakers": { min: 0.5, max: 1.0, typical: 0.75, volumeMin: 0.003, volumeMax: 0.006, volumeTypical: 0.0045 },
  "boots": { min: 0.8, max: 2.0, typical: 1.3, volumeMin: 0.004, volumeMax: 0.01, volumeTypical: 0.006 },
  "sandals": { min: 0.15, max: 0.5, typical: 0.3, volumeMin: 0.001, volumeMax: 0.003, volumeTypical: 0.002 },
  "slippers": { min: 0.1, max: 0.4, typical: 0.25, volumeMin: 0.001, volumeMax: 0.003, volumeTypical: 0.002 },
  "hat": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "cap": { min: 0.05, max: 0.15, typical: 0.08, volumeMin: 0.0003, volumeMax: 0.0008, volumeTypical: 0.0005 },
  "beanie": { min: 0.05, max: 0.12, typical: 0.08, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "scarf": { min: 0.08, max: 0.3, typical: 0.15, volumeMin: 0.0002, volumeMax: 0.0008, volumeTypical: 0.0004 },
  "gloves": { min: 0.03, max: 0.15, typical: 0.08, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  "belt": { min: 0.1, max: 0.35, typical: 0.2, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.00025 },
  "wallet": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "bag": { min: 0.2, max: 1.5, typical: 0.6, volumeMin: 0.002, volumeMax: 0.015, volumeTypical: 0.006 },
  "backpack": { min: 0.4, max: 1.5, typical: 0.8, volumeMin: 0.01, volumeMax: 0.04, volumeTypical: 0.025 },
  "handbag": { min: 0.3, max: 1.0, typical: 0.5, volumeMin: 0.002, volumeMax: 0.008, volumeTypical: 0.004 },
  "purse": { min: 0.15, max: 0.5, typical: 0.3, volumeMin: 0.001, volumeMax: 0.004, volumeTypical: 0.002 },
  "watch": { min: 0.03, max: 0.15, typical: 0.08, volumeMin: 0.00003, volumeMax: 0.00015, volumeTypical: 0.00008 },
  "watch band": { min: 0.01, max: 0.05, typical: 0.025, volumeMin: 0.00001, volumeMax: 0.00005, volumeTypical: 0.00003 },
  "sunglasses": { min: 0.02, max: 0.08, typical: 0.04, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  "glasses": { min: 0.02, max: 0.06, typical: 0.035, volumeMin: 0.0001, volumeMax: 0.0003, volumeTypical: 0.00015 },
  "jewelry": { min: 0.005, max: 0.1, typical: 0.03, volumeMin: 0.00001, volumeMax: 0.0001, volumeTypical: 0.00003 },
  "necklace": { min: 0.01, max: 0.1, typical: 0.04, volumeMin: 0.00002, volumeMax: 0.0001, volumeTypical: 0.00005 },
  "bracelet": { min: 0.01, max: 0.08, typical: 0.03, volumeMin: 0.00001, volumeMax: 0.00005, volumeTypical: 0.00003 },
  "ring": { min: 0.003, max: 0.02, typical: 0.008, volumeMin: 0.000002, volumeMax: 0.00001, volumeTypical: 0.000005 },
  "earrings": { min: 0.002, max: 0.03, typical: 0.01, volumeMin: 0.000002, volumeMax: 0.00002, volumeTypical: 0.00001 },
  "swimwear": { min: 0.1, max: 0.3, typical: 0.18, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "bikini": { min: 0.08, max: 0.2, typical: 0.12, volumeMin: 0.00015, volumeMax: 0.0004, volumeTypical: 0.00025 },
  "lingerie": { min: 0.03, max: 0.15, typical: 0.08, volumeMin: 0.0001, volumeMax: 0.0003, volumeTypical: 0.0002 },
  "bra": { min: 0.05, max: 0.15, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.00025 },
  
  // Maison & Cuisine
  "mug": { min: 0.2, max: 0.5, typical: 0.35, volumeMin: 0.0003, volumeMax: 0.0008, volumeTypical: 0.0005 },
  "cup": { min: 0.1, max: 0.4, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "glass": { min: 0.15, max: 0.4, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "plate": { min: 0.2, max: 0.8, typical: 0.45, volumeMin: 0.0005, volumeMax: 0.002, volumeTypical: 0.001 },
  "bowl": { min: 0.15, max: 0.6, typical: 0.35, volumeMin: 0.0003, volumeMax: 0.0015, volumeTypical: 0.0008 },
  "cutlery": { min: 0.03, max: 0.15, typical: 0.08, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "knife": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "kitchen knife": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "pan": { min: 0.5, max: 2.0, typical: 1.0, volumeMin: 0.002, volumeMax: 0.008, volumeTypical: 0.004 },
  "pot": { min: 0.8, max: 3.0, typical: 1.5, volumeMin: 0.003, volumeMax: 0.015, volumeTypical: 0.007 },
  "kettle": { min: 0.5, max: 1.5, typical: 0.9, volumeMin: 0.002, volumeMax: 0.005, volumeTypical: 0.003 },
  "blender": { min: 1.0, max: 3.5, typical: 2.0, volumeMin: 0.003, volumeMax: 0.01, volumeTypical: 0.006 },
  "toaster": { min: 1.0, max: 2.5, typical: 1.5, volumeMin: 0.003, volumeMax: 0.008, volumeTypical: 0.005 },
  "coffee maker": { min: 1.5, max: 5.0, typical: 3.0, volumeMin: 0.005, volumeMax: 0.02, volumeTypical: 0.01 },
  "microwave": { min: 10, max: 20, typical: 14, volumeMin: 0.03, volumeMax: 0.06, volumeTypical: 0.045 },
  "air fryer": { min: 3.0, max: 8.0, typical: 5.0, volumeMin: 0.015, volumeMax: 0.04, volumeTypical: 0.025 },
  "rice cooker": { min: 1.5, max: 4.0, typical: 2.5, volumeMin: 0.005, volumeMax: 0.015, volumeTypical: 0.01 },
  "food container": { min: 0.05, max: 0.5, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.002, volumeTypical: 0.0008 },
  "water bottle": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "thermos": { min: 0.2, max: 0.8, typical: 0.45, volumeMin: 0.0004, volumeMax: 0.0015, volumeTypical: 0.0008 },
  "lunch box": { min: 0.2, max: 0.6, typical: 0.35, volumeMin: 0.001, volumeMax: 0.003, volumeTypical: 0.002 },
  "cutting board": { min: 0.3, max: 1.5, typical: 0.7, volumeMin: 0.001, volumeMax: 0.004, volumeTypical: 0.002 },
  "towel": { min: 0.15, max: 0.8, typical: 0.4, volumeMin: 0.0005, volumeMax: 0.003, volumeTypical: 0.0015 },
  "blanket": { min: 0.8, max: 3.0, typical: 1.5, volumeMin: 0.003, volumeMax: 0.015, volumeTypical: 0.007 },
  "pillow": { min: 0.4, max: 1.5, typical: 0.8, volumeMin: 0.01, volumeMax: 0.04, volumeTypical: 0.02 },
  "bedsheet": { min: 0.5, max: 1.5, typical: 0.9, volumeMin: 0.002, volumeMax: 0.006, volumeTypical: 0.004 },
  "curtain": { min: 0.5, max: 2.0, typical: 1.0, volumeMin: 0.002, volumeMax: 0.008, volumeTypical: 0.004 },
  "lamp": { min: 0.3, max: 3.0, typical: 1.0, volumeMin: 0.001, volumeMax: 0.01, volumeTypical: 0.004 },
  "clock": { min: 0.1, max: 1.0, typical: 0.4, volumeMin: 0.0003, volumeMax: 0.003, volumeTypical: 0.001 },
  "mirror": { min: 0.5, max: 5.0, typical: 2.0, volumeMin: 0.002, volumeMax: 0.03, volumeTypical: 0.01 },
  "vase": { min: 0.2, max: 2.0, typical: 0.8, volumeMin: 0.0005, volumeMax: 0.005, volumeTypical: 0.002 },
  "candle": { min: 0.1, max: 0.8, typical: 0.3, volumeMin: 0.0002, volumeMax: 0.001, volumeTypical: 0.0005 },
  "storage box": { min: 0.3, max: 3.0, typical: 1.0, volumeMin: 0.005, volumeMax: 0.05, volumeTypical: 0.02 },
  "organizer": { min: 0.2, max: 2.0, typical: 0.8, volumeMin: 0.002, volumeMax: 0.02, volumeTypical: 0.008 },
  "hanger": { min: 0.02, max: 0.1, typical: 0.05, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0005 },
  "trash can": { min: 0.5, max: 3.0, typical: 1.5, volumeMin: 0.01, volumeMax: 0.05, volumeTypical: 0.025 },
  
  // Beauté & Santé
  "makeup": { min: 0.02, max: 0.2, typical: 0.08, volumeMin: 0.00002, volumeMax: 0.0003, volumeTypical: 0.0001 },
  "lipstick": { min: 0.02, max: 0.05, typical: 0.03, volumeMin: 0.00002, volumeMax: 0.00005, volumeTypical: 0.00003 },
  "mascara": { min: 0.015, max: 0.04, typical: 0.025, volumeMin: 0.00001, volumeMax: 0.00004, volumeTypical: 0.00002 },
  "foundation": { min: 0.03, max: 0.1, typical: 0.06, volumeMin: 0.00003, volumeMax: 0.0001, volumeTypical: 0.00006 },
  "perfume": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "skincare": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.00005, volumeMax: 0.0003, volumeTypical: 0.00015 },
  "cream": { min: 0.05, max: 0.25, typical: 0.12, volumeMin: 0.00005, volumeMax: 0.00025, volumeTypical: 0.00012 },
  "serum": { min: 0.03, max: 0.1, typical: 0.06, volumeMin: 0.00003, volumeMax: 0.0001, volumeTypical: 0.00006 },
  "shampoo": { min: 0.2, max: 1.0, typical: 0.5, volumeMin: 0.0002, volumeMax: 0.001, volumeTypical: 0.0005 },
  "conditioner": { min: 0.2, max: 1.0, typical: 0.5, volumeMin: 0.0002, volumeMax: 0.001, volumeTypical: 0.0005 },
  "soap": { min: 0.08, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0003, volumeTypical: 0.00015 },
  "toothbrush": { min: 0.02, max: 0.08, typical: 0.04, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "electric toothbrush": { min: 0.1, max: 0.3, typical: 0.18, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "hair dryer": { min: 0.4, max: 1.0, typical: 0.65, volumeMin: 0.001, volumeMax: 0.003, volumeTypical: 0.002 },
  "hair straightener": { min: 0.3, max: 0.8, typical: 0.5, volumeMin: 0.0008, volumeMax: 0.002, volumeTypical: 0.0012 },
  "hair curler": { min: 0.25, max: 0.7, typical: 0.45, volumeMin: 0.0006, volumeMax: 0.0018, volumeTypical: 0.001 },
  "razor": { min: 0.03, max: 0.15, typical: 0.08, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "electric shaver": { min: 0.15, max: 0.4, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "nail polish": { min: 0.02, max: 0.05, typical: 0.035, volumeMin: 0.00002, volumeMax: 0.00005, volumeTypical: 0.00003 },
  "makeup brush": { min: 0.01, max: 0.05, typical: 0.025, volumeMin: 0.00002, volumeMax: 0.0001, volumeTypical: 0.00005 },
  "makeup brush set": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0008, volumeTypical: 0.0004 },
  "mirror makeup": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.001, volumeTypical: 0.0005 },
  "massager": { min: 0.1, max: 1.5, typical: 0.5, volumeMin: 0.0002, volumeMax: 0.003, volumeTypical: 0.001 },
  "face mask": { min: 0.02, max: 0.08, typical: 0.04, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "supplement": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.00025 },
  
  // Sports & Plein air
  "yoga mat": { min: 0.8, max: 2.5, typical: 1.5, volumeMin: 0.003, volumeMax: 0.01, volumeTypical: 0.006 },
  "dumbbell": { min: 1.0, max: 25.0, typical: 5.0, volumeMin: 0.0005, volumeMax: 0.01, volumeTypical: 0.003 },
  "resistance band": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "jump rope": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "fitness tracker": { min: 0.02, max: 0.06, typical: 0.035, volumeMin: 0.00002, volumeMax: 0.00006, volumeTypical: 0.00004 },
  "sports bra": { min: 0.08, max: 0.2, typical: 0.12, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "leggings": { min: 0.15, max: 0.35, typical: 0.25, volumeMin: 0.0003, volumeMax: 0.0006, volumeTypical: 0.00045 },
  "running shoes": { min: 0.5, max: 1.0, typical: 0.7, volumeMin: 0.003, volumeMax: 0.006, volumeTypical: 0.0045 },
  "bicycle": { min: 8.0, max: 18.0, typical: 12.0, volumeMin: 0.1, volumeMax: 0.3, volumeTypical: 0.2 },
  "helmet": { min: 0.2, max: 0.6, typical: 0.35, volumeMin: 0.003, volumeMax: 0.008, volumeTypical: 0.005 },
  "tent": { min: 1.5, max: 6.0, typical: 3.0, volumeMin: 0.01, volumeMax: 0.04, volumeTypical: 0.02 },
  "sleeping bag": { min: 0.8, max: 2.5, typical: 1.5, volumeMin: 0.005, volumeMax: 0.02, volumeTypical: 0.01 },
  "camping chair": { min: 1.5, max: 4.0, typical: 2.5, volumeMin: 0.01, volumeMax: 0.03, volumeTypical: 0.02 },
  "flashlight": { min: 0.05, max: 0.5, typical: 0.2, volumeMin: 0.0001, volumeMax: 0.001, volumeTypical: 0.0004 },
  "binoculars": { min: 0.3, max: 1.2, typical: 0.6, volumeMin: 0.0005, volumeMax: 0.002, volumeTypical: 0.001 },
  "fishing rod": { min: 0.2, max: 0.8, typical: 0.4, volumeMin: 0.002, volumeMax: 0.01, volumeTypical: 0.005 },
  "golf club": { min: 0.3, max: 0.5, typical: 0.4, volumeMin: 0.002, volumeMax: 0.005, volumeTypical: 0.003 },
  "tennis racket": { min: 0.25, max: 0.4, typical: 0.32, volumeMin: 0.003, volumeMax: 0.006, volumeTypical: 0.004 },
  "basketball": { min: 0.5, max: 0.7, typical: 0.6, volumeMin: 0.007, volumeMax: 0.01, volumeTypical: 0.008 },
  "football": { min: 0.4, max: 0.5, typical: 0.45, volumeMin: 0.004, volumeMax: 0.006, volumeTypical: 0.005 },
  "soccer ball": { min: 0.4, max: 0.5, typical: 0.43, volumeMin: 0.005, volumeMax: 0.007, volumeTypical: 0.006 },
  "skateboard": { min: 1.5, max: 3.5, typical: 2.5, volumeMin: 0.008, volumeMax: 0.02, volumeTypical: 0.012 },
  "scooter": { min: 3.0, max: 15.0, typical: 8.0, volumeMin: 0.02, volumeMax: 0.08, volumeTypical: 0.04 },
  "electric scooter": { min: 10.0, max: 25.0, typical: 15.0, volumeMin: 0.03, volumeMax: 0.1, volumeTypical: 0.06 },
  
  // Jouets & Enfants
  "toy": { min: 0.05, max: 2.0, typical: 0.4, volumeMin: 0.0002, volumeMax: 0.01, volumeTypical: 0.002 },
  "plush toy": { min: 0.1, max: 1.0, typical: 0.3, volumeMin: 0.001, volumeMax: 0.015, volumeTypical: 0.005 },
  "action figure": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0002, volumeMax: 0.001, volumeTypical: 0.0005 },
  "doll": { min: 0.1, max: 0.8, typical: 0.35, volumeMin: 0.0005, volumeMax: 0.004, volumeTypical: 0.002 },
  "lego": { min: 0.1, max: 5.0, typical: 1.0, volumeMin: 0.0005, volumeMax: 0.02, volumeTypical: 0.005 },
  "puzzle": { min: 0.2, max: 1.5, typical: 0.6, volumeMin: 0.0005, volumeMax: 0.004, volumeTypical: 0.002 },
  "board game": { min: 0.5, max: 2.5, typical: 1.2, volumeMin: 0.002, volumeMax: 0.01, volumeTypical: 0.005 },
  "rc car": { min: 0.3, max: 3.0, typical: 1.0, volumeMin: 0.002, volumeMax: 0.02, volumeTypical: 0.008 },
  "baby clothes": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.00025 },
  "baby bottle": { min: 0.08, max: 0.2, typical: 0.12, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "stroller": { min: 6.0, max: 15.0, typical: 10.0, volumeMin: 0.05, volumeMax: 0.15, volumeTypical: 0.1 },
  "car seat": { min: 5.0, max: 15.0, typical: 9.0, volumeMin: 0.03, volumeMax: 0.08, volumeTypical: 0.05 },
  "diaper": { min: 0.02, max: 0.05, typical: 0.03, volumeMin: 0.0001, volumeMax: 0.0003, volumeTypical: 0.0002 },
  "diaper bag": { min: 0.5, max: 1.5, typical: 0.9, volumeMin: 0.005, volumeMax: 0.02, volumeTypical: 0.01 },
  
  // Outils & Bricolage
  "screwdriver": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "screwdriver set": { min: 0.3, max: 1.5, typical: 0.7, volumeMin: 0.0005, volumeMax: 0.003, volumeTypical: 0.0015 },
  "hammer": { min: 0.3, max: 1.0, typical: 0.5, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "wrench": { min: 0.1, max: 0.8, typical: 0.35, volumeMin: 0.0001, volumeMax: 0.0006, volumeTypical: 0.0003 },
  "drill": { min: 1.0, max: 3.0, typical: 1.8, volumeMin: 0.002, volumeMax: 0.008, volumeTypical: 0.004 },
  "saw": { min: 0.3, max: 2.0, typical: 0.8, volumeMin: 0.001, volumeMax: 0.006, volumeTypical: 0.003 },
  "tape measure": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  "level": { min: 0.2, max: 1.0, typical: 0.5, volumeMin: 0.0003, volumeMax: 0.002, volumeTypical: 0.001 },
  "toolbox": { min: 1.5, max: 8.0, typical: 4.0, volumeMin: 0.005, volumeMax: 0.03, volumeTypical: 0.015 },
  "paint brush": { min: 0.03, max: 0.2, typical: 0.08, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "paint roller": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0005, volumeMax: 0.002, volumeTypical: 0.001 },
  "glue gun": { min: 0.15, max: 0.5, typical: 0.3, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "soldering iron": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0008, volumeTypical: 0.0004 },
  "multimeter": { min: 0.15, max: 0.5, typical: 0.3, volumeMin: 0.0002, volumeMax: 0.0008, volumeTypical: 0.0004 },
  
  // Auto & Moto
  "car cover": { min: 1.5, max: 4.0, typical: 2.5, volumeMin: 0.005, volumeMax: 0.015, volumeTypical: 0.01 },
  "car mat": { min: 1.0, max: 4.0, typical: 2.0, volumeMin: 0.003, volumeMax: 0.01, volumeTypical: 0.006 },
  "car seat cover": { min: 0.8, max: 2.5, typical: 1.5, volumeMin: 0.003, volumeMax: 0.01, volumeTypical: 0.006 },
  "car charger": { min: 0.03, max: 0.1, typical: 0.06, volumeMin: 0.00003, volumeMax: 0.0001, volumeTypical: 0.00006 },
  "phone holder": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  "dash cam": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  "gps navigator": { min: 0.15, max: 0.4, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "tire": { min: 6.0, max: 15.0, typical: 10.0, volumeMin: 0.03, volumeMax: 0.08, volumeTypical: 0.05 },
  "motorcycle helmet": { min: 1.0, max: 2.0, typical: 1.4, volumeMin: 0.008, volumeMax: 0.015, volumeTypical: 0.01 },
  "motorcycle gloves": { min: 0.1, max: 0.3, typical: 0.2, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "motorcycle jacket": { min: 1.5, max: 4.0, typical: 2.5, volumeMin: 0.005, volumeMax: 0.015, volumeTypical: 0.01 },
  
  // Bureau & Papeterie
  "pen": { min: 0.008, max: 0.03, typical: 0.015, volumeMin: 0.00001, volumeMax: 0.00005, volumeTypical: 0.00002 },
  "pencil": { min: 0.005, max: 0.015, typical: 0.008, volumeMin: 0.000005, volumeMax: 0.00002, volumeTypical: 0.00001 },
  "notebook": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "planner": { min: 0.2, max: 0.6, typical: 0.35, volumeMin: 0.0005, volumeMax: 0.0015, volumeTypical: 0.001 },
  "stapler": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "scissors": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  "tape dispenser": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0008, volumeTypical: 0.0004 },
  "desk organizer": { min: 0.2, max: 1.0, typical: 0.5, volumeMin: 0.001, volumeMax: 0.005, volumeTypical: 0.002 },
  "file folder": { min: 0.05, max: 0.2, typical: 0.1, volumeMin: 0.0002, volumeMax: 0.0008, volumeTypical: 0.0004 },
  "binder": { min: 0.3, max: 1.0, typical: 0.5, volumeMin: 0.001, volumeMax: 0.004, volumeTypical: 0.002 },
  "paper": { min: 2.0, max: 3.0, typical: 2.5, volumeMin: 0.003, volumeMax: 0.005, volumeTypical: 0.004 },
  "envelope": { min: 0.005, max: 0.02, typical: 0.01, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "calculator": { min: 0.08, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "whiteboard": { min: 1.0, max: 5.0, typical: 2.5, volumeMin: 0.005, volumeMax: 0.03, volumeTypical: 0.015 },
  "marker": { min: 0.01, max: 0.03, typical: 0.02, volumeMin: 0.00002, volumeMax: 0.00006, volumeTypical: 0.00004 },
  
  // Pet & Animaux
  "pet food": { min: 0.5, max: 15.0, typical: 3.0, volumeMin: 0.001, volumeMax: 0.02, volumeTypical: 0.005 },
  "pet bowl": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "pet bed": { min: 0.5, max: 3.0, typical: 1.5, volumeMin: 0.01, volumeMax: 0.05, volumeTypical: 0.025 },
  "pet toy": { min: 0.03, max: 0.3, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.001, volumeTypical: 0.0004 },
  "pet collar": { min: 0.02, max: 0.1, typical: 0.05, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "pet leash": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0001, volumeMax: 0.0005, volumeTypical: 0.0003 },
  "pet carrier": { min: 1.0, max: 5.0, typical: 2.5, volumeMin: 0.02, volumeMax: 0.08, volumeTypical: 0.04 },
  "aquarium": { min: 2.0, max: 30.0, typical: 10.0, volumeMin: 0.01, volumeMax: 0.2, volumeTypical: 0.05 },
  "bird cage": { min: 1.0, max: 8.0, typical: 3.0, volumeMin: 0.02, volumeMax: 0.15, volumeTypical: 0.06 },
  "cat litter": { min: 2.0, max: 15.0, typical: 5.0, volumeMin: 0.003, volumeMax: 0.02, volumeTypical: 0.008 },
  "cat tree": { min: 5.0, max: 25.0, typical: 12.0, volumeMin: 0.05, volumeMax: 0.3, volumeTypical: 0.15 },
  
  // Décoration & Art
  "poster": { min: 0.05, max: 0.3, typical: 0.15, volumeMin: 0.0005, volumeMax: 0.003, volumeTypical: 0.0015 },
  "painting": { min: 0.3, max: 5.0, typical: 1.5, volumeMin: 0.002, volumeMax: 0.05, volumeTypical: 0.015 },
  "picture frame": { min: 0.2, max: 2.0, typical: 0.7, volumeMin: 0.001, volumeMax: 0.01, volumeTypical: 0.004 },
  "wall sticker": { min: 0.02, max: 0.2, typical: 0.08, volumeMin: 0.0001, volumeMax: 0.001, volumeTypical: 0.0004 },
  "tapestry": { min: 0.3, max: 1.5, typical: 0.7, volumeMin: 0.001, volumeMax: 0.005, volumeTypical: 0.002 },
  "rug": { min: 1.0, max: 10.0, typical: 4.0, volumeMin: 0.005, volumeMax: 0.05, volumeTypical: 0.02 },
  "carpet": { min: 2.0, max: 20.0, typical: 8.0, volumeMin: 0.01, volumeMax: 0.1, volumeTypical: 0.04 },
  "plant pot": { min: 0.2, max: 3.0, typical: 1.0, volumeMin: 0.0005, volumeMax: 0.01, volumeTypical: 0.003 },
  "artificial plant": { min: 0.1, max: 2.0, typical: 0.6, volumeMin: 0.001, volumeMax: 0.02, volumeTypical: 0.006 },
  "sculpture": { min: 0.2, max: 10.0, typical: 2.0, volumeMin: 0.0005, volumeMax: 0.03, volumeTypical: 0.008 },
  "figurine": { min: 0.05, max: 1.0, typical: 0.3, volumeMin: 0.0001, volumeMax: 0.003, volumeTypical: 0.001 },
  
  // Musique & Instruments
  "guitar": { min: 2.0, max: 5.0, typical: 3.0, volumeMin: 0.05, volumeMax: 0.12, volumeTypical: 0.08 },
  "ukulele": { min: 0.4, max: 0.8, typical: 0.55, volumeMin: 0.01, volumeMax: 0.025, volumeTypical: 0.015 },
  "violin": { min: 0.4, max: 0.6, typical: 0.5, volumeMin: 0.01, volumeMax: 0.02, volumeTypical: 0.015 },
  "keyboard": { min: 3.0, max: 15.0, typical: 8.0, volumeMin: 0.02, volumeMax: 0.1, volumeTypical: 0.05 },
  "drum": { min: 2.0, max: 10.0, typical: 5.0, volumeMin: 0.02, volumeMax: 0.1, volumeTypical: 0.05 },
  "microphone": { min: 0.1, max: 0.5, typical: 0.25, volumeMin: 0.0002, volumeMax: 0.001, volumeTypical: 0.0005 },
  "music stand": { min: 0.8, max: 2.5, typical: 1.5, volumeMin: 0.003, volumeMax: 0.01, volumeTypical: 0.006 },
  "guitar strings": { min: 0.02, max: 0.05, typical: 0.03, volumeMin: 0.00005, volumeMax: 0.00015, volumeTypical: 0.0001 },
  "guitar pick": { min: 0.001, max: 0.005, typical: 0.002, volumeMin: 0.000001, volumeMax: 0.000005, volumeTypical: 0.000002 },
  "capo": { min: 0.02, max: 0.08, typical: 0.04, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  
  // Livres & Media
  "book": { min: 0.15, max: 1.5, typical: 0.4, volumeMin: 0.0003, volumeMax: 0.003, volumeTypical: 0.001 },
  "magazine": { min: 0.1, max: 0.3, typical: 0.2, volumeMin: 0.0002, volumeMax: 0.0006, volumeTypical: 0.0004 },
  "comic book": { min: 0.1, max: 0.25, typical: 0.15, volumeMin: 0.0002, volumeMax: 0.0005, volumeTypical: 0.00035 },
  "calendar": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "dvd": { min: 0.08, max: 0.15, typical: 0.1, volumeMin: 0.0001, volumeMax: 0.0003, volumeTypical: 0.0002 },
  "vinyl record": { min: 0.15, max: 0.25, typical: 0.2, volumeMin: 0.001, volumeMax: 0.002, volumeTypical: 0.0015 },
  
  // Médical & Premiers soins
  "first aid kit": { min: 0.3, max: 2.0, typical: 0.8, volumeMin: 0.001, volumeMax: 0.006, volumeTypical: 0.003 },
  "thermometer": { min: 0.02, max: 0.1, typical: 0.05, volumeMin: 0.00005, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "blood pressure monitor": { min: 0.3, max: 0.8, typical: 0.5, volumeMin: 0.0005, volumeMax: 0.002, volumeTypical: 0.001 },
  "pulse oximeter": { min: 0.02, max: 0.06, typical: 0.04, volumeMin: 0.00003, volumeMax: 0.0001, volumeTypical: 0.00006 },
  "wheelchair": { min: 10.0, max: 25.0, typical: 15.0, volumeMin: 0.1, volumeMax: 0.3, volumeTypical: 0.2 },
  "crutches": { min: 0.8, max: 2.0, typical: 1.2, volumeMin: 0.005, volumeMax: 0.015, volumeTypical: 0.01 },
  "knee brace": { min: 0.1, max: 0.4, typical: 0.2, volumeMin: 0.0003, volumeMax: 0.001, volumeTypical: 0.0006 },
  "wrist brace": { min: 0.05, max: 0.15, typical: 0.08, volumeMin: 0.0001, volumeMax: 0.0004, volumeTypical: 0.0002 },
  
  // Générique
  "small item": { min: 0.01, max: 0.1, typical: 0.05, volumeMin: 0.00002, volumeMax: 0.0002, volumeTypical: 0.0001 },
  "medium item": { min: 0.1, max: 1.0, typical: 0.4, volumeMin: 0.0002, volumeMax: 0.002, volumeTypical: 0.0008 },
  "large item": { min: 1.0, max: 10.0, typical: 4.0, volumeMin: 0.002, volumeMax: 0.03, volumeTypical: 0.01 },
  "heavy item": { min: 5.0, max: 50.0, typical: 15.0, volumeMin: 0.01, volumeMax: 0.1, volumeTypical: 0.04 },
  "fragile item": { min: 0.1, max: 2.0, typical: 0.5, volumeMin: 0.0005, volumeMax: 0.01, volumeTypical: 0.003 },
};

/* =====================================================
   ✅ LIMITES RÉALISTES PAR CATÉGORIE (POIDS ET VOLUME)
===================================================== */

const PRODUCT_LIMITS: Record<string, { minWeight: number; maxWeight: number; minVolume: number; maxVolume: number }> = {
  // Chaussures
  "sandal": { minWeight: 0.15, maxWeight: 1.5, minVolume: 0.001, maxVolume: 0.005 },
  "slipper": { minWeight: 0.1, maxWeight: 1.0, minVolume: 0.001, maxVolume: 0.004 },
  "shoe": { minWeight: 0.2, maxWeight: 2.5, minVolume: 0.002, maxVolume: 0.008 },
  "boot": { minWeight: 0.5, maxWeight: 3.0, minVolume: 0.004, maxVolume: 0.015 },
  "sneaker": { minWeight: 0.3, maxWeight: 1.5, minVolume: 0.002, maxVolume: 0.007 },
  "heel": { minWeight: 0.2, maxWeight: 2.0, minVolume: 0.001, maxVolume: 0.006 },
  
  // Électronique
  "smartphone": { minWeight: 0.12, maxWeight: 0.25, minVolume: 0.00015, maxVolume: 0.0003 },
  "tablet": { minWeight: 0.3, maxWeight: 0.7, minVolume: 0.0005, maxVolume: 0.0015 },
  "laptop": { minWeight: 1.2, maxWeight: 3.0, minVolume: 0.003, maxVolume: 0.008 },
  "headphones": { minWeight: 0.15, maxWeight: 0.4, minVolume: 0.0005, maxVolume: 0.002 },
  
  // Vêtements
  "t-shirt": { minWeight: 0.1, maxWeight: 0.25, minVolume: 0.0002, maxVolume: 0.0005 },
  "jeans": { minWeight: 0.4, maxWeight: 0.8, minVolume: 0.0005, maxVolume: 0.001 },
  "jacket": { minWeight: 0.4, maxWeight: 1.5, minVolume: 0.001, maxVolume: 0.004 },
  
  // Accessoires
  "watch": { minWeight: 0.03, maxWeight: 0.15, minVolume: 0.00003, maxVolume: 0.00015 },
  "bag": { minWeight: 0.2, maxWeight: 2.0, minVolume: 0.002, maxVolume: 0.015 },
  
  // Maison
  "mug": { minWeight: 0.2, maxWeight: 0.5, minVolume: 0.0003, maxVolume: 0.0008 },
  "pan": { minWeight: 0.5, maxWeight: 2.0, minVolume: 0.002, maxVolume: 0.008 },
  
  // Beauté
  "perfume": { minWeight: 0.1, maxWeight: 0.5, minVolume: 0.0001, maxVolume: 0.0005 },
  "makeup": { minWeight: 0.02, maxWeight: 0.2, minVolume: 0.00002, maxVolume: 0.0003 },
  
  // Sport
  "yoga mat": { minWeight: 0.8, maxWeight: 2.5, minVolume: 0.003, maxVolume: 0.01 },
  "dumbbell": { minWeight: 1.0, maxWeight: 25.0, minVolume: 0.0005, maxVolume: 0.01 },
  
  // Jouets
  "toy": { minWeight: 0.05, maxWeight: 2.0, minVolume: 0.0002, maxVolume: 0.01 },
  
  // Livres
  "book": { minWeight: 0.15, maxWeight: 1.5, minVolume: 0.0003, maxVolume: 0.003 },
  
  // Par défaut
  "default": { minWeight: 0.05, maxWeight: 10.0, minVolume: 0.0001, maxVolume: 0.02 }
};

/* =====================================================
   ✅ FONCTION POUR OBTENIR LES LIMITES D'UN PRODUIT
===================================================== */

function getProductLimits(text: string): { minWeight: number; maxWeight: number; minVolume: number; maxVolume: number } {
  const lowerText = text.toLowerCase();
  
  for (const [key, limits] of Object.entries(PRODUCT_LIMITS)) {
    if (lowerText.includes(key)) {
      return limits;
    }
  }
  
  return PRODUCT_LIMITS.default;
}

/* =====================================================
   ✅ FONCTION POUR APPLIQUER LES LIMITES RÉALISTES
===================================================== */

function applyRealisticLimits(
  weightKg: number,
  volumeM3: number,
  productText: string,
  source: string
): { weightKg: number; volumeM3: number } {
  const limits = getProductLimits(productText);
  
  let adjustedWeight = weightKg;
  let adjustedVolume = volumeM3;
  let adjusted = false;
  
  // Ajuster le poids
  if (weightKg > limits.maxWeight) {
    adjustedWeight = limits.maxWeight;
    console.log(`[WeightEstimator] ⚠️ ${source} weight ${weightKg}kg > max ${limits.maxWeight}kg, ajusté à ${limits.maxWeight}kg`);
    adjusted = true;
  } else if (weightKg < limits.minWeight && weightKg > 0) {
    adjustedWeight = limits.minWeight;
    console.log(`[WeightEstimator] ⚠️ ${source} weight ${weightKg}kg < min ${limits.minWeight}kg, ajusté à ${limits.minWeight}kg`);
    adjusted = true;
  }
  
  // Ajuster le volume
  if (volumeM3 > limits.maxVolume) {
    adjustedVolume = limits.maxVolume;
    console.log(`[WeightEstimator] ⚠️ ${source} volume ${volumeM3}m³ > max ${limits.maxVolume}m³, ajusté à ${limits.maxVolume}m³`);
    adjusted = true;
  } else if (volumeM3 < limits.minVolume && volumeM3 > 0) {
    adjustedVolume = limits.minVolume;
    console.log(`[WeightEstimator] ⚠️ ${source} volume ${volumeM3}m³ < min ${limits.minVolume}m³, ajusté à ${limits.minVolume}m³`);
    adjusted = true;
  }
  
  if (!adjusted) {
    console.log(`[WeightEstimator] ✅ ${source} values OK: ${weightKg}kg, ${volumeM3}m³`);
  }
  
  return { weightKg: adjustedWeight, volumeM3: adjustedVolume };
}

/* =====================================================
   DENSITÉS DES MATÉRIAUX (kg/cm³)
===================================================== */
const MATERIAL_DENSITIES: Record<string, MaterialDensity> = {
  // Métaux
  "steel": { densityKgPerCm3: 0.00785, name: "Acier" },
  "stainless steel": { densityKgPerCm3: 0.00800, name: "Acier inoxydable" },
  "iron": { densityKgPerCm3: 0.00787, name: "Fer" },
  "aluminum": { densityKgPerCm3: 0.00270, name: "Aluminium" },
  "aluminium": { densityKgPerCm3: 0.00270, name: "Aluminium" },
  "copper": { densityKgPerCm3: 0.00896, name: "Cuivre" },
  "brass": { densityKgPerCm3: 0.00850, name: "Laiton" },
  "bronze": { densityKgPerCm3: 0.00880, name: "Bronze" },
  "zinc": { densityKgPerCm3: 0.00714, name: "Zinc" },
  "titanium": { densityKgPerCm3: 0.00451, name: "Titane" },
  "gold": { densityKgPerCm3: 0.01932, name: "Or" },
  "silver": { densityKgPerCm3: 0.01049, name: "Argent" },
  "platinum": { densityKgPerCm3: 0.02145, name: "Platine" },
  "nickel": { densityKgPerCm3: 0.00891, name: "Nickel" },
  "lead": { densityKgPerCm3: 0.01134, name: "Plomb" },
  "tin": { densityKgPerCm3: 0.00729, name: "Étain" },
  "metal": { densityKgPerCm3: 0.00700, name: "Métal générique" },
  "alloy": { densityKgPerCm3: 0.00750, name: "Alliage" },
  
  // Plastiques
  "plastic": { densityKgPerCm3: 0.00095, name: "Plastique générique" },
  "pvc": { densityKgPerCm3: 0.00140, name: "PVC" },
  "abs": { densityKgPerCm3: 0.00105, name: "ABS" },
  "polycarbonate": { densityKgPerCm3: 0.00120, name: "Polycarbonate" },
  "pc": { densityKgPerCm3: 0.00120, name: "Polycarbonate" },
  "acrylic": { densityKgPerCm3: 0.00119, name: "Acrylique" },
  "pmma": { densityKgPerCm3: 0.00119, name: "PMMA" },
  "nylon": { densityKgPerCm3: 0.00114, name: "Nylon" },
  "polyamide": { densityKgPerCm3: 0.00114, name: "Polyamide" },
  "polyester": { densityKgPerCm3: 0.00139, name: "Polyester" },
  "polyethylene": { densityKgPerCm3: 0.00095, name: "Polyéthylène" },
  "pe": { densityKgPerCm3: 0.00095, name: "Polyéthylène" },
  "hdpe": { densityKgPerCm3: 0.00097, name: "HDPE" },
  "ldpe": { densityKgPerCm3: 0.00092, name: "LDPE" },
  "polypropylene": { densityKgPerCm3: 0.00090, name: "Polypropylène" },
  "pp": { densityKgPerCm3: 0.00090, name: "Polypropylène" },
  "polystyrene": { densityKgPerCm3: 0.00105, name: "Polystyrène" },
  "ps": { densityKgPerCm3: 0.00105, name: "Polystyrène" },
  "tpu": { densityKgPerCm3: 0.00120, name: "TPU" },
  "silicone": { densityKgPerCm3: 0.00110, name: "Silicone" },
  "rubber": { densityKgPerCm3: 0.00120, name: "Caoutchouc" },
  "eva": { densityKgPerCm3: 0.00095, name: "EVA" },
  "foam": { densityKgPerCm3: 0.00030, name: "Mousse" },
  "memory foam": { densityKgPerCm3: 0.00050, name: "Mousse à mémoire" },
  "epoxy": { densityKgPerCm3: 0.00115, name: "Époxy" },
  "resin": { densityKgPerCm3: 0.00120, name: "Résine" },
  
  // Bois
  "wood": { densityKgPerCm3: 0.00060, name: "Bois générique" },
  "pine": { densityKgPerCm3: 0.00050, name: "Pin" },
  "oak": { densityKgPerCm3: 0.00075, name: "Chêne" },
  "maple": { densityKgPerCm3: 0.00070, name: "Érable" },
  "walnut": { densityKgPerCm3: 0.00065, name: "Noyer" },
  "cherry": { densityKgPerCm3: 0.00058, name: "Cerisier" },
  "mahogany": { densityKgPerCm3: 0.00068, name: "Acajou" },
  "teak": { densityKgPerCm3: 0.00065, name: "Teck" },
  "bamboo": { densityKgPerCm3: 0.00040, name: "Bambou" },
  "plywood": { densityKgPerCm3: 0.00055, name: "Contreplaqué" },
  "mdf": { densityKgPerCm3: 0.00075, name: "MDF" },
  "particleboard": { densityKgPerCm3: 0.00065, name: "Panneau de particules" },
  "cork": { densityKgPerCm3: 0.00024, name: "Liège" },
  
  // Verre & Céramique
  "glass": { densityKgPerCm3: 0.00250, name: "Verre" },
  "tempered glass": { densityKgPerCm3: 0.00250, name: "Verre trempé" },
  "crystal": { densityKgPerCm3: 0.00300, name: "Cristal" },
  "ceramic": { densityKgPerCm3: 0.00230, name: "Céramique" },
  "porcelain": { densityKgPerCm3: 0.00240, name: "Porcelaine" },
  "clay": { densityKgPerCm3: 0.00200, name: "Argile" },
  "terracotta": { densityKgPerCm3: 0.00190, name: "Terre cuite" },
  "marble": { densityKgPerCm3: 0.00270, name: "Marbre" },
  "granite": { densityKgPerCm3: 0.00275, name: "Granit" },
  "stone": { densityKgPerCm3: 0.00250, name: "Pierre" },
  "concrete": { densityKgPerCm3: 0.00240, name: "Béton" },
  
  // Textiles
  "cotton": { densityKgPerCm3: 0.00055, name: "Coton" },
  "polyester fabric": { densityKgPerCm3: 0.00045, name: "Polyester tissu" },
  "nylon fabric": { densityKgPerCm3: 0.00040, name: "Nylon tissu" },
  "wool": { densityKgPerCm3: 0.00035, name: "Laine" },
  "silk": { densityKgPerCm3: 0.00040, name: "Soie" },
  "linen": { densityKgPerCm3: 0.00050, name: "Lin" },
  "denim": { densityKgPerCm3: 0.00060, name: "Denim" },
  "leather": { densityKgPerCm3: 0.00090, name: "Cuir" },
  "genuine leather": { densityKgPerCm3: 0.00095, name: "Cuir véritable" },
  "pu leather": { densityKgPerCm3: 0.00070, name: "Cuir PU" },
  "faux leather": { densityKgPerCm3: 0.00065, name: "Simili cuir" },
  "suede": { densityKgPerCm3: 0.00085, name: "Daim" },
  "canvas": { densityKgPerCm3: 0.00055, name: "Toile" },
  "felt": { densityKgPerCm3: 0.00035, name: "Feutre" },
  "fleece": { densityKgPerCm3: 0.00030, name: "Polaire" },
  "velvet": { densityKgPerCm3: 0.00045, name: "Velours" },
  "mesh": { densityKgPerCm3: 0.00025, name: "Mesh" },
  "spandex": { densityKgPerCm3: 0.00035, name: "Spandex" },
  "lycra": { densityKgPerCm3: 0.00035, name: "Lycra" },
  "microfiber": { densityKgPerCm3: 0.00030, name: "Microfibre" },
  "cashmere": { densityKgPerCm3: 0.00032, name: "Cachemire" },
  "viscose": { densityKgPerCm3: 0.00048, name: "Viscose" },
  "rayon": { densityKgPerCm3: 0.00050, name: "Rayonne" },
  "chiffon": { densityKgPerCm3: 0.00025, name: "Mousseline" },
  "satin": { densityKgPerCm3: 0.00038, name: "Satin" },
  "lace": { densityKgPerCm3: 0.00020, name: "Dentelle" },
  "tweed": { densityKgPerCm3: 0.00055, name: "Tweed" },
  "oxford": { densityKgPerCm3: 0.00050, name: "Oxford" },
  "corduroy": { densityKgPerCm3: 0.00055, name: "Velours côtelé" },
  "knit": { densityKgPerCm3: 0.00035, name: "Tricot" },
  
  // Papier & Carton
  "paper": { densityKgPerCm3: 0.00070, name: "Papier" },
  "cardboard": { densityKgPerCm3: 0.00050, name: "Carton" },
  "corrugated": { densityKgPerCm3: 0.00025, name: "Carton ondulé" },
  
  // Composites & Autres
  "carbon fiber": { densityKgPerCm3: 0.00160, name: "Fibre de carbone" },
  "fiberglass": { densityKgPerCm3: 0.00180, name: "Fibre de verre" },
  "kevlar": { densityKgPerCm3: 0.00144, name: "Kevlar" },
  "graphite": { densityKgPerCm3: 0.00225, name: "Graphite" },
  "wax": { densityKgPerCm3: 0.00090, name: "Cire" },
  "paraffin": { densityKgPerCm3: 0.00090, name: "Paraffine" },
};

/* =====================================================
   MODIFICATEURS DE TAILLE
===================================================== */
const SIZE_MODIFIERS: SizeModifier[] = [
  // Très petit
  { keyword: "mini", weightMultiplier: 0.4, volumeMultiplier: 0.3 },
  { keyword: "micro", weightMultiplier: 0.3, volumeMultiplier: 0.2 },
  { keyword: "tiny", weightMultiplier: 0.35, volumeMultiplier: 0.25 },
  { keyword: "nano", weightMultiplier: 0.25, volumeMultiplier: 0.15 },
  { keyword: "pocket", weightMultiplier: 0.5, volumeMultiplier: 0.4 },
  { keyword: "travel size", weightMultiplier: 0.5, volumeMultiplier: 0.4 },
  { keyword: "compact", weightMultiplier: 0.6, volumeMultiplier: 0.5 },
  { keyword: "portable", weightMultiplier: 0.7, volumeMultiplier: 0.6 },
  
  // Petit
  { keyword: "small", weightMultiplier: 0.6, volumeMultiplier: 0.5 },
  { keyword: "xs", weightMultiplier: 0.5, volumeMultiplier: 0.4 },
  { keyword: "extra small", weightMultiplier: 0.5, volumeMultiplier: 0.4 },
  { keyword: "petite", weightMultiplier: 0.55, volumeMultiplier: 0.45 },
  { keyword: "little", weightMultiplier: 0.6, volumeMultiplier: 0.5 },
  
  // Moyen (standard)
  { keyword: "medium", weightMultiplier: 1.0, volumeMultiplier: 1.0 },
  { keyword: "regular", weightMultiplier: 1.0, volumeMultiplier: 1.0 },
  { keyword: "standard", weightMultiplier: 1.0, volumeMultiplier: 1.0 },
  { keyword: "normal", weightMultiplier: 1.0, volumeMultiplier: 1.0 },
  
  // Grand
  { keyword: "large", weightMultiplier: 1.5, volumeMultiplier: 1.6 },
  { keyword: "big", weightMultiplier: 1.4, volumeMultiplier: 1.5 },
  { keyword: "xl", weightMultiplier: 1.6, volumeMultiplier: 1.7 },
  { keyword: "extra large", weightMultiplier: 1.6, volumeMultiplier: 1.7 },
  { keyword: "2xl", weightMultiplier: 1.8, volumeMultiplier: 1.9 },
  { keyword: "xxl", weightMultiplier: 1.8, volumeMultiplier: 1.9 },
  { keyword: "3xl", weightMultiplier: 2.0, volumeMultiplier: 2.1 },
  { keyword: "xxxl", weightMultiplier: 2.0, volumeMultiplier: 2.1 },
  { keyword: "4xl", weightMultiplier: 2.2, volumeMultiplier: 2.3 },
  { keyword: "5xl", weightMultiplier: 2.4, volumeMultiplier: 2.5 },
  
  // Très grand
  { keyword: "huge", weightMultiplier: 2.0, volumeMultiplier: 2.5 },
  { keyword: "giant", weightMultiplier: 2.5, volumeMultiplier: 3.0 },
  { keyword: "jumbo", weightMultiplier: 2.2, volumeMultiplier: 2.7 },
  { keyword: "oversized", weightMultiplier: 1.8, volumeMultiplier: 2.0 },
  { keyword: "king size", weightMultiplier: 2.0, volumeMultiplier: 2.2 },
  { keyword: "queen size", weightMultiplier: 1.7, volumeMultiplier: 1.9 },
  { keyword: "full size", weightMultiplier: 1.5, volumeMultiplier: 1.6 },
  { keyword: "twin size", weightMultiplier: 1.2, volumeMultiplier: 1.3 },
  
  // Pour vêtements
  { keyword: "plus size", weightMultiplier: 1.4, volumeMultiplier: 1.5 },
  { keyword: "slim fit", weightMultiplier: 0.9, volumeMultiplier: 0.85 },
  { keyword: "regular fit", weightMultiplier: 1.0, volumeMultiplier: 1.0 },
  { keyword: "loose fit", weightMultiplier: 1.1, volumeMultiplier: 1.15 },
  { keyword: "oversized fit", weightMultiplier: 1.3, volumeMultiplier: 1.4 },
  
  // Quantités
  { keyword: "set of 2", weightMultiplier: 2.0, volumeMultiplier: 1.8 },
  { keyword: "2 pack", weightMultiplier: 2.0, volumeMultiplier: 1.8 },
  { keyword: "2pcs", weightMultiplier: 2.0, volumeMultiplier: 1.8 },
  { keyword: "set of 3", weightMultiplier: 3.0, volumeMultiplier: 2.5 },
  { keyword: "3 pack", weightMultiplier: 3.0, volumeMultiplier: 2.5 },
  { keyword: "3pcs", weightMultiplier: 3.0, volumeMultiplier: 2.5 },
  { keyword: "set of 4", weightMultiplier: 4.0, volumeMultiplier: 3.2 },
  { keyword: "4 pack", weightMultiplier: 4.0, volumeMultiplier: 3.2 },
  { keyword: "4pcs", weightMultiplier: 4.0, volumeMultiplier: 3.2 },
  { keyword: "set of 5", weightMultiplier: 5.0, volumeMultiplier: 4.0 },
  { keyword: "5 pack", weightMultiplier: 5.0, volumeMultiplier: 4.0 },
  { keyword: "5pcs", weightMultiplier: 5.0, volumeMultiplier: 4.0 },
  { keyword: "set of 6", weightMultiplier: 6.0, volumeMultiplier: 4.5 },
  { keyword: "6 pack", weightMultiplier: 6.0, volumeMultiplier: 4.5 },
  { keyword: "6pcs", weightMultiplier: 6.0, volumeMultiplier: 4.5 },
  { keyword: "set of 10", weightMultiplier: 10.0, volumeMultiplier: 7.0 },
  { keyword: "10 pack", weightMultiplier: 10.0, volumeMultiplier: 7.0 },
  { keyword: "10pcs", weightMultiplier: 10.0, volumeMultiplier: 7.0 },
  { keyword: "dozen", weightMultiplier: 12.0, volumeMultiplier: 8.0 },
  { keyword: "bulk", weightMultiplier: 5.0, volumeMultiplier: 4.0 },
  
  // Pour volumes/contenants
  { keyword: "50ml", weightMultiplier: 0.3, volumeMultiplier: 0.3 },
  { keyword: "100ml", weightMultiplier: 0.5, volumeMultiplier: 0.5 },
  { keyword: "150ml", weightMultiplier: 0.7, volumeMultiplier: 0.7 },
  { keyword: "200ml", weightMultiplier: 0.8, volumeMultiplier: 0.8 },
  { keyword: "250ml", weightMultiplier: 1.0, volumeMultiplier: 1.0 },
  { keyword: "300ml", weightMultiplier: 1.2, volumeMultiplier: 1.2 },
  { keyword: "350ml", weightMultiplier: 1.3, volumeMultiplier: 1.3 },
  { keyword: "400ml", weightMultiplier: 1.4, volumeMultiplier: 1.4 },
  { keyword: "450ml", weightMultiplier: 1.5, volumeMultiplier: 1.5 },
  { keyword: "500ml", weightMultiplier: 1.6, volumeMultiplier: 1.6 },
  { keyword: "600ml", weightMultiplier: 1.8, volumeMultiplier: 1.8 },
  { keyword: "750ml", weightMultiplier: 2.0, volumeMultiplier: 2.0 },
  { keyword: "1000ml", weightMultiplier: 2.5, volumeMultiplier: 2.5 },
  { keyword: "1l", weightMultiplier: 2.5, volumeMultiplier: 2.5 },
  { keyword: "1.5l", weightMultiplier: 3.5, volumeMultiplier: 3.5 },
  { keyword: "2l", weightMultiplier: 4.5, volumeMultiplier: 4.5 },
];

/* =====================================================
   EXTRACTEURS DE DIMENSIONS
===================================================== */
interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

function extractDimensionsFromText(text: string): Dimensions | null {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  
  // Pattern: LxWxH avec unités (ex: 10x5x3 cm, 10cm x 5cm x 3cm)
  const patterns = [
    // 10x5x3cm ou 10x5x3 cm
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|centimeters?)/i,
    // 10cm x 5cm x 3cm
    /(\d+(?:\.\d+)?)\s*cm\s*x\s*(\d+(?:\.\d+)?)\s*cm\s*x\s*(\d+(?:\.\d+)?)\s*cm/i,
    // 10x5x3mm
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:mm|millimeters?)/i,
    // 10x5x3m
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:m|meters?)(?![mi])/i,
    // 10x5x3 inches
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:in|inches?|")/i,
    // Generic LxWxH without units (assume cm)
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let l = parseFloat(match[1]);
      let w = parseFloat(match[2]);
      let h = parseFloat(match[3]);
      
      // Convert to cm based on detected unit
      if (pattern.source.includes('mm')) {
        l /= 10; w /= 10; h /= 10;
      } else if (pattern.source.includes('(?:m|meters?)')) {
        l *= 100; w *= 100; h *= 100;
      } else if (pattern.source.includes('in|inches')) {
        l *= 2.54; w *= 2.54; h *= 2.54;
      }
      
      // ✅ Limiter les dimensions à des valeurs réalistes (entre 0.5cm et 300cm)
      const MIN_SIZE_CM = 0.5;
      const MAX_SIZE_CM = 300;
      
      l = Math.min(Math.max(l, MIN_SIZE_CM), MAX_SIZE_CM);
      w = Math.min(Math.max(w, MIN_SIZE_CM), MAX_SIZE_CM);
      h = Math.min(Math.max(h, MIN_SIZE_CM), MAX_SIZE_CM);
      
      return { lengthCm: l, widthCm: w, heightCm: h };
    }
  }
  
  return null;
}

function extractWeightFromTextEnhanced(text: string): { weightKg: number; confidence: number } | null {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  
  // Liste de patterns avec confiance
  const patterns: { regex: RegExp; converter: (n: number) => number; confidence: number }[] = [
    // Shipping weight (plus précis)
    { regex: /shipping\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i, converter: (n) => n, confidence: 0.95 },
    { regex: /shipping\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/i, converter: (n) => n / 1000, confidence: 0.95 },
    { regex: /shipping\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)/i, converter: (n) => n * 0.453592, confidence: 0.95 },
    
    // Net weight
    { regex: /net\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i, converter: (n) => n, confidence: 0.9 },
    { regex: /net\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/i, converter: (n) => n / 1000, confidence: 0.9 },
    
    // Package weight
    { regex: /package\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i, converter: (n) => n, confidence: 0.92 },
    { regex: /package\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/i, converter: (n) => n / 1000, confidence: 0.92 },
    
    // Product weight
    { regex: /product\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i, converter: (n) => n, confidence: 0.88 },
    { regex: /product\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/i, converter: (n) => n / 1000, confidence: 0.88 },
    
    // Weight générique
    { regex: /weight[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i, converter: (n) => n, confidence: 0.85 },
    { regex: /weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/i, converter: (n) => n / 1000, confidence: 0.85 },
    { regex: /weight[:\s]*(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)/i, converter: (n) => n * 0.453592, confidence: 0.85 },
    { regex: /weight[:\s]*(\d+(?:\.\d+)?)\s*(?:oz|ounces?)/i, converter: (n) => n * 0.0283495, confidence: 0.85 },
    
    // Patterns plus génériques
    { regex: /(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)(?:\s|$|,|\.)/i, converter: (n) => n, confidence: 0.75 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:g|grams?)(?:\s|$|,|\.)/i, converter: (n) => n / 1000, confidence: 0.7 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)(?:\s|$|,|\.)/i, converter: (n) => n * 0.453592, confidence: 0.75 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:oz|ounces?)(?:\s|$|,|\.)/i, converter: (n) => n * 0.0283495, confidence: 0.7 },
  ];
  
  for (const { regex, converter, confidence } of patterns) {
    const match = lowerText.match(regex);
    if (match) {
      const weightKg = converter(parseFloat(match[1]));
      if (weightKg > 0.001 && weightKg < 1000) { // Reasonable weight range
        return { weightKg: round(weightKg), confidence };
      }
    }
  }
  
  return null;
}

/* =====================================================
   PUBLIC API - ESTIMATION INTELLIGENTE
===================================================== */

/**
 * Estime le poids d'un produit de manière intelligente
 * Ne retourne JAMAIS un poids unique par défaut, mais calcule
 * toujours une estimation contextuelle basée sur de multiples facteurs
 */
export async function estimateWeightSmart(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<number> {
  const result = await estimateWeightAndVolumeSmart(product, variant);
  return result.weightKg;
}

/**
 * Estime le volume d'un produit de manière intelligente
 * Ne retourne JAMAIS un volume unique par défaut
 */
export async function estimateVolumeSmart(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<number> {
  const result = await estimateWeightAndVolumeSmart(product, variant);
  return result.volumeM3;
}

/**
 * Fonction principale d'estimation - Retourne poids ET volume avec métadonnées
 */
export async function estimateWeightAndVolumeSmart(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<EstimationResult> {
  const productText = buildProductText(product, variant);
  const estimates: Array<{ weightKg: number; volumeM3: number; confidence: number; source: string }> = [];
  
  console.log(`[WeightEstimator] 🔍 Analyzing: ${product.rawTitle}`);
  
  // ============================================================
  // ÉTAPE 1: Extraction directe depuis les données du produit
  // ============================================================
  const directExtraction = extractFromProductData(product, variant);
  if (directExtraction) {
    const adjusted = applyRealisticLimits(directExtraction.weightKg, directExtraction.volumeM3, productText, "Direct extraction");
    estimates.push({
      weightKg: adjusted.weightKg,
      volumeM3: adjusted.volumeM3,
      confidence: 0.95,
      source: "direct_extraction"
    });
    console.log(`[WeightEstimator] ✅ Direct extraction: ${adjusted.weightKg}kg, ${adjusted.volumeM3}m³`);
  }
  
  // ============================================================
  // ÉTAPE 2: Estimation basée sur la catégorie
  // ============================================================
  const categoryEstimate = estimateFromCategory(productText, product.rawCategory);
  if (categoryEstimate) {
    const adjusted = applyRealisticLimits(categoryEstimate.weightKg, categoryEstimate.volumeM3, productText, "Category");
    estimates.push({
      weightKg: adjusted.weightKg,
      volumeM3: adjusted.volumeM3,
      confidence: categoryEstimate.confidence,
      source: "category_database"
    });
    console.log(`[WeightEstimator] 📊 Category estimate: ${adjusted.weightKg}kg (confidence: ${categoryEstimate.confidence})`);
  }
  
  // ============================================================
  // ÉTAPE 3: Estimation basée sur le matériau et les dimensions
  // ============================================================
  const materialEstimate = estimateFromMaterialAndDimensions(productText, product);
  if (materialEstimate) {
    const adjusted = applyRealisticLimits(materialEstimate.weightKg, materialEstimate.volumeM3, productText, "Material");
    estimates.push({
      weightKg: adjusted.weightKg,
      volumeM3: adjusted.volumeM3,
      confidence: materialEstimate.confidence,
      source: "material_calculation"
    });
    console.log(`[WeightEstimator] 🧱 Material estimate: ${adjusted.weightKg}kg, ${adjusted.volumeM3}m³`);
  }
  
  // ============================================================
  // ÉTAPE 4: Google Search (si APIs disponibles et pas assez de données)
  // ============================================================
  if (GOOGLE_RAPIDAPI_KEY && estimates.length < 2) {
    try {
      const googleEstimate = await estimateFromGoogle(product, variant);
      if (googleEstimate) {
        const adjusted = applyRealisticLimits(googleEstimate.weightKg, googleEstimate.volumeM3, productText, "Google");
        estimates.push({
          weightKg: adjusted.weightKg,
          volumeM3: adjusted.volumeM3,
          confidence: googleEstimate.confidence,
          source: "google_search"
        });
        console.log(`[WeightEstimator] 🔎 Google estimate: ${adjusted.weightKg}kg, ${adjusted.volumeM3}m³`);
      }
    } catch (err) {
      console.warn(`[WeightEstimator] ⚠️ Google search failed:`, err);
    }
  }
  
  // ============================================================
  // ÉTAPE 5: IA (si API disponible et besoin de confirmation)
  // ============================================================
  if (OPENAI_RAPIDAPI_KEY && (estimates.length < 2 || estimates.every(e => e.confidence < 0.7))) {
    try {
      const aiEstimate = await estimateFromAI(product, variant);
      if (aiEstimate) {
        const adjusted = applyRealisticLimits(aiEstimate.weightKg, aiEstimate.volumeM3, productText, "AI");
        estimates.push({
          weightKg: adjusted.weightKg,
          volumeM3: adjusted.volumeM3,
          confidence: aiEstimate.confidence,
          source: "ai_estimation"
        });
        console.log(`[WeightEstimator] 🤖 AI estimate: ${adjusted.weightKg}kg, ${adjusted.volumeM3}m³`);
      }
    } catch (err) {
      console.warn(`[WeightEstimator] ⚠️ AI estimation failed:`, err);
    }
  }
  
  // ============================================================
  // ÉTAPE 6: Fusion intelligente des estimations
  // ============================================================
  if (estimates.length > 0) {
    return fuseEstimatesIntelligent(estimates, product, variant);
  }
  
  // ============================================================
  // ÉTAPE 7: Fallback contextuel (JAMAIS un poids unique)
  // ============================================================
  return generateContextualFallback(product, variant, productText);
}

/* =====================================================
   EXTRACTION DEPUIS LES DONNÉES DU PRODUIT
===================================================== */
function extractFromProductData(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): { weightKg: number; volumeM3: number } | null {
  const allText = buildProductText(product, variant);
  
  // Extraire le poids
  const weightResult = extractWeightFromTextEnhanced(allText);
  if (!weightResult) return null;
  
  // Extraire le volume (depuis les dimensions)
  let volumeM3 = 0;
  const dimensions = extractDimensionsFromText(allText);
  if (dimensions) {
    volumeM3 = (dimensions.lengthCm / 100) * (dimensions.widthCm / 100) * (dimensions.heightCm / 100);
  }
  
  // Si pas de volume trouvé, estimer basé sur le poids
  if (volumeM3 === 0) {
    volumeM3 = estimateVolumeFromWeight(weightResult.weightKg);
  }
  
  return {
    weightKg: weightResult.weightKg,
    volumeM3: roundVolume(volumeM3)
  };
}

/* =====================================================
   ESTIMATION DEPUIS LA CATÉGORIE
===================================================== */
function estimateFromCategory(
  productText: string,
  category?: string
): { weightKg: number; volumeM3: number; confidence: number } | null {
  const lowerText = productText.toLowerCase();
  const lowerCategory = category?.toLowerCase() || "";
  
  let bestMatch: { key: string; range: WeightRange; score: number } | null = null;
  
  // Chercher la meilleure correspondance
  for (const [key, range] of Object.entries(CATEGORY_WEIGHT_DATABASE)) {
    const keyWords = key.split(" ");
    let score = 0;
    
    // Score basé sur le titre et la catégorie
    for (const word of keyWords) {
      if (lowerText.includes(word)) score += 2;
      if (lowerCategory.includes(word)) score += 3;
    }
    
    // Bonus pour correspondance exacte
    if (lowerText.includes(key)) score += 5;
    if (lowerCategory.includes(key)) score += 7;
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { key, range, score };
    }
  }
  
  if (!bestMatch) return null;
  
  // Appliquer les modificateurs de taille
  let weightMultiplier = 1.0;
  let volumeMultiplier = 1.0;
  
  for (const modifier of SIZE_MODIFIERS) {
    if (lowerText.includes(modifier.keyword)) {
      weightMultiplier = modifier.weightMultiplier;
      volumeMultiplier = modifier.volumeMultiplier;
      break;
    }
  }
  
  const { range } = bestMatch;
  const weightKg = round(range.typical * weightMultiplier);
  const volumeM3 = roundVolume(range.volumeTypical * volumeMultiplier);
  const confidence = Math.min(0.85, bestMatch.score / 15);
  
  return { weightKg, volumeM3, confidence };
}

/* =====================================================
   ESTIMATION DEPUIS MATÉRIAU ET DIMENSIONS
===================================================== */
function estimateFromMaterialAndDimensions(
  productText: string,
  product: ParsedRawProduct
): { weightKg: number; volumeM3: number; confidence: number } | null {
  const lowerText = productText.toLowerCase();
  
  // Trouver le matériau
  let detectedMaterial: MaterialDensity | null = null;
  for (const [key, material] of Object.entries(MATERIAL_DENSITIES)) {
    if (lowerText.includes(key)) {
      detectedMaterial = material;
      break;
    }
  }
  
  // Extraire les dimensions
  const dimensions = extractDimensionsFromText(productText);
  
  if (!detectedMaterial || !dimensions) return null;
  
  // Calculer le volume en cm³
  const volumeCm3 = dimensions.lengthCm * dimensions.widthCm * dimensions.heightCm;
  
  // ✅ Limiter le volume à des valeurs réalistes
  const MAX_VOLUME_CM3 = 50000; // ~37cm cube
  const MIN_VOLUME_CM3 = 1;      // 1cm³ minimum
  
  const safeVolumeCm3 = Math.min(Math.max(volumeCm3, MIN_VOLUME_CM3), MAX_VOLUME_CM3);
  
  // Supposer que l'objet n'est pas solide (facteur de remplissage)
  // La plupart des produits ont environ 30-70% de volume réel
  const fillFactor = detectFillFactor(lowerText);
  
  const weightKg = round(safeVolumeCm3 * detectedMaterial.densityKgPerCm3 * fillFactor);
  const volumeM3 = roundVolume(safeVolumeCm3 / 1000000);
  
  return { weightKg, volumeM3, confidence: 0.7 };
}

function detectFillFactor(text: string): number {
  const solidKeywords = ["solid", "massive", "heavy duty", "thick"];
  const hollowKeywords = ["hollow", "light", "thin", "shell", "inflatable", "foldable"];
  
  for (const keyword of solidKeywords) {
    if (text.includes(keyword)) return 0.8;
  }
  for (const keyword of hollowKeywords) {
    if (text.includes(keyword)) return 0.2;
  }
  
  return 0.4; // Default fill factor
}

/* =====================================================
   GOOGLE SEARCH ESTIMATION
===================================================== */
async function estimateFromGoogle(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<{ weightKg: number; volumeM3: number; confidence: number } | null> {
  if (!GOOGLE_RAPIDAPI_KEY) return null;
  
  const query = buildGoogleQuery(product, variant);
  
  try {
    const res = await fetch(
      `https://google-search74.p.rapidapi.com/?query=${encodeURIComponent(query)}&limit=10`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "google-search74.p.rapidapi.com",
          "x-rapidapi-key": GOOGLE_RAPIDAPI_KEY,
        },
      }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const texts: string[] = [];
    
    if (Array.isArray(data.results)) {
      for (const r of data.results) {
        texts.push(r.title ?? "", r.snippet ?? "", r.metadescription ?? "");
      }
    }
    
    const combinedText = texts.join(" ");
    const weightResult = extractWeightFromTextEnhanced(combinedText);
    const dimensions = extractDimensionsFromText(combinedText);
    
    if (weightResult) {
      let volumeM3 = 0;
      if (dimensions) {
        volumeM3 = (dimensions.lengthCm / 100) * (dimensions.widthCm / 100) * (dimensions.heightCm / 100);
      } else {
        volumeM3 = estimateVolumeFromWeight(weightResult.weightKg);
      }
      
      return {
        weightKg: weightResult.weightKg,
        volumeM3: roundVolume(volumeM3),
        confidence: weightResult.confidence * 0.9
      };
    }
    
    return null;
  } catch (err) {
    console.warn("[WeightEstimator] Google search failed:", err);
    return null;
  }
}

function buildGoogleQuery(product: ParsedRawProduct, variant?: ParsedVariant): string {
  let query = product.rawTitle;
  if (variant?.attributes) {
    query += " " + Object.values(variant.attributes).join(" ");
  }
  query += " weight kg OR shipping weight OR product specifications";
  return query;
}

/* =====================================================
   AI ESTIMATION
===================================================== */
async function estimateFromAI(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<{ weightKg: number; volumeM3: number; confidence: number } | null> {
  if (!OPENAI_RAPIDAPI_KEY) return null;
  
  const prompt = buildAIPrompt(product, variant);
  
  try {
    const res = await fetch("https://open-ai21.p.rapidapi.com/conversationllama", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "open-ai21.p.rapidapi.com",
        "x-rapidapi-key": OPENAI_RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        web_access: true
      }),
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const rawText = data?.result || data?.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON response
    try {
      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[^{}]*"weightKg"[^{}]*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        if (json.weightKg && json.weightKg > 0) {
          return {
            weightKg: round(json.weightKg),
            volumeM3: json.volumeM3 ? roundVolume(json.volumeM3) : estimateVolumeFromWeight(json.weightKg),
            confidence: json.confidence || 0.75
          };
        }
      }
    } catch {}
    
    // Fallback: extract from text
    const weightResult = extractWeightFromTextEnhanced(rawText);
    if (weightResult) {
      return {
        weightKg: weightResult.weightKg,
        volumeM3: estimateVolumeFromWeight(weightResult.weightKg),
        confidence: weightResult.confidence * 0.8
      };
    }
    
    return null;
  } catch (err) {
    console.warn("[WeightEstimator] AI estimation failed:", err);
    return null;
  }
}

function buildAIPrompt(product: ParsedRawProduct, variant?: ParsedVariant): string {
  const variantInfo = variant
    ? `\n- Variant attributes: ${JSON.stringify(variant.attributes || {})}`
    : "";
  
  return `You are an expert logistics specialist. Estimate the realistic shipping weight and package volume for this product.

Product Information:
- Title: ${product.rawTitle}
- Category: ${product.rawCategory || "Not specified"}
- Description: ${product.rawDescription?.slice(0, 500) || "Not available"}
- Attributes: ${JSON.stringify(product.rawAttributes || {})}${variantInfo}

IMPORTANT RULES:
1. Consider product + packaging weight (shipping weight)
2. Think like Amazon FBA / international shipping standards
3. Use your real-world knowledge of similar products
4. NEVER use arbitrary defaults - estimate based on product type
5. Consider material, size, and typical market products
6. Volume should include packaging (add 20-30% to product dimensions)

Provide a weight range (min, typical, max) for accuracy.

Return ONLY valid JSON:
{
  "weightKg": <typical weight in kg>,
  "minWeightKg": <minimum realistic weight>,
  "maxWeightKg": <maximum realistic weight>,
  "volumeM3": <typical volume in cubic meters>,
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`;
}

/* =====================================================
   FUSION INTELLIGENTE DES ESTIMATIONS
===================================================== */
function fuseEstimatesIntelligent(
  estimates: Array<{ weightKg: number; volumeM3: number; confidence: number; source: string }>,
  product: ParsedRawProduct,
  variant?: ParsedVariant
): EstimationResult {
  
  const productText = buildProductText(product, variant);
  const limits = getProductLimits(productText);
  
  // Trier par confiance
  estimates.sort((a, b) => b.confidence - a.confidence);
  
  // Filtrer les estimations aberrantes (optionnel car déjà ajustées)
  const validEstimates = estimates.filter(e => 
    e.weightKg >= limits.minWeight && e.weightKg <= limits.maxWeight &&
    e.volumeM3 >= limits.minVolume && e.volumeM3 <= limits.maxVolume
  );
  
  // Si tout a été filtré, garder la meilleure estimation
  const estimatesToUse = validEstimates.length > 0 ? validEstimates : estimates;
  
  // Calculer la moyenne pondérée
  let totalWeight = 0;
  let totalVolume = 0;
  let totalConfidenceWeight = 0;
  
  const weights: number[] = [];
  const volumes: number[] = [];
  
  for (const estimate of estimatesToUse) {
    const weight = estimate.confidence;
    totalWeight += estimate.weightKg * weight;
    totalVolume += estimate.volumeM3 * weight;
    totalConfidenceWeight += weight;
    weights.push(estimate.weightKg);
    volumes.push(estimate.volumeM3);
  }
  
  const avgWeightKg = round(totalWeight / totalConfidenceWeight);
  const avgVolumeM3 = roundVolume(totalVolume / totalConfidenceWeight);
  
  // ✅ S'assurer que le résultat final est dans les limites
  const finalWeightKg = Math.min(Math.max(avgWeightKg, limits.minWeight), limits.maxWeight);
  const finalVolumeM3 = Math.min(Math.max(avgVolumeM3, limits.minVolume), limits.maxVolume);
  
  // Calculer min/max
  const minWeightKg = round(Math.min(...weights) * 0.9);
  const maxWeightKg = round(Math.max(...weights) * 1.1);
  const minVolumeM3 = roundVolume(Math.min(...volumes) * 0.9);
  const maxVolumeM3 = roundVolume(Math.max(...volumes) * 1.1);
  
  // Déterminer la confiance globale
  const topConfidence = estimatesToUse[0].confidence;
  let confidence: "high" | "medium" | "low" = "low";
  if (topConfidence >= 0.8) confidence = "high";
  else if (topConfidence >= 0.5) confidence = "medium";
  
  // Sources utilisées
  const sources = estimatesToUse.map(e => e.source).join(", ");
  
  console.log(`[WeightEstimator] ✅ Final estimate: ${finalWeightKg}kg (${minWeightKg}-${maxWeightKg}kg), ${finalVolumeM3}m³ (${minVolumeM3}-${maxVolumeM3}m³)`);
  console.log(`[WeightEstimator] 📋 Sources: ${sources}, Confidence: ${confidence}`);
  
  return {
    weightKg: finalWeightKg,
    volumeM3: finalVolumeM3,
    confidence,
    source: sources,
    reasoning: `Estimated from ${estimatesToUse.length} source(s): ${sources}`,
    minWeightKg,
    maxWeightKg,
    minVolumeM3,
    maxVolumeM3
  };
}

/* =====================================================
   FALLBACK CONTEXTUEL
===================================================== */
function generateContextualFallback(
  product: ParsedRawProduct,
  variant?: ParsedVariant,
  productText?: string
): EstimationResult {
  const text = productText || buildProductText(product, variant);
  const lowerText = text.toLowerCase();
  
  // Analyser le texte pour deviner le type de produit
  let baseWeight = 0.3;
  let baseVolume = 0.001;
  let reasoning = "Contextual fallback based on text analysis";
  
  // Indices de poids léger
  const lightKeywords = ["light", "mini", "small", "tiny", "pocket", "portable", "thin", "slim", "soft", "fabric", "cloth", "paper", "plastic"];
  const heavyKeywords = ["heavy", "large", "big", "steel", "metal", "iron", "solid", "thick", "wooden", "glass", "ceramic", "motor", "electric"];
  const veryLightKeywords = ["earring", "ring", "sticker", "patch", "label", "card", "needle", "pin"];
  const veryHeavyKeywords = ["furniture", "appliance", "machine", "equipment", "engine", "generator"];
  
  // Ajuster basé sur les mots-clés
  let foundIndicator = false;
  
  for (const keyword of veryLightKeywords) {
    if (lowerText.includes(keyword)) {
      baseWeight = 0.02;
      baseVolume = 0.00005;
      reasoning = `Very light item detected (keyword: ${keyword})`;
      foundIndicator = true;
      break;
    }
  }
  
  if (!foundIndicator) {
    for (const keyword of veryHeavyKeywords) {
      if (lowerText.includes(keyword)) {
        baseWeight = 8.0;
        baseVolume = 0.04;
        reasoning = `Heavy item detected (keyword: ${keyword})`;
        foundIndicator = true;
        break;
      }
    }
  }
  
  if (!foundIndicator) {
    let lightScore = 0;
    let heavyScore = 0;
    
    for (const keyword of lightKeywords) {
      if (lowerText.includes(keyword)) lightScore++;
    }
    for (const keyword of heavyKeywords) {
      if (lowerText.includes(keyword)) heavyScore++;
    }
    
    if (lightScore > heavyScore) {
      baseWeight = 0.15;
      baseVolume = 0.0003;
      reasoning = `Light item indicators detected (score: ${lightScore})`;
    } else if (heavyScore > lightScore) {
      baseWeight = 1.5;
      baseVolume = 0.005;
      reasoning = `Heavy item indicators detected (score: ${heavyScore})`;
    }
  }
  
  // Appliquer les modificateurs de taille
  for (const modifier of SIZE_MODIFIERS) {
    if (lowerText.includes(modifier.keyword)) {
      baseWeight *= modifier.weightMultiplier;
      baseVolume *= modifier.volumeMultiplier;
      reasoning += ` | Size modifier: ${modifier.keyword}`;
      break;
    }
  }
  
  // Vérifier le prix pour ajuster (produits chers sont souvent plus lourds/volumineux)
  if (product.rawPrice) {
    if (product.rawPrice > 100) {
      baseWeight *= 1.3;
      baseVolume *= 1.2;
      reasoning += ` | High price adjustment`;
    } else if (product.rawPrice < 5) {
      baseWeight *= 0.7;
      baseVolume *= 0.8;
      reasoning += ` | Low price adjustment`;
    }
  }
  
  // ✅ Appliquer les limites réalistes
  const limits = getProductLimits(text);
  const weightKg = round(Math.min(Math.max(baseWeight, limits.minWeight), limits.maxWeight));
  const volumeM3 = roundVolume(Math.min(Math.max(baseVolume, limits.minVolume), limits.maxVolume));
  
  console.warn(`[WeightEstimator] ⚠️ FALLBACK used for "${product.rawTitle}"`);
  console.warn(`[WeightEstimator] 📦 Fallback values: ${weightKg}kg, ${volumeM3}m³`);
  console.warn(`[WeightEstimator] 💡 Reasoning: ${reasoning}`);
  
  return {
    weightKg,
    volumeM3,
    confidence: "low",
    source: "contextual_fallback",
    reasoning,
    minWeightKg: round(weightKg * 0.5),
    maxWeightKg: round(weightKg * 2.0),
    minVolumeM3: roundVolume(volumeM3 * 0.5),
    maxVolumeM3: roundVolume(volumeM3 * 2.0)
  };
}

/* =====================================================
   UTILITAIRES
===================================================== */
function buildProductText(product: ParsedRawProduct, variant?: ParsedVariant): string {
  const parts = [
    product.rawTitle,
    product.rawCategory,
    product.rawDescription,
    JSON.stringify(product.rawAttributes || {}),
  ];
  
  if (variant?.attributes) {
    parts.push(JSON.stringify(variant.attributes));
  }
  
  return parts.filter(Boolean).join(" ");
}

function estimateVolumeFromWeight(weightKg: number): number {
  // Estimation basée sur une densité moyenne de 300-500 kg/m³ pour les produits emballés
  const avgDensity = 400; // kg/m³
  return roundVolume(weightKg / avgDensity);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundVolume(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

/* =====================================================
   ✅ FONCTION PRINCIPALE POUR ESTIMER N'IMPORTE QUEL PRODUIT
===================================================== */

export async function estimateWeightForAnyProduct(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<number> {
  const result = await estimateWeightAndVolumeSmart(product, variant);
  return result.weightKg;
}

export async function estimateVolumeForAnyProduct(
  product: ParsedRawProduct,
  variant?: ParsedVariant
): Promise<number> {
  const result = await estimateWeightAndVolumeSmart(product, variant);
  return result.volumeM3;
}

/* =====================================================
   EXPORTS ADDITIONNELS POUR DEBUGGING
===================================================== */
export const WEIGHT_DATABASE = CATEGORY_WEIGHT_DATABASE;
export const MATERIALS = MATERIAL_DENSITIES;
export const SIZES = SIZE_MODIFIERS;
export const PRODUCT_LIMITS_DB = PRODUCT_LIMITS;