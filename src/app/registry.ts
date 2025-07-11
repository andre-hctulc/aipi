import { ResourceNotFoundError } from "../errors/common-errors.js";
import { getConstructors } from "../utils/reflection.js";
import type { Truthy } from "../utils/utility-types.js";
import { AipiApp } from "./app.js";
import { Resource } from "./resource.js";

export type AipiPreset = (registry: AipiRegistry) => void;

export interface BootstrapOptions {
    printRegistry?: boolean;
}

const DEFAULT_PRIORITY = 100;

/**
 * Example:
 * ```typescript
 * const app = await AipiRegistry.disclose()
 *  .use(new OpenAIProvider())
 *  .use(new PdfParser())
 *  .bootstrap();
 * ```
 */
export abstract class AipiRegistry {
    static disclose(): AipiRegistry {
        return new (class extends AipiRegistry {})();
    }

    print(): string {
        let text = "## *aipi* Registry 📖 ##\n";

        this.registry.forEach((value, key) => {
            const Key = this.getKey(key);

            text += `\n${(Key as any).icon || "🪣"} ${key.name}(s):\n`;
            value.forEach((entry) => {
                text += `   ${entry.resource.constructor.name} <${entry.priority}>\n`;
            });
        });

        text += "\n## *aipi* end ##";

        return text;
    }
    private registry: Map<Function, { resource: Resource; priority: number }[]> = new Map();
    readonly presets: AipiPreset[] = [];

    preset(preset: AipiPreset): this {
        this.presets.push(preset);
        return this;
    }

    async bootstrap(options: BootstrapOptions = {}): Promise<AipiApp> {
        const entries = Array.from(this.registry.values()).flat();

        const app = new AipiApp(this, options);

        await Promise.all(
            entries.map(async (entry) => {
                await entry.resource.mount(app, options);
            })
        );

        if (this.presets) {
            for (const preset of this.presets) {
                await preset(this);
            }
        }

        if (options.printRegistry) {
            console.log(this.print());
        }

        return app;
    }

    private getKey(resource: Function): Function {
        return getConstructors(resource, Resource)[0];
    }

    find<T extends Resource = Resource>(Resource: abstract new (...args: any) => T): T | null {
        return this.findAll(Resource)[0] || null;
    }

    require<T extends Resource = Resource>(Resource: abstract new (...args: any) => T): T {
        const resource = this.find(Resource);
        if (!resource) throw new ResourceNotFoundError(Resource);
        return resource;
    }

    findAll<T extends Resource = Resource>(Resource: abstract new (...args: any) => T): T[] {
        const key = this.getKey(Resource);

        const candidates = Array.from(this.registry.get(key) || []);

        return candidates
            .filter(({ resource }) => resource instanceof Resource)
            .sort((entry1, entry2) => entry2.priority - entry1.priority)
            .map(({ resource }) => resource) as T[];
    }

    clear() {
        this.registry.clear();
    }

    /**
     * Register a resource.
     * @param resource The resource to register.
     * @param priority The priority of the resource. Resources with higher priority are retrieved first. Defaults to 100. Default resources have a priority of 50.
     */
    use(resource: Resource, priority: number = DEFAULT_PRIORITY): this {
        const key = this.getKey(resource.constructor);

        if (!this.registry.has(key)) this.registry.set(key, []);
        this.registry.get(key)!.push({ resource, priority });

        return this;
    }

    useIf<T>(
        condition: T,
        resource: (truthyCondition: Truthy<T>) => Resource | Resource[],
        priority: number = DEFAULT_PRIORITY
    ): this {
        if (condition) {
            let resources = resource(condition as Truthy<T>);
            if (!Array.isArray(resources)) resources = [resources];
            for (const resource of resources) {
                this.use(resource, priority);
            }
        }

        return this;
    }
}
