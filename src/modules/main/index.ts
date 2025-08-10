import type { WatcherClient } from '@beyond-js/watchers/client';
import type { FilterSpec, IDiagnostic } from '@beyond-js/finder/types';
import type { ListenerType } from '@beyond-js/watchers/client';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';
import Listener from './listener';
import Inclusion from './inclusion';
import InclusionFiles from './inclusion/files';
import Iterator from './iterator';
import Parameters from './parameters';

export /*bundle*/ class Finder extends DynamicProcessor() {
	get dp() {
		return 'utils.finder';
	}

	#watcher: WatcherClient;
	get watcher() {
		return this.#watcher;
	}

	#path: string;
	get path() {
		return this.#path;
	}

	#spec: FilterSpec;
	get spec() {
		return this.#spec;
	}

	get filename(): FilterSpec['filename'] {
		return this.#spec.filename;
	}

	get extname(): FilterSpec['extname'] {
		return this.#spec.extname;
	}

	get includes(): FilterSpec['includes'] {
		return this.#spec.includes;
	}

	get excludes(): FilterSpec['excludes'] {
		return this.#spec.excludes;
	}

	#inclusions: Map<string, Inclusion>;

	#listener: Listener | undefined;
	get listener(): ListenerType {
		return this.#listener?.listener;
	}

	get [Symbol.iterator]() {
		return Iterator(this.#spec.includes, this.#inclusions);
	}

	get errors() {
		const output: IDiagnostic[] = [];
		this.#inclusions.forEach(inclusion => output.push(...inclusion.errors));
		return output;
	}

	#warnings: IDiagnostic[] = [];
	get warnings() {
		return this.#warnings;
	}

	get files() {
		const files = new InclusionFiles(this.#path, this.#spec);
		this.#spec.includes.forEach(include => files.append(this.#inclusions.get(include)));
		return Object.freeze(files);
	}

	get missing() {
		const output: string[] = [];
		this.#inclusions.forEach(inclusion => !inclusion.length && output.push(inclusion.entry));
		return output;
	}

	get length() {
		let length = 0;
		this.#inclusions.forEach(inclusion => (length += inclusion.length));
		return length;
	}

	/**
	 * Static finder constructor
	 * @param path {string} The path where to find the files
	 * @param spec {object | string | function | array}
	 *      . includes {array} Array of files or folders to be included in the search
	 *      . excludes {array} The files or folders to be excluded of the search
	 *      . filename {string} The name of the files to be found
	 *      . extname {string | Array} The extension of the files to be found
	 *      . filter {function} Function to filter files
	 * @param watcher {object} Files watcher to listen for file changes
	 */
	constructor(path: string, spec: FilterSpec, watcher: WatcherClient) {
		super();

		spec = Parameters(path, spec);

		this.#watcher = watcher;
		this.#path = path;
		this.#spec = spec;

		this.#inclusions = new Map();

		for (const entry of spec.includes) {
			if (typeof entry !== 'string') {
				const code = 'INCLUSION_NOT_A_STRING';
				const message = `Inclusion "${entry}" is not a string`;
				this.#warnings.push({ code, message });
				continue;
			}
			const inclusion = new Inclusion(path, entry, spec);
			this.#inclusions.set(entry, inclusion);
		}
	}

	#timer: NodeJS.Timeout | undefined;

	emit(event: string, ...params: any[]) {
		if (event === 'change') {
			clearTimeout(this.#timer);
			this.#timer = setTimeout(() => this._events.emit(event, ...params), 10);
			return;
		}
		return this._events.emit(event, ...params);
	}

	async _begin() {
		this.#listener = new Listener(this, this.#inclusions);

		const promises: Promise<void | boolean>[] = [];
		this.#inclusions.forEach(inclusion => promises.push(inclusion.process()));
		await Promise.all(promises).catch(exc => console.error(exc.stack));
	}

	destroy() {
		super.destroy();
		this.#listener?.destroy();
		this.#inclusions.forEach(inclusion => inclusion.destroy());
	}
}
