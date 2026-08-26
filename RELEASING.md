# Releasing Matthew UI

## Current state

- `matthew-ui@0.1.0` is published on npm with `latest=0.1.0`.
- Registry `gitHead` and remote `v0.1.0` resolve to `baa1c6d`. The release
  was created from `main` at that commit.
- `0.1.0` was a one-time local bootstrap publish because a brand-new package
  cannot configure Trusted Publishing or use npm Staged Publishing first.
- `v0.1.0` intentionally has no GitHub Release. Creating one with the current
  workflow would try to publish the already-existing npm version again.
- GitHub Pages, `github-pages`, and the protected `npm-release` environment are
  configured. The npm Trusted Publisher is configured for future releases.

The first normal OIDC release will be the first version after `0.1.0`.

## Security model

The npm Trusted Publisher must use these exact, case-sensitive values:

- Organization or user: `bingomaha-creator`
- Repository: `Matthew-ui`
- Workflow filename: `publish.yml`
- Environment: `npm-release`
- Allowed action: `npm publish`

The `npm-release` GitHub environment is restricted to `v*` tags, has a required
reviewer, and does not allow admin bypass. npm Publishing access requires 2FA
and disallows bypass-2FA tokens. Do not add a long-lived `NPM_TOKEN` and do not
stay logged in to npm locally for normal releases.

## Prepare a stable release

The repository currently accepts stable `x.y.z` versions only. The following
example releases `0.1.1`; replace it with the exact version chosen for the next
release.

1. Start from a clean and current `main`, then run the normal quality gate:

   ```bash
   git switch main
   git pull --ff-only origin main
   git status --short --branch
   npm run quality:check
   ```

2. Update `package.json` and `package-lock.json` without creating a commit or tag
   implicitly:

   ```bash
   npm version 0.1.1 --no-git-tag-version
   git diff -- package.json package-lock.json
   ```

3. Commit and push the release version, then wait for the `main` CI run to pass:

   ```bash
   git add package.json package-lock.json
   git commit -m "chore: release v0.1.1"
   git push origin main
   ```

4. Freeze `main` until the publish workflow finishes. The release guard requires
   the release tag commit to remain equal to `origin/main`.

5. Refresh refs and verify synchronization:

   ```bash
   git fetch --prune --tags origin
   git rev-parse HEAD
   git rev-parse origin/main
   ```

   The two commit values must be identical. Stop before creating a tag if they
   differ. After confirming they match, create the annotated local tag:

   ```bash
   git tag -a v0.1.1 -m "Release v0.1.1"
   git rev-parse v0.1.1^{commit}
   ```

   The tag commit must match the two values above. Do not push the tag yet.

6. Type the literal package confirmation and run both release gates:

   ```bash
   export MATTHEW_UI_RELEASE_CONFIRMATION=matthew-ui@0.1.1
   npm run release:check
   npm run release:dry-run
   unset MATTHEW_UI_RELEASE_CONFIRMATION
   ```

   Inspect the dry-run package name, version, access, file list, entry points,
   and size. Do not generate the confirmation value from `package.json`; its
   purpose is to force a human to read the exact package and version.

7. Push only the verified tag:

   ```bash
   git push origin refs/tags/v0.1.1
   ```

8. In GitHub Releases, create a release from the existing `v0.1.1` tag. It must
   be published, non-draft, and non-prerelease.

9. The `Publish package` workflow will wait for the `npm-release` environment.
   Before approving, the reviewer checks the already-green `main` CI, package
   version, tag, Release, and commit. Select **Approve and deploy** only when all
   five agree.

The environment is attached to the whole publish job. Approval therefore occurs
before checkout, install, fresh release checks, and `npm publish`, not between
the checks and upload. After approval, `prepublishOnly` reruns the complete
release and quality gates; a failure stops the upload.

GitHub Actions recognizes the exact release-event/tag context, so it does not
need `MATTHEW_UI_RELEASE_CONFIRMATION`. The publish job uses a short-lived OIDC
identity with only `contents: read` and `id-token: write` permissions.

## Verify the release

Wait for the `Publish package` workflow to finish successfully, then verify the
registry independently:

```bash
npm view matthew-ui@0.1.1 version gitHead dist.integrity dist.tarball --json
npm view matthew-ui dist-tags.latest
npm pack matthew-ui@0.1.1 --dry-run --json
git rev-parse v0.1.1^{commit}
```

Confirm that:

- npm `gitHead` equals the release tag commit;
- `latest` points to the new stable version;
- the registry tarball contains the expected public files;
- the npm page shows GitHub Actions provenance;
- the stable GitHub Release exists and links to the same tag.

Only after these checks pass may development advance `main` again.

## Failure recovery

If the workflow fails, first query the registry:

```bash
npm view matthew-ui@0.1.1 version
```

- If the version does not exist and the failure is an external OIDC/environment
  configuration problem, fix the configuration and rerun the same job without
  moving the pushed tag.
- If the version already exists, do not rerun `npm publish`. Reconcile the npm
  metadata and workflow result first.
- If an unpushed local tag exists and a fix creates a new commit, delete only
  that local tag with `git tag -d v0.1.1`, repeat the synchronization checks,
  and create it again. Never force-push it.
- If the tag or Release is already public and `origin/main` has advanced, do
  not rerun the old workflow, reset `main`, or move the public tag. Prepare a
  new version from the new `main` instead, even if this leaves a version gap.
- Never overwrite an npm version. A code fix after a published release requires
  a new patch, minor, or major version.
- Do not move a public release tag. If code must change after the tag is pushed,
  prepare a new version instead.

`prepublishOnly` prevents accidental normal publishes, but it is not a security
boundary: `npm publish --ignore-scripts` and publishing a prebuilt tarball can
bypass it. Trusted Publishing, protected GitHub environments, and restricted
npm publishing access are the final enforcement layers.
