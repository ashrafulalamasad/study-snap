// Types for model responses
export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string | ModelContentPart[];
}

export interface ModelContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

// Model fallback chain:
// PRIMARY: Google AI Studio via OpenAI-compatible endpoint (gemma-4-31b-it)
// FALLBACK: same endpoint, model gemma-4-26b-a4b-it / gemma-4-26b
// EMERGENCY: Groq qwen/qwen3.8-27b
const MODELS = [
  {
    id: "gemma-4-31b-it",
    provider: "google" as const,
  },
  {
    id: "gemma-4-26b-a4b-it",
    provider: "google" as const,
  },
  {
    id: "qwen/qwen3.8-27b",
    provider: "groq" as const,
  },
];

function getProviderConfig(provider: "google" | "groq") {
  if (provider === "google") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is not set");
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key,
    };
  } else {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY environment variable is not set");
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key,
    };
  }
}

/**
 * Remove internal reasoning <thought>...</thought> blocks returned by Google AI Studio
 */
export function cleanModelOutput(text: string): string {
  return text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
}

/**
 * Call a vision/text model with automatic fallback through the model chain.
 * Returns the complete text response.
 */
export async function callModel(
  messages: ModelMessage[],
  signal?: AbortSignal
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    if (model.provider === "groq" && !process.env.GROQ_API_KEY) {
      continue;
    }

    try {
      const config = getProviderConfig(model.provider);
      console.log(`[ai-client] Calling ${model.provider} model: ${model.id}`);

      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: model.id,
          messages,
          max_tokens: 4096,
          temperature: 0.3,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[ai-client] ${model.id} returned ${response.status}: ${errorText}`
        );
        lastError = new Error(
          `Model ${model.id} returned ${response.status}: ${errorText}`
        );
        continue;
      }

      const data = await response.json();

      if (data.error) {
        console.error(`[ai-client] ${model.id} error:`, data.error);
        lastError = new Error(
          `Model ${model.id} error: ${data.error.message || JSON.stringify(data.error)}`
        );
        continue;
      }

      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        lastError = new Error(`Model ${model.id} returned empty content`);
        continue;
      }

      const content = cleanModelOutput(rawContent);
      console.log(`[ai-client] ${model.id} succeeded (${content.length} chars)`);
      return content;
    } catch (err) {
      const error = err as Error;
      if (error.name === "AbortError") throw error;
      console.error(`[ai-client] ${model.id} exception:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All models failed to respond");
}

/**
 * Call a model and stream the response. Returns a ReadableStream of text chunks.
 * Once the stream completes, the full text is available.
 */
export async function callModelStreaming(
  messages: ModelMessage[],
  signal?: AbortSignal
): Promise<{ stream: ReadableStream<Uint8Array>; fullText: Promise<string> }> {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    if (model.provider === "groq" && !process.env.GROQ_API_KEY) {
      continue;
    }

    try {
      const config = getProviderConfig(model.provider);
      console.log(`[ai-stream] Connecting to ${model.provider} model: ${model.id}`);

      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: model.id,
          messages,
          max_tokens: 4096,
          temperature: 0.3,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[ai-stream] ${model.id} returned ${response.status}: ${errorText}`
        );
        lastError = new Error(
          `Model ${model.id} returned ${response.status}: ${errorText}`
        );
        continue;
      }

      if (!response.body) {
        lastError = new Error(`Model ${model.id} returned no body`);
        continue;
      }

      console.log(`[ai-stream] ${model.id} connected, streaming chunks...`);

      // Accumulate full text
      let fullText = "";
      let resolveFullText: (value: string) => void;
      let rejectFullText: (reason: Error) => void;

      const fullTextPromise = new Promise<string>((resolve, reject) => {
        resolveFullText = resolve;
        rejectFullText = reject;
      });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = response.body.getReader();

      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              resolveFullText(cleanModelOutput(fullText));
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  // Don't forward raw <thought> tokens if present
                  if (!delta.includes("<thought>") && !delta.includes("</thought>")) {
                    controller.enqueue(encoder.encode(delta));
                  }
                }
              } catch {
                // Partial JSON in SSE chunk, skip
              }
            }
          } catch (err) {
            const error = err as Error;
            controller.error(error);
            rejectFullText(error);
          }
        },
        cancel() {
          reader.cancel();
          rejectFullText(new Error("Stream cancelled"));
        },
      });

      return { stream, fullText: fullTextPromise };
    } catch (err) {
      const error = err as Error;
      if (error.name === "AbortError") throw error;
      console.error(`[ai-stream] ${model.id} exception:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All streaming models failed to respond");
}
