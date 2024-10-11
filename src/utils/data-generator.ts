import type { Provider } from "../providers";
import type { JSONSchema, Tool } from "../types";

type SchemaMap<D extends Record<string, any>> = { [K in keyof D]: JSONSchema };

export interface GenerateOptions {
    /**
     * System message to setup the AI
     */
    systemMessage?: string;
    /**
     * User message that triggers generating data
     */
    userMessage?: string;
    tooTrigger?: string;
}

export interface DataGeneratorConfig extends GenerateOptions {
    provider: Provider;
    /** Used as prefix for required tools */
    toolName: string;
}

export class DataGenerator<D extends Record<string, any> = any> {
    private _config: DataGeneratorConfig;
    private _fields = new Map<keyof D, { schema: JSONSchema; additionalToolData?: Partial<Tool> }>();

    constructor(config: DataGeneratorConfig) {
        this._config = config;
    }

    /**
     * Add a field to the data generator
     * @param key The key of the field
     * @param schema The schema of the field
     * @param tool Additional tool data. This overwrites the default tool data.
     */
    addField(key: keyof D, schema: JSONSchema, tool?: Partial<Tool>) {
        this._fields.set(key, { schema, additionalToolData: tool });
    }

    static async generateMap<D extends Record<string, any>>(
        config: DataGeneratorConfig,
        schemas: SchemaMap<D>,
        options?: GenerateOptions
    ): Promise<Partial<D>> {
        const generator = new DataGenerator<D>(config);

        for (const [key, schema] of Object.entries(schemas)) {
            generator.addField(key as keyof D, schema);
        }

        return generator.generate(options);
    }

    async generate(options: GenerateOptions = {}): Promise<Partial<D>> {
        if (!this._fields.size) return {};

        const opts = { ...this._config, ...options };

        const sysMsg = opts.systemMessage || "You are a data generator.";
        const userMsg = opts.userMessage || "Please generate some data.";
        const trigger = opts.tooTrigger || "Generate data";

        const entries = Array.from(this._fields.entries());

        const tools: Tool[] = entries.map(([key, { schema, additionalToolData }], index) => {
            return {
                type: "function",
                name: `${index},data_gen:${this._config.toolName}-${key.toString()}`,
                trigger,
                schema,
                ...additionalToolData,
            };
        });

        const res = await this._config.provider.chat({
            messages: [
                { content: sysMsg, role: "system" },
                { content: userMsg, role: "user" },
            ],
            tools,
        });

        const result: Partial<D> = {};

        res.choices[0].triggeredTools.forEach((toolCall) => {
            const index = parseInt(toolCall.tool.substring(0, toolCall.tool.indexOf(",")));
            const [key] = entries[index];
            result[key as keyof D] = toolCall.generated;
        });

        return result;
    }
}
