import { Resource } from "../app/index.js";

export interface CompleteOptions {
    choices?: number;
}

export interface CompleteResult {
    choices: string[];
}

export abstract class Completer extends Resource {
    abstract complete(text: string, options?: CompleteOptions): Promise<CompleteResult>;
}
