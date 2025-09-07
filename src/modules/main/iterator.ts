import type { IFilterSpec } from '@beyond-js/finder/types';
import type Inclusion from './inclusion';

/**
 * Iterator of files
 *
 * @param includes
 * @param inclusions
 * @returns {function*}
 */
export default function (includes: IFilterSpec['includes'], inclusions: Map<string, Inclusion>) {
	return function* () {
		if (!inclusions) return;

		const keys = new Set();
		for (const include of includes) {
			const inclusion = inclusions.get(include);
			for (const file of inclusion) {
				const key = file.relative.file;
				if (keys.has(key)) continue;
				keys.add(key);

				yield file;
			}
		}
	};
}
