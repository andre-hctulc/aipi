import type { Assistants } from "../assistants/assistants";
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

export interface CompleteInput extends Input {
    messages?: Message[];
    prompt: string;
}

export interface CompleteResult extends Result {
    choices: { content: string; type: string }[];
}

export interface ChatInput extends Input {
    messages: Message[];
    tools?: Tool[];
}

export interface ChatResult extends Result {
    choices: { content: string; type: string; triggeredTools: ToolMatch[] }[];
    triggeredTools: ToolMatch[];
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

export abstract class Provider {
    constructor() {}

    abstract supportAssistants(): Assistants | null;
    abstract embed(input: EmbedInput, meta?: MetaDescription): Promise<EmbedResult>;
    abstract complete(input: CompleteInput, meta?: MetaDescription): Promise<CompleteResult>;
    abstract chat(input: ChatInput, meta?: MetaDescription): Promise<ChatResult>;
    abstract createFile(input: CreateFileInput, meta?: MetaDescription): Promise<CreateFileResult>;
    abstract deleteFile(input: DeleteFileInput, meta?: MetaDescription): Promise<DeleteFileResult>;
}
