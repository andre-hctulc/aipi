import { Resource } from "../app/index.js";
import type { WithScope } from "../app/interfaces.js";
import { AipiError } from "../errors/aipi-error.js";
import type { ParamDef } from "./endpoints.js";

export class ParamError extends AipiError {
    constructor(param: ParamDef, status?: number) {
        const msg = `Invalid parameter: ${param.name}`;
        super({ message: msg, httpStatus: status ?? 400, httpMessage: true });
    }
}

export abstract class ParamParser extends Resource implements WithScope<ParamDef> {
    static icon = "﹫";

    abstract covers(param: ParamDef): boolean;

    /**
     * Parses a parameter
     * @returns The parameter value
     */
    parse(value: unknown, param: ParamDef) {
        // handle undefined
        if (value === undefined && !param.skipUndefinedParsing) {
            if (param.defaultValue !== undefined && param.defaultValueForUndefined !== false) {
                return param.defaultValue;
            }

            if (param.optional) return value;
            else throw new ParamError(param);
        }

        // handle null
        if (value === null && !param.skipNullParsing) {
            if (param.defaultValue !== undefined && param.defaultValueForNull !== false) {
                return param.defaultValue;
            }

            if (param.nullable) return value;
            else throw new ParamError(param);
        }

        return this.parseValue(value, param);
    }

    /**
     * By default _null_ and _undefined_ values are pre parsed, so this method will receive only non _null_ or _undefined_ values.
     * To handle _null_ and _undefined_ values, use the {@link ParamDef.skipNullParsing} or {@link ParamDef.skipUndefinedParsing} options.
     * @throws {ParamError} If the value is invalid
     */
    protected abstract parseValue(value: unknown, param: ParamDef): any;
}
