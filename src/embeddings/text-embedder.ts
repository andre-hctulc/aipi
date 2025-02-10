import { Resource } from "../app/index.js";
import type { BaseInput, BaseOptions } from "../types/types.js";
import type { Vector } from "./types.js";

export interface TextEmbedInput<P extends object = Record<string, any>> extends BaseInput<P> {
    text: string[] | string;
}

export abstract class TextEmbedder extends Resource {
    static icon = "📝";
    
    abstract embed(text: TextEmbedInput, options?: BaseOptions): Promise<Vector[]>;
}
