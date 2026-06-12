import type { NotificationChannel, QueueEntry } from "@/lib/types";

type NotificationResult = {
  channel: NotificationChannel;
  status: "sent" | "skipped";
  reason?: string;
};

async function sendSms(entry: QueueEntry, message: string): Promise<NotificationResult> {
  if (!entry.customerPhone) {
    return { channel: "sms", status: "skipped", reason: "No phone number" };
  }

  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER
  ) {
    return { channel: "sms", status: "skipped", reason: "Twilio is not configured" };
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to: entry.customerPhone,
    body: message
  });

  return { channel: "sms", status: "sent" };
}

async function sendEmail(entry: QueueEntry, message: string): Promise<NotificationResult> {
  if (!entry.customerEmail) {
    return { channel: "email", status: "skipped", reason: "No email address" };
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return { channel: "email", status: "skipped", reason: "Email provider is not configured" };
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: entry.customerEmail,
      subject: "LineUp queue update",
      text: message
    })
  });

  return { channel: "email", status: "sent" };
}

async function sendPush(entry: QueueEntry, message: string): Promise<NotificationResult> {
  void entry;
  void message;

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    return { channel: "push", status: "skipped", reason: "Firebase is not configured" };
  }

  return {
    channel: "push",
    status: "skipped",
    reason:
      "Firebase Admin credentials are configured, but this demo entry has no stored device token."
  };
}

export async function notifyQueueEntry(entry: QueueEntry, message: string) {
  const uniqueChannels = Array.from(new Set(entry.notificationChannels));
  const results = await Promise.all(
    uniqueChannels.map((channel) => {
      if (channel === "sms") {
        return sendSms(entry, message);
      }

      if (channel === "email") {
        return sendEmail(entry, message);
      }

      return sendPush(entry, message);
    })
  );

  return results;
}
