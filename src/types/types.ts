import type { JSONSchema } from "./json-schema.js";

export type Vector = number[];

export type Embeddable = string;

export type Instruction = {
    content: string;
};

export type MessageType = "user" | "system" | "assistant" | (string & {});

export type Message = {
    role: MessageType;
    textContent: string;
    attachments?: any;
    info?: any;
    toolMatches?: ToolMatch[];
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
    /**
     * Error when parsing the data
     */
    parseError?: unknown;
}

export type MessageFormat = {
    type?: "text" | "json" | (string & {});
    schema?: JSONSchema;
};

export type Falsy = false | null | undefined;

/**
 * Get all keys of an object including nested keys.
 */
export type NestedProperties<T> = T extends object
    ? {
          [K in keyof T]: K | NestedProperties<T[K]>;
      }[keyof T]
    : never;
