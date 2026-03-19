// lib/shipping-calculator.ts
// ============================================================================
// CALCULATEUR DE FRAIS DE PORT ULTIME - VERSION CORRIGÉE
// ============================================================================
// Ce fichier combine TOUS les éléments :
// - Validation des poids (weight-validator)
// - Emballage adapté (packaging-weights)
// - Tarifs par pays (shipping-config)
// - Calcul des frais et délais
// ============================================================================

import { validateWeightWithPackaging } from './weight-validator'
import { SHIPPING_DATABASE, VOLUMETRIC_FACTOR } from './shipping-config'
import { findWeightRange } from './weight-ranges'

// ============================================================================
// TYPES
// ============================================================================

export interface ShippingEstimate {
  /** Informations sur le produit */
  product: {
    id: string
    title: string
    category: string
  }
  
  /** Poids et emballage */
  weight: {
    /** Poids du produit seul (corrigé si nécessaire) */
    productWeight: number | null
    /** Poids original en base (avant correction) */
    originalWeight: number | null
    /** Poids de l'emballage */
    packagingWeight: number
    /** Poids total expédié (produit + emballage) */
    totalWeight: number
    /** Poids volumétrique (volume × 250) */
    volumetricWeight: number
    /** Poids facturable (le plus grand entre totalWeight et volumetricWeight) */
    chargeableWeight: number
    /** Poids arrondi au kg supérieur (pratique standard) */
    roundedWeight: number
    /** Le poids était-il crédible ? */
    wasCredible: boolean
    /** Explication */
    weightReason: string
  }
  
  /** Volume estimé */
  volume: {
    /** Volume du produit seul (m³) */
    productVolume: number
    /** Volume total avec emballage (m³) */
    totalVolume: number
  }
  
  /** Frais de port par mode */
  shipping: {
    bateau?: {
      cost: number
      minDays: number
      maxDays: number
      available: boolean
      description: string
      estimatedDate: string
      estimatedDateRange: string
    }
    avion?: {
      cost: number
      minDays: number
      maxDays: number
      available: boolean
      description: string
      estimatedDate: string
      estimatedDateRange: string
    }
    express?: {
      cost: number
      minDays: number
      maxDays: number
      available: boolean
      description: string
      estimatedDate: string
      estimatedDateRange: string
    }
  }
  
  /** Recommandation */
  recommended: {
    mode: 'bateau' | 'avion' | 'express'
    cost: number
    days: string
    reason: string
    savings?: {
      vsNext: number
      vsFastest: number
      percentage: number
    }
  }
  
  /** Métadonnées */
  meta: {
    quantity: number
    destination: string
    destinationName: string
    currency: string
    timestamp: string
  }
}

export interface ShippingEstimateRequest {
  productId: string
  productTitle: string
  productWeight?: number | null
  productCategory?: string
  quantity: number
  destinationCountry: string
  /** Volume en m³ (si disponible) */
  volume?: number
}

// ============================================================================
// CONFIGURATION DES VOLUMES ESTIMÉS
// ============================================================================

/**
 * Volume estimé par catégorie (m³ par unité)
 * Basé sur les données de weight-estimator
 */
const ESTIMATED_VOLUMES: Record<string, number> = {
  // Chaussures
  "sandal": 0.002,
  "shoe": 0.004,
  "boot": 0.006,
  "sneaker": 0.0045,
  
  // Vêtements
  "t-shirt": 0.0003,
  "shirt": 0.00045,
  "jeans": 0.0007,
  "jacket": 0.002,
  "coat": 0.004,
  
  // Accessoires
  "watch": 0.00008,
  "bag": 0.006,
  "backpack": 0.025,
  
  // Électronique
  "smartphone": 0.0002,
  "tablet": 0.001,
  "laptop": 0.005,
  "headphone": 0.001,
  
  // Maison
  "mug": 0.0005,
  "plate": 0.001,
  "pan": 0.004,
  
  // Beauté
  "perfume": 0.0003,
  "cream": 0.00012,
  
  // Par défaut
  "default": 0.001
}

