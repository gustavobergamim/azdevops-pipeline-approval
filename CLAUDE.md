# CLAUDE.md

Azure DevOps extension ("Releases Approval Dashboard") that adds an **Approve Releases** hub under Pipelines, listing classic Release approvals pending for the current user and approving/rejecting/deferring them one by one or in batch.

## Stack

- TypeScript + React 16, `azure-devops-ui` components, `azure-devops-extension-sdk` / `azure-devops-extension-api` (v5, REST `api-version/7.2` demand in the manifest).
- Bundled with webpack 5. Every folder directly under `src/` is an entry point (`src/<name>/<name>.tsx` → `dist/<name>/<name>.js`); HTML files are copied as-is. Today there is only `src/hub`.
- Import alias `@src-root/*` → `src/*` (tsconfig `paths` + `TsconfigPathsPlugin`).
- No test suite or linter is configured. Verify changes with `npm run compile` (type-checks via ts-loader).

## Layout

- `src/hub/hub.tsx` – hub page entry, header command bar, filters toggle (`?filters=true` query string, set by the `release-approval-stage-grouping` feature flag).
- `src/hub/components/` – `grid/` (approvals grid and its cells), `form/` (approve/reject/defer dialogs).
- `src/hub/services/` – REST wrappers (`release-approval.service.ts`, `release.service.ts`), extension data storage (`user.service.ts`), `localStorage` (`local-storage.service.ts`), grid item provider.
- `src/hub/model/` – events (`ReleaseApprovalEvents`), actions, colors, date picker types.
- `vss-extension.json` – manifest (contributions, scopes, feature flags). **Its `version` is the single source of truth for the extension version.**
- `configs/{dev,qa,prod}.json` – tfx `--overrides-file` per environment (extension id, name, visibility; dev points `baseUri` to `http://localhost:3000`).

## Commands

```shell
npm install
npm run compile        # production build to dist/
npm run start:dev      # webpack-dev-server on :3000 (dev extension loads from it)
npm run publish:dev    # build + publish the private dev extension; needs AZ_DEVOPS_MARKETPLACE_PAT
npm run package:qa     # out/qa/*.vsix (expects dist/ already built)
npm run package:prod   # out/prod/*.vsix
```

Manifest changes only take effect in Azure DevOps after republishing; code changes hot-reload through the dev server.

## CI/CD (Azure Pipelines)

Org/project: `https://dev.azure.com/gustavobergamim/AzureDevOpsExtensions`, folder `\PipelineApproval`.

- `azure-pipelines-ci.yml` → pipeline **PipelineApproval_GitHub_CI**: runs on master/develop pushes, PRs, and weekly. Uses `azure-pipelines/build-steps.yml`.
- `azure-pipelines.yml` → pipeline **PipelineApproval_GitHub** (manual): build & pack, then `azure-pipelines/marketplace-publish.yml` for the **QA** environment (private `pipeline-approval-qa`, shared with `gustavobergamim` and `vstssprints`) and then **Production** (`pipeline-approval`). Publish stages run as deployment jobs against the `QA`/`Production` environments (QA has an approval check).
- Release version is read from `vss-extension.json` and appended to the run name; bump `version` there for every release (Marketplace rejects re-publishing an existing version).
- Marketplace publishing uses the `VS MarketPlace` service connection (`connectTo: VsTeam`). Publishing doesn't wait for validation; `IsAzureDevOpsExtensionValid@5` polls for up to `validationTimeoutMinutes` (default 30), because tfx's built-in validation wait is short and not configurable.
- SonarCloud steps (service connection `SonarCloud`, org `azuredevopsextensions`) are skipped on fork PRs, where secrets aren't available.
- Keep pipeline tasks on current major versions; Azure DevOps flags deprecated tasks and tasks running on end-of-life Node handlers (6/10/16). Check run warnings with:

  ```shell
  az devops invoke --area build --resource timeline \
    --route-parameters project=AzureDevOpsExtensions buildId=<id> \
    --org https://dev.azure.com/gustavobergamim
  ```

  and installed task versions/handlers with `az devops invoke --area distributedtask --resource tasks --org https://dev.azure.com/gustavobergamim`.
- Validate pipeline YAML changes before merging: push the branch and compile it with the preview API (no run is queued). A local YAML parse doesn't catch template expression errors.

  ```shell
  echo '{"previewRun": true, "resources": {"repositories": {"self": {"refName": "refs/heads/<branch>"}}}}' > preview.json
  az devops invoke --area pipelines --resource preview --http-method POST --api-version 7.1 \
    --route-parameters project=AzureDevOpsExtensions pipelineId=<20 = release, 26 = CI> \
    --in-file preview.json --org https://dev.azure.com/gustavobergamim
  ```

## Conventions

- Dependabot PRs keep npm dependencies updated; base branch is `master`.
- Match existing style: class-based React components and services as classes.
