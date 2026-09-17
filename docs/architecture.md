# Finder architecture and usage

Finder discovers filesystem entries and presents them as ordered file metadata or long-lived collection items. It composes the external DynamicProcessor lifecycle with FileData/DynamicFile and an optional WatcherClient. It does not create a watcher service, read every file's contents, compile modules or implement HMR.

## Public modules

[package.json](../package.json) selects `modules` as the Beyond module root. Each public module has a TS bundle manifest; internal directories are not additional public imports.

| Public import | API and implementation |
| --- | --- |
| `@beyond-js/finder/main` | [Finder](../modules/main/index.ts), a DynamicProcessor with fixed search configuration |
| `@beyond-js/finder/configurable` | [ConfigurableFinder](../modules/configurable/index.ts), DynamicProcessor over FilesArray, owns/replaces a Finder |
| `@beyond-js/finder/collection` | [FinderCollection, FinderFile, IFinderItemCtor](../modules/collection/index.ts); collection items are created from file metadata |
| `@beyond-js/finder/files` | [FilesArray](../modules/files/index.ts), an iterable wrapper around a private array and relative-path Set; it does **not** extend Array |
| `@beyond-js/finder/types` | [IFilterSpec, IDiagnostic](../modules/types/index.ts) |

## Search configuration

`new Finder(path, spec, watcher)` uses a root string, filter object and optional-at-runtime WatcherClient. The TypeScript constructor currently declares the watcher argument without `?`; passing `undefined` supplies an unwatched search. A source checkout must first be compiled/resolved as Beyond modules; it is not a plain Node root entrypoint.

```ts
import { Finder } from '@beyond-js/finder/main';

const finder = new Finder(rootPath, {
    includes: ['src'],
    excludes: ['src/generated'],
    extname: ['.ts']
}, watcher);
await finder.ready;
const paths = [...finder].map(file => file.relative.file);
const diagnostics = finder.errors;
```

