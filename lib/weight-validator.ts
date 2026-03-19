// lib/weight-validator.ts (version complète)
// ============================================================================
// VALIDATEUR DE POIDS - Avec prise en compte de l'emballage
// ============================================================================

import { findWeightRange, isWeightCredible, getRecommendedWeightRange } from './weight-ranges'
import { PACKAGING_RULES, CATEGORY_PACKAGING_MAP } from './packaging-weights'

export interface ValidationResult {
  /** Le poids d'origine (sans emballage) */
  originalWeight: number | null
  /** Le poids du produit seul (corrigé si nécessaire) */
  productWeight: number | null
  /** Le poids total avec emballage */
  totalShippingWeight: number | null
  /** Est-ce que le poids est crédible ? */
  isCredible: boolean
  /** La raison (pour logs) */
  reason: string
  /** La catégorie détectée */
  category: string
  /** La fourchette recommandée pour le produit seul */
  recommendedRange: { min: number; max: number }
  /** Faut-il recalculer ? */
  shouldRecalculate: boolean
  /** Poids de l'emballage ajouté */
  packagingWeight: number
  /** Type d'emballage utilisé */
  packagingType: string
  /** Poids suggéré (si recalcul nécessaire) */
  suggestedWeight?: number
}

/**
 * Détermine le type d'emballage pour un produit
 */
function getPackagingForProduct(title: string, category: string): string {
  const lowerTitle = title.toLowerCase()
  
  // Vérifier si le produit est fragile
  const fragileKeywords = ["verre", "glass", "crystal", "céramique", "ceramic", "porcelaine", "vase", "mug"]
  for (const kw of fragileKeywords) {
    if (lowerTitle.includes(kw)) {
      return "fragile"
    }
  }
  
  // Chercher dans la map par catégorie
  for (const [key, packaging] of Object.entries(CATEGORY_PACKAGING_MAP)) {
    if (lowerTitle.includes(key)) {
      return packaging
    }
  }
  
  // Par défaut
  return "medium"
}

/**
 * Calcule le poids total avec emballage
 */
function calculateShippingWeight(
  productWeight: number,
  packagingType: string,
  isFragile: boolean
): number {
  const rule = PACKAGING_RULES[packagingType] || PACKAGING_RULES.medium
  let packagingWeight = rule.baseWeight
  
  // Si fragile, on ajoute du poids supplémentaire
  if (isFragile && rule.fragileMultiplier) {
    packagingWeight *= rule.fragileMultiplier
  }
  
  // Si le produit est très léger, l'emballage peut représenter une part importante
  if (productWeight < 0.1) {
    packagingWeight = Math.max(packagingWeight, 0.03) // Au moins 30g d'emballage
  }
  
  return productWeight + packagingWeight
}

/**
 * Valide un poids et calcule le poids total avec emballage
 */
export function validateWeightWithPackaging(
  weight: number | null | undefined,
  title: string
): ValidationResult {
  
  // Étape 1 : Trouver la catégorie du produit
  const range = findWeightRange(title)
  const packagingType = getPackagingForProduct(title, range.categoryName)
  const isFragile = packagingType === "fragile"
  
  // Étape 2 : Valider le poids existant
  if (!weight || weight <= 0) {
    // Pas de poids en base → on estime
    const estimatedProductWeight = (range.minWeight + range.maxWeight) / 2
    const shippingWeight = calculateShippingWeight(estimatedProductWeight, packagingType, isFragile)
    
    return {
      originalWeight: null,
      productWeight: null,
      totalShippingWeight: shippingWeight,
      isCredible: false,
      reason: "Aucun poids en base - utilisation estimation",
      category: range.categoryName,
      recommendedRange: { min: range.minWeight, max: range.maxWeight },
      shouldRecalculate: true,
      packagingWeight: shippingWeight - estimatedProductWeight,
      packagingType,
      suggestedWeight: estimatedProductWeight
    }
  }
  
  // Vérifier si le poids est crédible pour le produit seul
  const credible = weight >= range.minWeight && weight <= range.maxWeight
  
  if (credible) {
    // Poids crédible → on l'utilise
    const shippingWeight = calculateShippingWeight(weight, packagingType, isFragile)
    
    return {
      originalWeight: weight,
      productWeight: weight,
      totalShippingWeight: shippingWeight,
      isCredible: true,
      reason: "Poids crédible",
      category: range.categoryName,
      recommendedRange: { min: range.minWeight, max: range.maxWeight },
      shouldRecalculate: false,
      packagingWeight: shippingWeight - weight,
      packagingType
    }
  } else {
    // Poids non crédible → on recalcule
    const estimatedProductWeight = (range.minWeight + range.maxWeight) / 2
    const shippingWeight = calculateShippingWeight(estimatedProductWeight, packagingType, isFragile)
    
    return {
      originalWeight: weight,
      productWeight: null,
      totalShippingWeight: shippingWeight,
      isCredible: false,
      reason: `Poids ${weight}kg hors fourchette (${range.minWeight}-${range.maxWeight}kg) - recalcule`,
      category: range.categoryName,
      recommendedRange: { min: range.minWeight, max: range.maxWeight },
      shouldRecalculate: true,
      packagingWeight: shippingWeight - estimatedProductWeight,
      packagingType,
      suggestedWeight: estimatedProductWeight
    }
  }
}