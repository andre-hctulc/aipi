import type { JSONSchema } from "./json-schema";

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
    role: MessageType;
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
    trigger?: string;
    configure?: any;
    /** JSON schema */
    schema?: JSONSchema;
}

export interface ToolMatch {
    /**
     * Source tool name
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

export type Falsy = false | null | undefined;

/**
 * Get all keys of an object including nested keys.
 */
export type NestedProperties<T> = T extends object
    ? {
          [K in keyof T]: K | NestedProperties<T[K]>;
      }[keyof T]
    : never;
