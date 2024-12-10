import { JSONSchemaBuilder } from "../../schemas/json-schema-builder.js";
import type { JSONSchema } from "../../types/index.js";
import type { JSONSchemaTypeName } from "../../types/json-schema.js";

/**
 * This helper class handles JSON schemas for the OpenAI API.
 */
export abstract class OpenAISchemaBuilder extends JSONSchemaBuilder {
    protected override validate(schema: JSONSchema): {
        /** Errors if schema is not valid */
        errors: string[];
    } {
        const errors: string[] = [];

        // Root schema must be object
        if (schema.type !== "object") {
            return {
                errors: ["Root schema must be object"],
            };
        }

        JSONSchemaBuilder.forEachSubSchema(schema, (subSchema) => {
            // Multiple types are not allowed
            if (Array.isArray(subSchema.type)) {
                errors.push("Multiple types are not allowed");
                return;
            }

            const allowedTypes: Set<JSONSchemaTypeName> = new Set<JSONSchemaTypeName>([
                "array",
                "boolean",
                "integer",
                "number",
                "object",
                "string",
            ]);

            // Check if type is allowed
            if (!allowedTypes.has(subSchema.type as any)) {
                errors.push(`Type not allowed: ${subSchema.type}`);
                return;
            }

            const allowProps: Set<keyof JSONSchema> = new Set<keyof JSONSchema>([
                "properties",
                "additionalProperties",
                "type",
                "items",
                "enum",
                "required",
                "description",
            ]);

            // Remove all properties that are not allowed
            Object.keys(subSchema).forEach((key) => {
                if (!allowProps.has(key as any)) {
                    errors.push(`Property '${key}' not allowed`);
                }
            });
        });

        return { errors };
    }
}
