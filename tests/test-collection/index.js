const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { FinderCollection } = await bimport('@beyond-js/finder/collection');

	const finder = new FinderCollection();
	const path = __dirname;
	finder.configure(path, { extensions: ['.ts'], includes: ['*'], filename: 'module.json' });
	await finder.ready;

	console.log('Finder collection files count:', finder.size);
	console.log(
		'Finder collection files found:',
		[...finder.values()].map(file => file.relative.file)
	);

	const expected = 'dir-a/mod-1/module.json';
	const found = finder.has(expected);
	console.log(`File ${expected} found:`, found);
})().catch(exc => console.error(exc.stack));
