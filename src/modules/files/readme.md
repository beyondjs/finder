# `@beyond-js/finder/files`

A class that extends `Array` to manage a collection of file objects, ensuring each file has a unique relative path. It
provides methods for adding, deleting, and searching for files within a specified root directory.

---

# API

## `constructor(root: string)`

Creates a new `Files` instance tied to a specific root directory.

## `push(file: object, sort?: boolean)`

Adds a file object to the array. If the file already exists, it is not added again. An optional `sort` parameter can be
used to sort the array after adding the file.

## `delete(file: object)`

Removes a file object from the array.

## `includes(file: object)`

Checks if a file exists in the collection.

## `find(file: object)`

Returns a file object from the collection if it exists.

## `append(files: Files, sort?: boolean)`

Adds all the files from another `Files` instance to the current collection. An optional `sort` parameter can be used to
sort the array after appending.

## `clear()`

Removes all files from the collection.

---

### Features

-   Manages unique files by their relative path.
-   Extends the native `Array` class for easy use.
-   Provides methods to manage the file collection efficiently.
-   Includes functionality to work with absolute and relative paths.
