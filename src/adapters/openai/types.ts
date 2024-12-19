import type { RequestOptions } from "openai/core";

export interface CommonOpenAIOptions {
    params?: {
        model?: string;
        user?: string;
        requestOptions?: RequestOptions;
    };
}
