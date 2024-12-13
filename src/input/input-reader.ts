import { FileStorage } from "../persister/file-storage.js";
import { Resource } from "../app/resource.js";
import { AipiError } from "../errors/aipi-error.js";

export interface InputReaderConfig {
    fileStorage?: FileStorage;
}

export abstract class InputReader extends Resource {
    private fileStorage: FileStorage | undefined;

    constructor(config: InputReaderConfig = {}) {
        super();

        const fileStorage = config.fileStorage;

        if (!fileStorage) {
            throw new AipiError({ message: "No file storage available" });
        }
    }

    static create(config: InputReaderConfig): InputReader {
        return new (class extends InputReader {
            constructor() {
                super(config);
            }
        })();
    }

    /**
     * @param key The key of the file to read. A file path or key in the storage
     */
    async read(key: string): Promise<string | null> {
        const fileStorage = this.fileStorage || this.app.get(FileStorage);

        if (!fileStorage) {
            throw new AipiError({ message: "No file storage available" });
        }

        const file = await fileStorage.load(key);

        return file?.text() ?? null;
    }
}
