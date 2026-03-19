import * as Sentry from "@sentry/nextjs";
import { PrismaClient } from '@prisma/client';

// Wrapper pour les API routes
export function withSentry(handler: Function) {
  return async (req: any, res: any) => {
    try {
      // Ajouter le contexte de la requête
      Sentry.setContext("request", {
        url: req.url,
        method: req.method,
        headers: req.headers,
        query: req.query,
      });

      const result = await handler(req, res);
      return result;
    } catch (error) {
      // Capturer l'erreur avec contexte
      Sentry.captureException(error, {
        tags: {
          route: req.url,
          method: req.method,
        },
        extra: {
          body: req.body,
          query: req.query,
          params: req.params,
        },
      });
      
      console.error("❌ Erreur capturée par Sentry:", error);
      throw error;
    }
  };
}

// Prisma avec monitoring
export const prismaWithSentry = new PrismaClient().$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      try {
        const result = await query(args);
        const duration = performance.now() - start;
        
        // Alerte si requête lente (> 500ms)
        if (duration > 500) {
          Sentry.captureMessage(`Requête lente: ${model}.${operation}`, {
            level: 'warning',
            extra: { duration, args }
          });
        }
        
        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { model, operation },
          extra: { args }
        });
        throw error;
      }
    },
  },
});