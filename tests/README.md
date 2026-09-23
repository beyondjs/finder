# Tests

`node:test` files importing the public modules of this package under BEE Node from an Engine development server, with `@beyond-js/dynamic-processor`, `@beyond-js/file`, `@beyond-js/equal` and `@beyond-js/watchers` served or installed. `live.test.mjs` starts the real watchers service process and needs `@beyond-js/ipc` and `chokidar` resolvable from the working directory. `fixture/` is the permanent tree `discovery.test.mjs` reads and never writes.

```sh
BEE_URL=<servers> BEE_ADAPTER=engine node --import "$BEE_NODE_DIR/register.mjs" --test tests/*.test.mjs
```

Inside the Beyond Suite, `node utils/validation/run.mjs finder` prepares the servers and runs every file. [The validation guide](../docs/validation.md) maps each file to its contracts.

## Conventions

These files follow the normative conventions of the Beyond Suite testing guide (testing v1): Node's own test runner, one process per file; the public specifier a consumer imports and never a source file; readiness, events and answers awaited rather than time, with the runner's timeout bounding every wait; whatever a test creates (a directory, a process, a service) removed with `t.after`, on failure as well; and outcomes asserted, error paths by their diagnostic code where the object reports one. They are not run by `beyond test`: that command tests the packages Packages compiles, and this one is compiled by Engine, so the runner is given the loader and the servers instead. For the same reason the files sit in `tests/` and not beside the module sources, since Engine takes every file of a module directory as an input.

The deferred announcement of a finder is a ten-millisecond timer; `live.test.mjs` moves it with the runner's mock timers (`t.mock.timers`) instead of waiting for it.

## Fixtures

`fixture/` is the permanent tree `discovery.test.mjs` reads in place and never writes. It sits outside `modules/`, so Engine never takes it as a module input, and keeps the name `fixture/` because the test files refer to it by that name. Its nine files each hold one line; the tests assert which of them a specification selects.

| Path | Role |
| --- | --- |
| `fixture/root.txt` | A file at the root, for explicit includes |
| `fixture/src/index.ts`, `fixture/src/other.ts` | The `.ts` sources an extension filter finds |
| `fixture/src/readme.md` | A second extension and the target of a `filter` function |
| `fixture/src/generated/build.ts` | A nested source an exclusion removes |
| `fixture/dir-a/mod-1/module.json`, `fixture/dir-a/mod-2/module.json`, `fixture/dir-b/mod-3/module.json`, `fixture/dir-b/mod-4/module.json` | Manifests a `filename` search finds, in the order of the included directories |

## Inline inputs

`discovery.test.mjs` builds its symbolic-link loop and its manifest collection, and `live.test.mjs` the files it watches, in unique temporary directories (`mkdtemp`) from one-line writes, removing them with `t.after`. These are small inputs and short edits, so they stay inline.

## Test organization and source fixtures

These rules are shared by every Beyond repository.

- Contract/unit and integration tests live in `test/` or `tests/`; complete journeys against an installed, composed or exported product live in `acceptance/`, with a README of their own. Harness infrastructure (servers, registries, process lifecycle, copying and substitution) lives in a `support/` directory of the consuming area.
- Applications, packages, modules, documents and assets a test exercises are checked-in files with their real extensions and directory structure under the consuming area's `fixtures/`. Each fixture group has a README naming its purpose, entry modules, the tests that use it, their command, the expected behavior and any intentionally invalid part. A reader inspects the example without running or decoding a generator.
- A harness copies the fixtures it runs or edits to a unique temporary directory, substitutes only explicit values such as versions, ports or origins, and never writes the checked-in files, even when a run fails. Credentials, machine paths and build output are never fixture source.
- Small input values, expected values, protocol payloads and short edits stay inline. Source is generated only when generation is the behavior under test (size or memory stress, combinations, deliberately malformed input); the guide states why, the parameters that reproduce it and how to inspect what was generated.
- Fixtures stay out of the repository's production compilation, discovery and packaging.
- Migrating a test preserves its scenario identities, its positive, negative and recovery cases and its real execution path; an existing failure stays reported as a failure.
