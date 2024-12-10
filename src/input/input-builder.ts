import type { FileStorage } from "../files/file-storage.js";

export type InputObject = {
    input: string | string[];
    /**
     * @default ""
     */
    separator?: string;
};

export type Variables = Record<string, any>;

/**
 * Parse this with  {@link InputBuilder.parse}
 */
export type InputPart = string | undefined | null | false | InputObject | InputPart[];

export abstract class InputBuilder {
    private _text: string = "";
    private _vars: Variables = {};

    constructor(...input: string[]) {
        this.add(input);
    }

    static parse(input: InputPart): string {
        if (!input) return "";
        if (typeof input === "string") return input;
        if (Array.isArray(input)) return input.map((i) => this.parse(i)).join("");
        if (typeof input === "object")
            return this.parse(
                input.separator && Array.isArray(input.input)
                    ? input.input.join(input.separator ?? "")
                    : input?.input || ""
            );
        if (input) return this.parse(input);
        return "";
    }

    /**
     * Variable values are converted to strings with `toString()`
     */
    static injectVars(template: string, vars: Variables): string {
        const stringifyVar = (v: any) => {
            if (v == null) return "";
            return v.toString();
        };
        return template.replace(/{{\s*(\w+)\s*}}/g, (match, varName) => {
            return stringifyVar(vars[varName]);
        });
    }

    static create(...input: string[]): InputBuilder {
        const builder = new (class extends InputBuilder {})(...input);
        return builder;
    }

    static hug(text: string, hugWith: string) {
        return `${hugWith}${text}${hugWith}`;
    }

    add(input: string | string[]) {
        if (Array.isArray(input)) {
            this._text += input.join("");
            return this;
        }
        this._text += input;
        return this;
    }

    addMany(...input: string[]) {
        this._text += input.join("");
        return this;
    }

    addLine(line: string) {
        this._text += "\n" + line;
        return this;
    }

    repeat(count: number) {
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
     * Set the variables that will be injected
     */
    variables(vars: Variables) {
        this._vars = vars;
        return this;
    }

    build() {
        if (Object.keys(this._vars).length > 0) return InputBuilder.injectVars(this._text, this._vars);
        return this._text;
    }

    /**
     * **Text**
     *
     * Joins the input parts with a space separator
     */
    t(...input: string[]): string {
        return this.join(" ", ...input);
    }

    /**
     * **Concat**
     *
     * Joins the input parts with no separator
     */
    c(...input: string[]): string {
        return this.join("", ...input);
    }

    join(separator: string, ...input: string[]) {
        return input.join(separator);
    }

    /**
     * **Paragraphs**
     *
     * Joins the input parts with a newline separator
     */
    p(...input: string[]) {
        return this.join("\n", ...input);
    }

    /**
     * Joins the input parts with two newline separators
     */
    pp(...input: string[]) {
        return this.join("\n\n", ...input);
    }
}