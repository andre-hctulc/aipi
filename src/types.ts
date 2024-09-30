export type Vector = number[];

export interface MetaDescription {
    model?: string;
    user?: string;
    info?: any;
    responseFormat?: any;
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
    type: string;
    name?: string;
    trigger?: string;
    configure?: any;
    id?: string;
}
