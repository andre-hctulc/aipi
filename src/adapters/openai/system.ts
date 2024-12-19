import type {
    ResponseFormatJSONObject,
    ResponseFormatJSONSchema,
    ResponseFormatText,
} from "openai/resources/shared";
import type { Format, Tool } from "../../chats/types.js";
import type { AssistantTool } from "openai/resources/beta/assistants";

export function parseFormat(
    format: Format
): ResponseFormatText | ResponseFormatJSONObject | ResponseFormatJSONSchema | undefined {
    if (format.type === "json" && !format.schema) return { type: "json_object" };

    return {
        type: "json_schema",
        json_schema: {
            schema: format.schema as any,
            strict: true,
            name: "response_object",
        },
    };
}

export function assistantTool(tool: Tool): AssistantTool {
    if (tool.type === "function")
        return {
            function: {
                parameters: tool.schema as any,
                description: tool.description,
                name: tool.name,
                strict: true,
            },
            type: "function",
        };

    return { type: tool.type, ...tool.configure };
}

export function reviveAssistantTool(assistantTool: AssistantTool): Tool {
    if (assistantTool.type === "function")
        return {
            type: "function",
            description: assistantTool.function.description,
            name: assistantTool.function.name,
            schema: assistantTool.function.parameters,
        };

    if (assistantTool.type === "code_interpreter") {
        return {
            type: "code_interpreter",
            name: "",
        };
    }

    return { name: "", type: "file_search", data: assistantTool.file_search };
}
