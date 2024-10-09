import type { JSONSchema } from "../types";

/**
 * JSON Schema Builder
 */
export class SchemaBuilder {
    static copySchema(schema: JSONSchema): JSONSchema {
        // TODO faster?
        return JSON.parse(JSON.stringify(schema));
    }

    /**
     * @returns A new JSON Schema object with injected references
     */
    static injectRefs(
        schema: JSONSchema,
        refs: Record<string, JSONSchema> | ((refValue: string) => JSONSchema)
    ): JSONSchema {
        schema = this.copySchema(schema);

        this.forEachSubSchema(schema, (subSchema, path) => {
            if (subSchema.$ref) {
                if (typeof refs === "function") {
                    subSchema = { ...subSchema, ...refs(subSchema.$ref) };
                } else {
                    subSchema = { ...subSchema, ...refs[subSchema.$ref] };
                }
                delete subSchema.$ref;
            }
        });

        return schema;
    }

    /**
     * Iterate _bottom-up_ over all sub-schemas in the provided schema.
     */
    static forEachSubSchema(
        schema: JSONSchema,
        callback: (subSchema: JSONSchema, path: string) => void,
        currentPath: string = ""
    ) {
        if (schema.type === "object") {
            // Handle object properties
            if (schema.properties) {
                for (const key in schema.properties) {
                    const subSchema = schema.properties[key];
                    if (typeof subSchema === "boolean") continue;
                    this.forEachSubSchema(subSchema, callback, `${currentPath}/properties/${key}`);
                }
            }
            // Handle pattern properties
            if (schema.patternProperties) {
                for (const pattern in schema.patternProperties) {
                    const subSchema = schema.patternProperties[pattern];
                    if (typeof subSchema === "boolean") continue;
                    this.forEachSubSchema(subSchema, callback, `${currentPath}/patternProperties/${pattern}`);
                }
            }
        }

        // Handle arrays
        if (schema.type === "array" && schema.items) {
            // Handle array items
            if (Array.isArray(schema.items)) {
                schema.items.forEach((subSchema, index) => {
                    if (typeof subSchema === "boolean") return;
                    this.forEachSubSchema(subSchema, callback, `${currentPath}/items/${index}`);
                });
            } else if (typeof schema.items !== "boolean") {
                this.forEachSubSchema(schema.items, callback, `${currentPath}/items`);
            }
        }

        // Handle "anyOf", "allOf", and "oneOf"
        (["anyOf", "allOf", "oneOf"] as const).forEach((key) => {
            if (schema[key]) {
                schema[key].forEach((subSchema, index) => {
                    if (typeof subSchema === "boolean") return;
                    this.forEachSubSchema(subSchema, callback, `${currentPath}/${key}/${index}`);
                });
            }
        });

        callback(schema, currentPath);
    }
}
