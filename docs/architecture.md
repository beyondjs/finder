# Finder architecture and usage

Finder discovers filesystem entries and presents them as ordered file metadata or as long-lived collection items. It composes the Dynamic Processor lifecycle with `FileData`, `DynamicFile` and an optional `WatcherClient`. It does not create a watcher service, read every file's content, compile modules or apply updates.

## Public modules

[package.json](../package.json) selects `modules` as the Beyond module root. Each public module has a manifest; internal directories are not additional public imports.

| Public import | API and implementation |
| --- | --- |
| `@beyond-js/finder/main` | [Finder](../modules/main/index.ts), a Dynamic Processor with a fixed search configuration |
| `@beyond-js/finder/configurable` | [ConfigurableFinder](../modules/configurable/index.ts), a Dynamic Processor over `FilesArray` that owns and replaces a Finder |
| `@beyond-js/finder/collection` | [FinderCollection, FinderFile, IFinderItemCtor](../modules/collection/index.ts); items created from file metadata |
| `@beyond-js/finder/files` | [FilesArray](../modules/files/index.ts), an ordered set of `FileData` keyed by relative path; it does not extend `Array` |
| `@beyond-js/finder/types` | [IFilterSpec, IDiagnostic](../modules/types/index.ts) |

## Search configuration

`new Finder(path, spec, watcher?)` takes the root, the filter and an optional `WatcherClient`. [Parameters](../modules/main/parameters.ts) copies the filter and its arrays, defaults `includes` to `['*']` and `excludes` to `[]`, converts a string `extname` to an array and validates types: the root must be a string, `filename` a string, `includes` and `excludes` arrays. An include that is not a string is reported as the warning `INCLUSION_NOT_A_STRING` and left out.

| Filter | Exact meaning |
| --- | --- |
| `includes` | Literal file or directory paths relative to the root, in the order the results follow. Only the exact string `*` means recursive discovery from the root; `*.ts` and `src/**` are not patterns. |
| `excludes` | Literal relative paths. A directory is not entered; a file is rejected; descendants of either are rejected. |
| `filename` | Exact basename, such as `module.json`. |
| `extname` | Exact extension including the dot, one or several. |
| `filter` | A synchronous predicate on `FileData`, applied at discovery and on additions; it is not sent to the watcher. |

An explicit file still passes the same filters. An include that is absent or fully filtered appears in `missing`; that is not an error. A root that does not exist discovers nothing and reports nothing: the wildcard is missing.

## Initial discovery and order

Finder owns one [Inclusion](../modules/main/inclusion/index.ts) per include. `_begin()` creates the watcher listener when there is a watcher, then processes every inclusion concurrently. A literal path is checked with `access` and `stat`: a directory is walked by [RecursiveFinder](../modules/main/inclusion/recursive.ts), a file becomes one `FileData`. The wildcard walks the root and excludes the other explicit includes, so each occupies its own position.

The recursive walk uses `readdir` and `stat`, follows directory results and records the device and inode of every directory it enters, so a symbolic link that leads back into the tree ends the walk there instead of continuing forever. It does not otherwise treat links specially. A read error is the diagnostic `READ_ERROR` of the inclusion, `INCLUSION_ERROR` for a failure of the inclusion itself; diagnostics are `{ code, message }`.

Files within an inclusion are sorted by relative path. Iterating the finder follows include order and skips a relative path already yielded by an earlier inclusion; `length` sums the inclusions and can count an overlap twice; `files` builds a frozen aggregate `FilesArray` in the same order.

Errors and warnings of a finder are `{ code, message }` diagnostics. `errors` aggregates the inclusions'; `warnings` holds `INCLUSION_NOT_A_STRING` and `LISTENER_FAILED`.

## Watch events and invalidation

[Listener](../modules/main/listener/index.ts) uses the supplied `WatcherClient` to create a listener under the root, filtered by the finder's includes (none for the wildcard), excludes, filename and extension. It subscribes before the initial discovery starts and registers the listener without blocking `ready`: `watching` becomes true when the registration succeeded, and a registration that fails is the warning `LISTENER_FAILED` on the finder, reported once on the console, with discovery unaffected.

- `add`: the file is inserted into the inclusions it belongs to; the finder is invalidated when the membership changed.
- `unlink`: the file is removed; the finder is invalidated when the membership changed.
- `change`: `file.change` is emitted with the `FileData` of a member. Membership is not re-evaluated.
- The finder's own `change` is deferred by ten milliseconds so a burst announces once. The last announcement of a destruction is delivered at once and supersedes a pending one, so nothing is announced after `destroy()` returns.

A change of the finder is not a rebuild: it tells whoever required the finder that the set of files changed.

## Reconfiguration and collection items

`ConfigurableFinder` owns a watcher reference and a replaceable Finder. `configure(path, spec)` compares a copy of the configuration with the previous one using `@beyond-js/equal`, and returns `false` when they are equal; otherwise it destroys the previous finder, resets its own array to the new root, creates the new finder, invalidates itself and returns `true`. `configure()` with no path disables discovery. `_prepared` requires the finder and `_process` copies its files, so readiness waits for the new discovery.

`FinderCollection` extends `DynamicProcessor(Map)`, registers a `ConfigurableFinder` as its child and maps each discovered file to an item: `new Item(collection, file)`, `FinderFile` by default, which is a `DynamicFile` sharing the collection's listener. Keys are relative paths, or relative directories when `filename` filters, with `/` separators. `has(x)` and `get(x)` accept a key, a relative or absolute path of a file, or a `FileData`. `configure()` invalidates the collection when the configuration changed, so `ready` waits for the items of the new discovery.

`_process` reuses the item at an existing key, creates items for new keys, destroys the items whose keys are gone, and keeps `ordered`, which `forEach`, `entries`, `keys`, `values` and iteration follow. `clear()` destroys every item and then empties the map; `destroy()` destroys the processor, the items and the finder. An item that implements `destroy()` is destroyed by the collection; the collection owns its items.

## FilesArray

`FilesArray` keeps `FileData` in insertion or sorted order with a set of relative keys for uniqueness. `push(file, sort = true)` normalizes a string or `FileData`, refuses a duplicate by returning `undefined`, and sorts unless told not to; `delete`, `includes`, `indexOf`, `find` take a path or `FileData`; `splice` maintains the key set; `filter` returns a new `FilesArray`, `map` an array; `sort()` sorts in place by relative path and returns the backing array. `normalize` throws before the array is configured with a root.

## Lifecycle

Finder's `destroy()` cancels the deferred announcement, destroys the processor (whose last `change` is delivered at once), releases the listener when there is one and its watcher client has not already released it, and destroys the inclusions, which cancel a walk in progress. It is safe without a watcher. A collection's `destroy()` reaches its items and its finder.

## Build and validation

[beyond.json](../beyond.json) selects the package; module tsconfig files select Node types. The tests under [tests/](../tests/README.md) import the compiled public modules; [validation](validation.md) maps each contract to its test and states what is not established.
