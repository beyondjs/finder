import type { IFilterSpec } from '@beyond-js/finder/types';

/**
 * Validates Finder constructor parameters
 *
 * @param path {string} The path where to find the files
 * @param specs {object} The finder specification
 */
export default function Parameters(path: string, specs: IFilterSpec): IFilterSpec {
	'use strict';

	specs = specs ? Object.assign({}, specs) : {};
	specs.extname = typeof specs.extname === 'string' ? [specs.extname] : specs.extname;

	if (typeof path !== 'string') {
		throw new Error(`Type of parameter "path" should be a string, but "${typeof path}" was passed`);
	} else if (specs.filename && typeof specs.filename !== 'string') {
		throw new Error('Filename specification is invalid');
	} else if (specs.extname && !(specs.extname instanceof Array) && typeof specs.extname !== 'string') {
		throw new Error('Extname specification is invalid');
	} else if (specs.includes && !(specs.includes instanceof Array)) {
		throw new Error('Includes specification must be an array');
	} else if (specs.excludes && !(specs.excludes instanceof Array)) {
		throw new Error('Excludes specification must be an array');
	}

	// The arrays are copied: the finder keeps them, and a caller that mutates its own must not change it
	specs.includes = specs.includes ? specs.includes.slice() : ['*'];
	specs.excludes = specs.excludes ? specs.excludes.slice() : [];

	return specs;
}
