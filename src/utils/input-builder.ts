export type InputObject = {
    input: string | string[];
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

    private static parseInputPart(input: InputPart): string {
        if (!input) return "";
        if (typeof input === "string") return input;
        if (Array.isArray(input)) return input.map((i) => this.parseInputPart(i)).join("");
        if (typeof input === "object") return this.parseInputPart(input?.input || "");
        if (input) return this.parseInputPart(input);
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
        return input.map((inp) => this.parseInputPart(inp)).join(separator);
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
