import "server-only";

export type Provider = "ollama" | "groq" | "openai";
export type Message = { role: "user" | "assistant"; content: string };
export type ProviderEvent = { token: string } | { done: true; input?: number; output?: number };

export const coachOutputLimit = 400;
const models = { groq: "openai/gpt-oss-20b", openai: "gpt-6-luna" };
const rates = { groq: [0.075, 0.30], openai: [0.10, 0.50], ollama: [0, 0] };

export function costMicros(provider: Provider, input: number, output: number) {
  return Math.ceil(input * rates[provider][0] + output * rates[provider][1]);
}

async function* frames(body: ReadableStream<Uint8Array>, sse: boolean): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const delimiter = sse ? /\r?\n\r?\n/ : /\r?\n/;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const chunks = buffer.split(delimiter);
      buffer = chunks.pop() ?? "";
      if (buffer.length > 65_536) throw new Error("oversized_provider_frame");
      if (done && buffer.trim()) chunks.push(buffer);
      for (const chunk of chunks) {
        if (chunk.length > 65_536) throw new Error("oversized_provider_frame");
        const item = sse ? chunk.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n") : chunk;
        if (item.trim()) yield item;
      }
      if (done) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export async function* streamCoach(provider: Provider, system: string, messages: Message[], signal: AbortSignal): AsyncGenerator<ProviderEvent> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const chat = [{ role: "system", content: system }, ...messages];
  let url: string;
  let body: object;
  if (provider === "ollama") {
    url = `${(process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "")}/api/chat`;
    body = { model: process.env.OLLAMA_MODEL ?? "llama3.1", messages: chat, stream: true, options: { num_predict: coachOutputLimit } };
  } else if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) throw new Error("provider_unconfigured");
    headers.Authorization = `Bearer ${process.env.GROQ_API_KEY}`;
    url = "https://api.groq.com/openai/v1/chat/completions";
    body = { model: models.groq, messages: chat, stream: true, max_completion_tokens: coachOutputLimit, reasoning_format: "hidden" };
  } else {
    if (!process.env.OPENAI_API_KEY) throw new Error("provider_unconfigured");
    headers.Authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
    url = "https://api.openai.com/v1/responses";
    body = { model: models.openai, instructions: system, input: messages, stream: true, store: false, max_output_tokens: coachOutputLimit, reasoning: { effort: "low" } };
  }
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal, cache: "no-store", redirect: "error" });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("provider_unavailable");
  }
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  for await (const frame of frames(response.body, provider !== "ollama")) {
    if (frame === "[DONE]") {
      yield { done: true, input: usage?.prompt_tokens, output: usage?.completion_tokens };
      return;
    }
    const event = JSON.parse(frame);
    if (event.error || event.type === "response.failed" || event.type === "response.incomplete") throw new Error("provider_interrupted");
    const token = provider === "ollama" ? event.message?.content : provider === "groq" ? event.choices?.[0]?.delta?.content
      : event.type === "response.output_text.delta" ? event.delta : undefined;
    if (typeof token === "string" && token) yield { token };
    if (provider === "groq") usage = event.usage ?? event.x_groq?.usage ?? usage;
    if (provider === "ollama" && event.done) {
      yield { done: true, input: event.prompt_eval_count, output: event.eval_count };
      return;
    }
    if (provider === "openai" && event.type === "response.completed") {
      yield { done: true, input: event.response?.usage?.input_tokens, output: event.response?.usage?.output_tokens };
      return;
    }
  }
  throw new Error("provider_interrupted");
}
