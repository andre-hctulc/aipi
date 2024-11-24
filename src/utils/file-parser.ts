import { AipiError, AipiErrorTag } from "../aipi-error";

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
 * `string` UTF-8 encoded
 */
export type FileSource = ArrayBuffer | Buffer | Blob | File | string | BlobPart | BlobPart[];

export type MimeTypeLike = File | string;
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

    get priority(): number {
        return this._config.priority ?? FileParser.DEFAULT_PRIORITY;
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

    /**
     * @throws `AipiError` if failed to convert source to blob
     */
    static createBlob(source: FileSource, options?: BlobPropertyBag): Blob {
        if (source instanceof Blob) return source;
        if (source instanceof Buffer) return new Blob([source.buffer], options);
        if (source instanceof ArrayBuffer) return new Blob([new Uint8Array(source)], options);
        if (typeof source === "string") return new Blob([source], options);
        if (Array.isArray(source)) return new Blob(source, options);
        throw new AipiError({ message: "Invalid blob source", tags: [AipiErrorTag.TYPE_ERROR] });
    }

    /**
     * @throws `AipiError` if failed to convert source to file
     */
    static createFile(source: FileSource, options?: FilePropertyBag & { fileName?: string }): File {
        if (source instanceof File) return source;
        if (source instanceof Blob)
            return new File([source], options?.fileName || (source as any)?.name?.toString() || "", options);
        if (source instanceof Buffer) return new File([source.buffer], options?.fileName || "file", options);
        if (source instanceof ArrayBuffer)
            return new File([new Uint8Array(source)], options?.fileName || "file", options);
        if (typeof source === "string") return new File([source], options?.fileName || "file", options);
        if (Array.isArray(source)) return new File(source, options?.fileName || "file", options);
        throw new AipiError({ message: "Invalid file source", tags: [AipiErrorTag.TYPE_ERROR] });
    }

    static createJsonFile(
        source: any,
        options?: Omit<FilePropertyBag, "type"> & { fileName?: string }
    ): File {
        return FileParser.createFile(JSON.stringify(source), { type: "application/json", ...options });
    }

    static createEmptyFile(options?: FilePropertyBag & { fileName?: string }): File {
        return FileParser.createFile("", options);
    }

    /**
     * @throws `AipiError` if failed to convert source to buffer
     */
    static buffer(source: ArrayBuffer | Buffer): Buffer {
        if (Buffer.isBuffer(source)) return source;
        if (source instanceof ArrayBuffer) return Buffer.from(source);
        throw new AipiError({ message: "Invalid buffer source" });
    }

    private static READABLE = new Set([
        "application/json",
        "application/javascript",
        "application/typescript",
        "application/x-javascript",
        "application/x-typescript",
        "application/ecmascript",
        "application/x-ecmascript",
        "application/x-json",
        "application/html",
        "application/xml",
        "application/xhtml+xml",
        "application/x-www-form-urlencoded",
        "application/x-yaml",
        "application/x-yml",
    ]);

    static isJson(mimeTypeLike: MimeTypeLike): boolean {
        if (mimeTypeLike instanceof File) mimeTypeLike = mimeTypeLike.type;
        return mimeTypeLike === "application/json";
    }

    /**
     * Checks if the file is UTF-8 encoded text or a readable file type.
     */
    static isReadable(mimeTypeLike: MimeTypeLike): boolean {
        if (mimeTypeLike instanceof File) mimeTypeLike = mimeTypeLike.type;
        return mimeTypeLike.startsWith("text/") || this.READABLE.has(mimeTypeLike);
    }

    /**
     * Checks if the file is a text file by checking if the mime type starts with `text/`.
     */
    static isTextFile(mimeTypeLike: MimeTypeLike): boolean {
        if (mimeTypeLike instanceof File) mimeTypeLike = mimeTypeLike.type;
        return mimeTypeLike.startsWith("text/");
    }
}

/**
 * Parses text files.
 */
export class LiteralParser extends FileParser {
    protected override async extractText(file: File): Promise<string> {
        return file.text();
    }

    override parses(file: File): boolean {
        return FileParser.isTextFile(file);
    }
}
