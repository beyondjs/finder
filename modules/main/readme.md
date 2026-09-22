# Finder

Finder owns a fixed filter configuration, one Inclusion per include, the initial discovery and an optional watcher listener. It inherits processing and readiness from Dynamic Processor. Includes are literal paths plus the exact `*` sentinel; `extname` is the extension key. `watching` says whether the listener registered; a failure to register is the warning `LISTENER_FAILED`.

Read [the behaviour and lifecycle contract](../../docs/architecture.md#search-configuration) before extending or integrating this module. Internal source files are not separate public module identities.
