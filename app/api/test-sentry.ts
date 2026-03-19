import { withSentry } from '../../lib/sentry-wrapper';
import * as Sentry from '@sentry/nextjs';

async function handler(req, res) {
  // Test 1: Message simple
  Sentry.captureMessage("🧪 Test backend Sentry - OK", {
    level: 'info',
    tags: { test: 'pre-deploy' }
  });

  // Test 2: Vérifier la config
  const hasDsn = process.env.SENTRY_DSN ? "✅" : "❌";
  
  // Test 3: Simuler une erreur (décommente pour tester)
  // throw new Error("🧪 Erreur de test volontaire");

  res.status(200).json({ 
    success: true, 
    message: "Sentry est configuré !",
    sentry_dsn: hasDsn
  });
}

export default withSentry(handler);