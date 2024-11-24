import { AipiError, ProviderNotFoundError } from "../aipi-error";
import { Registry } from "../registry";
import type { Provider } from "../providers";
import type { JSONSchema, Message, Tool, ToolMatch } from "../types";
import { Assistant, CreateChatInput, CreateResponseInput } from "../assistants";

export interface GenerateOptions {
    /**
     * Messages used to configure the chat that generates the data. Should contain at least one user message.
     */
    messages?: Message[];
    schema?: JSONSchema;
    jsonMode?: boolean;
    tools?: Tool[];
    /**
     * Parse the response as JSON if a schema is provided.
     * @default true
     */
    parse?: boolean;
}

export interface DataGeneratorConfig {
    /**
     * Base generate options. Can be overwritten on a per generate basis.
     */
    generate?: GenerateOptions;
    /**
     * Used to identify tools and other data. Defaults to current time.
     */
    id?: string;
    provider?: Provider;
    /**
     * Use an assistant chat instead of normal chat for generating data
     */
    assistant?: {
        assistant: Assistant;
        /**
         * Additional parameters for creating the response
         */
        runParams?: Partial<CreateResponseInput>;
        /**
         * Additional parameters for creating the chat
         */
        createChatParams?: Partial<CreateChatInput>;
        /**
         * Messages for an additional run.
         * This can be used to generate a messages in the first run and make tools trigger in the second run.
         */
        additionalRun?: Message[];
    };
    baseTools?: Tool[];
}

export interface Generated {
    data: any;
    toolData: Record<string, any[]>;
}

/**
 * Uses _tools_ to generate data
 */
export class DataGenerator {
    private _config: DataGeneratorConfig;
    private _fields = new Map<string, { tool: Omit<Tool, "name" | "type"> }>();
    readonly id: string;

    constructor(config: DataGeneratorConfig) {
        this._config = config;
        this.id = config.id ?? Date.now().toString();
    }

    hasTools() {
        return this._fields.size > 0;
    }

    async generate(options?: Omit<GenerateOptions, "toolTrigger">): Promise<Generated> {
        const opts = { ...this._config.generate, ...options };
        const messages: Message[] = opts.messages || [
            { role: "system", textContent: "You are a data generator." },
            { role: "user", textContent: "Please generate some data." },
        ];
        const provider = this._config.provider || Registry.getProvider();
        if (!provider) throw new ProviderNotFoundError();

        const entries = Array.from(this._fields.entries());
        if (entries.length >= 100) throw new AipiError({ message: "Too many fields. Maximum is 99." });

        const tools: Tool[] = this._config.baseTools || [];

        entries.forEach(([key, field], index) => {
            const toolName = this.createToolName(index);
            tools.push({
                ...field.tool,
                name: toolName,
                type: "function",
            });
        });

        // -- create chat and response

        let responseMessages: Message[] = [];
        let toolMatches: ToolMatch[] = [];

        if (this._config.assistant) {
            const assistant = this._config.assistant.assistant;

            const { chatId } = await assistant.createChat({
                ...this._config.assistant.createChatParams,
            });

            let error: any;

            try {
                const { responseMessages: rm, toolMatches: tm } = await assistant.run(
                    {
                        tools,
                        chatId,
                        // initial messages
                        messages,
                        ...this._config.assistant.runParams,
                    },
                    { response: { schema: opts.schema } }
                );
                toolMatches = tm;
                responseMessages = rm || [];

                // additional run
                if (this._config.assistant.additionalRun) {
                    const { responseMessages: rm2, toolMatches: tm2 } = await assistant.run(
                        {
                            tools,
                            // additional run messages
                            messages: this._config.assistant.additionalRun,
                            chatId,
                            ...this._config.assistant.runParams,
                        },
                        { response: { schema: opts.schema } }
                    );
                    toolMatches.push(...tm2);
                    responseMessages.push(...rm2);
                }
            } catch (err) {
                error = err;
            } finally {
                // Always delete Chat! A thread lifetime is 60 days
                await assistant.deleteChat({ chatId });
            }

            if (error) throw error;
        } else {
            const { responseMessages: rm, toolMatches: tm } = await provider.chat(
                {
                    messages,
                },
                { response: { schema: opts.schema } }
            );
            responseMessages = rm || [];
            toolMatches = tm;
        }

        // -- parse response messages

        let data: any;

        if (opts.parse !== false) {
            try {
                if (opts.schema) data = JSON.parse(responseMessages[0].textContent);
                else data = responseMessages[0].textContent;
            } catch (err) {
                throw new AipiError({
                    message: "Failed to generate data. Did not receive valid JSON.",
                    cause: err,
                });
            }
        } else {
            data = responseMessages[0].textContent;
        }

        // -- parse tool data

        const toolData: any = {};

        // Collect tool data
        toolMatches.forEach((t) => {
            const toolName = this.parseToolName(t.tool);
            if (!toolName) return;

            const entry = entries[toolName.index];
            if (!entry) return;

            const [field] = entry;
            if (!toolData[field]) toolData[field] = [];
            toolData[field].push(t.generated);
        });

        return {
            data,
            toolData,
        };
    }

    /**
     * Add a field to the data generator. This field will be filled with data when `collect` is called.
     * @param key The key of the field
     * @param schema The schema of the field
     * @param tool Additional tool data. This overwrites the default tool data.
     */
    add(key: string, tool: Omit<Tool, "name" | "type">) {
        this._fields.set(key, { tool: tool });
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
     * Uses _tools_ to generate data
     */
    static async generateMap(
        config: DataGeneratorConfig,
        tools: Record<string, { tool: Omit<Tool, "name" | "type"> }>,
        options?: Omit<GenerateOptions, "toolTrigger">
    ): Promise<Generated> {
        const generator = new DataGenerator(config);

        for (const [key, field] of Object.entries(tools)) {
            generator.add(key, field.tool);
        }

        return generator.generate(options);
    }

    /**
     * Uses _chat response_ to generate data
     */
    static async generate(
        config: Omit<DataGeneratorConfig, "generate"> = {},
        generateOptions: GenerateOptions
    ): Promise<Generated> {
        // Id can be empty as no tools are used
        const generator = new DataGenerator(config);
        return generator.generate(generateOptions);
    }
}
