# Finder

Finder owns fixed filter configuration, Inclusion objects, initial recursive discovery and an optional watcher listener. It inherits processing/readiness from DynamicProcessor. Includes are literal paths plus the exact `*` sentinel; extname is the extension key.

Read the [complete behavior and lifecycle contract](../../docs/architecture.md#search-configuration) before extending or integrating this module. Internal source files are not separate public module identities.
