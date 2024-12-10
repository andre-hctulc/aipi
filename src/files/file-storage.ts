import { Resource } from "../app/index.js";

export abstract class FileStorage extends Resource {
    abstract load(key: string): Promise<File>;
    abstract write(key: string, file: File): Promise<void>;
    abstract remove(key: string): Promise<void>;
    /**
     * @param key The base key
     * @returns List of file keys
     */
    abstract list(key: string): Promise<string[]>;
}
