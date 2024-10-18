import { Provider } from "../providers";
import { FileParser, LiteralParser } from "../utils";
import { VectorStore } from "../vector-stores/vector-store";

enum RegistryKey {
    FILE_PARSERS = "$file_parsers",
    PROVIDERS = "$providers",
    VECTOR_STORES = "$vector_stores",
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
    }

    static useFileParser<T extends FileParser>(parser: T) {
        this.instance.register(RegistryKey.FILE_PARSERS, parser);
        return this;
    }

    static getFileParsers(): FileParser[] {
        return this.instance.get<FileParser>(RegistryKey.FILE_PARSERS);
    }

    static useProvider(provider: Provider) {
        this.instance.register(RegistryKey.PROVIDERS, provider);
        return this;
    }

    static findFileParser(file: File): FileParser | null {
        return (
            this.getFileParsers()
                .sort((fp) => -fp.priority)
                .find((parser) => parser.parses(file)) || null
        );
    }

    static getProvider(): Provider | null {
        const providers = this.instance.get<Provider>(RegistryKey.PROVIDERS);
        return providers.length ? providers[0] : null;
    }

    static findProvider(ProviderClass: new (...args: any) => Provider): Provider | null {
        return (
            this.instance.get<Provider>(RegistryKey.PROVIDERS).find((p) => p instanceof ProviderClass) || null
        );
    }

    static getProviders(): Provider[] {
        return this.instance.get<Provider>(RegistryKey.PROVIDERS);
    }

    static useVectorStore(store: VectorStore) {
        this.instance.register(RegistryKey.VECTOR_STORES, store);
        return this;
    }

    static getVectorStore(): VectorStore | null {
        const vectorStores = this.instance.get<VectorStore>(RegistryKey.VECTOR_STORES);
        return vectorStores.length ? vectorStores[0] : null;
    }

    static getVectorStores(): VectorStore[] {
        return this.instance.get<VectorStore>(RegistryKey.VECTOR_STORES);
    }
}
