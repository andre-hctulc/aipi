import { AipiError, ProviderNotFoundError } from "../aipi-error";
import { Registry } from "../registry";
import type { Provider } from "../providers";
import type { JSONSchema, Message, Tool, ToolMatch } from "../types";
import { Assistant } from "../assistants";

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
    systemMessages?: string[];
    /**
     * User message that triggers generating data
     */
    userMessages?: string[];
    tooTrigger?: string;
}

export interface DataGeneratorConfig extends GenerateOptions {
    /**
     * Used to identify tools and other data. Defaults to current time.
     */
    id?: string;
    provider?: Provider;
    /**
     * Use an assistant chat instead of normal chat for generating data
     */
    assistant?: Assistant;
}

/**
 * Uses _tools_ to generate data
 */
export class DataGenerator<D extends Record<string, any> = Record<string, unknown>> {
    private _config: DataGeneratorConfig;
    private _fields = new Map<keyof D, { additionalToolData?: Partial<Tool> }>();
    readonly id: string;

    constructor(config: DataGeneratorConfig) {
        this._config = config;
        this.id = config.id ?? Date.now().toString();
    }

    /**
     * Uses _chat response_ to generate data
     */
    async generate<T>(schema: JSONSchema, options?: Omit<GenerateOptions, "toolTrigger">): Promise<T> {
        const opts = { ...this._config, ...options };
        const sysMsg = opts.systemMessages || ["You are a data generator."];
        const userMsg = opts.userMessages || ["Please generate some data."];
        const provider = opts.provider || Registry.getProvider();

        if (!provider) throw new ProviderNotFoundError();

        const inputMessages = [
            ...sysMsg.map((msg) => ({ content: msg, role: "system" as const })),
            ...userMsg.map((msg) => ({ content: msg, role: "user" as const })),
        ];
        let responseMessages: Message[];

        if (opts.assistant) {
            const { chatId } = await opts.assistant.createChat({ messages: inputMessages });
            const { responseMessages: rm } = await opts.assistant.createResponse({ chatId, tools: [] });
            responseMessages = rm || [];
        } else {
            const { responseMessages: rm } = await provider.chat(
                {
                    messages: inputMessages,
                },
                { response: schema }
            );
            responseMessages = rm || [];
        }

        try {
            return JSON.parse(responseMessages[0].content);
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

    private createToolName(index: number) {
        return `${index >= 10 ? index : "0" + index}_gen-tool_${this.id}`;
    }

    private parseToolName(tool: string) {
        const matches = tool.match(/(\d{2})_gen-tool_(.+)/);
        if (!matches) return null;
        return { index: parseInt(matches[1]), id: matches[2] };
    }

    /**
     * @param target If provided, the data will be added to this object instead of creating a new one
     * @returns The generated data
     */
    async collect(options: GenerateOptions & { target?: Partial<D> } = {}): Promise<Partial<D>> {
        // return options.target when given for consistency (it is returned when given)
        if (!this._fields.size) return options.target || {};

        const opts = { ...this._config, ...options };

        const sysMsg = opts.systemMessages || ["You are a data generator."];
        const userMsg = opts.userMessages || ["Please generate some data."];
        const trigger = opts.tooTrigger || "Generate data";

        const entries = Array.from(this._fields.entries());
        if (entries.length > 99) throw new AipiError({ message: "Too many fields. Maximum is 99." });

        const tools: Tool[] = entries.map(([key, { additionalToolData }], index) => {
            return {
                type: "function",
                name: this.createToolName(index),
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

        const inputMessages = [
            ...sysMsg.map((msg) => ({ content: msg, role: "system" as const })),
            ...userMsg.map((msg) => ({ content: msg, role: "user" as const })),
        ];

        const result: Partial<D> = options.target || {};
        let toolMatches: ToolMatch[];

        if (opts.assistant) {
            const { chatId } = await opts.assistant.createChat({ messages: inputMessages });
            const { toolMatches: tm } = await opts.assistant.createResponse({ chatId, tools });
            toolMatches = tm || [];
        } else {
            const { toolMatches: tm } = await provider.chat({ messages: inputMessages, tools });
            toolMatches = tm || [];
        }

        toolMatches.forEach((toolCall) => {
            if (toolCall.tool.length < 2) return;

            const parsedToolName = this.parseToolName(toolCall.tool);

            if (!parsedToolName) return;
            if (parsedToolName.id !== this.id) return;

            const [field] = entries[parsedToolName.index] || [""];
            if (field === "") return;

            result[field] = toolCall.generated;
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
