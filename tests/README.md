# Tests

`node:test` files importing the public modules of this package under BEE Node from an Engine development server, with `@beyond-js/dynamic-processor`, `@beyond-js/file`, `@beyond-js/equal` and `@beyond-js/watchers` served or installed. `live.test.mjs` starts the real watchers service process and needs `@beyond-js/ipc` and `chokidar` resolvable from the working directory. `fixture/` is the permanent tree `discovery.test.mjs` reads and never writes.

```sh
BEE_URL=<servers> BEE_ADAPTER=engine node --import "$BEE_NODE_DIR/register.mjs" --test tests/*.test.mjs
```

Inside the Beyond Suite, `node utils/validation/run.mjs finder` prepares the servers and runs every file. [The validation guide](../docs/validation.md) maps each file to its contracts.

## Conventions

These files follow the normative conventions of the Beyond Suite testing guide (testing v1): Node's own test runner, one process per file; the public specifier a consumer imports and never a source file; readiness, events and answers awaited rather than time, with the runner's timeout bounding every wait; whatever a test creates (a directory, a process, a service) removed with `t.after`, on failure as well; and outcomes asserted, error paths by their diagnostic code where the object reports one. They are not run by `beyond test`: that command tests the packages Packages compiles, and this one is compiled by Engine, so the runner is given the loader and the servers instead. For the same reason the files sit in `tests/` and not beside the module sources, since Engine takes every file of a module directory as an input.

The deferred announcement of a finder is a ten-millisecond timer; `live.test.mjs` moves it with the runner's mock timers (`t.mock.timers`) instead of waiting for it.
