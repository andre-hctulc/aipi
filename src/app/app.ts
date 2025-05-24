import type { Resource } from "./resource.js";
import type { AipiRegistry, BootstrapOptions } from "./registry.js";
import type { WithScope } from "./interfaces.js";
import { ResourceNotFoundError } from "../errors/common-errors.js";

/**
 * Emitted by a registry on bootstrap.
 */
export class AipiApp {
    readonly devMode: boolean;

    constructor(
        readonly registry: AipiRegistry,
        private options: BootstrapOptions
    ) {
        this.devMode = options.printRegistry || false;
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
    cover<S, R extends Resource & WithScope<S>>(
        item: S,
        Resource: abstract new (...args: any) => R
    ): R | null {
        const candidates = this.getAll(Resource);
        return candidates.find((c) => c.covers(item)) || null;
    }

    /**
     * Find all resources that cover the given item
     */
    coverAll<S, R extends Resource & WithScope<S>>(item: S, Resource: abstract new (...args: any) => R): R[] {
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
