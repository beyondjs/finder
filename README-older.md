# @beyond-js/finder

A powerful and flexible file finder utility for Node.js applications.

## Installation

```bash
npm install @beyond-js/finder
```

## Usage

```javascript
const { Finder, ConfigurableFinder, FinderCollection } = require('@beyond-js/finder');

// Basic usage with Finder
const finder = new Finder('/path/to/search', {
	includes: ['*.js', 'src/**/*.ts'],
	excludes: ['node_modules', 'dist'],
	filename: 'config',
	extname: ['.json', '.yaml']
});

finder.on('file.change', file => {
	console.log('File changed:', file);
});

// Using ConfigurableFinder
const configurableFinder = new ConfigurableFinder(watcherInstance);
configurableFinder.configure('/path/to/search', {
	includes: ['**/*.js'],
	excludes: ['node_modules']
});

// Using FinderCollection
class MyCollection extends FinderCollection {
	constructor(watcher) {
		super(watcher, MyItemClass);
	}
}

const collection = new MyCollection(watcherInstance);
collection.configure('/path/to/search', {
	includes: ['**/*.config.js']
});

collection.ready.then(() => {
	for (const [key, item] of collection) {
		console.log(key, item);
	}
});
```

## API

### Finder

-   `constructor(path: string, specs: object)`
-   `on(event: string, callback: function)`: Listen for file changes

### ConfigurableFinder

-   `constructor(watcher: object)`
-   `configure(path: string, specs: object)`: Set up the finder configuration

### FinderCollection

-   `constructor(watcher: object, Item: class)`
-   `configure(path: string, specs: object)`: Set up the collection configuration
-   `ready`: Promise that resolves when the collection is ready

## Features

-   Flexible file searching with include/exclude patterns
-   File watching capabilities
-   Configurable finder for dynamic search configurations
-   Collection support for managing groups of found items
-   Asynchronous processing with Promise support

## License

MIT © [[BeyondJS](https://beyondjs)]
