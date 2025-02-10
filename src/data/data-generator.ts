import { AipiError } from "../errors/aipi-error.js";
import type { Message, Format, Tool, ToolMatch } from "../chats/types.js";
import { Chat } from "../chats/chat.js";
import { Completer, type CompleteOptions } from "../chats/completer.js";
import type { BaseOptions } from "../types/types.js";
import type { RunChatInput } from "../chats/chats.js";
import { deepMerge } from "../utils/system.js";

export interface GenerateOptions {
    /**
     * Messages used to configure the chat that generates the data. Should contain at least one user message.
     */
    messages?: Message[];
    responseFormat?: Format;
    /**
     * Base run options
     */
    runOptions?: BaseOptions;
    /**
     * Base run input
     */
    runInput?: Partial<RunChatInput>;
    completeOptions?: CompleteOptions;
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
    engine: Chat | Completer;
}

export interface Generated {
    data: any;
    toolData: Record<string, any[]>;
}

/**
 * Uses {@link Chat}s to generate data.
 */
export class DataGenerator {
    static icon = "🧰";

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

        const engine = this._config.engine;
        let toolMatches: ToolMatch[];
        let data: any;

        // ## Chat

        if (engine instanceof Chat) {
            // -- add messages to chat and run it

            engine.addMessages(messages);
            const { snapshot } = await engine.run(
                // deepMerge does not merge arrays!
                deepMerge(genOpts.runInput, { resources: { tools: [...tools, ...(genOpts.tools || [])] } }),
                genOpts.runOptions
            );

            toolMatches = snapshot.toolMatches;

            // -- parse response messages

            data = engine.latestMessage?.textContent;
        }
        // ## Completer
        else {
            const { choices, toolMatches: tm } = await engine.complete(
                messages[0]?.textContent || "",
                genOpts?.completeOptions
            );
            toolMatches = tm;
            data = choices[0];
        }

        // -- parse tool data

        if (genOpts.parse !== false && genOpts.responseFormat) {
            try {
                data = data ? JSON.parse(data) : null;
            } catch (err) {
                throw new AipiError({
                    message: "Failed to generate data. Did not receive valid JSON.",
                    cause: err,
                });
            }
        }
        const toolData: any = {};

        // Collect tool data
        toolMatches.forEach((t) => {
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
