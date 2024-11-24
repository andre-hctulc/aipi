import { Provider } from "../providers";
import { FileParser, InputReader, LiteralParser } from "../utils";
import { VectorStore } from "../vector-stores/vector-store";

enum RegistryKey {
    FILE_PARSERS = "$file_parsers",
    PROVIDERS = "$providers",
    VECTOR_STORES = "$vector_stores",
    INPUT_READERS = "$input_readers",
}

export abstract class Registry {
    private registry: Map<string, any[]> = new Map();

    constructor() {
        this.init();
    }

    private init() {
        // Init default components
        this.register<FileParser>(RegistryKey.FILE_PARSERS, new LiteralParser());
    }

    private register<T>(key: string, ...values: T[]) {
        if (!this.registry.has(key)) this.registry.set(key, []);
        this.registry.get(key)!.push(...values);
    }

    private set<T>(key: string, values: T[]) {
        this.registry.set(key, values);
        return this;
    }

    private get<T>(key: string): T[] {
        return this.registry.get(key) || [];
    }

    private clear() {
        this.registry.clear();
    }

    private static instance: Registry = new (class extends Registry {})();

    static clear() {
        this.instance.clear();
        return this;
    }

    // -- FileParser (many)

    static useFileParser<T extends FileParser>(parser: T) {
        this.instance.register(RegistryKey.FILE_PARSERS, parser);
        return this;
    }

    static getFileParsers(): FileParser[] {
        return this.instance.get<FileParser>(RegistryKey.FILE_PARSERS);
    }

    static findFileParser(file: File): FileParser | null {
        return (
            this.getFileParsers()
                .sort((fp) => -fp.priority)
                .find((parser) => parser.parses(file)) || null
        );
    }

    // -- Provider (1)

    static getProvider(): Provider | null {
        const providers = this.instance.get<Provider>(RegistryKey.PROVIDERS);
        return providers.length ? providers[0] : null;
    }

    static useProvider(provider: Provider) {
        this.instance.set(RegistryKey.PROVIDERS, [provider]);
        return this;
    }

    // -- VectorStore (1)

    static useVectorStore(store: VectorStore) {
        this.instance.set(RegistryKey.VECTOR_STORES, [store]);
        return this;
    }

    static getVectorStore(): VectorStore | null {
        const vectorStores = this.instance.get<VectorStore>(RegistryKey.VECTOR_STORES);
        return vectorStores.length ? vectorStores[0] : null;
    }

    // -- InputReader (1)

    static useInputReader(reader: InputReader) {
        this.instance.set(RegistryKey.INPUT_READERS, [reader]);
        return this;
    }

    static getInputReader(): InputReader | null {
        const readers = this.instance.get<InputReader>(RegistryKey.INPUT_READERS);
        return readers.length ? readers[0] : null;
    }
}
