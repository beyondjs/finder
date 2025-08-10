# `@beyond-js/finder/configurable`

This module defines the `ConfigurableFinder` class, which extends the core `Finder` with the ability to dynamically
update its configuration without needing to create a new instance. It's designed for scenarios where search parameters
need to be changed at runtime.

---

# API

## `constructor(watcher: object)`

Creates a new `ConfigurableFinder` instance.

-   `watcher`: The file watcher instance that the finder will use to monitor file changes.

## `configure(path: string, specs: object)`

Configures or reconfigures the finder with new search parameters.

-   `path`: The new root directory for the search.
-   `specs`: An object with the new search specifications, following the same format as the `Finder` class constructor.

---

# Features

-   **Dynamic Configuration**: Easily change the search path, includes/excludes, filenames, and extensions after
    instantiation.
-   **File Watching Integration**: Works with a provided watcher instance to listen for file system changes and
    re-process the files automatically when the configuration changes.
-   **Inherited Functionality**: Inherits all the core features from the `Finder` class, such as file searching, error
    handling, and file collection management.
