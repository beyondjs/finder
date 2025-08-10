# `@beyond-js/finder/main`

A powerful and flexible file finder utility for Node.js applications. This module defines the core `Finder` class, which
can search for files based on a set of specifications and listen for changes.

---

# API

## `constructor(path: string, specs: object, watcher?: object)`

Creates a new `Finder` instance.

-   `path`: The root directory to search in.
-   `specs`: An object defining the search criteria.
    -   `includes`: An array of file or directory patterns to include in the search (e.g., `['*.js', 'src/**/*.ts']`).
    -   `excludes`: An array of file or directory patterns to exclude from the search (e.g.,
        `['node_modules', 'dist']`).
    -   `filename`: A specific filename to search for.
    -   `extname`: A string or array of strings representing file extensions to search for.
    -   `filter`: A function to apply custom filtering logic.
-   `watcher`: (Optional) An object to listen for file changes, enabling real-time updates.

## `on(event: string, callback: function)`

Listens for a specific event. The primary event is `'file.change'`, which is emitted when a watched file is modified.

## `files`

A getter that returns a `Files` object (an array-like collection) containing all files found by the `Finder` that match
the given specifications.

## `errors`

A getter that returns an array of any errors encountered during the search process.

---

# Features

-   **Flexible Searching**: Supports include/exclude patterns, specific filenames, and file extensions.
-   **File Watching**: Can be configured to listen for file changes in the specified directory.
-   **Asynchronous Processing**: The search is handled asynchronously, preventing blocking operations.
-   **Error Handling**: Exposes any errors that occur during the search.
-   **Iterable**: The `Finder` instance is iterable, allowing you to loop through the files it has found.
