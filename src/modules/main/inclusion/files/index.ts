import type { FileData } from '@beyond-js/file/data';
import type { FilterSpec } from '@beyond-js/finder/types';
import { FilesArray } from '@beyond-js/finder/files';
import { FilesFilter } from './filter';

/**
 * Adds a filter specification to the array of files
 */
export default class InclusionFiles extends FilesArray {
	// An object with a .check(file) method that verifies if a file
	// complies with the specified filters
	#filter: FilesFilter;

	constructor(root: string, spec?: FilterSpec) {
		if (typeof root !== 'string' || !spec) {
			throw new Error('Invalid parameters, root and spec are required');
		}

		super(root);
		this.#filter = new FilesFilter(root, spec);
	}

	/**
	 * Push a file to the array
	 * @param file {object} The file object
	 * @param sort {boolean}
	 */
	push(file: FileData, sort = true) {
		file = this.normalize(file);
		const check = this.#filter.check(file);
		if (!check.passed) return;

		return super.push(file, sort);
	}
}
