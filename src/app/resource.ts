import { AipiError } from "../errors/aipi-error.js";
import { AipiApp } from "./index.js";
import type { BootstrapOptions } from "./registry.js";

export abstract class Resource {
    private _mounted = false;

    private _app: AipiApp | undefined;

    readonly id: string;

    constructor() {
        this.id = Math.random().toString(36).substring(7);
    }

    get mounted() {
        return this._mounted;
    }

    /**
     * Available after mount or when provided via {@link Resource.feedApp}.
     * This is **never available** during the construction of the resource.
     */
    get app() {
        if (!this._app) {
            throw new AipiError({
                message:
                    "App instance not available. Registered resources can access the app after mount. Use `Resource.feedApp` to provide the app context manually.",
            });
        }

        return this._app;
    }

    feedApp(app: AipiApp) {
        this._app = app;
    }

    async mount(app: AipiApp, bootstrapOptions: BootstrapOptions) {
        if (this._mounted) {
            throw new AipiError({ message: "Resource already mounted" });
        }

        this._mounted = true;
        this._app = app;

        await this.onMount?.(bootstrapOptions);
    }

    protected onMount?(bootstrapOptions: BootstrapOptions): void | Promise<void>;
}