/**
 * Estime le volume d'un produit à partir de son titre
 */
function estimateVolumeFromTitle(title: string): number {
  const lowerTitle = title.toLowerCase()
  
  for (const [key, volume] of Object.entries(ESTIMATED_VOLUMES)) {
    if (lowerTitle.includes(key)) {
      return volume
    }
  }
  
  return ESTIMATED_VOLUMES.default
}

// ============================================================================
// FONCTIONS DE CALCUL
// ============================================================================

/**
 * Calcule le poids volumétrique
 */
function calculateVolumetricWeight(volumeM3: number): number {
  return volumeM3 * VOLUMETRIC_FACTOR
}

/**
 * Formate une date estimée
 */
function formatEstimatedDate(minDays: number, maxDays: number, locale: string = 'fr-FR'): {
  single: string
  range: string
} {
  const today = new Date()
  
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + minDays)
  
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + maxDays)
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }
  
  const formatDayMonth: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit'
  }
  
  if (minDays === maxDays) {
    return {
      single: minDate.toLocaleDateString(locale, formatOptions),
      range: `le ${minDate.toLocaleDateString(locale, formatOptions)}`
    }
  } else {
    return {
      single: `${minDate.toLocaleDateString(locale, formatDayMonth)}-${maxDate.toLocaleDateString(locale, formatDayMonth)}`,
      range: `entre le ${minDate.toLocaleDateString(locale, formatOptions)} et le ${maxDate.toLocaleDateString(locale, formatOptions)}`
    }
  }
}

/**
 * Recommande le meilleur mode de livraison
 */
