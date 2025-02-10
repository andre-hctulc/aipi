import { Resource } from "../app/index.js";
import type { BaseOptions } from "../types/types.js";

export type TextPartTag =
    | "sentence"
    | "word"
    | "punctuation"
    | "number"
    | "email"
    | "url"
    | "emoji"
    | "hashtag"
    | "mention"
    | "emoticon"
    | "symbol"
    | "currency"
    | "time"
    | "paragraph"
    | "date"
    | "abbreviation"
    | "quoted_phrase"
    | "ordinal"
    | "character";

export interface Segment {
    tag: (string & {}) | TextPartTag;
    text: string;
    range: [number, number] | readonly [number, number];
    children: Segment[];
}

/**
 * Base class for all kinds of tokenizers or other text splitters.
 */
export abstract class Splitter extends Resource {
    static icon = "🔪";
    
    abstract tokenize(text: string, options?: BaseOptions): Segment[];
}
