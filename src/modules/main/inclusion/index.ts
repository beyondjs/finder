import type { FilterSpec } from '@beyond-js/finder/types';
import type { IDiagnostic } from '@beyond-js/finder/types';
import { FileData } from '@beyond-js/file/data';
import Files from './files';
import RecursiveFinder from './recursive';
import { join, relative } from 'path';
import * as fs from 'fs';

const { stat, access } = fs.promises;

export enum TYPES {
	DIRECTORY = 0,
	FILE,
	WILDCARD
}

/**
 * An inclusion can be a wildcard, a file or a directory.
 * The way to use this class is by calling the .process() method. The execution can be cancelled by
 * calling the .destroy() method.
 * After calling the .process() method, the consumer should check if the object was destroyed while processing.
 */
export default class Inclusion extends Files {
	// The entry of the inclusion can be a file, a directory or the wildcard
	#entry: string;
	get entry() {
		return this.#entry;
	}

	#spec: FilterSpec;
	get spec() {
		return this.#spec;
	}

	get TYPES(): typeof TYPES {
		return TYPES;
	}

	#type: TYPES;
	get type() {
		return this.#type;
	}

	#errors: IDiagnostic[] = [];
	get errors() {
		return this.#errors;
	}

	#warnings: IDiagnostic[] = [];
	get warnings() {
		return this.#warnings;
	}

	#processing = false;
	get processing() {
		return this.#processing;
	}

	#processed = false;
	get processed() {
		return this.#processed;
	}

	#destroyed = false;
	get destroyed() {
		return this.#destroyed;
	}

	/**
	 * Finder inclusion constructor
	 *
	 * @param root {string} The root of the search, required to set the files relative directory
	 * @param entry {string} The entry in the includes specification, each entry can be a directory,
	 * a file, or the wildcard
	 * @param spec {FilterSpec} The finder specification
	 */
	constructor(root: string, entry?: string, spec?: FilterSpec) {
		if (typeof root !== 'string' || !entry || !spec) {
			throw new Error('Invalid parameters, root, entry and spec are required');
		}

		super(root, spec);
		this.#entry = entry;
		this.#spec = spec;
	}

	// The recursive search that is being executed
	#recursive: RecursiveFinder;

	#wildcard = async () => {
		let excludes = this.#spec.includes.slice();
		excludes.splice(excludes.indexOf('*'), 1);
		this.#spec.excludes ? (excludes = excludes.concat(this.#spec.excludes)) : null;

		await this.#directory(this.root, excludes);
	};

	#directory = async (path: string, excludes?: FilterSpec['excludes']) => {
		excludes = excludes ? excludes : this.#spec.excludes;
		const filter: FilterSpec = Object.assign({}, this.#spec, { excludes });
		this.#recursive = new RecursiveFinder(this.root, path, filter);

		await this.#recursive.process();
		if (this.#destroyed) return;

		this.#errors = this.#recursive.errors.slice();
		!this.#errors.length && super.append(this.#recursive.files, /*sort*/ true);
		this.#recursive = undefined;
	};

	#file = (path: string) => {
		const file = new FileData(this.root, path);
		super.push(file, /*sort*/ true);
	};

	async process(): Promise<void | boolean> {
		if (this.#processed) throw new Error('Inclusion was already processed');
		if (this.#processing) throw new Error('Inclusion is already being processed');
		if (this.#destroyed) throw new Error('Inclusion has been destroyed');

		this.#processing = true;

		try {
			if (this.#entry === '*') {
				this.#type = TYPES.WILDCARD;
				await this.#wildcard();
				return;
			}

			const path = join(this.root, this.#entry);
			const exists = await (async () => {
				// await fs.exists(path);
				try {
					await access(path);
					return true;
				} catch (error) {
					if (error.code === 'ENOENT') return false;
					throw error; // Re-throw if it's not a "not found" error
				}
			})();

			if (this.#destroyed) return;
			if (!exists) return;

			let { isDirectory, isFile } = await stat(path);
			if (this.#destroyed) return;

			if (isDirectory()) {
				this.#type = TYPES.DIRECTORY;
				await this.#directory(path);
			} else if (isFile()) {
				this.#type = TYPES.FILE;
				await this.#file(path);
			}
		} catch (exc) {
			console.error(exc.stack);
			this.#errors.push(exc.message);
		} finally {
			this.#processing = false;
			this.#processed = true;
		}
	}

	/**
	 * Called by the fs listener when a file is being added
	 * @param file {string | object} The file being added
	 */
	push(file: string | FileData) {
		if (!this.#processed && !this.#processing) {
			console.warn('Push file event received on a finder inclusion that was not initialised', file, this.root);
			return;
		}

		file = file instanceof FileData ? file : new FileData(this.root, file);
		if (this.#type !== TYPES.WILDCARD) {
			// Check if the file being pushed should be included in the current inclusion
			if (relative(this.#entry, file.relative.file).startsWith('..')) return;
		}
		return super.push(file, /*sort*/ true);
	}

	/**
	 * Called by the fs listener when a file is being unlinked
	 * @param file {string | object} The file being added
	 */
	delete(file: string | FileData) {
		if (!this.#processed && !this.#processing) {
			console.warn('Delete file event received on a finder inclusion that was not initialised', file, this.root);
			return;
		}
		return super.delete(file);
	}

	destroy() {
		this.#destroyed = true;
		this.#recursive && this.#recursive.destroy();
	}
}
