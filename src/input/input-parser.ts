import { Resource, type WithScopes } from "../app/index.js";
import type { InputPart } from "./input-builder.js";

export interface ParsedInputFile {
    parts: InputPart[];
    separator: string;
}

export abstract class InputParser extends Resource implements WithScopes<string> {
    abstract covers(key: string): boolean;

    abstract parse(key: string, fileContent: string): ParsedInputFile;
}
