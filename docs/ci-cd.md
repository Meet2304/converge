# CI/CD pipeline

Converge uses one quality contract locally, in GitHub Actions, and during Vercel builds. A
deployment cannot complete unless the same checks pass in this order:

1. Install the exact dependencies from `bun.lock` with Bun 1.4.2.
2. Run `biome format .` as an explicit full-codebase formatting check.
3. Run `biome ci .` for lint rules, import organization, and Biome's combined CI verification.
4. Run TypeScript in no-emit mode.
5. Run the Bun test suite. The command succeeds while the repository has no tests and starts
   enforcing them automatically as soon as test files are added.
6. Audit production dependencies for high or critical vulnerabilities.
7. Build the production Next.js application.

## Local commands

```bash
bun install --frozen-lockfile
bun run format       # format the entire supported codebase before opening or updating a PR
bun run format:check # verify formatting without changing files
bun run check        # report Biome issues
bun run check:fix    # apply safe formatting, lint, and import fixes
bun run typecheck
bun run test
bun run audit
bun run build
bun run ci           # run the complete deployment gate
```

Use the repository-pinned Bun version from `package.json`. Biome is an exact development
dependency so local and CI diagnostics remain identical.

## GitHub Actions

`.github/workflows/ci.yml` runs on every pull request, every push to `main`, and manual dispatch.
The `Verify` job uses a frozen lockfile and executes every quality gate. Pull requests also run
GitHub's dependency review and fail when a changed dependency introduces a high or critical
advisory.

The GitHub repository protects `main` and requires these checks before merge:

- `CI / Verify`
- `CI / Dependency review`
- `Vercel`

The rule uses strict status checks and applies to administrators, so direct pushes cannot bypass the
pipeline. If a check name changes in this workflow, update the branch protection rule at the same
time.

## Vercel delivery

Vercel remains the deployment provider described in the stack documentation. Its Git integration
creates previews for branches and production deployments from `main`. `vercel.json` runs
the exact Bun 1.4.2 binary through `bunx` for both install and `bun run ci`, so Biome, types, tests,
the dependency audit, and the production build all pass before Vercel can publish a deployment.

Keep the Vercel project connected to `Meet2304/converge`, with `main` selected as the production
branch. No GitHub deployment secrets are required for this Git-based delivery path.