Here `rootPath` and `watcher` are supplied by the application; readiness belongs to DynamicProcessor and must be followed by diagnostics checks. Before using unwatched search cleanup, address the [lifecycle limitation](#lifecycle-and-error-boundaries) below.

[Parameters](../modules/main/parameters.ts) shallow-copies the filter object, defaults includes to `['*']` and excludes to `[]`, and converts a string extname into an array. filename must be a string; includes/excludes must be arrays. It does not deeply validate entries, copy nested arrays, enforce root containment or parse globs.

| Filter | Exact meaning |
| --- | --- |
| includes | Literal file/directory paths relative to root; only the exact string `*` means recursive root discovery. `*.ts` and `src/**/*.ts` are not supported glob patterns. |
| excludes | Literal relative paths/subtrees. Directory traversal skips exact excluded directories; file filtering rejects descendants through path-relative checks. |
| filename | Exact basename match, such as `module.json`. |
| extname | Exact extension membership including the dot, such as `.ts`; the key is `extname`, not `extensions`. |
| filter | Synchronous predicate receiving FileData; affects discovery/add filtering but is not sent to Watchers. |

An explicit file still passes the same filename/extname/custom/exclusion filters. An absent or fully filtered inclusion appears in `missing`; missing is not necessarily a filesystem error. Inclusion errors are exposed separately.

## Initial discovery and order

Finder owns one [Inclusion](../modules/main/inclusion/index.ts) per include string. `_begin()` constructs its watcher Listener first, then processes inclusions concurrently. A literal path is checked with access/stat; directories use [RecursiveFinder](../modules/main/inclusion/recursive.ts), files create FileData directly. Wildcard traversal excludes other explicit includes so they can occupy their own positions in the result.

RecursiveFinder uses readdir/stat and follows directory results recursively. It has no symlink visited-set or containment boundary. Async filesystem calls are not cancelled; destroy sets flags checked after awaits. A caught directory error prevents its accumulated result from being appended to the inclusion.

InclusionFiles applies [FilesFilter](../modules/main/inclusion/files/filter.ts) on insertion. Files within each inclusion are sorted by relative path. Finder iteration follows configured include order and deduplicates relative file keys across inclusions. `files` constructs a new aggregated FilesArray and freezes its outer object; private mutable collections remain mutable through its methods. `length` sums inclusion lengths and can count overlapping matches more than iteration does.

The public getters expose path/spec/filename/extname/includes/excludes, watcher/listener, errors/warnings/missing, files and length. Mutating the exposed spec or includes after construction does not rebuild the inclusion map.

## Watch events and invalidation

[Listener](../modules/main/listener/index.ts) uses an already supplied WatcherClient. It creates a filtered listener under Finder's path, translating wildcard includes to no includes restriction. It subscribes before starting its initial asynchronous scan; watcher listener startup is fire-and-forget with logged errors, so `finder.ready` does not prove subscription or underlying chokidar readiness.

- `add`: insert the file into matching inclusions; invalidate the Finder if membership changed after initial processing.
- `unlink`: delete the file from inclusions and similarly invalidate.
- `change`: emit `file.change` with FileData when processed. This does not rebuild membership or re-evaluate the custom predicate.
- Finder's own `change` emission is debounced by ten milliseconds; other events are immediate through its DynamicProcessor event emitter.

A change event is not a compiler rebuild or runtime patch. Packages uses FinderCollection for module manifests and processor inputs: custom items interpret discovered manifests; DynamicFile-based items are intended to track contents through the shared listener, subject to the dependency compatibility limitation below. Passing no watcher keeps discovery separate from live updates. These consumer roles do not require this repository to exist beside Packages.

## Reconfiguration and collection items

ConfigurableFinder owns a fixed watcher reference and a replaceable Finder. `configure(path, spec)` compares configuration with the previous object using `@beyond-js/equal`, destroys the old Finder, resets FilesArray for a new path, and invalidates. `configure()` disables discovery; the old array clears during its next process, not immediately in that branch. `_prepared` requires the Finder and `_process` copies its files. The previous configuration stores references, so mutating the same filter object can defeat change detection.

```ts
import { FinderCollection } from '@beyond-js/finder/collection';

const manifests = new FinderCollection({ Item: ManifestItem, watcher });
manifests.configure(rootPath, { filename: 'module.json' });
await manifests.ready;
```

`ManifestItem` must implement `new (collection, fileData)` and may implement destroy. The default [FinderFile](../modules/collection/file.ts) extends external DynamicFile with `{file, listener: collection.listener}`. The selected File dependency source (`@beyond-js/file/dynamic`, internal `modules/dynamic/listener.ts`) currently requires both watcher and listener before subscribing. [FinderFile](../modules/collection/file.ts) passes only file and listener, so this source combination does not subscribe for content invalidation. Finder still emits file.change independently. A published dependency version may differ; verify the resolved File implementation before promising live default-item contents. The constructor is one options object, not positional `(watcher, Item)` arguments. FinderCollection owns a ConfigurableFinder through DynamicProcessor.setup; it does not extend ConfigurableFinder.

Keys use relative file paths normally, or relative directory names when filename is specified; separators normalize to `/`. `ordered`, forEach, entries, keys, values and iteration follow finder order. `_process` reuses items at matching keys, creates new ones and destroys removed items. The current reuse lookup passes an already normalized directory key back through filename-based normalization, which can move it to its parent; verify stable item reuse for filename-filtered collections before relying on identity preservation.

## FilesArray operations

FilesArray provides root/length, normalization, push/delete/clear/reset, includes/indexOf/find, append/sort, iteration, entries/keys/values, forEach/map/filter and splice. Relative string keys are compared literally for lookup, while push normalizes through FileData; use canonical relative paths consistently. `find` takes a path or FileData, not an Array predicate. `push` returns FileData or undefined on duplicate, not a numeric length. `filter` returns a new FilesArray; map returns an ordinary array.

`splice` changes the private array without updating the uniqueness Set, so it can desynchronize includes/indexOf/find and later insertion. `sort()` returns the actual backing array, also permitting mutation outside the Set. Prefer the dedicated operations and repair these invariants before treating arbitrary mutation as supported.

## Lifecycle and error boundaries

- Finder.destroy calls DynamicProcessor.destroy, Listener.destroy and inclusion destruction. Listener exists even without a WatcherClient, but its destroy unconditionally calls its absent underlying listener. Unwatched teardown can throw; fix this guard before depending on cleanup or reconfiguration.
- The debounced change timer is not cleared on destroy. Shutdown can therefore leave a late callback. No event replay bridges a watcher startup gap.
- FinderCollection.clear empties `ordered` before using its overridden forEach to destroy items; that traversal sees no keys. The default destroy path consequently does not guarantee item resources are released. Removed-item cleanup during normal `_process` uses the earlier order and is a distinct path.
- Non-string includes produce warnings but remain in the includes array; files/iterator subsequently look up missing inclusion objects. Invalid arrays are not a supported soft-warning-only configuration. Calling Finder with both path and spec absent returns an incomplete normalized object and fails later.
- IDiagnostic specifies `{code, message}`, but recursive/inclusion catches push exception message strings. Consumers should not assume every current error matches the declared shape. `_begin` catches aggregate rejection and logs it; readiness alone is not validity.
- FilesFilter computes path relationships, not glob matches or a security sandbox. Configure trusted roots/includes and define symlink/permission behavior explicitly for untrusted workspaces.

## Build and verification contracts

[beyond.json](../beyond.json) selects the package. Node and node-ts distributions use implementation bundle ports 1110/1111; module tsconfig files select Node types and esnext. No root npm scripts or test runner configuration are supplied. The [publish workflow](../.github/workflows/publish.yml) builds an `npm` distribution although this manifest declares only node/node-ts; reconcile that release contract before using the workflow. It also installs floating `beyond@latest`, unlike the Node 18 devcontainer's older pinned Beyond.

[Finder](../tests/test-finder/index.js), [invalid directory](../tests/test-invalid-dir/index.js) and [collection](../tests/test-collection/index.js) examples use legacy BEE and print results. Their `extensions` filter key is stale; they are not complete assertion/cleanup tests. Modern BEE Node compatibility requires supplying the utility dependencies' expected runtime and any watcher service; Node loading alone does not start IPC.

Meaningful verification includes literal/wildcard order and overlaps, filename/extension/custom filtering, missing and inaccessible roots, file add/change/unlink, no-watcher destroy, rapid reconfiguration, filename-key item reuse, removal disposal and FilesArray index consistency. Keep filesystem changes in isolated fixtures and test watcher/service lifecycle separately from static discovery.
