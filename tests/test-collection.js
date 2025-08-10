const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { FinderCollection } = await bimport('@beyond-js/finder/collection');
	const path = join(process.cwd(), 'files');
	const finder = new FinderCollection();
	finder.configure(path, { extensions: ['.ts'], includes: ['index.ts', 'another.ts'] });
	await finder.ready;

	console.log('Finder collection files count:', finder.size);
	console.log(
		'Finder collection files found:',
		[...finder.values()].map(file => file.relative.file)
	);
})().catch(exc => console.error(exc.stack));
