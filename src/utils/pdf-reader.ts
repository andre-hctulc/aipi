import { FileParser } from "./file-parser";
import pdf from "pdf-parse";

export class PDFParser extends FileParser {
    protected override async extractText(file: Blob): Promise<string> {
        const data = await pdf(FileParser.buffer(await file.arrayBuffer()));
        return data.text;
    }

    override parses(mimeType: string): boolean {
        return mimeType === "application/pdf";
    }
}
