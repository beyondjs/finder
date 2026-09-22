# FinderCollection

Construct it with one options object `{ Item, watcher }`. It owns a ConfigurableFinder and maps discovered files to reusable items created as `new Item(collection, file)`; `FinderFile`, the default, is a DynamicFile sharing the collection's listener. Keys are relative paths, or relative directories when `filename` filters; `has` and `get` accept a key or a file. A changed configuration invalidates the collection, `clear()` destroys the items, and the collection owns them.

Read [the contract](../../docs/architecture.md#reconfiguration-and-collection-items) before extending or integrating this module.
