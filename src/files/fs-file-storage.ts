import path from "path";
import { FileStorage } from "./file-storage.js";
import { promises } from "fs";

export class FileSystemStorage extends FileStorage {
    readonly baseDir: string;

    constructor(baseDir?: string) {
        super();
        this.baseDir = path.resolve(baseDir || ".");
    }

    async load(key: string): Promise<File> {
        const buff = await promises.readFile(path.join(this.baseDir, key));
        return new File([buff], key);
    }

    async write(key: string, file: File): Promise<void> {
        await promises.writeFile(path.join(this.baseDir, key), Buffer.from(await file.arrayBuffer()));
    }

    async remove(key: string): Promise<void> {
        await promises.unlink(path.join(this.baseDir, key));
    }

    list(key: string): Promise<string[]> {
        return promises.readdir(path.join(this.baseDir, key));
    }
}
