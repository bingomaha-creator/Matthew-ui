# Releasing Matthew UI

The repository is prepared for npm Trusted Publishing, but publishing remains
disabled while `package.json` contains `"private": true`.

## One-time repository setup

1. In GitHub, set **Settings -> Pages -> Source** to **GitHub Actions**.
2. Protect the `github-pages` environment so only `main` can deploy.
3. Create an `npm-release` environment, restrict it to version tags, and add a
   required reviewer.
4. In npm package settings, configure a Trusted Publisher with these exact
   values:
   - Organization or user: `bingomaha-creator`
   - Repository: `Matthew-ui`
   - Workflow filename: `publish.yml`
   - Environment: `npm-release`
5. After Trusted Publishing works, require two-factor authentication and
   disallow token-based publishing in the npm package settings.

The npm documentation does not currently guarantee that Trusted Publishing can
bootstrap a package name that has never been published. Before the first
release, check whether npm exposes the Trusted Publisher settings for
`matthew-ui`. If it does not, choose and explicitly approve a one-time local OTP
or short-lived granular-token publication, then configure OIDC and revoke the
token immediately.

## Prepare a release

1. Update the version in `package.json` and `package-lock.json`.
   The first release flow accepts stable `x.y.z` versions only.
2. Remove `"private": true` in the release commit.
3. Merge the release commit to `main`.
4. Run `git fetch --prune origin main --tags`, then ensure local `main` exactly
   matches `origin/main`.
5. Create `v<version>` on that commit.
6. Set `MATTHEW_UI_RELEASE_CONFIRMATION` to the literal package and version,
   such as `matthew-ui@0.1.0`. Do not derive this value in a script.
7. Run `npm run release:check`.
8. Run `npm run release:dry-run` and inspect the tarball manifest.
9. Confirm the exact package and version again, then push the version tag and
   publish a stable GitHub Release for that tag.

Publishing a stable GitHub Release triggers `.github/workflows/publish.yml`.
The workflow checks the version, tag, branch synchronization, package contents,
types, tests, Storybook, and real React 18/19 consumption before npm receives
the package. Prereleases are intentionally skipped.

Do not add a long-lived `NPM_TOKEN`. The publish job uses GitHub's short-lived
OIDC identity and has only `contents: read` and `id-token: write` permissions.
The `prepublishOnly` hook prevents accidental normal publishes, but it is not a
security boundary: `npm publish --ignore-scripts` and publishing a prebuilt
tarball can bypass it. Trusted Publishing, protected GitHub environments, and
disallowing token-based publishing are the final enforcement layer.
