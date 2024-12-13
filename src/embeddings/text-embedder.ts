import { Resource } from "../app/index.js";
import type { Vector } from "./types.js";

export interface TextEmbeddingOptions {}

export abstract class TextEmbedder extends Resource {
    abstract embed(text: string[], options?: TextEmbeddingOptions): Promise<Vector[]>;
}
