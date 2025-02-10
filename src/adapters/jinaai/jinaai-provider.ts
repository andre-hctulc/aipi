import { Provider } from "../../providers/provider.js";

export interface JinaAIProviderInit {
    /**
     * @default "https://api.jina.ai/v1"
     */
    baseUrl?: string;
    apiKey?: string;
}
export class JinaAIProvider extends Provider {
    readonly baseUrl: string;
    #apiKey: string = "";

    constructor(init?: JinaAIProviderInit) {
        super();
        if (init?.apiKey) this.#apiKey = init.apiKey;
        this.baseUrl = init?.baseUrl ?? "https://api.jina.ai/v1";
    }

    /**
     * Fetches a URL with the Jina AI API key.
     */
    async fetch(url: string, requestInit?: RequestInit) {
        const headers = new Headers(requestInit?.headers || {});

        if (this.#apiKey) headers.set("Authorization", `Bearer ${this.#apiKey}`);

        if (url.startsWith("/")) {
            url = this.baseUrl + url;
        } else if (!url.startsWith("http")) {
            url = this.baseUrl + "/" + url;
        }

        const response = await fetch(url, {
            ...requestInit,
            headers,
        });

        if (!response.ok) {
            throw new Error(`JinaAI: Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        return response;
    }
}
