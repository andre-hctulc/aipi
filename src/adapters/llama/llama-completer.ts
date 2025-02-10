import {
    defineChatSessionFunction,
    LlamaChatSession,
    type ChatSessionModelFunction,
    type LlamaContextOptions,
} from "node-llama-cpp";
import { Completer, type CompleteOptions, type CompleteResult } from "../../chats/completer.js";
import type { Message, ToolMatch } from "../../chats/types.js";
import { LlamaProvider } from "./llama-provider.js";
import { flattenMessages } from "./system.js";
import { createId } from "../../utils/system.js";

export interface LlamaCompleteOptions extends CompleteOptions {
    params?: {
        contextOptions?: LlamaContextOptions;
        sessionOptions?: Partial<LlamaChatSession>;
        systemPrompt?: Message[];
    };
}

export class LlamaCompleter extends Completer {
    private provider!: LlamaProvider;

    override onMount() {
        this.provider = this.app.require(LlamaProvider);
    }

    override async complete(text: string, options?: LlamaCompleteOptions): Promise<CompleteResult> {
        const context = await this.provider.model.createContext({ ...options?.params?.contextOptions });
        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt: flattenMessages(options?.params?.systemPrompt || [], "system"),
            ...options?.params?.sessionOptions,
        });

        const tools = [...(options?.tools || [])];

        const functions: {
            [name: string]: ChatSessionModelFunction;
        } = {};

        tools.forEach((tool) => {
            functions[tool.name] = defineChatSessionFunction({
                params: tool.schema as any,
                description: tool.description,
                handler: (params) => {
                    toolMatches.push({ tool: tool.name, params: params, rawParams: params });
                },
            });
        });

        const toolMatches: ToolMatch[] = [];
        const responseMessages: Message[] = [];
        const { responseText } = await session.promptWithMeta(text, {
            functions,
        });

        responseMessages.push({ textContent: responseText, role: "system", id: createId() });

        return {
            toolMatches,
            choices: [responseText],
        };
    }
}
