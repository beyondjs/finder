import type { WatcherClient } from '@beyond-js/watchers/client';
import type { FilterSpec } from '@beyond-js/finder/types';
import { RequireType } from '@beyond-js/dynamic-processor/main';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';
import { equal } from '@beyond-js/equal/main';
import { FilesArray } from '@beyond-js/finder/files';
import { Finder } from '@beyond-js/finder/main';

export /*bundle*/ class ConfigurableFinder extends DynamicProcessor(FilesArray) {
	get dp() {
		return 'utils.configurable-finder';
	}

	#watcher?: WatcherClient;
	get watcher() {
		return this.#watcher;
	}

	#finder: Finder | undefined;
	get _finder() {
		return this.#finder;
	}

	get path() {
		return this.#finder?.path;
	}

	get spec() {
		return this.#finder?.spec;
	}

	get filename() {
		return this.#finder?.filename;
	}

	get extname() {
		return this.#finder?.extname;
	}

	get errors() {
		return this.#finder ? this.#finder.errors : [];
	}

	get warnings() {
		return this.#finder ? this.#finder.warnings : [];
	}

	get missing() {
		return this.#finder ? this.#finder.missing : [];
	}

	#previous?: { path: string; spec: FilterSpec };

	/**
	 * Configurable finder constructor
	 *
	 * @param watcher= {*} The files watcher service
	 */
	constructor(watcher: WatcherClient = void 0) {
		super(''); // Initialize with an empty path waiting for configuration
		this.#watcher = watcher;
	}

	configure(path?: string, spec?: FilterSpec) {
		if (this.destroyed) throw new Error('Configurable finder is destroyed');
		if (!path && spec) throw new Error('Invalid parameters');

		const config = { path, spec };
		if (equal(this.#previous, config)) return;
		this.#previous = config;

		// The configuration has been changed.
		// The .create() method is responsible for eliminating the previous finder if it exists.
		this.#finder?.destroy();
		this.#finder = void 0;
		if (!path) {
			this._invalidate();
			return;
		}

		super.reset(path);
		this.#finder = new Finder(path, spec, this.#watcher);
		this._invalidate();
	}

	_prepared(require: RequireType) {
		this.#finder && require(this.#finder, 'finder');
	}

	_process() {
		this.clear();
		this.#finder?.files.forEach(file => this.push(file));
	}

	destroy() {
		super.destroy();
		this.#finder?.destroy();
	}
}
