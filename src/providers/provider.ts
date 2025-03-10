import { Resource } from "../app/resource.js";
import { NotMountedError } from "../errors/common-errors.js";

/**
 * Generic provider resource
 */
export abstract class Provider<T = unknown> extends Resource {
    static icon = "🔌";

    private _provides: T | undefined;

    protected override async onMount() {
        this._provides = await this.provide();
    }

    get main(): T {
        if (this._provides === undefined) {
            throw new NotMountedError();
        }

        return this._provides;
    }

    protected abstract provide(): T | Promise<T>;
}
