import { AipiError } from "../errors/aipi-error.js";
import { type ParamType, type ParamDef } from "./endpoints.js";
import { ParamError, ParamParser } from "./param-parser.js";

const commonParamTypes = new Set<ParamType>([
    "any",
    "array",
    "vector",
    "boolean",
    "number",
    "object",
    "string",
    "string_array",
    "object_array",
    "file",
    "boolean_array",
    "number_array",
]);

export class CommonParamParser extends ParamParser {
    override covers(param: ParamDef): boolean {
        return commonParamTypes.has(param.type);
    }

    protected override parseValue(value: unknown, param: ParamDef) {
        switch (param.type) {
            case "any":
                return value;

            case "array":
                return Array.isArray(value) ? value : [value];

            case "vector":
                if (!Array.isArray(value)) {
                    throw new ParamError(param);
                }
                return value;

            case "boolean":
                return this.parseBool(value);

            case "boolean_array":
                return Array.isArray(value)
                    ? value.map((bool) => this.parseBool(bool))
                    : [this.parseBool(value)];

            case "number":
                return this.parseNum(value, param);

            case "number_array":
                return Array.isArray(value)
                    ? value.map((num) => this.parseNum(num, param))
                    : [this.parseNum(value, param)];

            case "object":
                return this.parseObject(value, param);

            case "string":
                return String(value);

            case "string_array":
                return Array.isArray(value) ? value.map(String) : [String(value)];

            case "object_array":
                return Array.isArray(value) ? value.map((v) => this.parseObject(v, param)) : [value];

            case "file":
                return value;

            case "boolean_array":
                return Array.isArray(value) ? value.map(Boolean) : [Boolean(value)];
        }

        throw new AipiError({ message: `Unknown param type: ${param.type}`, unexpected: true });
    }

    private parseBool(bool: unknown) {
        if (typeof bool === "string") return bool.toLowerCase() === "true" || bool === "1";
        return bool === true || bool === 1;
    }

    private parseNum(num: unknown, param: ParamDef) {
        const n = Number(num);
        if (isNaN(n)) {
            throw new ParamError(param);
        }
        return num;
    }

    private parseObject(obj: unknown, param: ParamDef) {
        if (typeof obj === "string") {
            try {
                return JSON.parse(obj);
            } catch (err) {
                throw new ParamError(param);
            }
        }

        if (!obj || typeof obj !== "object") {
            throw new ParamError(param);
        }

        return obj;
    }
}
