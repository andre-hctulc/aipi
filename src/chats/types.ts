import type { JSONSchema } from "../types/json-schema.js";

export type MessageType = "user" | "system" | "assistant" | (string & {});

export type Message = {
    role: MessageType;
    textContent?: string;
    content?: any;
    attachments?: any;
    info?: any;
    id?: string;
    index?: number;
};

export type Format = {
    type?: "text" | "json" | (string & {});
    schema?: JSONSchema;
};

export interface Tool {
    type: ({} & string) | "function";
    name: string;
    description?: string;
    configure?: any;
    /** JSON schema */
    schema?: JSONSchema;
    data?: any;
}

export interface ToolMatch {
    /**
     * Source tool name
     */
    tool: string;
    /**
     * Generated content
     */
    params?: any;
    /**
     * Might get set instead of `generated` when parsing the data fails
     * */
    rawParams?: any;
    /**
     * Error when parsing the data
     */
    parseError?: unknown;
    index?: number;
    ref?: string;
}
