// app/api/logistics/estimate/route.ts
// ============================================================================
// API D'ESTIMATION LOGISTIQUE - Pour le frontend
// ============================================================================
// Cette API reçoit les requêtes de la page produit et retourne
// toutes les estimations (poids, frais, délais, recommandations)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { calculateShippingEstimate } from '@/lib/shipping-calculator'
import { getCountryShipping } from '@/lib/shipping-config'

// ============================================================================
// VALIDATION DES PARAMÈTRES
// ============================================================================

interface EstimateRequest {
  productId: string
  productTitle: string
  productWeight?: number | null
  quantity: number
  country: string
}

function validateParams(params: URLSearchParams): EstimateRequest | { error: string } {
  const productId = params.get('productId')
  const productTitle = params.get('productTitle')
  const quantity = params.get('quantity')
  const country = params.get('country')
  
  if (!productId) {
    return { error: 'productId est requis' }
  }
  
  if (!productTitle) {
    return { error: 'productTitle est requis' }
  }
  
  if (!quantity) {
    return { error: 'quantity est requis' }
  }
  
  const quantityNum = parseInt(quantity)
  if (isNaN(quantityNum) || quantityNum <= 0) {
    return { error: 'quantity doit être un nombre positif' }
  }
  
  if (!country) {
    return { error: 'country est requis' }
  }
  
  const weightParam = params.get('productWeight')
  const productWeight = weightParam ? parseFloat(weightParam) : null
  
  return {
    productId,
    productTitle,
    productWeight: productWeight && !isNaN(productWeight) ? productWeight : null,
    quantity: quantityNum,
    country
  }
}

