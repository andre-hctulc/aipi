import { AipiError } from "../errors/aipi-error.js";
import { Persister, type PersisterClearOptions, type PersisterSaveOptions } from "./persister.js";
import hash from "stable-hash";

export class MemoryPersister extends Persister<any, any> {
    private readonly _store: Map<any, any> = new Map();

    override async save(key: any, value: any, options?: PersisterSaveOptions): Promise<void> {
        key = hash(key);
        if (options?.overwrite === false && this._store.has(key)) {
            throw new AipiError({ message: "Key already exists." });
        }
        this._store.set(key, value);
    }

    override async load(key: any): Promise<any> {
        key = hash(key);
        return this._store.get(key);
    }

    override async delete(key: any): Promise<void> {
        key = hash(key);
        this._store.delete(key);
    }

    override async clear(options?: PersisterClearOptions): Promise<void> {
        this._store.clear();
    }

    override keys(): Promise<string[]> {
        return Promise.resolve(Array.from(this._store.keys()));
    }

    override async values(): Promise<any[]> {
        return Array.from(this._store.values());
    }

    override async entries(): Promise<[any, any][]> {
        return Array.from(this._store.entries());
    }

    override async size(): Promise<number> {
        return this._store.size;
    }

    override async has(key: any): Promise<boolean> {
        key = hash(key);
        return this._store.has(key);
    }
}
