# @beyond-js/finder

Find files by literal paths, name, extension and predicate; keep the set current through a supplied watcher; map the files to long-lived items.

```ts
import { Finder } from '@beyond-js/finder/main';
import { FinderCollection } from '@beyond-js/finder/collection';

const finder = new Finder(root, { includes: ['src'], excludes: ['src/generated'], extname: ['.ts'] }, watcher);
await finder.ready;
for (const file of finder) console.log(file.relative.file);      // FileData, in include order, without duplicates
finder.on('change', () => {});                                   // membership changed (watched)
finder.on('file.change', file => {});                            // a member's content changed (watched)

const manifests = new FinderCollection({ Item: ManifestItem, watcher });
manifests.configure(root, { filename: 'module.json' });          // items keyed by directory
await manifests.ready;
```

Public Beyond modules are **main**, **configurable**, **collection**, **files** and **types**; [architecture, APIs and lifecycle](docs/architecture.md) explains search configuration (includes and excludes are literal paths, only the exact `*` recurses; the key is `extname`), initial discovery, watched updates, reconfiguration, item identity and cleanup. [Validation](docs/validation.md) maps each contract to its test; the tests under [tests/](tests/README.md) import the compiled public modules.

Without a watcher a finder answers its discovery once and is destroyed cleanly. With one, `watching` says whether the listener registered; a listener that could not be registered is a `LISTENER_FAILED` warning and discovery still answers.

This checkout is authored with Beyond: [beyond.json](beyond.json) selects [package.json](package.json), whose module root is `modules`. Compiled public modules and their dependencies must be available to the consumer through a Beyond loader.

MIT; see [LICENSE](LICENSE).