// ============================================================================
// ENDPOINT GET - /api/logistics/estimate
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de l'URL
    const searchParams = request.nextUrl.searchParams
    const validation = validateParams(searchParams)
    
    // Si erreur de validation
    if ('error' in validation) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error 
        },
        { status: 400 }
      )
    }
    
    const { productId, productTitle, productWeight, quantity, country } = validation
    
    // Vérifier que le pays est supporté
    const countryConfig = getCountryShipping(country)
    
    // ============================================================
    // APPEL AU CALCULATEUR PRINCIPAL
    // ============================================================
    const estimate = await calculateShippingEstimate({
      productId,
      productTitle,
      productWeight,
      quantity,
      destinationCountry: country
    })
    
    // ============================================================
    // FORMATAGE DE LA RÉPONSE POUR LE FRONTEND
    // ============================================================
    const response = {
      success: true,
      data: {
        // Informations produit
        product: {
          id: estimate.product.id,
          title: estimate.product.title,
          category: estimate.product.category
        },
        
        // Poids et emballage
        weight: {
          productWeight: estimate.weight.productWeight,
          originalWeight: estimate.weight.originalWeight,
          packagingWeight: estimate.weight.packagingWeight,
          totalWeight: estimate.weight.totalWeight,
          volumetricWeight: estimate.weight.volumetricWeight,
          chargeableWeight: estimate.weight.chargeableWeight,
          roundedWeight: estimate.weight.roundedWeight,
          wasCredible: estimate.weight.wasCredible,
          weightReason: estimate.weight.weightReason
        },
        
        // Volume
        volume: {
          productVolume: estimate.volume.productVolume,
          totalVolume: estimate.volume.totalVolume
        },
        
        // Modes de livraison (uniquement ceux disponibles)
        shipping: {
          bateau: estimate.shipping.bateau ? {
            cost: estimate.shipping.bateau.cost,
            minDays: estimate.shipping.bateau.minDays,
            maxDays: estimate.shipping.bateau.maxDays,
            description: estimate.shipping.bateau.description,
            estimatedDate: estimate.shipping.bateau.estimatedDate,
            estimatedDateRange: estimate.shipping.bateau.estimatedDateRange,
            icon: estimate.shipping.bateau.icon || '🚢'
          } : undefined,
          
          avion: estimate.shipping.avion ? {
            cost: estimate.shipping.avion.cost,
            minDays: estimate.shipping.avion.minDays,
            maxDays: estimate.shipping.avion.maxDays,
            description: estimate.shipping.avion.description,
            estimatedDate: estimate.shipping.avion.estimatedDate,
            estimatedDateRange: estimate.shipping.avion.estimatedDateRange,
            icon: estimate.shipping.avion.icon || '✈️'
          } : undefined,
          
          express: estimate.shipping.express ? {
            cost: estimate.shipping.express.cost,
            minDays: estimate.shipping.express.minDays,
            maxDays: estimate.shipping.express.maxDays,
            description: estimate.shipping.express.description,
            estimatedDate: estimate.shipping.express.estimatedDate,
            estimatedDateRange: estimate.shipping.express.estimatedDateRange,
            icon: estimate.shipping.express.icon || '⚡'
          } : undefined
        },
        
        // Recommandation
        recommended: {
          mode: estimate.recommended.mode,
          cost: estimate.recommended.cost,
          days: estimate.recommended.days,
          reason: estimate.recommended.reason,
          savings: estimate.recommended.savings
        },
        
        // Métadonnées
        meta: {
          quantity: estimate.meta.quantity,
          destination: estimate.meta.destination,
          destinationName: countryConfig.name,
          timestamp: estimate.meta.timestamp
        }
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[LOGISTICS_API] Erreur:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// OPTIONNELLEMENT : Version POST pour les requêtes plus complexes
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productTitle, productWeight, quantity, country } = body
    
    // Validation similaire à GET
    if (!productId || !productTitle || !quantity || !country) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'quantity invalide' },
        { status: 400 }
      )
    }
    
    const estimate = await calculateShippingEstimate({
      productId,
      productTitle,
      productWeight: productWeight || null,
      quantity: quantityNum,
      destinationCountry: country
    })
    
    // Même format de réponse que GET
    const countryConfig = getCountryShipping(country)
    
    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: estimate.product.id,
          title: estimate.product.title,
          category: estimate.product.category
        },
        weight: {
          productWeight: estimate.weight.productWeight,
          originalWeight: estimate.weight.originalWeight,
          packagingWeight: estimate.weight.packagingWeight,
          totalWeight: estimate.weight.totalWeight,
          volumetricWeight: estimate.weight.volumetricWeight,
          chargeableWeight: estimate.weight.chargeableWeight,
          roundedWeight: estimate.weight.roundedWeight,
          wasCredible: estimate.weight.wasCredible,
          weightReason: estimate.weight.weightReason
        },
        volume: {
          productVolume: estimate.volume.productVolume,
          totalVolume: estimate.volume.totalVolume
        },
        shipping: {
          bateau: estimate.shipping.bateau ? {
            cost: estimate.shipping.bateau.cost,
            minDays: estimate.shipping.bateau.minDays,
            maxDays: estimate.shipping.bateau.maxDays,
            description: estimate.shipping.bateau.description,
            estimatedDate: estimate.shipping.bateau.estimatedDate,
            estimatedDateRange: estimate.shipping.bateau.estimatedDateRange,
            icon: estimate.shipping.bateau.icon || '🚢'
          } : undefined,
          avion: estimate.shipping.avion ? {
            cost: estimate.shipping.avion.cost,
            minDays: estimate.shipping.avion.minDays,
            maxDays: estimate.shipping.avion.maxDays,
            description: estimate.shipping.avion.description,
            estimatedDate: estimate.shipping.avion.estimatedDate,
            estimatedDateRange: estimate.shipping.avion.estimatedDateRange,
            icon: estimate.shipping.avion.icon || '✈️'
          } : undefined,
          express: estimate.shipping.express ? {
            cost: estimate.shipping.express.cost,
            minDays: estimate.shipping.express.minDays,
            maxDays: estimate.shipping.express.maxdays,
            description: estimate.shipping.express.description,
            estimatedDate: estimate.shipping.express.estimatedDate,
            estimatedDateRange: estimate.shipping.express.estimatedDateRange,
            icon: estimate.shipping.express.icon || '⚡'
          } : undefined
        },
        recommended: {
          mode: estimate.recommended.mode,
          cost: estimate.recommended.cost,
          days: estimate.recommended.days,
          reason: estimate.recommended.reason,
          savings: estimate.recommended.savings
        },
        meta: {
          quantity: estimate.meta.quantity,
          destination: estimate.meta.destination,
          destinationName: countryConfig.name,
          timestamp: estimate.meta.timestamp
        }
      }
    })
    
  } catch (error) {
    console.error('[LOGISTICS_API] Erreur POST:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur'
      },
      { status: 500 }
    )
  }
}