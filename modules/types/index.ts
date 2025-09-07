import type { FileData } from '@beyond-js/file/data';

export /*bundle*/ interface IDiagnostic {
	code: string;
	message: string;
}

export /*bundle*/ interface IFilterSpec {
	includes?: string[];
	excludes?: string[];
	filename?: string;
	extname?: string | string[];
	filter?: (file: FileData) => boolean;
}
