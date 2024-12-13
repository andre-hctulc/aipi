import { Resource } from "./resource.js";
import { AipiRegistry, type BootstrapOptions } from "./registry.js";
import type { WithScopes } from "./interfaces.js";
import { LiteralParser } from "../file-parsers/literal-parser.js";
import { CommonParamParser } from "../server/common-param-parser.js";
import { FileSystemStorage } from "../persister/fs-file-storage.js";
import { DefaultInputParser } from "../input/default-input-parser.js";
import { MemoryPersister } from "../persister/memory-persister.js";
import { ResourceNotFoundError } from "../errors/common-errors.js";

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
            // memory persister
            .use(new MemoryPersister(), DEFAULT_RESOURCE_PRIORITY)
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
     * Mount a resource without registering it
     */
    async mount<R extends Resource>(resource: R, options: BootstrapOptions = {}): Promise<R> {
        await resource.mount(this, options);
        return resource;
    }

    /**
     * Get a resource
     */
    get<T extends Resource>(Resource: abstract new (...args: any) => T): T | null {
        return this.registry.find(Resource);
    }

    /**
     * Require a resource. If the resource is not found, an error is thrown.
     */
    require<T extends Resource>(Resource: abstract new (...args: any) => T): T {
        const res = this.registry.find(Resource);
        if (!res) throw new ResourceNotFoundError(Resource);
        return res;
    }

    /**
     * Get all resources
     */
    getAll<T extends Resource>(Resource: abstract new (...args: any) => T): T[] {
        return this.registry.findAll(Resource);
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
