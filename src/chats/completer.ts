import { Resource } from "../app/index.js";
import type { BaseOptions } from "../types/types.js";
import type { Tool, ToolMatch } from "./types.js";

export interface CompleteOptions<P extends object = Record<string, any>> extends BaseOptions<P> {
    choices?: number;
    tools?: Tool[];
}

export interface CompleteResult {
    choices: string[];
    toolMatches: ToolMatch[];
}

export abstract class Completer extends Resource {
    static icon = "🔍";

    abstract complete(text: string, options?: CompleteOptions): Promise<CompleteResult>;
}
