import { AipiError } from "../aipi-error";
import { Registry } from "../registry";

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
    // default config values
    private static readonly DEFAULT_PRIORITY = 100;

    private _config: FileReaderConfig;

    constructor(config: FileReaderConfig = {}) {
        this._config = config;
    }

    abstract parses(file: File): boolean;
    protected abstract extractText(file: File): Promise<string>;

    /**
     * @throws `AipiError` if the `extractText` implementation fails
     */
    async text(file: File): Promise<string> {
        if (this._config.maxSize && file.size > this._config.maxSize) {
            throw new AipiError({ message: "File size exceeds limit" });
        }

        try {
            return await this.extractText(file);
        } catch (err) {
            throw new AipiError({ message: "Failed to extract text from file", cause: err });
        }
    }

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

    static find(file: File): FileParser | null {
        return (
            Registry.getFileParsers()
                .sort((fp) => -(fp._config.priority ?? this.DEFAULT_PRIORITY))
                .find((parser) => parser.parses(file)) || null
        );
    }

    static isJSON(file: File): boolean {
        return file.type === "application/json";
    }
}

/**
 * Parses the text from plain text files.
 */
export class LiteralParser extends FileParser {
    protected override async extractText(file: File): Promise<string> {
        return file.text();
    }

    override parses(file: File): boolean {
        return ["text/plain", "application/json"].includes(file.type);
    }
}
