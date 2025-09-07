import type { FileData } from '@beyond-js/file/data';
import type { FinderCollection } from './';
import { DynamicFile } from '@beyond-js/file/dynamic';

export /*bnundle*/ class FinderFile extends DynamicFile {
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
