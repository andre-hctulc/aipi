import {
    Provider,
    type ChatInput,
    type ChatResult,
    type CompleteInput,
    type CompleteResult,
    type CreateAssistantInput,
    type CreateAssistantResult,
    type DeleteAssistantInput,
    type DeleteAssistantResult,
    type EmbedInput,
    type EmbedResult,
    type GetAssistantInput,
    type GetAssistantResult,
    type ListAssistantsInput,
    type ListAssistantsResult,
    type UpdateAssistantInput,
    type UpdateAssistantResult,
} from "../../providers/provider.js";
import type { Message, ToolMatch, Vector } from "../../types/types.js";
import {
    type ChatSessionModelFunction,
    defineChatSessionFunction,
    getLlama,
    Llama,
    LlamaChatSession,
    type LlamaChatSessionOptions,
    type LlamaContextOptions,
    LlamaEmbeddingContext,
    LlamaModel,
    type LlamaModelOptions,
} from "node-llama-cpp";

export class LlamaProvider extends Provider<any> {
    llama!: Llama;
    model!: LlamaModel;
    private embeddingContext!: LlamaEmbeddingContext;

    constructor(private options: LlamaModelOptions) {
        super();
    }

    override async onMount(): Promise<void> {
        this.llama = await getLlama();
        this.model = await this.llama.loadModel(this.options);
        this.embeddingContext = await this.model.createEmbeddingContext();
    }

    override async embed(input: EmbedInput): Promise<EmbedResult> {
        const embeddings = await Promise.all(
            input.content.map((content) => {
                return this.embeddingContext.getEmbeddingFor(content);
            })
        );

        return { vectors: embeddings.map((e) => e.vector as Vector) };
    }

    private filterMessages(messages: Message[], role: string) {
        return messages
            .filter((m) => m.role === role)
            .map((m) => m.textContent)
            .join("\n");
    }

    override async complete(input: CompleteInput): Promise<CompleteResult> {
        const context = await this.model.createContext({});
        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt: this.filterMessages(input.messages || [], "system"),
        });

        const result = await session.completePrompt(this.filterMessages(input.messages || [], "user"));

        return { choices: [{ content: result, type: "text" }] };
    }

    override async chat(
        input: ChatInput,
        options?: {
            contextOptions?: Partial<LlamaContextOptions>;
            sessionOptions?: Partial<LlamaChatSessionOptions>;
        }
    ): Promise<ChatResult> {
        const context = await this.model.createContext({ ...options?.contextOptions });
        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt: this.filterMessages(input.messages || [], "system"),
            ...options?.sessionOptions,
        });

        const functions: {
            [name: string]: ChatSessionModelFunction;
        } = {};

        input.tools?.forEach((tool) => {
            functions[tool.name] = defineChatSessionFunction({
                params: tool.schema as any,
                description: tool.description,
                handler: (params) => {
                    toolMatches.push({ tool: tool.name, generated: params, generatedRaw: params });
                },
            });
        });

        const toolMatches: ToolMatch[] = [];
        const responseMessages: Message[] = [];

        for (const message of input.messages || []) {
            if (message.role !== "user") continue;

            const { responseText } = await session.promptWithMeta(message.textContent, {
                functions,
            });
            responseMessages.push({ textContent: responseText, role: "system" });
        }

        return {
            responseMessages,
            toolMatches /*: result.response
                .map<ToolMatch | null>((r) => {
                    if (typeof r === "string") return null;

                    return { tool: r.name };
                })
                .filter(Boolean) as ToolMatch[], */,
        };
    }

    override listAssistants(input: ListAssistantsInput): Promise<ListAssistantsResult<any>> {
        throw new Error("Not yet implemented..");
    }

    override createAssistant(input: CreateAssistantInput): Promise<CreateAssistantResult<any>> {
        throw new Error("Not yet implemented.");
    }

    override getAssistant(input: GetAssistantInput): Promise<GetAssistantResult<any>> {
        throw new Error("Not yet implemented.");
    }

    override updateAssistant(input: UpdateAssistantInput): Promise<UpdateAssistantResult<any>> {
        throw new Error("Not yet implemented.");
    }

    override deleteAssistant(input: DeleteAssistantInput): Promise<DeleteAssistantResult> {
        throw new Error("Not yet implemented.");
    }
}
