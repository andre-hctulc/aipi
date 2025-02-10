import { AipiError } from "../errors/aipi-error.js";
import type { InputObject } from "./input-builder.js";
import { InputParser, type ParsedInputFile } from "./input-parser.js";

export class DefaultInputParser extends InputParser {
    covers(key: string): boolean {
        return key.endsWith(".txt") || key.endsWith(".json");
    }

    parse(key: string, fileContent: string): ParsedInputFile {
        if (key.endsWith("json")) {
            let inputObj: InputObject;

            try {
                inputObj = JSON.parse(fileContent);
            } catch (err) {
                throw new AipiError({
                    message: "Invalid JSON",
                    cause: err,
                });
            }

            if (!inputObj.input) throw new AipiError({ message: "" });

            return {
                parts: Array.isArray(inputObj.input) ? inputObj.input : [inputObj.input],
                separator: inputObj.separator || "",
            };
        }

        return { parts: [fileContent], separator: "" };
    }
}