function recommendBestMode(
  estimates: { bateau?: any; avion?: any; express?: any },
  totalWeight: number,
  totalVolume: number,
  destination: string
): { mode: 'bateau' | 'avion' | 'express'; cost: number; days: string; reason: string; savings?: any } {
  
  // Récupérer les modes disponibles
  const available: Array<{ mode: 'bateau' | 'avion' | 'express'; cost: number; days: number }> = []
  
  if (estimates.bateau?.available) {
    available.push({ 
      mode: 'bateau', 
      cost: estimates.bateau.cost,
      days: estimates.bateau.minDays
    })
  }
  if (estimates.avion?.available) {
    available.push({ 
      mode: 'avion', 
      cost: estimates.avion.cost,
      days: estimates.avion.minDays
    })
  }
  if (estimates.express?.available) {
    available.push({ 
      mode: 'express', 
      cost: estimates.express.cost,
      days: estimates.express.minDays
    })
  }
  
  if (available.length === 0) {
    return {
      mode: 'bateau',
      cost: 0,
      days: 'N/A',
      reason: 'Aucun mode disponible'
    }
  }
  
  // Trier par coût
  const sorted = [...available].sort((a, b) => a.cost - b.cost)
  
  // Calculer les économies
  const cheapest = sorted[0]
  const fastest = available.reduce((prev, curr) => prev.days < curr.days ? prev : curr)
  
  const savings = {
    vsNext: sorted.length > 1 ? sorted[1].cost - cheapest.cost : 0,
    vsFastest: fastest.cost - cheapest.cost,
    percentage: cheapest.cost > 0 ? Math.round((fastest.cost - cheapest.cost) / fastest.cost * 100) : 0
  }
  
  // Logique de recommandation
  if (totalWeight > 20 && estimates.bateau?.available) {
    return {
      mode: 'bateau',
      cost: cheapest.cost,
      days: `${estimates.bateau.minDays}-${estimates.bateau.maxDays}j`,
      reason: 'Produit lourd (>20kg) - recommandé transport maritime économique',
      savings
    }
  }
  
  if (totalVolume > 0.05 && estimates.bateau?.available) {
    return {
      mode: 'bateau',
      cost: cheapest.cost,
      days: `${estimates.bateau.minDays}-${estimates.bateau.maxDays}j`,
      reason: 'Produit volumineux - recommandé transport maritime',
      savings
    }
  }
  
  // Par défaut, recommander le moins cher
  return {
    mode: cheapest.mode,
    cost: cheapest.cost,
    days: `${cheapest.days}+ jours`,
    reason: cheapest.mode === 'bateau' ? 'Option la plus économique' :
            cheapest.mode === 'avion' ? 'Meilleur rapport délai/prix' : 'Livraison la plus rapide',
    savings
  }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Calcule les estimations logistiques pour un produit
 */
export async function calculateShippingEstimate(
  request: ShippingEstimateRequest
): Promise<ShippingEstimate> {
  
  const {
    productId,
    productTitle,
    productWeight,
    productCategory,
    quantity,
    destinationCountry,
    volume: providedVolume
  } = request
  
  // ============================================================
  // 1️⃣ VALIDER LE POIDS (ou l'estimer)
  // ============================================================
  const validation = validateWeightWithPackaging(productWeight, productTitle)
  
  // ============================================================
  // 2️⃣ ESTIMER LE VOLUME
  // ============================================================
  let productVolume = providedVolume || 0
  
  if (!productVolume || productVolume === 0) {
    // Estimer à partir du titre
    productVolume = estimateVolumeFromTitle(productTitle)
    
    // Si on a un poids estimé, on peut aussi calculer via densité
    if (validation.suggestedWeight) {
      const densityBasedVolume = validation.suggestedWeight / 400 // densité moyenne
      productVolume = (productVolume + densityBasedVolume) / 2 // moyenne des deux
    }
  }
  
  // ============================================================
  // 3️⃣ CALCULER LES POIDS TOTAUX - CORRECTION ICI !!!
  // ============================================================
  // Utilisation de l'opérateur nullish coalescing (??) pour prioriser les valeurs non-null
  // et prise en compte de la suggestion du validateur
  const productWeightPerUnit = validation.productWeight ?? validation.suggestedWeight ?? 0.5
  const packagingWeightPerUnit = validation.packagingWeight
  
  // Logs pour debug (à retirer en production)
  console.log('📦 [CALCULATEUR] Poids retenu:', {
    fromValidator: {
      productWeight: validation.productWeight,
      suggestedWeight: validation.suggestedWeight,
      category: validation.category,
      isCredible: validation.isCredible,
      reason: validation.reason
    },
    final: {
      productWeightPerUnit,
      packagingWeightPerUnit,
      source: validation.productWeight !== null && validation.productWeight !== undefined ? 'original' :
              validation.suggestedWeight !== null && validation.suggestedWeight !== undefined ? 'estimé' : 'fallback'
    }
  })
  
  const totalProductWeight = productWeightPerUnit * quantity
  const totalPackagingWeight = packagingWeightPerUnit * quantity
  const totalWeight = totalProductWeight + totalPackagingWeight
  
  const totalVolume = productVolume * quantity
  
  // Poids volumétrique
  const volumetricWeight = calculateVolumetricWeight(totalVolume)
  
  // Poids facturable (le plus grand)
  const chargeableWeight = Math.max(totalWeight, volumetricWeight)
  
  // Arrondi au kg supérieur (pratique standard)
  const roundedWeight = Math.ceil(chargeableWeight)
  
  // ============================================================
  // 4️⃣ RÉCUPÉRER LES TARIFS DU PAYS
  // ============================================================
  const countryConfig = SHIPPING_DATABASE[destinationCountry] || SHIPPING_DATABASE.AF
  
  // Frais porte-à-porte
  const portePorteFee = roundedWeight < 5 
    ? countryConfig.portePorteFees.under5kg 
    : countryConfig.portePorteFees.over5kg
  
  // ============================================================
  // 5️⃣ CALCULER LES FRAIS POUR CHAQUE MODE
  // ============================================================
  const shipping: any = {}
  
  // Bateau
  if (countryConfig.modes.bateau.available) {
    const baseCost = countryConfig.modes.bateau.pricePerKg * roundedWeight
    const totalCost = Number((baseCost + portePorteFee).toFixed(2))
    const dates = formatEstimatedDate(
      countryConfig.modes.bateau.minDays,
      countryConfig.modes.bateau.maxDays
    )
    
    shipping.bateau = {
      cost: totalCost,
      minDays: countryConfig.modes.bateau.minDays,
      maxDays: countryConfig.modes.bateau.maxDays,
      available: true,
      description: countryConfig.modes.bateau.description,
      estimatedDate: dates.single,
      estimatedDateRange: dates.range
    }
  }
  
  // Avion
  if (countryConfig.modes.avion.available) {
    const baseCost = countryConfig.modes.avion.pricePerKg * roundedWeight
    const totalCost = Number((baseCost + portePorteFee).toFixed(2))
    const dates = formatEstimatedDate(
      countryConfig.modes.avion.minDays,
      countryConfig.modes.avion.maxDays
    )
    
    shipping.avion = {
      cost: totalCost,
      minDays: countryConfig.modes.avion.minDays,
      maxDays: countryConfig.modes.avion.maxDays,
      available: true,
      description: countryConfig.modes.avion.description,
      estimatedDate: dates.single,
      estimatedDateRange: dates.range
    }
  }
  
  // Express
  if (countryConfig.modes.express.available) {
    const baseCost = countryConfig.modes.express.pricePerKg * roundedWeight
    const totalCost = Number((baseCost + portePorteFee).toFixed(2))
    const dates = formatEstimatedDate(
      countryConfig.modes.express.minDays,
      countryConfig.modes.express.maxDays
    )
    
    shipping.express = {
      cost: totalCost,
      minDays: countryConfig.modes.express.minDays,
      maxDays: countryConfig.modes.express.maxDays,
      available: true,
      description: countryConfig.modes.express.description,
      estimatedDate: dates.single,
      estimatedDateRange: dates.range
    }
  }
  
  // ============================================================
  // 6️⃣ RECOMMANDER LE MEILLEUR MODE
  // ============================================================
  const recommended = recommendBestMode(
    shipping,
    totalWeight,
    totalVolume,
    destinationCountry
  )
  
  // ============================================================
  // 7️⃣ CONSTRUIRE LA RÉPONSE
  // ============================================================
  const estimate: ShippingEstimate = {
    product: {
      id: productId,
      title: productTitle,
      category: validation.category
    },
    weight: {
      productWeight: validation.productWeight,
      originalWeight: validation.originalWeight,
      packagingWeight: validation.packagingWeight,
      totalWeight: Number(totalWeight.toFixed(2)),
      volumetricWeight: Number(volumetricWeight.toFixed(2)),
      chargeableWeight: Number(chargeableWeight.toFixed(2)),
      roundedWeight,
      wasCredible: validation.isCredible,
      weightReason: validation.reason
    },
    volume: {
      productVolume: Number(productVolume.toFixed(4)),
      totalVolume: Number(totalVolume.toFixed(4))
    },
    shipping,
    recommended,
    meta: {
      quantity,
      destination: destinationCountry,
      destinationName: countryConfig.name,
      currency: countryConfig.currency,
      timestamp: new Date().toISOString()
    }
  }
  
  return estimate
}

// ============================================================================
// VERSION SIMPLIFIÉE POUR LE FRONTEND
// ============================================================================

export interface SimpleShippingEstimate {
  success: boolean
  data?: {
    totalWeight: number
    shippingCost: number
    estimatedDays: string
    recommendedMode: string
  }
  error?: string
}

/**
 * Version simplifiée pour un usage rapide
 */
export async function getSimpleShippingEstimate(
  productId: string,
  productTitle: string,
  quantity: number,
  destinationCountry: string,
  productWeight?: number
): Promise<SimpleShippingEstimate> {
  try {
    const estimate = await calculateShippingEstimate({
      productId,
      productTitle,
      productWeight,
      quantity,
      destinationCountry
    })
    
    return {
      success: true,
      data: {
        totalWeight: estimate.weight.totalWeight,
        shippingCost: estimate.recommended.cost,
        estimatedDays: estimate.recommended.days,
        recommendedMode: estimate.recommended.mode
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}