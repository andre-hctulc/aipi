import { AipiError, ProviderNotFoundError } from "../aipi-error";
import type { Provider } from "../providers";
import { Registry } from "../registry";
import type { JSONSchema, Tool } from "../types";

type SchemaMap<D extends Record<string, any>> = {
    [K in keyof D]: {
        /** Additional tool data */
        tool?: Partial<Tool>;
    };
};

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
    provider?: Provider;
}

/**
 * Uses _tools_ to generate data
 */
export class DataGenerator<D extends Record<string, any> = Record<string, unknown>> {
    private _config: DataGeneratorConfig;
    private _fields = new Map<keyof D, { additionalToolData?: Partial<Tool> }>();

    constructor(config: DataGeneratorConfig) {
        this._config = config;
    }

    /**
     * Uses _chat response_ to generate data
     */
    async generate<T>(schema: JSONSchema, options?: Omit<GenerateOptions, "toolTrigger">): Promise<T> {
        const opts = { ...this._config, ...options };
        const sysMsg = opts.systemMessage || "You are a data generator.";
        const userMsg = opts.userMessage || "Please generate some data.";
        const provider = opts.provider || Registry.getProvider();

        if (!provider) throw new ProviderNotFoundError();

        const res = await provider.chat(
            {
                messages: [
                    { content: sysMsg, role: "system" },
                    { content: userMsg, role: "user" },
                ],
            },
            { response: schema }
        );

        try {
            return JSON.parse(res.choices[0].content);
        } catch (err) {
            throw new AipiError({
                message: "Failed to generate data. Did not receive valid JSON.",
                cause: err,
            });
        }
    }

    /**
     * Add a field to the data generator. This field will be filled with data when `collect` is called.
     * @param key The key of the field
     * @param schema The schema of the field
     * @param tool Additional tool data. This overwrites the default tool data.
     */
    add(key: keyof D & string, tool?: Partial<Tool>) {
        this._fields.set(key, { additionalToolData: tool });
    }

    /**
     * @param target If provided, the data will be added to this object instead of creating a new one
     * @returns The generated data
     */
    async collect(options: GenerateOptions & { target?: Partial<D> } = {}): Promise<Partial<D>> {
        // return options.target when given for consistency (it is returned when given)
        if (!this._fields.size) return options.target || {};

        const opts = { ...this._config, ...options };

        const sysMsg = opts.systemMessage || "You are a data generator.";
        const userMsg = opts.userMessage || "Please generate some data.";
        const trigger = opts.tooTrigger || "Generate data";

        const entries = Array.from(this._fields.entries());

        const tools: Tool[] = entries.map(([key, { additionalToolData }], index) => {
            return {
                type: "function",
                name: `<data_generator>[${index}]${key.toString()}`,
                trigger,
                ...additionalToolData,
                schema: additionalToolData?.schema || {
                    type: "object",
                    description: `The object that holds the generated data`,
                    additionalProperties: false,
                    properties: {
                        data: { type: "string", description: "The generated data" },
                    },
                    required: ["content"],
                },
            };
        });

        const provider = this._config.provider || Registry.getProvider();

        if (!provider) throw new ProviderNotFoundError();

        const res = await provider.chat({
            messages: [
                { content: sysMsg, role: "system" },
                { content: userMsg, role: "user" },
            ],
            tools,
        });

        const result: Partial<D> = options.target || {};

        res.choices[0].triggeredTools.forEach((toolCall) => {
            const index = parseInt(toolCall.tool.substring(0, toolCall.tool.indexOf(",")));
            const [key] = entries[index];
            result[key as keyof D] = toolCall.generated;
        });

        return result;
    }

    /**
     * Uses _tools_ to generate data
     */
    static async generateMap<D extends Record<string, any>>(
        config: DataGeneratorConfig,
        schemas: SchemaMap<D>,
        options?: Omit<GenerateOptions, "toolTrigger">
    ): Promise<Partial<D>> {
        const generator = new DataGenerator<D>(config);

        for (const [key, field] of Object.entries(schemas)) {
            generator.add(key as keyof D & string, field.tool);
        }

        return generator.collect(options);
    }

    /**
     * Uses _chat response_ to generate data
     */
    static async generate<T = unknown>(
        schema: JSONSchema,
        config: Omit<DataGeneratorConfig, "id" | "toolName" | "toolTrigger"> = {}
    ): Promise<T> {
        // Id can be empty as no tools are used
        const generator = new DataGenerator(config);
        return generator.generate<T>(schema, config);
    }
}
