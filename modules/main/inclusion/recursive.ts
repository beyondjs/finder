import type { IFilterSpec } from '@beyond-js/finder/types';
import type { IDiagnostic } from '@beyond-js/finder/types';
import { FilesArray } from '@beyond-js/finder/files';
import Files from './files';
import * as fs from 'fs';
import { relative } from 'path';
import { join } from 'path';

const { readdir, stat, access } = fs.promises;

/**
 * Recursive search in a specific directory.
 * No exceptions are thrown. Errors are silently exposed through the .errors property.
 * The way to use this class is by calling the .process() method. The execution can be cancelled by
 * calling the .destroy() method.
 * After calling the .process() method, the consumer should check if the object was destroyed while processing.
 */
export default class RecursiveFinder {
	#root: string;
	get root() {
		return this.#root;
	}

	#path: string;
	get path() {
		return this.#path;
	}

	#spec: IFilterSpec;
	get spec() {
		return this.#spec;
	}

	#files: FilesArray;
	get files() {
		return this.#files;
	}

	#errors: IDiagnostic[] = [];
	get errors() {
		return this.#errors;
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
	 * Recursive searcher constructor
	 *
	 * @param root {string} The root of the search, required to check if a folder is going
	 * to be excluded by the excludes specification (it is expressed as a relative path)
	 * @param path {string} The path where to find the files
	 * @param spec {object} The finder specification (filename, extname, filter, excludes).
	 * Includes is not used here as this class is already under an inclusion (specified in the includes).
	 */
	constructor(root: string, path: string, spec: IFilterSpec) {
		this.#root = root;
		this.#path = path;
		this.#spec = spec;
	}

	/**
	 * Find files recursively in a directory
	 *
	 * @param path {string} The directory where to search for the files
	 * @returns {Promise<object>}
	 */
	#readdir = async (path: string) => {
		const output = new Files(this.#root, this.#spec);
		const excludes = this.#spec.excludes;

		const files = await readdir(path);
		if (this.#destroyed) return;

		for (let file of files) {
			file = join(path, file);

			const stats = await stat(file);
			if (this.#destroyed) return;

			// Check if directory is excluded from the search
			const excluded = (file: string) => {
				const r = relative(this.#root, file);
				return excludes.reduce((prev, exclude) => prev || relative(exclude, r) === '', false);
			};

			if (stats.isDirectory()) {
				// Continue the recursive search
				!excluded(file) && output.append(await this.#readdir(file));
				if (this.#destroyed) return;
			} else if (stats.isFile()) {
				// If the file does not meet the filters criteria, it will be automatically discarded
				!excluded(file) && output.push(file);
			}
		}

		return output;
	};

	async process() {
		if (this.#processed) throw new Error('Search was already processed');
		if (this.#processing) throw new Error('Search is already being processed');
		if (this.#destroyed) throw new Error('Search has been destroyed');

		this.#processing = true;
		try {
			const exists = await (async () => {
				try {
					await access(this.#path);
					return true;
				} catch (exc) {
					if (exc.code === 'ENOENT') return false;
					throw exc;
				}
			})();

			this.#files = !exists ? new Files(this.#path, this.#spec) : await this.#readdir(this.#path);
		} catch (exc) {
			console.error(exc.stack);
			this.#errors.push(exc.message);
			this.#files?.clear();
		} finally {
			this.#processing = false;
			this.#processed = true;
		}
	}

	destroy() {
		this.#destroyed = true;
	}
}
