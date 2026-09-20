import type { AIProvider, CompletionParams, CompletionResult } from "./provider";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(private apiKey: string) {}

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const model = params.model?.startsWith("gpt") ? params.model : DEFAULT_MODEL;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens ?? 2048,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const tokensUsed = data.usage?.total_tokens ?? content.length / 4;
    const cost = tokensUsed * 0.000002;

    return { content, tokensUsed, cost };
  }

  async *stream(params: CompletionParams): AsyncIterable<string> {
    const result = await this.complete(params);
    for (const word of result.content.split(" ")) {
      yield word + " ";
      await new Promise((r) => setTimeout(r, 20));
    }
  }
}
