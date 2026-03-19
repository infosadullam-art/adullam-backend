// lib/packaging-weights.ts
// ============================================================================
// POIDS DES EMBALLAGES PAR CATÉGORIE
// ============================================================================

export interface PackagingRule {
  /** Poids de base de l'emballage en kg */
  baseWeight: number
  /** Facteur multiplicatif pour les produits fragiles */
  fragileMultiplier?: number
  /** Description */
  description: string
}

export const PACKAGING_RULES: Record<string, PackagingRule> = {
  // Très petits produits (bijoux, montres, petits accessoires)
  "very_small": {
    baseWeight: 0.02, // 20g (petite enveloppe bulle)
    description: "Enveloppe à bulles + petit carton"
  },
  // Petits produits (téléphones, montres, petits appareils)
  "small": {
    baseWeight: 0.05, // 50g
    description: "Petit carton + papier bulle"
  },
  // Produits moyens (chaussures, petits électroménagers)
  "medium": {
    baseWeight: 0.15, // 150g
    description: "Carton moyen + calage"
  },
  // Grands produits (vestes, gros électroménagers)
  "large": {
    baseWeight: 0.3, // 300g
    description: "Grand carton + mousse + calage"
  },
  // Très grands produits (meubles, vélos)
  "very_large": {
    baseWeight: 1.0, // 1kg
    description: "Carton renforcé + mousse épaisse + coins protecteurs"
  },
  // Fragile (verre, céramique, électronique sensible)
  "fragile": {
    baseWeight: 0.2,
    fragileMultiplier: 1.5, // 50% d'emballage en plus
    description: "Emballage renforcé avec mousse supplémentaire"
  }
}

// Correspondance entre catégories de produits et type d'emballage
export const CATEGORY_PACKAGING_MAP: Record<string, string> = {
  // Bijoux & montres
  "watch": "very_small",
  "bracelet": "very_small",
  "ring": "very_small",
  "earring": "very_small",
  "necklace": "very_small",
  
  // Électronique
  "smartphone": "small",
  "tablet": "small",
  "laptop": "medium",
  "headphone": "small",
  "camera": "medium",
  
  // Chaussures
  "sandal": "small",
  "shoe": "small",
  "boot": "medium",
  
  // Vêtements
  "t-shirt": "small",
  "jeans": "small",
  "jacket": "medium",
  "coat": "large",
  
  // Verre & fragile
  "glass": "fragile",
  "mug": "fragile",
  "plate": "fragile",
  "vase": "fragile",
  
  // Gros électroménager
  "microwave": "very_large",
  "fridge": "very_large",
  
  // Par défaut
  "default": "medium"
}