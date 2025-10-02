import type { ListenerType, WatcherClient } from '@beyond-js/watchers/client';
import type { FileData } from '@beyond-js/file/data';
import type { IFilterSpec } from '@beyond-js/finder/types';
import type { IFinderItemCtor } from './file';
import { ConfigurableFinder } from '@beyond-js/finder/configurable';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';
import { FinderFile } from './file';

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
	 * Access to the .has(key) method of the items map
	 *
	 * @param file {object | string}
	 */
	has(file: string | FileData): boolean {
		if (!this.path) return false;

		const key = this.#normalize(this.#finder.normalize(file));
		return super.has(key);
	}

	/**
	 * Access to the .get(key) method of the items map
	 *
	 * @param file {object | string}
	 */
	get(file: string | FileData): InstanceType<ItemType> | undefined {
		if (!this.path) return;

		const key = this.#normalize(this.#finder.normalize(file));
		return super.get(key);
	}

	_process() {
		const updated = new Map();
		const ordered: string[] = [];
		this.#finder.forEach(file => {
			const key = this.#normalize(file);
			ordered.push(key);

			let item = this.has(key) ? this.get(key) : new this.#Item(this, file);
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

	configure(path?: string, spec?: IFilterSpec) {
		this.#finder.configure(path, spec);
	}

	// forEach must respect the order of the files arranged by the finder
	forEach(callback: (value: InstanceType<ItemType>, key: string, map: this) => void, thisArg?: any): void {
		for (const key of this.#ordered) {
			// super.get(key)! si estás seguro de que existe
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
		this.#ordered.length = 0;
		this.forEach(item => (item as any).destroy?.());
		return super.clear();
	}

	destroy() {
		super.destroy();
		this.clear();
		this.#finder.destroy();
	}
}
