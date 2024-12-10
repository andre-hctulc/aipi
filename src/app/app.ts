import { Resource } from "./resource.js";
import { AipiRegistry, type BootstrapOptions } from "./registry.js";
import { Provider } from "../providers/provider.js";
import { AipiError } from "../errors/aipi-error.js";
import type { WithScopes } from "./interfaces.js";
import { LiteralParser } from "../file-parsers/literal-parser.js";
import { CommonParamParser } from "../server/common-param-parser.js";
import { FileSystemStorage } from "../files/fs-file-storage.js";
import { DefaultInputParser } from "../input/default-input-parser.js";

const DEFAULT_RESOURCE_PRIORITY = 50;

export class AipiApp {
    readonly devMode: boolean;

    constructor(
        readonly registry: AipiRegistry,
        private options: BootstrapOptions
    ) {
        this.devMode = options.devMode || false;
        this.useDefaults();
    }

    /**
     * Register default resources
     */
    private useDefaults() {
        this.registry
            // file literal parser
            .use(new LiteralParser(), DEFAULT_RESOURCE_PRIORITY)
            // param parser
            .use(new CommonParamParser(), DEFAULT_RESOURCE_PRIORITY)
            // file system storage (program root)
            .use(new FileSystemStorage(), DEFAULT_RESOURCE_PRIORITY)
            // input parser
            .use(new DefaultInputParser(), DEFAULT_RESOURCE_PRIORITY);
    }

    /**
     * Get a resource
     */
    get<T extends Resource>(Resource: abstract new (...args: any) => T): T | null {
        return this.registry.find(Resource);
    }

    /**
     * Get all resources
     */
    getAll<T extends Resource>(Resource: abstract new (...args: any) => T): T[] {
        return this.registry.findAll(Resource);
    }

    private _provider: Provider | undefined;

    /**
     * The default provider
     */
    get provider() {
        if (this._provider) return this._provider;

        const prov = this.registry.find(Provider);

        if (!prov) {
            throw new AipiError({ message: "No provider registered" });
        }

        return (this._provider = prov);
    }

    /**
     * Find a resource that covers the given item
     */
    cover<S, R extends Resource & WithScopes<S>>(
        item: S,
        Resource: abstract new (...args: any) => R
    ): R | null {
        const candidates = this.getAll(Resource);
        return candidates.find((c) => c.covers(item)) || null;
    }

    /**
     * Find all resources that cover the given item
     */
    coverAll<S, R extends Resource & WithScopes<S>>(
        item: S,
        Resource: abstract new (...args: any) => R
    ): R[] {
        return this.getAll(Resource).filter((c) => c.covers(item));
    }

    log(...args: any[]) {
        console.log(...args);
    }

    logDev(...args: any[]) {
        if (this.devMode) {
            console.log(...args);
        }
    }
}
