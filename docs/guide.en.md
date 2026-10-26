## What it's for

`JSON.parse` accepts duplicate keys and silently keeps the last one: a configuration can contain `"timeout": 5` then `"timeout": 50` and no tool will complain. This script validates every JSON file in a folder, reports the **line and column** of syntax errors and flags those duplicates.

## Before you start

- A folder (or a file) to check. `node_modules`, `.git` and build folders are skipped.

## Step by step

1. Check a whole project:
   ```bash
   node src/json-lint.mjs ./my-project
   ```
2. For files that tolerate comments and trailing commas (`tsconfig.json`, editor settings), add `--jsonc`.
3. Fix using the line and column shown.

## Reading the output

One `✗ file:line:column message` per problem. A duplicate key is reported with its path (`$.options.timeout`).

## Automating it

As a pre-commit hook or in CI: the exit code is 2 at the first problem.

## Pitfalls

- Without `--jsonc`, a commented `tsconfig.json` is (rightly) reported as invalid: it is not strict JSON.
- The script does not check the expected **structure** (schema), only syntax and duplicates.
