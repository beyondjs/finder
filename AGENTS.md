# finder agent instructions

Canonical instructions for this independent repository and its descendants. Read the local README and relevant guides before changing code. This utility is authored with Beyond and must preserve its public package and module boundaries.

`Finder.emit` reads `_events` from the mixin of `@beyond-js/dynamic-processor`, which exposes it through its prototype; keep the two in step. `destroy()` cancels the deferred change announcement and is safe without a watcher. A watcher that cannot be registered is the warning `LISTENER_FAILED` and never a failure of discovery. Collection keys are what `has` and `get` accept, items keep their identity across processings and the collection owns and destroys them. [Validation](docs/validation.md) maps each contract to its test; run the tests after a change.

**A repair here reaches a consumer only through sources that are served.** Packages resolves this package from the public registry in an ordinary installation. Its bootstrap can serve these sources instead, registered in the package configuration of the compiler and selected with `BEYOND_LOCAL_PACKAGES`, and `@beyond-js/packages-bootstrap` carries a copy of them so that a clean installation does so without any checkout. Delivering a change to an installation that keeps the registry-backed configuration, and to an image that was built before, still needs a new published version or a rebuild; that is an owner decision. The Beyond Suite record `docs/reviews/2026-09-22/packages-closure-evidence.md` holds the evidence for that date; it is an optional external reference, not a link from here.
- Preserve the selected branch, existing changes and public identifiers. Do not commit, push, reset, deploy or publish without explicit authorization.
- Use English for first-party documentation, comments and explanatory text. Preserve functional strings and generated/vendor content.
- Keep documentation autonomous: relative links stay inside this repository; external packages are described as contracts with optional references.
- Preserve the existing module/object programming structure. Internal files are not automatically public modules. Keep bare public imports intact.
- Distinguish source behavior, known defects, proposed changes and executed validation. Documentation work does not authorize implementation changes, dependency installations or service startup.
- Validate links, anchors and formatting for documentation edits. Run tests appropriate to actual code changes only.
- Follow the [coding standards](docs/coding-standards.md); they are binding for new and modified code. Source files target 300 lines or fewer and must not exceed 400. Model each responsibility as a class that owns `#private` state and exposes simply named members, composed from collaborating objects. Avoid compound names in methods, properties, variables and parameters by giving the responsibility its own object: `client.register()`, not `registerClient()`. Compound names remain allowed in class definitions. Preserve public contracts, and do not rewrite untouched files only to comply.

Documentation follows [the local documentation standards](docs/AGENTS.md).

The coordinated working branch is `feature/next`. Its base preserves the selected TypeScript implementation; do not switch back to historical source branches for ordinary work.
