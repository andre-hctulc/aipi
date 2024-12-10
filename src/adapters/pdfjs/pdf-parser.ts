import type { TextItem } from "pdfjs-dist/types/src/display/api.js";
import { FileParser } from "../../file-parsers/file-parser.js";
import { getDocument } from "pdfjs-dist";

/**
 * A `FileParser` implementation that parses _application/pdf_ using the `pdfjs-dist` package.
 */
export class PDFParser extends FileParser {
    protected override async extractText(file: Blob): Promise<string> {
        const pdfDocument = await getDocument({ data: await file.arrayBuffer() }).promise;

        console.log(`PDF loaded. Number of pages: ${pdfDocument.numPages}`);

        let fullText = "";

        // Loop through all pages
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);

            // Get text content of the page
            const textContent = await page.getTextContent();

            // Extract the text from the items
            const pageText = textContent.items
                .map((item) => (item as TextItem).str)
                .filter((item) => item !== undefined)
                .join(" ");

            fullText += pageText + "\n";
        }

        return fullText;
    }

    override covers(file: File): boolean {
        return file.type === "application/pdf";
    }
}
