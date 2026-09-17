# @beyond-js/finder

Find files by literal paths, basename, extension and predicates; optionally track membership through a supplied watcher.

Read [architecture, APIs and lifecycle](docs/architecture.md) before integrating the package. The guide explains configuration, execution flow, source limitations and verification cases. Public Beyond modules are **main, configurable, collection, files and types**; their module manifests and marked bundle exports define the API.

This checkout is authored with Beyond. [beyond.json](beyond.json) selects [package.json](package.json), whose module root is `modules`. Source module directories are not plain Node entrypoints; compiled public modules and their dependencies must be available to the consumer.

Use `extname`, not `extensions`. Includes/excludes are literal paths; only the exact include `*` means recursive root discovery. FinderCollection takes `{Item, watcher}` and FilesArray wraps an array rather than extending Array. See [search configuration](docs/architecture.md#search-configuration) and [cleanup limitations](docs/architecture.md#lifecycle-and-error-boundaries).

The build/test prerequisites and gaps are documented in the guide. No generic npm test/build command is supplied by the source manifest.

MIT; see [LICENSE](LICENSE).
