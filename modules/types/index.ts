import type { FileData } from '@beyond-js/file/data';

/**
 * A diagnostic of a search: a code that names it and a readable message
 */
export /*bundle*/ interface IDiagnostic {
	code: string;
	message: string;
}

/**
 * The filter of a search: literal includes and excludes relative to the root, an exact filename, exact
 * extensions and a synchronous predicate on the metadata of a file
 */
export /*bundle*/ interface IFilterSpec {
	includes?: string[];
	excludes?: string[];
	filename?: string;
	extname?: string | string[];
	filter?: (file: FileData) => boolean;
}
