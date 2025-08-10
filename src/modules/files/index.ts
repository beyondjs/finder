import { FileData } from '@beyond-js/file/data';
import { isAbsolute, join } from 'path';

/**
 * Represents an ordered collection of files with unique relative paths.
 *
 * This class extends Array to preserve the order of files while
 * adding fast existence checks via a Set of relative file paths.
 */
export /*bundle*/ class FilesArray {
	#files: FileData[] = [];

	#root: string;
	get root() {
		return this.#root;
	}

	get length(): number {
		return this.#files.length;
	}

	// Set of relative file paths for quick lookup and uniqueness enforcement
	#keys: Set<string> = new Set(); // The relative paths of the files

	constructor(root: string) {
		this.#root = root;
	}

	/**
	 * Sort files by their relative path.
	 */
	sort() {
		return this.#files.sort((a, b) => (a.relative.file < b.relative.file ? -1 : 1));
	}

	/**
	 * Add a file to the collection.
	 *
	 * @param file - File to add.
	 * @param sort - Whether to sort the collection after insertion.
	 *
	 * @note Overrides Array.push with a custom signature to enforce FileData usage
	 *       and optionally maintain sorted order. We intentionally break Array's
	 *       method signature, so @ts-ignore is used.
	 */
	push(file: string | FileData, sort: boolean = true): FileData | undefined {
		file = this.normalize(file);

		if (this.includes(file)) return; // Skip if file already exists

		this.#keys.add(file.relative.file);
		this.#files.push(file);
		sort && this.sort();
		return file;
	}

	/**
	 * Remove all files from the array.
	 */
	clear() {
		this.#keys.clear();
		this.#files.length = 0;
	}

	/**
	 * Clear the array and set a new root path.
	 */
	reset(root: string) {
		this.clear();
		this.#root = root;
	}

	/**
	 * Remove a specific file from the collection.
	 *
	 * @param file - File to delete (either a FileData instance or a string path).
	 */
	delete(file: FileData | string) {
		if (!this.#root) return;

		file = this.normalize(file);
		if (!this.includes(file)) return;

		const index = this.indexOf(file);
		this.#files.splice(index, 1);
		this.#keys.delete(file.relative.file);
		return true;
	}

	/**
	 * Normalize an input into a FileData instance.
	 *
	 * @param file - A FileData instance or a file path string.
	 * @throws If Files is not configured or if the parameter is invalid.
	 */
	normalize(file: string | FileData): FileData {
		if (!this.#root) throw new Error('Files is not configured');

		if (file instanceof FileData) return file;
		if (typeof file !== 'string') throw new Error('Invalid file parameter');

		file = isAbsolute(file) ? file : join(this.#root, file);
		return new FileData(this.#root, file);
	}

	/**
	 * Compute the unique key for a file.
	 *
	 * @param file - FileData or path.
	 * @returns The relative path key.
	 */
	#key(file: string | FileData): string {
		if (typeof file === 'string') {
			if (!isAbsolute(file)) return file;
			file = new FileData(this.#root, file);
			return file.relative.file;
		} else if (file instanceof File) {
			return file.relative.file;
		} else {
			throw new Error('Invalid file parameter');
		}
	}

	/**
	 * Check if the collection contains a specific file.
	 */
	includes(file: string | FileData) {
		if (!this.#root) return false;
		return this.#keys.has(this.#key(file));
	}

	/**
	 * Gets the index of a specific file in the collection.
	 */
	indexOf(file: string | FileData): number {
		if (!this.#root) return -1;

		const key = this.#key(file);
		return this.#files.findIndex(f => this.#key(f) === key);
	}

	/**
	 * Changes the contents of the array by removing or replacing existing elements
	 * and/or adding new elements.
	 *
	 * This is a direct implementation of the Array.prototype.splice() method.
	 */
	splice(start: number, deleteCount?: number, ...items: FileData[]): FileData[] {
		return this.#files.splice(start, deleteCount, ...items);
	}

	/**
	 * Retrieve a file by its path or FileData reference.
	 *
	 * @note This intentionally overrides Array.find with a different signature,
	 *       so @ts-ignore is used to suppress TypeScript's type incompatibility warning.
	 */
	find(file: string | FileData): FileData | undefined {
		if (!this.#root) return;
		const key = this.#key(file);
		return this.#files.find(f => f.relative.file === key);
	}

	/**
	 * Executes a provided function once for each file in the collection.
	 */
	forEach(callback: (value: FileData, index: number, array: FileData[]) => void) {
		this.#files.forEach(callback);
	}

	/**
	 * Append all files from another Files instance into this collection.
	 *
	 * @param files - A Files instance to append.
	 * @param sort - Whether to sort after appending.
	 */
	append(files: FilesArray, sort?: boolean) {
		if (!this.#root) throw new Error('Files is not configured');

		if (!(files instanceof FilesArray)) throw new Error('Invalid parameters');
		files.forEach(file => this.push(file, false));
		sort && this.sort();
	}

	/**
	 * Returns an Array Iterator object with key/value pairs.
	 */
	entries(): IterableIterator<[number, FileData]> {
		return this.#files.entries();
	}

	/**
	 * Returns an Array Iterator object with the keys of the collection.
	 */
	keys(): IterableIterator<number> {
		return this.#files.keys();
	}

	/**
	 * Returns an Array Iterator object with the values of the collection.
	 */
	values(): IterableIterator<FileData> {
		return this.#files.values();
	}

	[Symbol.iterator](): Iterator<FileData> {
		return this.#files[Symbol.iterator]();
	}

	/**
	 * Creates a new FilesArray with all elements that pass the test
	 * implemented by the provided function.
	 */
	filter(callback: (value: FileData, index: number, array: FileData[]) => unknown): FilesArray {
		const filteredArray = this.#files.filter(callback);
		const instance = new FilesArray(this.root);
		filteredArray.forEach(file => instance.push(file, false));
		return instance;
	}

	/**
	 * Creates a new array populated with the results of calling a provided function
	 * on every element in the calling array.
	 */
	map<T>(callback: (value: FileData, index: number, array: FileData[]) => T): T[] {
		return this.#files.map(callback);
	}
}
