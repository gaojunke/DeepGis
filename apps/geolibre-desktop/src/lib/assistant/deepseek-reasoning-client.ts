import OpenAI from "openai";

type ChatMessage = {
  role?: unknown;
  content?: unknown;
  tool_calls?: unknown;
  [key: string]: unknown;
};

type ChatRequest = {
  messages?: unknown;
  [key: string]: unknown;
};

type DeepSeekToolCallDelta = {
  index?: number;
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
};

type DeepSeekChunk = {
  choices?: Array<{
    delta?: {
      reasoning_content?: string | null;
      content?: string | null;
      tool_calls?: DeepSeekToolCallDelta[];
    };
  }>;
};

type CapturedToolCall = {
  id: string;
  type: string;
  function: { name: string; arguments: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeToolCalls(value: unknown): CapturedToolCall[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((toolCall) => {
      const functionValue = isRecord(toolCall.function) ? toolCall.function : {};
      return {
        id: typeof toolCall.id === "string" ? toolCall.id : "",
        type: typeof toolCall.type === "string" ? toolCall.type : "function",
        function: {
          name: typeof functionValue.name === "string" ? functionValue.name : "",
          arguments: typeof functionValue.arguments === "string" ? functionValue.arguments : "",
        },
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function assistantMessageKey(message: Pick<ChatMessage, "content" | "tool_calls">): string {
  return JSON.stringify({
    content: typeof message.content === "string" ? message.content : "",
    toolCalls: normalizeToolCalls(message.tool_calls),
  });
}

/**
 * OpenAI-compatible client wrapper for DeepSeek's `deepseek-reasoner` model.
 *
 * DeepSeek requires the exact `reasoning_content` from every earlier assistant
 * turn to be included in the next Chat Completions request. Strands keeps the
 * public assistant response as text/tool blocks, so this wrapper captures the
 * extra streaming field and restores it while the Strands OpenAI adapter
 * rebuilds the conversation history on subsequent turns.
 */
export class DeepSeekReasoningClient {
  private readonly client: OpenAI;
  private readonly reasoningByAssistantMessage = new Map<string, string>();

  constructor(options: ConstructorParameters<typeof OpenAI>[0]) {
    this.client = new OpenAI(options);
  }

  /** A narrow client shape used by Strands' Chat Completions model. */
  asOpenAIClient(): OpenAI {
    return {
      chat: {
        completions: {
          create: async (request: ChatRequest) => {
            const stream = await this.client.chat.completions.create(
              this.withReasoningContent(request) as never,
            );
            return this.captureReasoningContent(stream as unknown as AsyncIterable<DeepSeekChunk>);
          },
        },
      },
    } as unknown as OpenAI;
  }

  private withReasoningContent(request: ChatRequest): ChatRequest {
    if (!Array.isArray(request.messages)) return request;

    return {
      ...request,
      messages: request.messages.map((value) => {
        if (!isRecord(value) || value.role !== "assistant") return value;
        const message = value as ChatMessage;
        const reasoningContent = this.reasoningByAssistantMessage.get(assistantMessageKey(message));
        return reasoningContent ? { ...message, reasoning_content: reasoningContent } : message;
      }),
    };
  }

  private async *captureReasoningContent(
    stream: AsyncIterable<DeepSeekChunk>,
  ): AsyncGenerator<DeepSeekChunk> {
    let reasoningContent = "";
    let content = "";
    const toolCalls = new Map<number, CapturedToolCall>();

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (typeof delta?.reasoning_content === "string") {
        reasoningContent += delta.reasoning_content;
      }
      if (typeof delta?.content === "string") content += delta.content;
      for (const toolCall of delta?.tool_calls ?? []) {
        const index = toolCall.index ?? 0;
        const existing = toolCalls.get(index) ?? {
          id: "",
          type: "function",
          function: { name: "", arguments: "" },
        };
        if (toolCall.id) existing.id = toolCall.id;
        if (toolCall.type) existing.type = toolCall.type;
        if (toolCall.function?.name) existing.function.name = toolCall.function.name;
        if (toolCall.function?.arguments) existing.function.arguments += toolCall.function.arguments;
        toolCalls.set(index, existing);
      }
      yield chunk;
    }

    if (reasoningContent) {
      this.reasoningByAssistantMessage.set(
        assistantMessageKey({ content, tool_calls: [...toolCalls.values()] }),
        reasoningContent,
      );
    }
  }
}
