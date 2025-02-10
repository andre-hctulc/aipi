import { Resource } from "../app/index.js";

export interface PersisterClearOptions {
    /**
     * Persisters may prevent clearing if this option is not set to true.
     */
    force?: boolean;
}

export interface PersisterSaveOptions {
    /**
     * The default value depends on the implementation.
     */
    overwrite?: boolean;
}

export type PersisterObjectKey = {
    type: string;
    value: any;
    tags: any[];
};

export abstract class Persister<K, V> extends Resource {
    static icon = "💾";
    
    abstract save(key: K, value: V, options?: PersisterSaveOptions): Promise<void>;
    abstract load(key: K): Promise<V | undefined>;
    abstract delete(key: K): Promise<void>;
    abstract clear(options?: PersisterClearOptions): Promise<void>;
    abstract keys(): Promise<K[]>;
    abstract values(): Promise<V[]>;
    abstract entries(): Promise<[K, V][]>;
    abstract size(): Promise<number>;
    abstract has(key: K): Promise<boolean>;

    /**
     * Creates a key object.
     */
    static key(type: string, value: any, tags: string[] = []): PersisterObjectKey {
        return { type, value, tags: tags.map((t) => `$$${t}`) };
    }
}

/**
 * A persistable object.
 *
 * Use this in combination with {@link Reviver}.
 */
export interface Persistable<S> {
    /**
     * Serializes the object for persistence.
     */
    serialize(): S | Promise<S>;
}

/**
 * Revives persisted objects.
 *
 * Use this in combination with {@link Persistable}.
 */
export interface Reviver<S, V extends Persistable<S>> {
    /**
     * Revives a serialized object.
     */
    revive(serialized: S): V | Promise<V>;
}
