# @beyond-js/finder

@beyond-js/finder is a lightweight utility that makes file discovery in Node.js projects simple and efficient. Connected
to @beyond-js/watchers, it works in real time — detecting changes instantly and keeping your file queries always up to
date. Ideal for build tools, live development environments, or any workflow that needs dynamic file tracking.

---

### Modules

The package is composed of the following main modules:

-   [main](./modules/main/README.md): The core search functionality, which defines the `Finder` class.
-   [configurable](./modules/configurable/README.md): Provides a class (`ConfigurableFinder`) for dynamically
    reconfiguring the search.
-   [collection](./modules/collection/README.md): Manages a collection of items found by the `Finder`.
-   [files](./modules/files/README.md): A base class for handling file collections efficiently.
