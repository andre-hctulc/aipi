import { Assistant } from "../assistants/assistant";
import { CommonQueryOptions } from "../types";
import type {
    Embeddable,
    Input,
    Message,
    MetaDescription,
    Result,
    Tool,
    ToolMatch,
    Vector,
} from "../types/types";

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

export interface UpdateAssistantResult<A extends Assistant = Assistant> extends Result {
    assistant: A;
}

export interface DeleteAssistantInput extends Input {
    assistantId: string;
}

export interface DeleteAssistantResult extends Result {
    deleted: boolean;
}

export abstract class Provider<A extends Assistant = Assistant> {
    constructor() {}

    // -- Embeddings

    abstract embed(input: EmbedInput, meta?: MetaDescription): Promise<EmbedResult>;

    // -- Files

    abstract createFile(input: CreateFileInput, meta?: MetaDescription): Promise<CreateFileResult>;
    abstract deleteFile(input: DeleteFileInput, meta?: MetaDescription): Promise<DeleteFileResult>;

    // -- Chat

    abstract chat(input: ChatInput, meta?: MetaDescription): Promise<ChatResult>;

    // -- Assistants

    abstract listAssistants(
        input: ListAssistantsInput,
        meta: MetaDescription
    ): Promise<ListAssistantsResult<A>>;

    abstract createAssistant(
        input: CreateAssistantInput,
        meta: MetaDescription
    ): Promise<CreateAssistantResult<A>>;

    abstract getAssistant(input: GetAssistantInput, meta: MetaDescription): Promise<GetAssistantResult<A>>;

    /**
     * @returns updated?
     */
    abstract updateAssistant(
        input: UpdateAssistantInput,
        meta: MetaDescription
    ): Promise<UpdateAssistantResult<A>>;

    /**
     * @returns deleted?
     */
    abstract deleteAssistant(
        input: DeleteAssistantInput,
        meta: MetaDescription
    ): Promise<DeleteAssistantResult>;
}
