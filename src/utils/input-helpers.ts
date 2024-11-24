import { join, resolve } from "path";
import type { FileStorage } from "../files";
import fs from "fs";
import { AipiError } from "../aipi-error";

export type InputObject = {
    input: string | string[];
    /**
     * @default " "
     */
    separator?: string;
};

export type Variables = Record<string, any>;

export type InputPart = string | undefined | null | false | InputObject | InputPart[];

export abstract class InputBuilder {
    private _text: string = "";
    private _vars: Variables = {};

    constructor(...inputParts: InputPart[]) {
        this._text = InputBuilder.t(inputParts);
    }

    add(input: string) {
        this._text += input;
        return this;
    }

    addLine(line: string) {
        this._text += "\n" + line;
        return this;
    }

    duplicate(count: number) {
        this._text = this._text.repeat(count);
        return this;
    }

    /**
     * Adds a variable to the input
     */
    variable(name: string, value: any) {
        this._vars[name] = value;
        return this;
    }

    /**
     *
     * @param vars Overwrite the variables
     * @returns
     */
    variables(vars: Variables) {
        this._vars = vars;
        return this;
    }

    build() {
        if (Object.keys(this._vars).length > 0) return InputBuilder.replaceVars(this._text, this._vars);
        return this._text;
    }

    static from(...input: InputPart[]): InputBuilder {
        const builder = new (class extends InputBuilder {})(input);
        return builder;
    }

    /**
     * Variable values are converted to strings with `toString()`
     */
    static replaceVars(template: string, vars: Variables): string {
        const stringifyVar = (v: any) => {
            if (v == null) return "";
            return v.toString();
        };
        return template.replace(/{{\s*(\w+)\s*}}/g, (match, varName) => {
            return stringifyVar(vars[varName]);
        });
    }

    static parse(input: InputPart): string {
        if (!input) return "";
        if (typeof input === "string") return input;
        if (Array.isArray(input)) return input.map((i) => this.parse(i)).join("");
        if (typeof input === "object")
            return this.parse(
                input.separator && Array.isArray(input.input)
                    ? input.input.join(input.separator)
                    : input?.input || ""
            );
        if (input) return this.parse(input);
        return "";
    }

    /**
     * **Text**
     *
     * Joins the input parts with a space separator
     */
    static t(...input: InputPart[]): string {
        return this.join(" ", ...input);
    }

    /**
     * **Concat**
     *
     * Joins the input parts with no separator
     */
    static c(...input: InputPart[]): string {
        return this.join("", ...input);
    }

    static join(separator: string, ...input: InputPart[]) {
        return input.map((inp) => this.parse(inp)).join(separator);
    }

    /**
     * **Paragraphs**
     *
     * Joins the input parts with a newline separator
     */
    static p(...input: InputPart[]) {
        return this.join("\n", ...input);
    }

    /**
     * Joins the input parts with two newline separators
     */
    static pp(...input: InputPart[]) {
        return this.join("\n\n", ...input);
    }

    static hug(text: string, hugger: string) {
        return `${hugger}${text}${hugger}`;
    }
}

export interface InputReaderConfig {
    /**
     * Path to a directory
     */
    files?: string;
    fileStorage?: FileStorage;
}

// TODO implement cache (See docs/TODO)
export class InputReader {
    private _filesDir: string;
    private _fileStorage: FileStorage | null = null;

    constructor(config: InputReaderConfig) {
        if (config.fileStorage) this._fileStorage = config.fileStorage;
        this._filesDir = resolve(config.files || "");
    }

    /**
     * @param key The key of the file to read. A file path or key in the storage
     */
    async read(key: string): Promise<string> {
        if (this._fileStorage) {
            const file = await this._fileStorage.getFile(key);
            return InputReader.parseFile(file);
        } else {
            const fullPath = join(this._filesDir, key);
            return InputReader.readFile(fullPath);
        }
    }

    private static parseContent(content: string, isJSON: boolean) {
        if (isJSON) {
            let inputObj: InputObject;

            try {
                inputObj = JSON.parse(content);
                if (!inputObj.input) throw new Error();
            } catch (err) {
                throw new AipiError({
                    message: "Failed to parse JSON file. Expected { input: string | string[], ... }",
                });
            }
            return InputBuilder.parse(inputObj);
        }

        return content;
    }

    static async parseFile(file: File) {
        const isJSON = file.type === "application/json";
        const content = await file.text();
        return this.parseContent(content, isJSON);
    }

    static async readFile(path: string) {
        const absPath = resolve(path);
        const isJSON = path.endsWith(".json");
        const content = await fs.promises.readFile(absPath, "utf-8");
        return this.parseContent(content, isJSON);
    }
}
