import { FileParser } from "./file-parser.js";

/**
 * Parses text files and JSON
 */
export class LiteralParser extends FileParser {
    protected override async extractText(file: File): Promise<string> {
        return file.text();
    }

    override covers(file: File): boolean {
        return FileParser.isText(file) || FileParser.isJson(file);
    }
}
