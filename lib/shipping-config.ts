// lib/shipping-config.ts
// ============================================================================
// CONFIGURATION DES TARIFS LOGISTIQUES - VOS RÈGLES UNIQUEMENT
// ============================================================================
// Tous les prix sont en USD (frais porte-à-porte inclus)
// ============================================================================

export interface ShippingMode {
  /** Prix par kg en USD */
  pricePerKg: number
  /** Délai minimum en jours */
  minDays: number
  /** Délai maximum en jours */
  maxDays: number
  /** Disponible ou non */
  available: boolean
  /** Description pour l'affichage */
  description: string
  /** Icône recommandée */
  icon?: string
}

export interface CountryShipping {
  /** Nom du pays */
  name: string
  /** Code pays (2 lettres) */
  code: string
  /** Modes de transport disponibles */
  modes: {
    bateau: ShippingMode
    avion: ShippingMode
    express: ShippingMode
  }
  /** Frais porte-à-porte en USD (frais fixes) */
  portePorteFees: {
    under5kg: number  // Pour les colis de moins de 5kg
    over5kg: number   // Pour les colis de 5kg et plus
  }
}

// ============================================================================
// TAUX DE CONVERSION (à ajuster selon le marché)
// ============================================================================
const XOF_TO_USD = 600 // 1 USD = 600 FCFA (environ)

// ============================================================================
// VOS RÈGLES - COTE D'IVOIRE
// ============================================================================
export const SHIPPING_DATABASE: Record<string, CountryShipping> = {
  CI: {
    name: "Côte d'Ivoire",
    code: "CI",
    modes: {
      bateau: {
        pricePerKg: 4.57,
        minDays: 45,
        maxDays: 50,
        available: true,
        description: "Transport maritime économique",
        icon: "🚢"
      },
      avion: {
        pricePerKg: 14.69,
        minDays: 15,
        maxDays: 17,
        available: true,
        description: "Transport aérien rapide",
        icon: "✈️"
      },
      express: {
        pricePerKg: 24.49,
        minDays: 10,
        maxDays: 10,
        available: true,
        description: "Livraison express prioritaire",
        icon: "⚡"
      }
    },
    // ✅ FRAIS PORTE-À-PORTE AJOUTÉS
    portePorteFees: {
      under5kg: Number((1000 / XOF_TO_USD).toFixed(2)), // 1000 FCFA → 1.67 USD
      over5kg: Number((2000 / XOF_TO_USD).toFixed(2))   // 2000 FCFA → 3.33 USD
    }
  },

  // ============================================================================
  // VOS RÈGLES - AUTRES PAYS D'AFRIQUE
  // ============================================================================
  AF: {
    name: "Autres pays d'Afrique",
    code: "AF",
    modes: {
      bateau: {
        pricePerKg: 4.57,
        minDays: 45,
        maxDays: 50,
        available: true,
        description: "Transport maritime économique",
        icon: "🚢"
      },
      avion: {
        pricePerKg: 14.69,
        minDays: 15,
        maxDays: 20,
        available: true,
        description: "Transport aérien rapide",
        icon: "✈️"
      },
      express: {
        pricePerKg: 24.49,
        minDays: 10,
        maxDays: 10,
        available: true,
        description: "Livraison express prioritaire",
        icon: "⚡"
      }
    },
    // ✅ FRAIS PORTE-À-PORTE AJOUTÉS (identiques à la CI)
    portePorteFees: {
      under5kg: Number((1000 / XOF_TO_USD).toFixed(2)), // 1000 FCFA → 1.67 USD
      over5kg: Number((2000 / XOF_TO_USD).toFixed(2))   // 2000 FCFA → 3.33 USD
    }
  }
}

// ============================================================================
// FACTEUR DE POIDS VOLUMÉTRIQUE
// ============================================================================
export const VOLUMETRIC_FACTOR = 250

// ============================================================================
// FONCTION POUR RÉCUPÉRER LA CONFIG D'UN PAYS
// ============================================================================
export function getCountryShipping(countryCode: string): CountryShipping {
  return SHIPPING_DATABASE[countryCode] || SHIPPING_DATABASE.AF
}