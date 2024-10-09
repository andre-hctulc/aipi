import { FileParser, LiteralParser, PDFParser } from "../utils";

enum RegistryKey {
    FILE_PARSERS = "$file_parsers",
}

export abstract class Registry {
    private registry: Map<string, any[]> = new Map();

    constructor() {
        this.init();
    }

    private init() {
        // Init default components
        this.register<FileParser>(RegistryKey.FILE_PARSERS, new LiteralParser(), new PDFParser());
    }

    private register<T>(key: string, ...values: T[]) {
        if (!this.registry.has(key)) this.registry.set(key, []);
        this.registry.get(key)!.push(...values);
    }

    private get<T>(key: string): T[] {
        return this.registry.get(key) || [];
    }

    private static instance: Registry = new (class extends Registry {})();

    static useFileParser<T extends FileParser>(parser: T) {
        this.instance.register(RegistryKey.FILE_PARSERS, parser);
    }

    static getFileParsers(): FileParser[] {
        return this.instance.get<FileParser>(RegistryKey.FILE_PARSERS);
    }
}
