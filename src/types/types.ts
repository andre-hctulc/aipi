export type Vector = number[];

export interface MetaDescription {
    model?: string;
    user?: string;
    info?: any;
    /**
     * Response options
     */
    response?: any;
    /**
     * Request options
     */
    request?: any;
}

export interface HandlerParams<I> extends MetaDescription {
    provider: string;
    input: I;
}

export type Embeddable = string;

export type Instruction = {
    content: string;
};

export type MessageType = "user" | "system";

export type Message = {
    type: MessageType;
    content: string;
};

export interface Input {
    /** generic arguments */
    configure?: any;
}

export interface Result {
    /** generic arguments */
    raw?: any;
}

export interface Tool {
    type: ({} & string) | "function";
    name: string;
    description?: string;
    trigger?: string;
    configure?: any;
    /** JSON schema */
    schema?: any;
    id?: string;
}

export interface ToolCall {
    /**
     * Source tool
     */
    tool: string;
    /**
     * Generated content
     */
    generated?: any;
    /**
     * Might get set instead of `generated` when parsing the data fails
     * */
    generatedRaw?: any;
    error?: unknown;
}
