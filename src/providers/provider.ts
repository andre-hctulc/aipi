import { Assistant } from "../assistants/assistant.js";
import { Resource } from "../app/resource.js";
import type { CommonQueryOptions, JSONSchema } from "../types/index.js";
import type {
    Embeddable,
    Input,
    Message,
    MessageFormat,
    Result,
    Tool,
    ToolMatch,
    Vector,
} from "../types/types.js";

export interface EmbedInput extends Input {
    /**
     * List of text to embed.
     */
    content: Embeddable[];
}

export interface EmbedResult extends Result {
    vectors: Vector[];
}

export interface ChatInput extends Input {
    messages: Message[];
    tools?: Tool[];
    responseFormat?: MessageFormat;
}

export interface ChatResult extends Result {
    responseMessages: Message[];
    toolMatches: ToolMatch[];
}

export interface CreateFileInput extends Input {
    file: File;
    usage?: string;
}

export interface CreateFileResult extends Result {
    fileId: string;
}

export interface DeleteFileInput extends Input {
    fileId: string;
}

export interface DeleteFileResult extends Result {}

export interface ListAssistantsInput extends Input {
    query?: CommonQueryOptions;
}

export interface ListAssistantsResult<A extends Assistant = Assistant> extends Result {
    assistants: A[];
}

export interface CreateAssistantInput extends Input {
    /**
     * Unique name of the assistant.
     */
    name: string;
    instructions: string;
    description?: string;
    metadata?: any;
    tools?: Tool[];
    resources?: any;
    model?: string;
}

export interface CreateAssistantResult<A extends Assistant = Assistant> extends Result {
    assistant: A;
}

export interface GetAssistantInput extends Result {
    assistantId: string;
}

export interface GetAssistantResult<A extends Assistant = Assistant> extends Result {
    assistant: A | null;
}

export interface UpdateAssistantInput extends Input {
    assistantId: string;
    /**
     * The update data
     */
    data: {
        instructions?: string;
        description?: string;
        metadata?: any;
        tools?: Tool[];
        name?: string;
        resources?: any;
        model?: string;
    };
}

export interface CompleteResult extends Result {
    choices: { content: string; type: (string & {}) | "text" }[];
}

export interface CompleteInput extends Input {
    messages?: Message[];
    prompt: string;
}

export interface UpdateAssistantResult<A extends Assistant = Assistant> extends Result {
    assistant: A;
}

export interface DeleteAssistantInput extends Input {
    assistantId: string;
}

export interface DeleteAssistantResult extends Result {
    deleted: boolean;
}

export abstract class Provider<A extends Assistant = Assistant> extends Resource {
    constructor() {
        super();
    }

    // -- Embeddings

    abstract embed(input: EmbedInput, options?: any): Promise<EmbedResult>;

    // -- Chat

    abstract chat(input: ChatInput, options?: any): Promise<ChatResult>;
    abstract complete(input: CompleteInput, options?: any): Promise<CompleteResult>;

    // -- Assistants

    abstract listAssistants(input: ListAssistantsInput, options?: any): Promise<ListAssistantsResult<A>>;

    abstract createAssistant(input: CreateAssistantInput, options?: any): Promise<CreateAssistantResult<A>>;

    abstract getAssistant(input: GetAssistantInput, options?: any): Promise<GetAssistantResult<A>>;

    /**
     * @returns updated?
     */
    abstract updateAssistant(input: UpdateAssistantInput, options?: any): Promise<UpdateAssistantResult<A>>;

    /**
     * @returns deleted?
     */
    abstract deleteAssistant(input: DeleteAssistantInput, options?: any): Promise<DeleteAssistantResult>;
}
