const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { Finder } = await bimport('@beyond-js/finder/main');
	const path = join(__dirname, 'files');
	const finder = new Finder(path, { extensions: ['.ts'], includes: ['index.ts', 'shouldnt-exist.ts'] });
	await finder.ready;

	console.log('Finder files count:', finder.files.length);
	console.log(
		'Finder files found:',
		[...finder.files].map(file => file.relative.file)
	);
	console.log(
		'Finder missing entries:',
		[...finder.missing].map(entry => entry)
	);
})().catch(exc => console.error(exc.stack));
