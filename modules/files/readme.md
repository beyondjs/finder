# FilesArray

FilesArray wraps a private FileData array and relative-key Set; it does not extend Array. push/find have file-oriented signatures. Dedicated insertion/deletion maintain uniqueness; splice and mutations through the array returned by sort can bypass that index.

Read the [complete behavior and lifecycle contract](../../docs/architecture.md#filesarray-operations) before extending or integrating this module. Internal source files are not separate public module identities.
