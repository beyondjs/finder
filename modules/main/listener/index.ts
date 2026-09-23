import type { Finder } from '../';
import type { ListenerType } from '@beyond-js/watchers/client';
import type Inclusion from '../inclusion';
import { FileData } from '@beyond-js/file/data';

export default class Listener {
	#finder: Finder;
	#inclusions: Map<string, Inclusion>;

	#listener: ListenerType;
	get listener(): ListenerType {
		return this.#listener;
	}

	#destroyed = false;
	get destroyed() {
		return this.#destroyed;
	}

	/** Whether the listener is registered in the service: false without a watcher, or after a failure */
	#watching = false;
	get watching() {
		return this.#watching;
	}

	#createListener = () => {
		const { watcher, spec, path } = this.#finder;
		if (!watcher) return;

		let includes = spec.includes.includes('*') ? undefined : spec.includes;
		includes = typeof includes === 'string' ? [includes] : includes;

		const excludes = typeof spec.excludes === 'string' ? [spec.excludes] : spec.excludes;

		this.#listener = watcher.listeners.create(path, {
			includes: includes,
			excludes: excludes,
			filename: spec.filename,
			extname: spec.extname
		});

		this.#listener.on('add', this.#add);
		this.#listener.on('unlink', this.#unlink);
		this.#listener.on('change', this.#change);

		this.#listener
			.listen()
			.then(() => (this.#watching = true))
			.catch((exc: Error) => {
				// The finder still answers its discovery; that it is not being followed is reported, not hidden
				const message = `The finder of "${path}" is not watching its files: ${exc.message}`;
				this.#finder.warnings.push({ code: 'LISTENER_FAILED', message });
				console.error(message);
			});
	};

	constructor(finder: Finder, inclusions: Map<string, Inclusion>) {
		this.#finder = finder;
		this.#inclusions = inclusions;

		this.#createListener();
	}

	#add = (file: string) => {
		if (this.#destroyed) {
			console.warn(`Event received on a destroyed listener. File: "${file}".`);
			return;
		}

		let changed = false;
		this.#inclusions.forEach(inclusion => inclusion.push(file) && (changed = true));
		changed && this.#finder.processed && this.#finder._invalidate();
	};

	#unlink = (file: string) => {
		if (this.#destroyed) {
			console.warn(`Event received on a destroyed listener. File: "${file}".`);
			return;
		}

		let changed = false;
		this.#inclusions.forEach(inclusion => inclusion.delete(file) && (changed = true));
		changed && this.#finder.processed && this.#finder._invalidate();
	};

	#change = (file: string) => {
		if (this.#destroyed) {
			console.warn(`Event received on a destroyed listener. File: "${file}".`);
			return;
		}

		const fdata = new FileData(this.#finder.path, file);
		this.#finder.processed && this.#finder.emit('file.change', fdata);
	};

	destroy() {
		this.#destroyed = true;
		this.#watching = false;

		// A watcher client destroyed before the finder has already released the listeners of its watcher
		if (!this.#listener || this.#listener.destroyed) return;
		// The released Watchers answer with a promise; the published 1.0.7 releases synchronously and returns nothing
		Promise.resolve(this.#listener.destroy()).catch((exc: Error) => console.error(exc.stack));
	}
}
