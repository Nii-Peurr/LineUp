import OpenAI from "openai";
import type { Insight, QueueSnapshot } from "@/lib/types";

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export async function predictWaitTime(snapshot: QueueSnapshot) {
  const fallback = Math.max(
    1,
    Math.round(
      (snapshot.waitingEntries.length * snapshot.queue.averageServiceMinutes) /
        Math.max(1, snapshot.queue.activeStaff)
    )
  );
  const client = getOpenAIClient();

  if (!client) {
    return {
      waitMinutes: fallback,
      confidence: 0.78,
      source: "deterministic-demo" as const
    };
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_WAIT_MODEL ?? "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "Estimate virtual queue wait time in minutes. Return compact JSON with waitMinutes and confidence."
      },
      {
        role: "user",
        content: JSON.stringify({
          queueLength: snapshot.waitingEntries.length,
          activeStaff: snapshot.queue.activeStaff,
          averageServiceMinutes: snapshot.queue.averageServiceMinutes,
          currentDemand: snapshot.queue.currentDemand,
          missedTurnRate: snapshot.missedTurnRate
        })
      }
    ]
  });

  const text = response.output_text;

  try {
    const parsed = JSON.parse(text) as { waitMinutes?: number; confidence?: number };

    return {
      waitMinutes: Math.max(1, Math.round(parsed.waitMinutes ?? fallback)),
      confidence: parsed.confidence ?? 0.82,
      source: "openai" as const
    };
  } catch {
    return {
      waitMinutes: fallback,
      confidence: 0.72,
      source: "openai-unparsed" as const
    };
  }
}

export async function generateBusinessInsights(snapshot: QueueSnapshot): Promise<Insight[]> {
  const client = getOpenAIClient();

  if (!client) {
    return [
      {
        id: "ai_demo_1",
        title: "Staffing opportunity",
        body: "Adding one active staff member during heavy demand could reduce the current wait by roughly 8 minutes.",
        severity: "info"
      },
      {
        id: "ai_demo_2",
        title: "Retention risk",
        body: "Customers begin leaving at higher rates when the quoted wait passes 25 minutes.",
        severity: "warning"
      }
    ];
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_INSIGHTS_MODEL ?? "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "You are a concise operations analyst for a virtual queue SaaS. Return JSON array of 2 insights with title, body, severity."
      },
      {
        role: "user",
        content: JSON.stringify({
          business: snapshot.business.name,
          location: snapshot.location.name,
          queueLength: snapshot.waitingEntries.length,
          activeStaff: snapshot.queue.activeStaff,
          averageWaitMinutes: snapshot.averageWaitMinutes,
          missedTurnRate: snapshot.missedTurnRate
        })
      }
    ]
  });

  try {
    const parsed = JSON.parse(response.output_text) as Omit<Insight, "id">[];

    return parsed.slice(0, 3).map((insight, index) => ({
      id: `ai_${index}`,
      title: insight.title,
      body: insight.body,
      severity: insight.severity
    }));
  } catch {
    return [
      {
        id: "ai_fallback",
        title: "Insight ready",
        body: response.output_text.slice(0, 180),
        severity: "info"
      }
    ];
  }
}
