import { JSONSchemaBuilder } from "./json-schema-builder.js";
import type { JSONSchema, JSONSchemaTypeName } from "../types/json-schema.js";

/**
 * Builds schemas suitable for function calls.
 * 
 * These schemas are more strict, with these features:
 * 
 * - All properties are required
 * - No ambiguous types
 * - No additional properties
 * - No $schema, $id, $ref, $defs, $comment, title, format
 *
 * Some of these features can be adjusted on non fitting schemas.
 */
export class StrictJSONSchemaBuilder extends JSONSchemaBuilder {
    /**
     * Mutates the schema so it can be used in the OpenAI API.
     * If the schema can not be transformed to a valid schema, it returns null.
     * @returns The transformed schema or null if it can not be transformed.
     */
    protected override validate(schema: JSONSchema): { errors: string[] } {
        const superVal = super.validate(schema);

        if (superVal.errors.length > 0) {
            return superVal;
        }

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
                "additionalProperties",
                "title",
                "format",
            ]);

            // Remove all properties that are not allowed
            Object.keys(subSchema).forEach((key) => {
                if (key.startsWith("$")) return;

                if (!allowProps.has(key as any)) {
                    errors.push(`Property not allowed: ${key}`);
                }
            });
        });

        return { errors };
    }

    protected override adjust(schema: JSONSchema): JSONSchema {
        return new JSONSchemaBuilder(schema, { copySchema: false })
            .transform((subSchema) => {
                delete subSchema.$schema;
                delete subSchema.$id;
                delete subSchema.$ref;
                delete subSchema.$defs;
                delete subSchema.$comment;
                delete subSchema.title;
                delete subSchema.format;

                if (subSchema.type === "object") {
                    subSchema.additionalProperties = false;
                    subSchema.required = Object.keys(subSchema.properties || {});
                }

                return subSchema;
            })
            .build();
    }
}
