# FinderCollection

Construct FinderCollection with one options object `{Item, watcher}`. It owns ConfigurableFinder and maps discovered files to reusable item instances. Item receives `(collection, fileData)`; the default FinderFile extends DynamicFile. Filename filtering uses directory keys.

Read the [complete behavior and lifecycle contract](../../docs/architecture.md#reconfiguration-and-collection-items) before extending or integrating this module. Internal source files are not separate public module identities.
