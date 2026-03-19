import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(),
    Sentry.fsIntegration(),
  ],

  beforeSend(event, hint) {
    const request = hint?.originalException?.request;
    if (request) {
      event.contexts = {
        ...event.contexts,
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
        },
      };
    }
    return event;
  },
});