import { z } from "zod"

export const emailSchema = z
  .string()
  .email("Email invalide")
  .min(5, "Email trop court")
  .max(100, "Email trop long")
  .transform(email => email.toLowerCase().trim())

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\s]{10,15}$/, "Numéro de téléphone invalide")
  .transform(phone => phone.replace(/\s/g, ""))

export const passwordSchema = z
  .string()
  .min(8, "Minimum 8 caractères")
  .max(50, "Maximum 50 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[0-9]/, "Au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial")

export const nameSchema = z
  .string()
  .min(2, "Nom trop court")
  .max(50, "Nom trop long")
  .regex(/^[a-zA-Z\s-']+$/, "Caractères invalides")

export const verificationCodeSchema = z
  .string()
  .length(6, "Code à 6 chiffres")
  .regex(/^[0-9]+$/, "Chiffres uniquement")