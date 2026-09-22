import type { FileData } from '@beyond-js/file/data';
import type { FinderCollection } from './';
import { DynamicFile } from '@beyond-js/file/dynamic';

/**
 * The constructor of the items of a collection: it receives the collection and the metadata of the file
 */
export /*bundle*/ interface IFinderItemCtor {
	new (finder: FinderCollection<any>, file: FileData): any;
}

/**
 * The default item of a collection: a dynamic file that follows its content through the listener the
 * collection shares
 */
export /*bundle*/ class FinderFile extends DynamicFile {
	get dp() {
		return 'utils.finder-file';
	}

	#finder: FinderCollection<any>;
	get finder(): FinderCollection<any> {
		return this.#finder;
	}

	constructor(finder: FinderCollection<any>, file: FileData) {
		super({ file, listener: finder.listener });
		this.#finder = finder;
	}
}
