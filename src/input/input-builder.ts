export type InputObject = {
    input: string | string[];
    /**
     * @default ""
     */
    separator?: string;
};

export type Variables = Record<string, any>;

/**
 * Parse this with  {@link InputBuilder.parsePart}
 */
export type InputPart = string | undefined | null | false | InputObject | InputPart[];

export abstract class InputBuilder {
    private _text: string = "";
    private _vars: Variables = {};

    constructor(...input: string[]) {
        this.add(input);
    }

    static parsePart(input: InputPart): string {
        if (!input) return "";
        if (typeof input === "string") return input;
        if (Array.isArray(input)) return input.map((i) => this.parsePart(i)).join("");
        if (typeof input === "object")
            return this.parsePart(
                input.separator && Array.isArray(input.input)
                    ? input.input.join(input.separator ?? "")
                    : input?.input || ""
            );
        if (input) return this.parsePart(input);
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

    static sep(separator: string, ...input: string[]) {
        return input.join(separator);
    }

    static join(...input: string[]) {
        return input.join("");
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

    /**
     * Adds a line to the input
     */
    addLine(line: string) {
        this._text += "\n" + line;
        return this;
    }

    /**
     * Adds a paragraph to the input
     */
    addP(paragraph: string) {
        this._text += "\n\n" + paragraph;
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
}
