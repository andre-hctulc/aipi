import { AipiError, ErrorTag } from "../errors/aipi-error.js";
import { Resource } from "../app/resource.js";
import type { WithScopes } from "../app/index.js";
import type { BaseConfig, BaseOptions } from "../types/types.js";

export interface FileReaderConfig extends BaseConfig {
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
export abstract class FileParser extends Resource implements WithScopes<File> {
    static icon = "📄";
    
    // default config values
    private static readonly DEFAULT_PRIORITY = 100;

    protected config: FileReaderConfig;

    constructor(config: FileReaderConfig = {}) {
        super();
        this.config = config;
    }

    get priority(): number {
        return this.config.priority ?? FileParser.DEFAULT_PRIORITY;
    }

    abstract covers(file: File): boolean;
    protected abstract extractText(file: File, options?: BaseOptions): Promise<string>;

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

    /**
     * @throws `AipiError` if failed to convert source to blob
     */
    static createBlob(source: FileSource, options?: BlobPropertyBag): Blob {
        if (source instanceof Blob) return source;
        if (source instanceof Buffer) return new Blob([source.buffer as BlobPart], options);
        if (source instanceof ArrayBuffer) return new Blob([new Uint8Array(source)], options);
        if (typeof source === "string") return new Blob([source], options);
        if (Array.isArray(source)) return new Blob(source, options);
        throw new AipiError({ message: "Invalid blob source", tags: [ErrorTag.TYPE_ERROR] });
    }

    /**
     * @throws `AipiError` if failed to convert source to file
     */
    static createFile(source: FileSource, options?: FilePropertyBag & { name?: string }): File {
        if (source instanceof File) {
            return source;
        }
        if (source instanceof Blob) {
            return new File([source], options?.name ?? ((source as any)?.name?.toString() || ""), options);
        }
        if (source instanceof Buffer) {
            return new File([source], options?.name || "file", options);
        }
        if (source instanceof ArrayBuffer) {
            return new File([new Uint8Array(source)], options?.name || "file", options);
        }
        if (typeof source === "string") {
            return new File([source], options?.name || "file", options);
        }
        if (Array.isArray(source)) {
            return new File(source, options?.name || "file", options);
        }

        throw new AipiError({ message: "Invalid file source", tags: [ErrorTag.TYPE_ERROR] });
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
    static isText(mimeTypeLike: MimeTypeLike): boolean {
        if (mimeTypeLike instanceof File) mimeTypeLike = mimeTypeLike.type;
        return mimeTypeLike.startsWith("text/");
    }
}
