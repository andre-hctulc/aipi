import path from "path";
import { FileStorage } from "./file-storage.js";
import fs from "fs";
import { NotSupportedError } from "../errors/common-errors.js";
import type { PersisterClearOptions, PersisterSaveOptions } from "./persister.js";

export class FileSystemStorage extends FileStorage {
    readonly baseDir: string;

    constructor(baseDir?: string) {
        super();
        this.baseDir = path.resolve(baseDir || ".");
    }

    override async save(key: string, value: File, options?: PersisterSaveOptions): Promise<void> {
        const p = path.resolve(this.baseDir, key);

        if (!options?.overwrite && fs.existsSync(path.resolve(this.baseDir, key))) {
            throw new NotSupportedError("Save", "File already exists.");
        }

        await fs.promises.writeFile(p, Buffer.from(await value.arrayBuffer()));
    }

    override async load(key: string): Promise<File | undefined> {
        const p = path.resolve(this.baseDir, key);

        if (!fs.existsSync(p)) return undefined;

        const buff = await fs.promises.readFile(path.resolve(this.baseDir, key));

        return new File([buff], key);
    }

    override async delete(key: string): Promise<void> {
        await fs.promises.unlink(path.resolve(this.baseDir, key));
    }

    override async clear(options?: PersisterClearOptions): Promise<void> {
        if (!options?.force) {
            throw new NotSupportedError(
                "Clear",
                "Clearing the file system storage is not supported without the force option."
            );
        }

        const entries = await fs.promises.readdir(this.baseDir);

        for (const entry of entries) {
            await fs.promises.unlink(path.resolve(this.baseDir, entry));
        }
    }

    override keys(): Promise<string[]> {
        return fs.promises.readdir(this.baseDir);
    }

    override async values(): Promise<File[]> {
        const keys = await this.keys();
        return Promise.all(keys.map((key) => this.load(key) as Promise<File>));
    }

    override async entries(): Promise<[string, File][]> {
        const keys = await this.keys();

        return Promise.all(
            keys.map(async (key) => {
                const file = await this.load(key);
                return [key, file!];
            })
        );
    }

    override async size(): Promise<number> {
        const keys = await this.keys();
        return keys.length;
    }

    override has(key: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
