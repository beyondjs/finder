/**
 * A finder and a collection followed through the real watchers service: membership changes, content
 * announcements, the deferred announcement after destruction, and a watcher that cannot be registered.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WatchersService } from '@beyond-js/watchers/service';
import { WatcherClient } from '@beyond-js/watchers/client';
import { Finder } from '@beyond-js/finder/main';
import { FinderCollection } from '@beyond-js/finder/collection';

const NAME = 'watchers-finder-test';
const service = new WatchersService(NAME);
before(() => service.start());
after(() => service.stop());

/**
 * Resolves once the observed state holds, or fails naming what did not happen: a bounded wait over state
 * the objects expose, checked every few milliseconds, never a wait for time
 */
async function until(condition, what, ms = 8000) {
	const deadline = Date.now() + ms;
	while (!condition()) {
		if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
		await new Promise(resolve => setTimeout(resolve, 10));
	}
}
/** A temporary directory of one test, removed when the test ends, on failure as well */
async function temporary(t) {
	const dir = await realpath(await mkdtemp(join(tmpdir(), 'beyond-finder-live-')));
	t.after(() => rm(dir, { recursive: true, force: true }));
	return dir;
}
const relative = finder => [...finder].map(file => file.relative.file);

test('a watched finder follows additions, removals and content changes', async t => {
	const dir = await temporary(t);
	await writeFile(join(dir, 'one.ts'), '1');
	const client = new WatcherClient(NAME, { is: 'test', path: dir });
	const finder = new Finder(dir, { extname: '.ts' }, client);
	await finder.ready;
	await until(() => finder.watching, 'the listener to register');
	assert.deepEqual(relative(finder), ['one.ts']);

	const announced = [];
	finder.on('change', () => announced.push('change'));
	finder.on('file.change', file => announced.push(`file.change ${file.relative.file}`));

	await writeFile(join(dir, 'two.ts'), '2');
	await until(() => finder.processed && relative(finder).length === 2, 'the added file');
	await until(() => announced.includes('change'), 'the change announcement');
	assert.deepEqual(relative(finder), ['one.ts', 'two.ts']);

	// The listener delivers the events of one directory in order, so once the file written after it is a
	// member, the event of the filtered file has been handled
	await writeFile(join(dir, 'ignored.md'), 'x');
	await writeFile(join(dir, 'three.ts'), '3');
	await until(() => relative(finder).includes('three.ts'), 'the file written after the filtered one');
	assert.deepEqual(relative(finder), ['one.ts', 'three.ts', 'two.ts'], 'a file outside the filter is not a member');

	await writeFile(join(dir, 'one.ts'), '1 changed');
	await until(() => announced.includes('file.change one.ts'), 'the content announcement');

	await rm(join(dir, 'two.ts'));
	await until(() => relative(finder).length === 2, 'the removal');
	assert.deepEqual(relative(finder), ['one.ts', 'three.ts']);
	finder.destroy();
	await client.destroy();
});

test('a destruction supersedes a deferred announcement: one change at the destruction, nothing afterwards', async t => {
	// The announcement of a change is deferred by a timer; the runner's mock timers move time explicitly
	const dir = await temporary(t);
	const finder = new Finder(dir, { extname: '.ts' });
	await finder.ready;
	const heard = [];
	finder.on('change', () => heard.push(finder.destroyed ? 'destroyed' : 'change'));

	t.mock.timers.enable({ apis: ['setTimeout'] });
	finder.emit('change');
	finder.emit('change');
	assert.deepEqual(heard, [], 'the announcement is deferred');
	t.mock.timers.tick(10);
	assert.deepEqual(heard, ['change'], 'and a burst is delivered once when its window ends');

	finder.emit('change');
	finder.destroy();
	assert.deepEqual(heard, ['change', 'destroyed'], 'the destruction announces at once, replacing the pending one');
	t.mock.timers.tick(10);
	assert.deepEqual(heard, ['change', 'destroyed'], 'nothing is announced after the destruction');
	t.mock.timers.reset();
});

test('default collection items follow their content through the shared listener', async t => {
	const dir = await temporary(t);
	await mkdir(join(dir, 'mod'));
	await writeFile(join(dir, 'mod', 'module.json'), '{"v": 1}');
	const client = new WatcherClient(NAME, { is: 'test', path: dir });
	const collection = new FinderCollection({ watcher: client });
	collection.configure(dir, { filename: 'module.json' });
	await collection.ready;
	const item = collection.get('mod');
	await item.ready;
	assert.equal(item.content, '{"v": 1}');
	assert.equal(item.watching, true, 'the default item is subscribed through the collection listener');

	await until(() => collection.listener && item.watching, 'the subscription');
	await writeFile(join(dir, 'mod', 'module.json'), '{"v": 2}');
	await until(() => item.content === '{"v": 2}', 'the content of the item to follow the file');

	await mkdir(join(dir, 'other'));
	await writeFile(join(dir, 'other', 'module.json'), '{}');
	await until(() => collection.has('other'), 'the new directory to join the collection');
	assert.equal(collection.get('mod'), item, 'the existing item kept its identity');

	collection.destroy();
	assert.equal(item.destroyed, true);
	await client.destroy();
});

test('a finder destroyed after its watcher client releases nothing twice', async t => {
	const dir = await temporary(t);
	await writeFile(join(dir, 'one.ts'), '1');
	const client = new WatcherClient(NAME, { is: 'test', path: dir });
	const finder = new Finder(dir, { extname: '.ts' }, client);
	await finder.ready;
	await until(() => finder.watching, 'the listener to register');

	const warn = t.mock.method(console, 'warn');
	await client.destroy();
	finder.destroy();
	assert.equal(warn.mock.callCount(), 0, 'the listener the client already released is not destroyed again');
});

test('a watcher that cannot be registered leaves the finder answering, with the failure in its warnings', async t => {
	const dir = await temporary(t);
	await writeFile(join(dir, 'one.ts'), '1');
	const client = new WatcherClient('watchers-absent', { is: 'test', path: dir });
	const finder = new Finder(dir, { extname: '.ts' }, client);
	await finder.ready;
	assert.deepEqual(relative(finder), ['one.ts'], 'discovery does not depend on the watcher');
	await until(() => finder.warnings.length, 'the warning');
	assert.equal(finder.warnings[0].code, 'LISTENER_FAILED');
	assert.equal(finder.watching, false);
	finder.destroy();
	await client.destroy();
});
