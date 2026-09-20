import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

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
  readonly name: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
  stream(params: CompletionParams): AsyncIterable<string>;
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const goalMatch = params.userPrompt.match(/goal[:\s]+(.+)/i);
    const goal = goalMatch?.[1]?.slice(0, 120) ?? params.userPrompt.slice(0, 120);

    let content: string;
    if (params.systemPrompt.includes("JSON plan")) {
      content = JSON.stringify({
        steps: [
          {
            title: "Research and analyze",
            description: `Analyze the objective: ${goal}`,
            departmentSlug: "marketing",
            requiresApproval: false,
          },
          {
            title: "Draft deliverable",
            description: `Create actionable output for: ${goal}`,
            departmentSlug: "operations",
            requiresApproval: false,
          },
          {
            title: "Executive synthesis",
            description: "Compile findings into CEO-ready summary",
            departmentSlug: "operations",
            requiresApproval: false,
          },
        ],
      });
    } else if (params.systemPrompt.includes("route")) {
      content = JSON.stringify({
        agentId: "auto",
        title: "Execute assigned task",
        plan: "Complete the task using available skills and tools",
        needsApproval: /send|email|pay|post|publish|invoice/i.test(params.userPrompt),
      });
    } else {
      content = `## Deliverable\n\nCompleted analysis for: **${goal}**\n\n### Key findings\n- Market opportunity identified in target segment\n- Recommended 3-step action plan drafted\n- Risk factors documented with mitigations\n\n### Next steps\n1. Review draft with CEO\n2. Execute approved outreach\n3. Measure results in 2 weeks`;
    }

    const words = params.userPrompt.split(" ").length;
    return {
      content,
      tokensUsed: words * 3,
      cost: words * 0.0001,
    };
  }

  async *stream(params: CompletionParams): AsyncIterable<string> {
    const result = await this.complete(params);
    for (const chunk of result.content.split(" ")) {
      yield chunk + " ";
      await new Promise((r) => setTimeout(r, 30));
    }
  }
}

/** Chain: tries preferred provider, then fallbacks, then mock. */
export class ChainedAIProvider implements AIProvider {
  readonly name = "chained";
  private providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    this.providers = providers.length ? providers : [new MockAIProvider()];
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    for (const p of this.providers) {
      try {
        return await p.complete(params);
      } catch (e) {
        console.warn(`[AI] ${p.name} failed:`, e);
      }
    }
    return new MockAIProvider().complete(params);
  }

  async *stream(params: CompletionParams): AsyncIterable<string> {
    const result = await this.complete(params);
    for (const chunk of result.content.split(" ")) {
      yield chunk + " ";
      await new Promise((r) => setTimeout(r, 20));
    }
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(model?: string): AIProvider {
  if (!cachedProvider) {
    const chain: AIProvider[] = [];
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (model?.startsWith("claude") && anthropicKey) {
      chain.push(new AnthropicProvider(anthropicKey));
    } else if (model?.startsWith("gpt") && openaiKey) {
      chain.push(new OpenAIProvider(openaiKey));
    } else {
      if (anthropicKey) chain.push(new AnthropicProvider(anthropicKey));
      if (openaiKey) chain.push(new OpenAIProvider(openaiKey));
    }

    cachedProvider = new ChainedAIProvider(chain);
  }
  return cachedProvider;
}

export function providerForModel(model: string): AIProvider {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (model.startsWith("claude") && anthropicKey) {
    return new AnthropicProvider(anthropicKey);
  }
  if (model.startsWith("gpt") && openaiKey) {
    return new OpenAIProvider(openaiKey);
  }
  return getAIProvider(model);
}
