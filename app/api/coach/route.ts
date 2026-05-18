import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* ─── Ollama Config ─── */
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1";

/* ─── System Prompt Builder ─── */
function buildSystemPrompt(context: {
  firstName: string;
  membershipStatus: string | null;
  planName: string | null;
  daysLeft: number | null;
  streak: number;
  sessionsThisWeek: number;
  weeklyGoal: number;
  recentSessions: {
    date: string;
    routineName: string | null;
    totalVolume: number;
    durationMin: number;
    exercises: { name: string; sets: { weight: number; reps: number }[] }[];
  }[];
}): string {
  const sessionsBlock =
    context.recentSessions.length > 0
      ? context.recentSessions
        .map((s) => {
          const exList = s.exercises
            .map(
              (e) =>
                `  - ${e.name}: ${e.sets.map((set) => `${set.weight}kg×${set.reps}`).join(", ")}`
            )
            .join("\n");
          return `• ${s.date} — ${s.routineName ?? "Quick Session"} (${s.durationMin}min, ${s.totalVolume}kg volume)\n${exList}`;
        })
        .join("\n")
      : "No sessions logged yet.";

  return `You are the AI Coach for Contnental Fitness Gym. You are a knowledgeable, encouraging, and concise fitness coach.

MEMBER PROFILE:
- Name: ${context.firstName}
- Membership: ${context.membershipStatus ?? "Unknown"} (${context.planName ?? "No plan"})${context.daysLeft !== null ? `, ${context.daysLeft} days remaining` : ""}
- Current streak: ${context.streak} day(s)
- This week: ${context.sessionsThisWeek}/${context.weeklyGoal} sessions

RECENT WORKOUT HISTORY (last 10 sessions):
${sessionsBlock}

GUIDELINES:
- Keep responses concise and actionable — 2-4 short paragraphs max.
- Use the member's first name occasionally.
- Base advice on their ACTUAL workout data above — reference specific exercises, volumes, and patterns.
- If they ask about nutrition, give general guidance but note you're not a dietitian.
- If they ask about injuries or pain, always recommend consulting a medical professional.
- Be motivating without being cheesy. Think experienced personal trainer, not hype-man.
- You may suggest workout splits, exercise alternatives, progressive overload strategies, and rest recommendations.
- Format important points with bold (**text**) sparingly for emphasis.
- Do NOT use markdown headers (#) or bullet lists unless specifically helpful.`;
}

/* ─── POST Handler ─── */
export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, context } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    context: Parameters<typeof buildSystemPrompt>[0];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages required" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(context);

  // Build Ollama request
  const ollamaMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-20), // Keep last 20 messages for context window
  ];

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: true,
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      console.error("[AI Coach] Ollama error:", ollamaRes.status, errText);
      return Response.json(
        {
          error:
            ollamaRes.status === 404
              ? `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`
              : "AI Coach is temporarily unavailable",
        },
        { status: 502 }
      );
    }

    // Stream the response through to the client
    const reader = ollamaRes.body?.getReader();
    if (!reader) {
      return Response.json({ error: "No response stream" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          // Ollama streams newline-delimited JSON
          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n").filter((l) => l.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                // Send just the content token
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ token: parsed.message.content })}\n\n`
                  )
                );
              }
              if (parsed.done) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                );
              }
            } catch {
              // Skip malformed lines
            }
          }
        } catch (err) {
          console.error("[AI Coach] Stream error:", err);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[AI Coach] Connection error:", err);
    return Response.json(
      {
        error:
          "Cannot connect to Ollama. Make sure Ollama is running (ollama serve).",
      },
      { status: 502 }
    );
  }
}
