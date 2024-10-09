import { Provider } from "../providers";
import { FileParser, LiteralParser } from "../utils/file-parser";
import { PDFParser } from "../utils/pdf-reader";

interface AipiConfig {
    /**
     * `LiteralParser` and `PDFParser` are included by default
     */
    fileParsers?: FileParser[];
}

/**
 * Extend this class and override `Aipi.init` to for more fine grained configuration.
 */
export class Aipi<P extends Provider> {
    private _fileParsers: FileParser[] = [new LiteralParser(), new PDFParser()];

    constructor(readonly provider: P, config: AipiConfig) {
        this._fileParsers.push(...(config.fileParsers || []));
        this._fileParsers = this._fileParsers.sort(
            (a, b) => (a.config.priority || 100) - (b.config.priority || 100)
        );
        this.init?.();
    }

    /**
     * Allows more fine grained configuration. Use it by extending this class.
     */
    protected init?() {}

    /**
     * @returns The first  parser that can parse the given file type
     */
    getFileParser(file: Blob): FileParser | null {
        return this._fileParsers.find((p) => p.parses(file.type)) || null;
    }
}
