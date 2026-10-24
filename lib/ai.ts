export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string | ModelContentPart[];
}

export interface ModelContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

const MODELS = [
  {
    id: "gemma-4-31b-it",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyName: "GEMINI_API_KEY",
  },
  {
    id: "gemma-4-26b-a4b-it",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyName: "GEMINI_API_KEY",
  },
  {
    id: "qwen/qwen3.8-27b",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyName: "GROQ_API_KEY",
  },
] as const;

const RETRY_DELAY_MS = 5_000;

function waitForRetry(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, RETRY_DELAY_MS);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(new DOMException("The request was aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

function getApiKey(keyName: (typeof MODELS)[number]["keyName"]): string | null {
  const key = process.env[keyName];
  return key || null;
}

export function cleanModelOutput(text: string): string {
  return text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
}

async function fetchModel(
  model: (typeof MODELS)[number],
  body: BodyInit,
  signal?: AbortSignal
): Promise<Response | null> {
  const key = getApiKey(model.keyName);
  if (!key) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(model.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body,
      signal,
    });

    if (response.status !== 429 || attempt === 1) return response;

    console.warn(`[ai-client] ${model.id} is busy; retrying in 5 seconds`);
    await waitForRetry(signal);
  }

  return null;
}

export async function callModel(
  messages: ModelMessage[],
  signal?: AbortSignal
): Promise<string> {
  for (const model of MODELS) {
    try {
      const response = await fetchModel(
        model,
        JSON.stringify({
          model: model.id,
          messages,
          max_tokens: 12000,
          temperature: 0.3,
        }),
        signal
      );

      if (!response) continue;
      if (!response.ok) {
        console.error(`[ai-client] ${model.id} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        return cleanModelOutput(content);
      }

      console.error(`[ai-client] ${model.id} returned empty content`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error(
        `[ai-client] ${model.id} failed:`,
        error instanceof Error ? error.message : "unknown error"
      );
    }
  }

  throw new Error("Model is busy, switching to a backup model…");
}

export async function callModelStreaming(
  messages: ModelMessage[],
  signal?: AbortSignal
): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>; modelId: string }> {
  for (const model of MODELS) {
    try {
      const response = await fetchModel(
        model,
        JSON.stringify({
          model: model.id,
          messages,
          max_tokens: 12000,
          temperature: 0.3,
        }),
        signal
      );

      if (!response) continue;
      if (!response.ok) {
        console.error(`[ai-stream] ${model.id} returned ${response.status}`);
        continue;
      }
      if (!response.body) {
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        console.error(`[ai-stream] ${model.id} returned empty content`);
        continue;
      }

      const encoder = new TextEncoder();
      const payload = [
        `data: ${JSON.stringify({
          choices: [{ delta: { content } }],
        })}\n\n`,
        "data: [DONE]\n\n",
      ].join("");
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(payload));
          controller.close();
        },
      });

      return { reader: stream.getReader(), modelId: model.id };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error(
        `[ai-stream] ${model.id} failed:`,
        error instanceof Error ? error.message : "unknown error"
      );
    }
  }

  throw new Error("Model is busy, switching to a backup model…");
}
