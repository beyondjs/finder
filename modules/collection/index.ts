import type { ListenerType, WatcherClient } from '@beyond-js/watchers/client';
import type { FileData } from '@beyond-js/file/data';
import type { IFilterSpec } from '@beyond-js/finder/types';
import type { IFinderItemCtor } from './file';
import { ConfigurableFinder } from '@beyond-js/finder/configurable';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';
import { FinderFile } from './file';

/**
 * A long-lived collection of items created from the files a finder discovers, keyed by relative path, or by
 * relative directory when it is filtered by filename. An item keeps its identity while its file exists and
 * is destroyed when the file leaves the collection.
 */
export /*bundle*/ class FinderCollection<ItemType extends IFinderItemCtor> extends DynamicProcessor(Map<string, any>) {
	get dp() {
		return 'utils.finder-collection';
	}

	#finder: ConfigurableFinder;
	#Item: IFinderItemCtor;
	get Item() {
		return this.#Item;
	}

	get listener(): ListenerType | undefined {
		return this.#finder?.listener;
	}

	get path() {
		return this.#finder.path;
	}

	get spec() {
		return this.#finder.spec;
	}

	get filename() {
		return this.#finder.filename;
	}

	get extname() {
		return this.#finder.extname;
	}

	get errors() {
		return this.#finder.errors;
	}

	get warnings() {
		return this.#finder.warnings;
	}

	get missing() {
		return this.#finder.missing;
	}

	// Ordered array of collection keys
	#ordered: string[] = [];
	get ordered() {
		return this.#ordered;
	}

	/**
	 * FinderCollection constructor
	 *
	 * @param Item {object} The collection item
	 * @param watcher {WatcherClient} The client file watchers
	 */
	constructor({ Item, watcher }: { Item?: ItemType; watcher?: WatcherClient } = {}) {
		super();

		this.#Item = Item ? Item : FinderFile;
		this.#finder = new ConfigurableFinder(watcher);
		super.setup(new Map([['finder', { child: this.#finder }]]));
	}

	#normalize(file: FileData) {
		const normalize = (file: string) => file.replace(/\\/g, '/').replace(/\/$/, ''); // Remove trailing slash
		const key = this.filename ? file.relative.dirname : file.relative.file;
		return normalize(key);
	}

	/**
	 * The key of an item: a key of the collection given as it is, or a file (a path or its data) reduced to
	 * the key it belongs to, which is its relative directory when the collection is filtered by filename
	 */
	#key(file: string | FileData): string {
		if (typeof file === 'string') {
			const key = file.replace(/\\/g, '/').replace(/\/$/, '');
			if (super.has(key)) return key;
		}
		return this.#normalize(this.#finder.normalize(file));
	}

	/**
	 * Whether an item exists, by its key or by a file that belongs to it
	 *
	 * @param file {object | string}
	 */
	has(file: string | FileData): boolean {
		if (!this.path) return false;
		return super.has(this.#key(file));
	}

	/**
	 * The item of a key, or of a file that belongs to it
	 *
	 * @param file {object | string}
	 */
	get(file: string | FileData): InstanceType<ItemType> | undefined {
		if (!this.path) return;
		return super.get(this.#key(file));
	}

	_process() {
		const updated = new Map();
		const ordered: string[] = [];
		this.#finder.forEach(file => {
			const key = this.#normalize(file);
			ordered.push(key);

			// The key is already normalized: looked up directly, so an item keeps its identity across processings
			const item = super.has(key) ? super.get(key) : new this.#Item(this, file);
			updated.set(key, item);
		});

		// Destroy the resources that are not currently in the collection
		this.forEach((item: any, key: string) => !updated.has(key) && item.destroy?.());

		super.clear(); // Do not use this.clear, as it will destroy all the previously created items
		updated.forEach((item, key) => this.set(key, item));

		// The assignment of #ordered must be done at the end of the method, because this property is used
		// by the forEach of the collection, which in turn is used by the current method
		this.#ordered = ordered;
	}

	/**
	 * Configures the search. A changed configuration invalidates the collection, so its readiness waits
	 * for the items of the new discovery.
	 */
	configure(path?: string, spec?: IFilterSpec) {
		this.#finder.configure(path, spec) && this._invalidate();
	}

	// forEach must respect the order of the files arranged by the finder
	forEach(callback: (value: InstanceType<ItemType>, key: string, map: this) => void, thisArg?: any): void {
		for (const key of this.#ordered) {
			// Every key of the order is in the map, so the value is present
			const value = super.get(key) as InstanceType<ItemType>;
			callback.call(thisArg, value, key, this);
		}
	}

	[Symbol.iterator] = () => {
		return this.entries();
	};

	*entries(): ReturnType<Map<string, InstanceType<ItemType>>['entries']> {
		for (const key of this.#ordered) {
			const value: InstanceType<ItemType> = super.get(key);
			yield [key, value];
		}
	}

	keys() {
		const keys: string[] = [];
		this.#ordered.forEach(key => keys.push(key));
		return keys.values();
	}

	values(): ReturnType<Map<string, InstanceType<ItemType>>['values']> {
		const values: InstanceType<ItemType>[] = [];
		this.#ordered.forEach(key => values.push(super.get(key)));
		return values.values();
	}

	clear() {
		// The items are destroyed before the order is forgotten: the traversal reads the order
		const items = this.#ordered.map(key => super.get(key));
		this.#ordered.length = 0;
		items.forEach(item => (item as any)?.destroy?.());
		return super.clear();
	}

	destroy() {
		super.destroy();
		this.clear();
		this.#finder.destroy();
	}
}
