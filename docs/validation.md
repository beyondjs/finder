# Validation

The contracts of Finder and the tests that establish them. **Component test**: a `node:test` file run against the compiled public modules with no watcher. **Live**: the same with the real watchers service process. Inside the Beyond Suite, `node utils/validation/run.mjs finder` prepares both; [the tests guide](../tests/README.md) states the prerequisites.

| Contract or risk | Test | Observed |
| --- | --- | --- |
| Wildcard discovery, sorted; unwatched destroy | `discovery` 1 | nine files of the fixture in order; `watching` false; destroy does not throw |
| Literal includes in configured order; a missing one in `missing`, not an error | `discovery` 2 | order kept; `missing` names it; no error |
| `extname`, `filename`, predicate and excludes | `discovery` 3 | each narrows as documented; excludes reject a file, a directory and descendants |
| No duplicate between an explicit file and the wildcard; frozen `files` | `discovery` 4 | three by iteration and by `length`; `files` frozen |
| Missing root; non-string includes | `discovery` 5 | nothing found, wildcard missing, no error; two warnings, include removed, no crash |
| Validation and copied arrays | `discovery` 6 | non-string root, string arrays, non-string filename refused; the caller's array mutation does not change the finder |
| A symbolic-link loop terminates | `discovery` 7 | one leaf found, no error |
| Reconfiguration: equal skipped, mutation ignored, replacement destroys, disable, refused after destroy | `discovery` 8 | as documented |
| Collection item identity, removal, `clear()`, keys by directory, `has` by key and by path | `discovery` 9 | items reused; removed item destroyed; `clear` destroys |
| `FilesArray` invariants through push, delete, splice, filter | `discovery` 10 | keys consistent after `splice` |
| A watched finder follows add, unlink and content change | `live` 1 | membership and `change`; `file.change` with the member; a filtered-out file ignored |
| A burst announces once; a destruction announces at once, supersedes a pending announcement and nothing follows it | `live` 2 | with the runner's mock timers: nothing before the window ends, one `change` after it, one at the destruction, none after |
| Default items follow their content through the shared listener; identity kept when a directory joins | `live` 3 | item content updated; item reused; destroyed with the collection |
| A finder destroyed after its watcher client releases nothing twice | `live` 4 | no `already destroyed` warning |
| A watcher that cannot be registered leaves discovery answering, with `LISTENER_FAILED` | `live` 5 | files found; warning present; `watching` false |

## Not established

- Permission failures during a walk (`READ_ERROR`): not produced portably; read from source.
- Events for files created during the initial walk: the inclusion accepts a push while processing, but no test races a write against the walk.
- Very large trees and the cost of `stat` per entry: no measurement.
- The ordering of `file.change` relative to `change` when one write both adds and changes: not exercised.
