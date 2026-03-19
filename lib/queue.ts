import { Queue, Worker, Job } from "bullmq"

// Configuration Redis pour BullMQ
const connectionOptions = {
  host: "127.0.0.1",
  port: 6379,
  // password: process.env.REDIS_PASSWORD, // décommente si nécessaire
}

// ✅ Définition des queues
export const importQueue = new Queue("import", { connection: connectionOptions })
export const deduplicationQueue = new Queue("deduplication", { connection: connectionOptions })
export const fakeDetectionQueue = new Queue("fakeDetection", { connection: connectionOptions })
export const cleanProductsQueue = new Queue("cleanProducts", { connection: connectionOptions })
export const forYouScoringQueue = new Queue("forYouScoring", { connection: connectionOptions })
export const feedScoringQueue = new Queue("feedScoring", { connection: connectionOptions })
export const adsIngestionQueue = new Queue("adsIngestion", { connection: connectionOptions })
export const notificationQueue = new Queue("notification", { connection: connectionOptions })
export const graphUpdateQueue = new Queue("graphUpdate", { connection: connectionOptions })

// Type pour les noms de queue
export type QueueName =
  | "import"
  | "deduplication"
  | "fakeDetection"
  | "cleanProducts"
  | "forYouScoring"
  | "feedScoring"
  | "adsIngestion"
  | "notification"
  | "graphUpdate"

// Mapping pratique
export const queues: Record<QueueName, Queue> = {
  import: importQueue,
  deduplication: deduplicationQueue,
  fakeDetection: fakeDetectionQueue,
  cleanProducts: cleanProductsQueue,
  forYouScoring: forYouScoringQueue,
  feedScoring: feedScoringQueue,
  adsIngestion: adsIngestionQueue,
  notification: notificationQueue,
  graphUpdate: graphUpdateQueue,
}

// Export utile
export { Worker, Job }
