import { AipiError } from "../aipi-error";

export interface FileReaderConfig {
    /**
     * Maximum file size in bytes
     */
    maxSize?: number;
    /**
     * @default 100
     */
    priority?: number;
}

/**
 * Parses the text from files. Use the `LiteralParser` for plain text files.
 */
export abstract class FileParser {
    constructor(readonly config: FileReaderConfig = {}) {}

    /**
     * @throws `AipiError` if the `extractText` implementation fails
     */
    async text(file: File): Promise<string> {
        if (this.config.maxSize && file.size > this.config.maxSize) {
            throw new AipiError({ message: "File size exceeds limit" });
        }

        try {
            return await this.extractText(file);
        } catch (err) {
            throw new AipiError({ message: "Failed to extract text from file", cause: err });
        }
    }

    abstract parses(mimeType: string): boolean;
    protected abstract extractText(file: File): Promise<string>;

    static newFile(blobParts: BlobPart[], fileName: string): File {
        return new File(blobParts, fileName);
    }

    static newBlob(blobParts: BlobPart[], options?: BlobPropertyBag): Blob {
        return new Blob(blobParts, options);
    }

    /**
     * @throws `AipiError` if failed to convert source to buffer
     */
    static buffer(source: ArrayBuffer | Buffer): Buffer {
        if (Buffer.isBuffer(source)) return source;
        if (source instanceof ArrayBuffer) return Buffer.from(source);
        throw new AipiError({ message: "Invalid buffer source" });
    }
}

/**
 * Parses the text from plain text files.
 */
export class LiteralParser extends FileParser {
    protected override async extractText(file: File): Promise<string> {
        return file.text();
    }

    override parses(mimeType: string): boolean {
        return ["text/plain", "application/json"].includes(mimeType);
    }
}
