import type { RequestOptions, Uploadable } from "openai/core";
import { Resource } from "../../app/index.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { FilePurpose } from "openai/resources/files";

const supportedByFileSearch = new Set([
    "text/x-c",
    "text/x-c++",
    "text/x-csharp",
    "text/css",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/x-golang",
    "text/html",
    "text/x-java",
    "text/javascript",
    "application/json",
    "text/markdown",
    "application/pdf",
    "text/x-php",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/x-python",
    "text/x-ruby",
    "application/x-sh",
    "text/x-tex",
    "application/typescript",
    "text/plain",
]);

export abstract class OpenAIFiles extends Resource {
    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    /**
     * Checks whether the given MIME type is supported by OpenAI file search.
     *
     * Last updated: _7. Nov 2024_
     */
    static fileSearchSupports(mimeType: string) {
        return supportedByFileSearch.has(mimeType);
    }
    // -- Files

    async createFile(
        file: Uploadable,
        purpose: FilePurpose,
        requestOptions?: RequestOptions
    ): Promise<{ fileId: string }> {
        const res = await this.provider.client.files.create(
            {
                purpose,
                file,
            },
            requestOptions
        );

        return { fileId: res.id };
    }

    async deleteFile(fileId: string, requestOptions?: RequestOptions): Promise<void> {
        await this.provider.client.files.del(fileId, requestOptions);
    }
}
