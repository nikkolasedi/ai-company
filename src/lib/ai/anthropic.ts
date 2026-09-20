import type { AIProvider, CompletionParams, CompletionResult } from "./provider";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  constructor(private apiKey: string) {}

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const model = params.model?.startsWith("claude") ? params.model : DEFAULT_MODEL;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens ?? 2048,
        system: params.systemPrompt,
        messages: [{ role: "user", content: params.userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content =
      data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
    const tokensUsed =
      (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
    const cost = tokensUsed * 0.000003;

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
