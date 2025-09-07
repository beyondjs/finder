import type { FileData } from '@beyond-js/file/data';
import type { IFilterSpec } from '@beyond-js/finder/types';
import { FilesArray } from '@beyond-js/finder/files';
import { FilesFilter } from './filter';

/**
 * Adds a filter specification to the array of files
 */
export default class InclusionFiles extends FilesArray {
	// An object with a .check(file) method that verifies if a file
	// complies with the specified filters
	#filter: FilesFilter;

	constructor(root: string, spec?: IFilterSpec) {
		if (typeof root !== 'string' || !spec) {
			throw new Error('Invalid parameters, root and spec are required');
		}

		super(root);
		this.#filter = new FilesFilter(root, spec);
	}

	/**
	 * Push a file to the array
	 *
	 * @param file {FileData | string} The file to be added to the array
	 * If a string is provided, it will be normalized to a FileData object.
	 * @param sort {boolean} If true, the file will be sorted in the array.
	 * Defaults to true.
	 *
	 * @returns {FileData | undefined} Returns the file if it passes the filter, otherwise undefined.
	 *
	 * @param sort {boolean} If true, the file will be sorted in the array.
	 * @returns {FileData | undefined} Returns the file if it passes the filter, otherwise undefined.
	 */
	push(file: FileData | string, sort = true) {
		file = this.normalize(file);
		const check = this.#filter.check(file);
		if (!check.passed) return;

		return super.push(file, sort);
	}
}
