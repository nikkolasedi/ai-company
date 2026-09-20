export interface CompletionParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  tokensUsed: number;
  cost: number;
}

export interface AIProvider {
  complete(params: CompletionParams): Promise<CompletionResult>;
  stream(params: CompletionParams): AsyncIterable<string>;
}

export class MockAIProvider implements AIProvider {
  async complete(params: CompletionParams): Promise<CompletionResult> {
    const words = params.userPrompt.split(" ").length;
    return {
      content: `[Mock AI Response] Processed: "${params.userPrompt.slice(0, 100)}..."`,
      tokensUsed: words * 2,
      cost: words * 0.0001,
    };
  }

  async *stream(params: CompletionParams): AsyncIterable<string> {
    const result = await this.complete(params);
    const chunks = result.content.split(" ");
    for (const chunk of chunks) {
      yield chunk + " ";
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

export function getAIProvider(): AIProvider {
  return new MockAIProvider();
}
