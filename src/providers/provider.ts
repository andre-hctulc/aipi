import { Assistants } from "../assistants/assistants";
import { Embeddable, Input, Message, MetaDescription, Result, Tool, Vector } from "../types/types";

export interface EmbedInput extends Input {
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
    messages?: Message[];
    prompt: string;
    tools?: Tool[];
}

export interface ChatResult extends Result {
    choices: { content: string; type: string }[];
}

export abstract class Provider {
    constructor() {}

    abstract supportAssistants(): Assistants | null;
    abstract embed(input: EmbedInput, meta: MetaDescription): Promise<EmbedResult>;
    abstract complete(input: CompleteInput, meta: MetaDescription): Promise<CompleteResult>;
    abstract chat(input: ChatInput, meta: MetaDescription): Promise<ChatResult>;
}
