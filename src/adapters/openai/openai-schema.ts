import { JSONSchemaBuilder } from "../../schemas/json-schema-builder.js";
import type { JSONSchema, JSONSchemaTypeName } from "../../types/json-schema.js";

/**
 * This helper class handles JSON schemas for the OpenAI API.
 */
export abstract class OpenAISchemaBuilder extends JSONSchemaBuilder {
    /**
     * Mutates the schema so it can be used in the OpenAI API.
     * If the schema can not be transformed to a valid schema, it returns null.
     * @returns The transformed schema or null if it can not be transformed.
     */
    protected override validate(schema: JSONSchema): { errors: string[] } {
        // Root schema must be object
        if (schema.type !== "object") {
            return {
                errors: ["Root schema must be object"],
            };
        }

        const errors: string[] = [];

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
            }

            const allowProps: Set<keyof JSONSchema> = new Set<keyof JSONSchema>([
                "properties",
                "type",
                "items",
                "enum",
                "required",
                "description",
            ]);

            // Remove all properties that are not allowed
            Object.keys(subSchema).forEach((key) => {
                if (!allowProps.has(key as any)) {
                    errors.push(`Property not allowed: ${key}`);
                }
            });
        });

        return { errors };
    }
}
