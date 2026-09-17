# ConfigurableFinder

ConfigurableFinder composes DynamicProcessor over FilesArray and owns a replaceable Finder; it does not subclass Finder. Construct it with an optional watcher, then call configure(path, spec), or configure() to disable discovery. Equal configuration skips replacement.

Read the [complete behavior and lifecycle contract](../../docs/architecture.md#reconfiguration-and-collection-items) before extending or integrating this module. Internal source files are not separate public module identities.
