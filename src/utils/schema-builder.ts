import type { JSONSchema, JSONSchemaDefinition } from "../types";

/**
 * JSON Schema Builder
 */
export class SchemaBuilder {
    private _schema: JSONSchema = {};

    constructor() {}

    build(): JSONSchema {
        return SchemaBuilder.copy(this._schema);
    }

    /**
     * Sets the schema
     */
    schema(schema: JSONSchema): SchemaBuilder {
        this._schema = SchemaBuilder.copy(schema);
        return this;
    }

    /**
     * Sets a sub schema at the provided path
     */
    sub(path: string, schema: JSONSchema): SchemaBuilder {
        const parts = path.split(".");
        let currentSchema: JSONSchema = this._schema;

        while (parts.length > 1) {
            const part = parts.shift()!;
            if (!currentSchema.properties) currentSchema.properties = {};
            if (!currentSchema.properties[part]) currentSchema.properties[part] = {};
            if (typeof currentSchema.properties[part] === "boolean") currentSchema.properties[part] = {};
            currentSchema = currentSchema.properties[part];
        }

        const lastPart = parts.shift()!;
        if (!currentSchema.properties) currentSchema.properties = {};
        currentSchema.properties[lastPart] = schema;

        return this;
    }

    /**
     * Picks the provided paths from the schema and removes the rest.
     *
     * **Example paths:** _prop_, _user.id_, _user.name_, _user.address.street_
     *
     * @param objPaths The paths to pick
     */
    pick(objPaths: string[]): SchemaBuilder {
        const builder = SchemaBuilder.from(this._schema);
        this._schema = {};
        objPaths.forEach((path) => {
            this.sub(path, SchemaBuilder.resolveObjPath(this._schema, path)!);
        });
        this._schema = builder.build();
        return this;
    }

    private clearSchema(schema: JSONSchema) {
        Object.keys(schema).forEach((key) => {
            delete schema[key as keyof JSONSchema];
        });
    }

    injectRefs(
        refs:
            | Record<string, JSONSchema>
            | ((refValue: string, subSchema: JSONSchema, subSchemaPath: string) => JSONSchema | undefined)
    ): SchemaBuilder {
        return this.mutate((subSchema, subSchemaPath) => {
            if (subSchema.$ref) {
                // Copy the ref schema to the current schema
                if (typeof refs === "function") {
                    return Object.assign(subSchema, refs(subSchema.$ref, subSchema, subSchemaPath));
                } else if (subSchema.$ref in refs) {
                    return Object.assign(subSchema, refs[subSchema.$ref]);
                }
            }
            return undefined;
        });
    }

    mutate(
        mutator: (subSchema: JSONSchema, subSchemaPath: string) => JSONSchema | undefined | void
    ): SchemaBuilder {
        SchemaBuilder.forEachSubSchema(this._schema, (subSchema, path) => {
            const newSchema = mutator(subSchema, path);
            // Clear the schema if the mutator returns a new schema
            if (newSchema) {
                this.clearSchema(subSchema);
                // Copy the ref schema to the current schema
                Object.assign(subSchema, newSchema);
            }
        });

        return this;
    }

    static from(schema: JSONSchema): SchemaBuilder {
        return new SchemaBuilder().schema(schema);
    }

    static copy(schema: JSONSchema): JSONSchema {
        // TODO faster?
        return JSON.parse(JSON.stringify(schema));
    }

    /**
     * @returns A new JSON Schema object with injected references
     */
    static injectRefs(
        schema: JSONSchema,
        refs:
            | Record<string, JSONSchema>
            | ((refValue: string, subSchema: JSONSchema, path: string) => JSONSchema)
    ): JSONSchema {
        return SchemaBuilder.from(schema).injectRefs(refs).build();
    }

    static mutate(
        schema: JSONSchema,
        mutator: (subSchema: JSONSchema, subSchemaPath: string) => JSONSchema | undefined | void
    ): JSONSchema {
        return SchemaBuilder.from(schema).mutate(mutator).build();
    }

    /**
     * Iterate _bottom-up_ over all sub-schemas in the provided schema.
     *
     * **Examples schema paths:**
     * _prop_, _user/properties/name_, _user/properties/address/properties/street, _app/items_, _app/items/0_
     */
    static forEachSubSchema(
        schema: JSONSchema,
        callback: (subSchema: JSONSchema, schemaPath: string) => void,
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

    /**
     * @returns Whether the provided schema is an object-like schema (object, array or any)
     */
    static isObjectLikeSchema(schema: JSONSchemaDefinition): boolean {
        if (schema === false) return false;
        return schema === true || schema.type === "object" || schema.type === "array" || !schema.type;
    }

    /**
     * **Example paths:** _prop_, _user.id_, _user.name_, _user.address.street_
     * @returns The sub-schema at the provided path
     */
    static resolveObjPath(schema: JSONSchema, path: string): JSONSchema | null {
        const parts = path.split(".");

        let subSchema: JSONSchema = schema;

        while (parts.length && subSchema.properties) {
            const part = parts.shift()!;
            if (typeof subSchema.properties[part] === "boolean") return null;
        }

        if (parts.length) return null;

        return subSchema;
    }
}
