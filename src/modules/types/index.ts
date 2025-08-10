import type { FileData } from '@beyond-js/file/data';

export /*bundle*/ interface IDiagnostic {
	code: string;
	message: string;
}

export /*bundle*/ interface FilterSpec {
	includes?: string[];
	excludes?: string[];
	filename?: string;
	extname?: string | string[];
	filter?: (file: FileData) => boolean;
}
