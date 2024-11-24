import type { JSONSchema, JSONSchemaTypeName } from "../types";
import { SchemaBuilder } from "../utils";

/**
 * This helper class handles JSON schemas for the OpenAI API.
 */
export abstract class OpenAISchemaBuilder {
    /**
     * Normalizes the schema so it can be used in the OpenAI API.
     * @returns The normalized schema or null if it can not be normalized.
     */
    static adjust(schema: JSONSchema): JSONSchema | null {
        return OpenAISchemaBuilder.checkSchema(schema).transformedSchema;
    }

    /**
     * Checks if the schema is allowed in the OpenAI API.
     * @returns Whether the schema is allowed and the errors if it is not.
     */
    static allowed(schema: JSONSchema): { ok: boolean; errors: string[] } {
        const { ok, errors } = OpenAISchemaBuilder.checkSchema(schema);
        return { ok, errors };
    }

    /**
     * Mutates the schema so it can be used in the OpenAI API.
     * If the schema can not be transformed to a valid schema, it returns null.
     * @returns The transformed schema or null if it can not be transformed.
     */
    private static checkSchema(schema: JSONSchema): {
        /** The transformed schema when ok */
        transformedSchema: JSONSchema | null;
        /** Did change schema? */
        changed: boolean;
        /** Could schema be transformed to valid schema? */
        ok: boolean;
        /** Errors if schema is not valid */
        errors: string[];
    } {
        let ok = true;
        let changed = false;
        const errors: string[] = [];

        // Root schema must be object
        if (schema.type !== "object") {
            return {
                changed: false,
                ok: false,
                transformedSchema: null,
                errors: ["Root schema must be object"],
            };
        }

        const mapped = SchemaBuilder.mutate(schema, (subSchema) => {
            if (!ok) return;

            // Multiple types are not allowed
            if (Array.isArray(subSchema.type)) {
                ok = false;
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
                ok = false;
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
                // TODO check if these are allowed (i think they are not)
                // "maxItems",
                // "minItems",
                // "maximum",
                // "minimum",
                // "minLength",
                // "maxLength",
                // "exclusiveMaximum",
                // "exclusiveMinimum",
            ]);

            // Remove all properties that are not allowed
            Object.keys(subSchema).forEach((key) => {
                if (!allowProps.has(key as any)) {
                    changed = true;
                    delete subSchema[key as keyof JSONSchema];
                }
            });

            if (subSchema.type === "object") {
                // Additional properties must be false for object types
                subSchema.additionalProperties = false;
                // Required must be an array of all properties
                subSchema.required = Object.keys(subSchema.properties || {});
            } else {
                delete subSchema.properties;
            }

            return {
                ...subSchema,
            };
        });

        return { changed, ok, transformedSchema: ok ? mapped : null, errors };
    }
}
