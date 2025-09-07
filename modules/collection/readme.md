# `@beyond-js/finder/collection`

This module defines the `FinderCollection` class, which extends the functionality of `ConfigurableFinder` to manage a
collection of found files as a `Map`. It is designed to create and manage individual "item" objects for each file that
matches the search criteria, making it ideal for managing groups of related files.

---

# API

## `constructor(watcher: object, Item: class)`

Creates a new `FinderCollection` instance.

-   `watcher`: The file watcher instance.
-   `Item`: The class to be used for creating individual items for each file found by the collection.

## `configure(path: string, specs: object)`

Sets up or updates the search configuration for the collection, similar to `ConfigurableFinder`.

## `ready: Promise`

A promise that resolves when the initial file search is complete and the collection is ready for use.

## `get(file: object | string)`

Retrieves an item from the collection using either a file object or a path string.

## `has(file: object | string)`

Checks if an item for a given file exists in the collection.

## `forEach(callback: function)`

Iterates over the collection's items in the order they were found.

---

# Features

-   **Item-Based Management**: Automatically creates and manages a collection of custom `Item` objects, one for each
    file found.
-   **Dynamic Updates**: When files are added, changed, or deleted, the collection automatically updates and notifies
    the relevant items.
-   **Ordered Iteration**: Maintains the order of the files found, allowing for predictable iteration.
-   **Seamless Integration**: Built on top of `ConfigurableFinder` and integrates with a file watcher to provide a
    complete solution for dynamic file management.
