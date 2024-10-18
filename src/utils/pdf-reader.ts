// import { FileParser } from "@packages/aipi";
// import pdf from "pdf-parse";
// /*
// Currently this cannot be in aipi itself because pdf-parse requires to be in experimental.serverComponentsExternalPackages,
// but this does not work with mono repos.
// */

// export class PDFParser extends FileParser {
//     protected override async extractText(file: Blob): Promise<string> {
//         const data = await pdf(FileParser.buffer(await file.arrayBuffer()));
//         return data.text;
//     }

//     override parses(file: File): boolean {
//         return file.type === "application/pdf";
//     }
// }

export {};
