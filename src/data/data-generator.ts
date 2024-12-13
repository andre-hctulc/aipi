import { AipiError } from "../errors/aipi-error.js";
import type { AnyOptions, Chat } from "../index.js";
import type { Message, Format, Tool } from "../chats/types.js";

export interface GenerateOptions {
    /**
     * Messages used to configure the chat that generates the data. Should contain at least one user message.
     */
    messages?: Message[];
    responseFormat?: Format;
    runOptions?: AnyOptions;
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
    generateOptions?: Partial<GenerateOptions>;
    /**
     * Used to identify tools and other data. Defaults to current time.
     */
    id?: string;
    baseTools?: Tool[];
    chat: Chat;
}

export interface Generated {
    data: any;
    toolData: Record<string, any[]>;
}

/**
 * Uses {@link Chat}s to generate data.
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
        const genOpts = { ...this._config.generateOptions, ...options };
        const messages: Message[] = genOpts.messages || [
            { role: "system", textContent: "You are a data generator." },
            { role: "user", textContent: "Please generate some data." },
        ];

        const entries = Array.from(this._fields.entries());
        if (entries.length >= 100) throw new AipiError({ message: "Too many fields. Maximum is 99." });

        const tools: Tool[] = [...(this._config.baseTools || []), ...(genOpts.tools || [])];

        entries.forEach(([key, field], index) => {
            const toolName = this.createToolName(index);
            tools.push({
                ...field.tool,
                name: toolName,
                type: "function",
            });
        });

        // -- add messages to chat and run it

        const chat = this._config.chat;

        await chat.addMessages(messages);
        const { snapshot } = await chat.run({ resources: { tools } }, genOpts.runOptions);

        // -- parse response messages

        let data: any;

        if (genOpts.parse !== false && genOpts.responseFormat) {
            try {
                data = chat.latestMessage?.textContent ? JSON.parse(chat.latestMessage.textContent) : null;
            } catch (err) {
                throw new AipiError({
                    message: "Failed to generate data. Did not receive valid JSON.",
                    cause: err,
                });
            }
        } else {
            data = chat.latestMessage?.textContent;
        }

        // -- parse tool data

        const toolData: any = {};

        // Collect tool data
        snapshot.toolMatches.forEach((t) => {
            const toolName = this.parseToolName(t.tool);
            if (!toolName) return;

            const entry = entries[toolName.index];
            if (!entry) return;

            const [field] = entry;
            if (!toolData[field]) toolData[field] = [];
            toolData[field].push(t.params);
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
        config: Omit<DataGeneratorConfig, "generate">,
        generateOptions: GenerateOptions
    ): Promise<Generated> {
        // Id can be empty as no tools are used
        const generator = new DataGenerator(config);
        return generator.generate(generateOptions);
    }

    /**
     * Clear all fields
     */
    clearFields() {
        this._fields.clear();
    }
}
