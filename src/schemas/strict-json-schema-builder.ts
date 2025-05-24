import { JSONSchemaBuilder } from "./json-schema-builder.js";
import type { JSONSchema, JSONSchemaTypeName } from "../types/json-schema.js";

/**
 * Builds schemas suitable for function calls.
 *
 *Strict schemas have the following features:
 * - All object properties are required
 * - No ambiguous types
 * - No additional properties, must explicitly be set to false
 *
 * Some of these features can be adjusted on non fitting schemas.
 */
export class StrictJSONSchemaBuilder extends JSONSchemaBuilder {
    private static readonly supportedKeys: ReadonlySet<string> = new Set([
        "type",
        "description",
        "properties",
        "required",
        "enum",
        "items",
        // "format",
        // "default",
        "additionalProperties",
    ]);
    private static readonly supportedFormats: ReadonlySet<string> = new Set(["date-time", "email", "uri"]);
    private static readonly supportedTypes: Set<JSONSchemaTypeName> = new Set<JSONSchemaTypeName>([
        "array",
        "boolean",
        "integer",
        "number",
        "object",
        "string",
    ]);

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
                errors: ["Root schema must be 'object'"],
            };
        }

        const errors: string[] = [];

        JSONSchemaBuilder.forEachSubSchema(schema, (subSchema) => {
            // Multiple types are not allowed
            if (Array.isArray(subSchema.type)) {
                errors.push("Multiple types are not allowed");
                return;
            }

            // Check if type is allowed
            if (!StrictJSONSchemaBuilder.supportedTypes.has(subSchema.type as any)) {
                errors.push(`Type not allowed: ${subSchema.type}`);
            }

            // Check if format is allowed
            if (
                subSchema.format !== undefined &&
                StrictJSONSchemaBuilder.supportedTypes.has(subSchema.format as any)
            ) {
                errors.push(`Format not allowed: ${subSchema.type}`);
            }

            // Remove all properties that are not allowed
            Object.keys(subSchema).forEach((key) => {
                if (key.startsWith("$")) return;

                if (!StrictJSONSchemaBuilder.supportedKeys.has(key)) {
                    errors.push(`Property not allowed: ${key}`);
                }
            });
        });

        return { errors };
    }

    protected override adjust(schema: JSONSchema): JSONSchema {
        return new JSONSchemaBuilder(schema, { copySchema: false })
            .transform((subSchema) => {
                for (const key in subSchema) {
                    if (!StrictJSONSchemaBuilder.supportedKeys.has(key)) {
                        delete (subSchema as any)[key];
                    }
                }

                if (
                    subSchema.format !== undefined &&
                    !StrictJSONSchemaBuilder.supportedFormats.has(subSchema.format)
                ) {
                    delete subSchema.format;
                }

                if (subSchema.type === "object") {
                    subSchema.additionalProperties = false;
                    // Required must be set for all properties
                    subSchema.required = Object.keys(subSchema.properties || {});
                }

                return subSchema;
            })
            .build();
    }
}
