# FilesArray

An ordered set of FileData keyed by relative path; it does not extend Array. `push` refuses duplicates and sorts by default, `splice` keeps the keys consistent, `filter` returns a new FilesArray and `sort()` returns the backing array.

Read [the contract](../../docs/architecture.md#filesarray) before extending or integrating this module.
