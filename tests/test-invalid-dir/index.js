const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { Finder } = await bimport('@beyond-js/finder/main');
	const path = 'invalid-path';
	const finder = new Finder(path, { extensions: ['.txt'] });
	await finder.ready;

	console.log('Files found:', finder.files);
	console.log('Files missing:', finder.missing);
})().catch(exc => console.error(exc.stack));
