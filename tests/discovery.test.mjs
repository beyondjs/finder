/**
 * Discovery without a watcher: literal includes and excludes, the recursive wildcard, the filters, the
 * order and identity of what is found, and the diagnostics of what is not.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Finder } from '@beyond-js/finder/main';
import { ConfigurableFinder } from '@beyond-js/finder/configurable';
import { FinderCollection } from '@beyond-js/finder/collection';
import { FilesArray } from '@beyond-js/finder/files';
import { FileData } from '@beyond-js/file/data';

const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixture');
const relative = finder => [...finder].map(file => file.relative.file);

test('the recursive wildcard finds every file under the root, sorted by relative path', async () => {
	const finder = new Finder(fixture, {});
	await finder.ready;
	assert.deepEqual(finder.includes, ['*']);
	assert.deepEqual(relative(finder), [
		'dir-a/mod-1/module.json', 'dir-a/mod-2/module.json', 'dir-b/mod-3/module.json', 'dir-b/mod-4/module.json',
		'root.txt', 'src/generated/build.ts', 'src/index.ts', 'src/other.ts', 'src/readme.md'
	]);
	assert.equal(finder.errors.length, 0);
	assert.equal(finder.watching, false);
	assert.doesNotThrow(() => finder.destroy(), 'an unwatched finder is destroyed cleanly');
});

test('includes are literal paths in the configured order; a missing one is reported in missing', async () => {
	const finder = new Finder(fixture, { includes: ['src', 'root.txt', 'absent/file.ts', 'dir-a'] });
	await finder.ready;
	assert.deepEqual(relative(finder), [
		'src/generated/build.ts', 'src/index.ts', 'src/other.ts', 'src/readme.md',
		'root.txt', 'dir-a/mod-1/module.json', 'dir-a/mod-2/module.json'
	]);
	assert.deepEqual(finder.missing, ['absent/file.ts']);
	assert.equal(finder.errors.length, 0, 'a missing include is not an error');
	finder.destroy();
});

test('extname, filename, excludes and a predicate narrow what is found', async () => {
	const ts = new Finder(fixture, { extname: '.ts', excludes: ['src/generated'] });
	await ts.ready;
	assert.deepEqual(relative(ts), ['src/index.ts', 'src/other.ts']);
	ts.destroy();

	const manifests = new Finder(fixture, { filename: 'module.json', includes: ['dir-b', 'dir-a'] });
	await manifests.ready;
	assert.deepEqual(relative(manifests), ['dir-b/mod-3/module.json', 'dir-b/mod-4/module.json', 'dir-a/mod-1/module.json', 'dir-a/mod-2/module.json']);
	manifests.destroy();

	const filtered = new Finder(fixture, { extname: ['.ts', '.md'], filter: file => file.basename !== 'readme' });
	await filtered.ready;
	assert.deepEqual(relative(filtered), ['src/generated/build.ts', 'src/index.ts', 'src/other.ts']);
	filtered.destroy();

	const excluded = new Finder(fixture, { excludes: ['src/index.ts', 'dir-a', 'dir-b'] });
	await excluded.ready;
	assert.deepEqual(relative(excluded), ['root.txt', 'src/generated/build.ts', 'src/other.ts', 'src/readme.md']);
	excluded.destroy();
});

test('an explicit file and the wildcard do not duplicate it in iteration, and files is a frozen aggregate', async () => {
	const finder = new Finder(fixture, { includes: ['src/index.ts', '*'], extname: '.ts' });
	await finder.ready;
	assert.deepEqual(relative(finder), ['src/index.ts', 'src/generated/build.ts', 'src/other.ts']);
	assert.equal(finder.length, 3, 'the wildcard excludes the other explicit includes');
	assert.equal(finder.files.length, 3);
	assert.ok(Object.isFrozen(finder.files));
	finder.destroy();
});

test('a missing root discovers nothing and reports no error; a non-string include is a warning', async () => {
	const finder = new Finder(join(fixture, 'absent'), { extname: '.ts' });
	await finder.ready;
	assert.deepEqual(relative(finder), []);
	assert.deepEqual(finder.missing, ['*']);
	assert.equal(finder.errors.length, 0);
	finder.destroy();

	const warned = new Finder(fixture, { includes: ['root.txt', 42, null] });
	await warned.ready;
	assert.deepEqual(warned.warnings.map(warning => warning.code), ['INCLUSION_NOT_A_STRING', 'INCLUSION_NOT_A_STRING']);
	assert.deepEqual(warned.includes, ['root.txt']);
	assert.deepEqual(relative(warned), ['root.txt']);
	assert.equal(warned.files.length, 1);
	warned.destroy();
});

test('the specification is validated, and the arrays of the caller are copied', async () => {
	assert.throws(() => new Finder(42, {}), /should be a string/);
	assert.throws(() => new Finder(undefined, undefined), /should be a string/);
	assert.throws(() => new Finder(fixture, { includes: 'src' }), /must be an array/);
	assert.throws(() => new Finder(fixture, { excludes: 'src' }), /must be an array/);
	assert.throws(() => new Finder(fixture, { filename: 3 }), /Filename/);
	const includes = ['root.txt'];
	const finder = new Finder(fixture, { includes });
	includes.push('src');
	await finder.ready;
	assert.deepEqual(relative(finder), ['root.txt']);
	finder.destroy();
});

test('a symbolic link that leads back into the tree terminates the search', async t => {
	const root = await realpath(await mkdtemp(join(tmpdir(), 'beyond-finder-loop-')));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, 'a', 'b'), { recursive: true });
	await writeFile(join(root, 'a', 'b', 'leaf.ts'), '');
	await symlink(join(root, 'a'), join(root, 'a', 'b', 'back'));
	const finder = new Finder(root, { extname: '.ts' });
	await finder.ready;
	assert.deepEqual(relative(finder), ['a/b/leaf.ts']);
	assert.equal(finder.errors.length, 0);
	finder.destroy();
});

test('a configurable finder replaces its finder on a different configuration and skips an equal one', async () => {
	const finder = new ConfigurableFinder();
	finder.configure(fixture, { extname: '.ts', excludes: ['src/generated'] });
	await finder.ready;
	assert.deepEqual(finder.map(file => file.relative.file), ['src/index.ts', 'src/other.ts']);
	const first = finder._finder;

	const spec = { extname: '.ts', excludes: ['src/generated'] };
	finder.configure(fixture, spec);
	assert.equal(finder._finder, first, 'an equal configuration keeps the finder');
	spec.excludes.push('mutated-afterwards');
	finder.configure(fixture, { extname: '.ts', excludes: ['src/generated'] });
	assert.equal(finder._finder, first, 'mutating the caller\'s object does not defeat the comparison');

	finder.configure(fixture, { filename: 'module.json' });
	assert.notEqual(finder._finder, first);
	assert.equal(first.destroyed, true, 'the replaced finder is destroyed');
	await finder.ready;
	assert.equal(finder.length, 4);

	finder.configure();
	await finder.ready;
	assert.equal(finder.length, 0, 'no configuration means nothing is found');
	assert.equal(finder.path, undefined);
	assert.throws(() => finder.configure(undefined, {}), /Invalid parameters/);
	finder.destroy();
	assert.throws(() => finder.configure(fixture, {}), /destroyed/);
});

test('a collection keeps item identity across processings, destroys removed items and its own on clear', async t => {
	const created = [];
	class Item {
		destroyed = false;
		constructor(collection, file) {
			this.file = file;
			created.push(this);
		}
		destroy() {
			this.destroyed = true;
		}
	}
	const root = await realpath(await mkdtemp(join(tmpdir(), 'beyond-finder-collection-')));
	t.after(() => rm(root, { recursive: true, force: true }));
	for (const name of ['one', 'two']) {
		await mkdir(join(root, name));
		await writeFile(join(root, name, 'module.json'), '{}');
	}
	const collection = new FinderCollection({ Item });
	collection.configure(root, { filename: 'module.json' });
	await collection.ready;
	assert.deepEqual([...collection.keys()], ['one', 'two'], 'filename-filtered collections are keyed by directory');
	assert.equal(collection.has('one'), true);
	assert.equal(collection.has(join(root, 'one', 'module.json')), true, 'a path is normalized to its key');
	assert.equal(collection.get('two').file.relative.file, 'two/module.json');
	assert.equal(created.length, 2);

	collection._invalidate();
	await collection.ready;
	assert.equal(created.length, 2, 'reprocessing reuses the items at the same keys');
	assert.equal(collection.get('one'), created[0]);

	await rm(join(root, 'two'), { recursive: true });
	collection.configure(root, { filename: 'module.json', excludes: ['nothing'] });
	await collection.ready;
	assert.deepEqual([...collection.keys()], ['one']);
	assert.equal(created[1].destroyed, true, 'an item no longer discovered is destroyed');

	collection.clear();
	assert.equal(created[0].destroyed, true, 'clear destroys the items it held');
	assert.equal(collection.size, 0);
	collection.destroy();
});

test('FilesArray keeps its keys consistent through push, delete, splice, filter and sort', () => {
	const files = new FilesArray('/root');
	const a = files.push('/root/b.ts', false);
	files.push('a.ts');
	assert.equal(files.push('b.ts'), undefined, 'a duplicate is not added and returns undefined');
	assert.equal(files.length, 2);
	assert.ok(a instanceof FileData);
	assert.deepEqual(files.map(file => file.relative.file), ['a.ts', 'b.ts'], 'push sorts by default');
	assert.equal(files.includes('a.ts'), true);
	assert.equal(files.indexOf('b.ts'), 1);
	assert.equal(files.find('b.ts').relative.file, 'b.ts');

	const removed = files.splice(0, 1);
	assert.equal(removed[0].relative.file, 'a.ts');
	assert.equal(files.includes('a.ts'), false, 'splice forgets the key of what it removed');
	assert.ok(files.push('a.ts'), 'so it can be added again');
	assert.equal(files.delete('a.ts'), true);
	assert.equal(files.delete('a.ts'), undefined);
	assert.equal(files.filter(file => file.extname === '.ts').length, 1);
	assert.throws(() => files.normalize(42), /Invalid file parameter/);
	assert.throws(() => new FilesArray('').push('x'), /not configured/);
});
