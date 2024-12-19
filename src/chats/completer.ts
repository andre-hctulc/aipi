import { Resource } from "../app/index.js";
import type { AnyOptions } from "../types/types.js";
import type { Tool, ToolMatch } from "./types.js";

export interface CompleteOptions extends AnyOptions {
    choices?: number;
    tools?: Tool[];
}

export interface CompleteResult {
    choices: string[];
    toolMatches: ToolMatch[];
}

export abstract class Completer extends Resource {
    abstract complete(text: string, options?: CompleteOptions): Promise<CompleteResult>;
}
