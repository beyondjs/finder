# ConfigurableFinder

A Dynamic Processor over FilesArray that owns a replaceable Finder. `configure(path, spec)` returns whether the configuration changed; an equal one, compared on a copy, changes nothing. `configure()` disables discovery.

Read [the contract](../../docs/architecture.md#reconfiguration-and-collection-items) before extending or integrating this module.
