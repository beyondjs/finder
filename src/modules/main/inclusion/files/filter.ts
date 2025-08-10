import type { FileData } from '@beyond-js/file/data';
import type { FilterSpec } from '@beyond-js/finder/types';
import { relative } from 'path';

interface CheckResult {
	warning?: string;
	passed: boolean;
}

export class FilesFilter implements FilterSpec {
	#root: string;

	#spec: FilterSpec;
	get includes(): FilterSpec['includes'] {
		return this.#spec.includes;
	}
	get excludes(): FilterSpec['excludes'] {
		return this.#spec.excludes;
	}
	get filename(): FilterSpec['filename'] {
		return this.#spec.filename;
	}
	get extname(): FilterSpec['extname'] {
		return this.#spec.extname;
	}
	get filter(): FilterSpec['filter'] {
		return this.#spec.filter;
	}

	constructor(root: string, spec: FilterSpec) {
		this.#root = root;
		this.#spec = spec;
	}

	/**
	 * Check if the file passes the filters conditions
	 *
	 * @param file {object} The file to be checked
	 * @returns {{warning: string, passed: boolean}}
	 */
	check(file: FileData): CheckResult {
		const output: CheckResult = { passed: true };

		// If a filename was specified to filter the finder, verify that the file meets this condition
		if (this.filename && this.filename !== file.filename) {
			output.warning = 'File does not comply the filename criteria';
			output.passed = false;
			return output;
		}

		// If a extension was specified to filter the finder, verify that the file meets this condition
		if (this.extname && !this.extname.includes(file.extname)) {
			output.warning = 'Invalid extension';
			output.passed = false;
			return output;
		}

		// If a filter function was specified, call it to check this file the passes it
		if (typeof this.filter === 'function' && !this.filter(file)) {
			output.warning = 'Excluded by the filter function';
			output.passed = false;
			return output;
		}

		// Check if file is excluded from the search
		const excluded = (file: FileData) =>
			this.excludes.reduce(
				(prev, exclude) => prev || !relative(exclude, file.relative.file).startsWith('..'),
				false
			);

		if (excluded(file)) {
			output.warning = 'File is excluded by the list of exclusions';
			output.passed = false;
			return output;
		}

		return output;
	}
}
