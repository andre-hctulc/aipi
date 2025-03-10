import OpenAI from "openai";
import { Provider } from "../../providers/provider.js";
import type { ClientOptions } from "openai";

export class OpenAIProvider extends Provider<OpenAI> {
    private _client: ClientOptions | undefined;

    constructor(client: ClientOptions) {
        super();
        this._client = client;
    }

    protected override provide(): OpenAI {
        const oai = this._client instanceof OpenAI ? this._client : new OpenAI(this._client);
        this._client = undefined;
        return oai;
    }
}
