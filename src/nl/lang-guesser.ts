import { Resource } from "../app/index.js";
import type { BaseOptions } from "../types/types.js";

export interface LangGuess {
    alpha2: string;
    alpha3?: string;
    /**
     * Full name of the language
     */
    language?: string;
    /**
     * Probability of the guess
     */
    probability?: number;
}

export interface LangGuessOptions {
    allowLangs?: string[];
}

/**
 * Base class for all kinds of tokenizers or other text splitters.
 */
export abstract class LangGuesser extends Resource {
    static icon = "❔";

    abstract guess(text: string, options?: LangGuessOptions & BaseOptions): LangGuess;
}
