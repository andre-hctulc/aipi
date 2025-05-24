import type { AipiPreset } from "../app/registry.js";
import { LiteralParser } from "../file-parsers/literal-parser.js";
import { DefaultInputParser } from "../input/default-input-parser.js";
import { FileSystemStorage } from "../persister/fs-file-storage.js";
import { MemoryPersister } from "../persister/memory-persister.js";
import { CommonParamParser } from "../server/common-param-parser.js";

/**
 * Default resources should be lower priority than user-defined resources.
 *
 * Default is **100**.
 */
const DEFAULT_RESOURCE_PRIORITY = 50;

/**
 * Default preset.
 *
 * Includes:
 * - {@link MemoryPersister}
 * - {@link FileSystemStorage}
 * - {@link LiteralParser}
 * - {@link CommonParamParser}
 * - {@link DefaultInputParser}
 */
export const DefaultPreset: AipiPreset = (registry) => {
    registry
        // memory persister
        .use(new MemoryPersister(), DEFAULT_RESOURCE_PRIORITY)
        // file literal parser
        .use(new LiteralParser(), DEFAULT_RESOURCE_PRIORITY)
        // param parser
        .use(new CommonParamParser(), DEFAULT_RESOURCE_PRIORITY)
        // file system storage (program root)
        .use(new FileSystemStorage(), DEFAULT_RESOURCE_PRIORITY)
        // input parser
        .use(new DefaultInputParser(), DEFAULT_RESOURCE_PRIORITY);
};
