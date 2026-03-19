import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"
import type { NotificationChannel } from "@prisma/client"

interface NotificationDispatchJobData {
  notificationId?: string
  userId?: string
  orderId?: string
  type?: string
  status?: string
}

// WhatsApp sender (placeholder)
async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  // In production, integrate with WhatsApp Business API
  console.log(`[WhatsApp] Sending to ${phone}: ${message}`)
  return true
}

// SMS sender (placeholder)
async function sendSMS(phone: string, message: string): Promise<boolean> {
  // In production, integrate with Twilio/other SMS provider
  console.log(`[SMS] Sending to ${phone}: ${message}`)
  return true
}

async function dispatchNotification(notification: {
  id: string
  channel: NotificationChannel
  message: string
  userId: string
}) {
  const user = await prisma.user.findUnique({
    where: { id: notification.userId },
    select: { phone: true },
  })

  if (!user?.phone) {
    throw new Error("User phone not found")
  }

  let success = false

  switch (notification.channel) {
    case "WHATSAPP":
      success = await sendWhatsApp(user.phone, notification.message)
      break
    case "SMS":
      success = await sendSMS(user.phone, notification.message)
      break
    case "EMAIL":
      // Implement email sending
      success = true
      break
    case "PUSH":
      // Implement push notification
      success = true
      break
  }

  return success
}

export async function notificationDispatch(job: Job<NotificationDispatchJobData>) {
  const { notificationId, userId, orderId, type, status } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "NOTIFICATION_DISPATCH",
      status: "RUNNING",
      payload: { notificationId, userId, orderId, type, status },
      startedAt: new Date(),
    },
  })

  try {
    // If specific notification ID provided
    if (notificationId) {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        throw new Error("Notification not found")
      }

      const success = await dispatchNotification(notification)

      if (success) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        })
      }

      await prisma.jobLog.update({
        where: { id: jobLog.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          result: { sent: 1, success },
          completedAt: new Date(),
        },
      })

      return { sent: 1, success }
    }

    // Handle order notifications
    if (orderId && type) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      let title = ""
      let message = ""

      switch (type) {
        case "orderConfirmation":
          title = "Order Confirmed"
          message = `Your order #${order.orderNumber} has been confirmed. Total: ${order.total} ${order.currency}`
          break
        case "orderStatusUpdate":
          title = "Order Update"
          message = `Your order #${order.orderNumber} status: ${status || order.status}`
          break
      }

      // Create and send notification (WhatsApp priority, SMS fallback)
      const notification = await prisma.notification.create({
        data: {
          userId: order.userId,
          type: type === "orderConfirmation" ? "ORDER_CONFIRMATION" : "ORDER_SHIPPED",
          channel: "WHATSAPP",
          title,
          message,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        },
      })

      const success = await dispatchNotification(notification)

      if (success) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "SENT", sentAt: new Date() },
        })
      } else {
        // Try SMS fallback
        const smsNotification = await prisma.notification.create({
          data: {
            userId: order.userId,
            type: notification.type,
            channel: "SMS",
            title,
            message,
            data: { orderId: order.id, fallbackFrom: notification.id },
          },
        })

        const smsSuccess = await dispatchNotification(smsNotification)
        if (smsSuccess) {
          await prisma.notification.update({
            where: { id: smsNotification.id },
            data: { status: "SENT", sentAt: new Date() },
          })
        }
      }

      await prisma.jobLog.update({
        where: { id: jobLog.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          result: { sent: 1, success },
          completedAt: new Date(),
        },
      })

      return { sent: 1, success }
    }

    // Batch dispatch pending notifications
    const pendingNotifications = await prisma.notification.findMany({
      where: { status: "PENDING" },
      take: 100,
    })

    let sent = 0
    let failed = 0

    for (const notification of pendingNotifications) {
      try {
        const success = await dispatchNotification(notification)
        if (success) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: "SENT", sentAt: new Date() },
          })
          sent++
        } else {
          failed++
        }
      } catch {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: "FAILED",
            retryCount: notification.retryCount + 1,
          },
        })
        failed++
      }

      await job.updateProgress(
        Math.round(((pendingNotifications.indexOf(notification) + 1) / pendingNotifications.length) * 100),
      )
    }

    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: { sent, failed },
        completedAt: new Date(),
      },
    })

    return { sent, failed }
  } catch (error) {
    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    })
    throw error
  }
}

export const notificationDispatchWorker = new Worker("notification", notificationDispatch, {
  connection: redis,
  concurrency: 5,
})
