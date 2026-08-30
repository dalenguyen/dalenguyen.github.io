---
title: "Deploy What Changed: Nx affected + Cloud Run + Workload Identity Federation"
slug: 2026-08-30-deploy-what-changed
description: A merge to main should ship the services that merge touched, and nothing else. The whole pipeline — keyless GitHub-to-Google auth, one deploy target per app, and the dependency-graph work that makes "affected" trustworthy.
categories: ['github-actions', 'cloud-run', 'nx', 'devops']
coverImage: https://dalenguyen.me/assets/images/blog/2026-08-30-deploy-what-changed.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-08-30T10:00:00.000Z
author: Dale Nguyen
draft: false
---

A merge to `main` should ship the services that merge touched — and nothing else. Here is the whole pipeline: keyless auth, one deploy target per app, and the graph work that makes "affected" trustworthy.

**Stack:** Nx monorepo · Python + Node · Cloud Run. **Auth:** Workload Identity Federation. **Secrets in repo:** zero.

## 00. The shape

### One command, two callers

Most broken deploy workflows are broken the same way: the YAML contains a second, drifting copy of the deploy commands. Someone tunes memory limits locally, ships it by hand, and CI keeps deploying the old shape for a month before anyone notices.

So the rule that makes everything else work: **the deploy command lives in the repo, next to the app it deploys.** CI does not know how to deploy anything. It knows how to ask.

In an Nx workspace that means a `deploy` target per app:

`apps/web/project.json`
```json
{
  "targets": {
    "deploy": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "docker build --platform linux/amd64 -f apps/web/Dockerfile -t gcr.io/$PROJECT/web:latest . && docker push gcr.io/$PROJECT/web:latest && gcloud run deploy web --image gcr.io/$PROJECT/web:latest --region us-central1 --allow-unauthenticated"
      }
    }
  }
}
```

Now a human types `nx deploy web` and CI runs `nx affected -t deploy`. Same command, same flags, same memory limits, no drift. The rest of this post is the two hard parts: proving to Google who GitHub is, and proving to Nx what actually changed.

> **New project? Create the registry first.** Container Registry stopped accepting writes on March 18, 2025 — `gcr.io` hostnames now proxy to Artifact Registry, but only for repositories that already exist. An established project usually has that mirror already; a brand-new one doesn't, and `docker push` fails with a 404 the first time. Create it once: `gcloud artifacts repositories create gcr.io --repository-format=docker --location=us --project=$PROJECT`. New projects are better off skipping the mirror entirely and pushing to `us-docker.pkg.dev/$PROJECT/gcr.io/web:latest` instead.

## 01. Identity

### Stop putting service account keys in GitHub

The tutorial answer is `gcloud iam service-accounts keys create`, paste the JSON into a repo secret, done. That key is a permanent credential with deploy rights, sitting in a place many people can read, that nothing rotates and nobody revokes.

Workload Identity Federation replaces it. GitHub already signs a short-lived OpenID Connect (OIDC) token for every workflow run, describing the repo, the branch, the workflow. You teach Google to trust that issuer, then narrow the trust to exactly one repository. No key exists, so no key can leak.

Before the `gcloud` commands, here's the whole exchange as a diagram — step through it to see where a token from the wrong repository actually gets rejected:

<div data-chart="wif-flow">Diagram: GitHub Actions requests an OIDC token → GitHub signs it → Google's Workload Identity Pool verifies the issuer and repository, rejecting any repo that doesn't match → on a match, Google exchanges it for short-lived credentials scoped to the deploy service account → those credentials deploy to Cloud Run. No long-lived key exists at any step. Enable JavaScript to step through it.</div>

### Create the deploy identity

```bash
# The service account CI will impersonate. It has no key.
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Actions deploy" --project=$PROJECT

SA=github-deploy@$PROJECT.iam.gserviceaccount.com

# Deploy revisions, push images, and act as the runtime SA.
for R in roles/run.admin \
         roles/artifactregistry.writer \
         roles/storage.admin \
         roles/iam.serviceAccountUser \
         roles/secretmanager.viewer; do
  gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$SA" --role=$R --condition=None
done
```

> **Why serviceAccountUser.** Deploying a Cloud Run service that *runs as* another service account is an impersonation. Without `roles/iam.serviceAccountUser` the deploy fails at the very last step with a permission error that names the runtime account, not the deployer — an easy twenty minutes to lose.

### Trust GitHub, and only your repo

```bash
gcloud iam workload-identity-pools create github \
  --location=global --project=$PROJECT

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github --project=$PROJECT \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository=='my-org/my-repo'"
```

> **The attribute condition is the security boundary.** Omit `--attribute-condition` and you have told Google to trust *every repository on GitHub*. Anyone who can run a public workflow can then mint a token your pool accepts. Newer `gcloud` versions refuse to create an unconditioned provider for exactly this reason. Keep the condition; make it as narrow as your workflow allows.

Then let that repository — and nothing else in the pool — impersonate the deploy account:

```bash
PN=$(gcloud projects describe $PROJECT --format='value(projectNumber)')

gcloud iam service-accounts add-iam-policy-binding $SA --project=$PROJECT \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/github/attribute.repository/my-org/my-repo"
```

Three values go into repo secrets. None of them is a credential — they are addresses, and they are useless without a signed token from your repo.

```bash
echo "projects/$PN/locations/global/workloadIdentityPools/github/providers/github-provider" \
  | gh secret set WIF_PROVIDER
echo "$SA"      | gh secret set WIF_SERVICE_ACCOUNT
echo "$PROJECT" | gh secret set GCP_PROJECT
```

> **Tighten further before this touches production.** The condition above is repo-only, which means it trusts *any* branch and *any* workflow in `my-org/my-repo` — not just `deploy.yml` on `main`. Two changes close that gap:
>
> - **Restrict to the deploy ref.** Add `&& assertion.ref=='refs/heads/main'` to the condition. Now a workflow triggered from a feature branch — even one added by someone with ordinary write access — can't mint a usable token.
> - **Bind to the repository ID, not its name.** `assertion.repository` is a name, and names get reused: delete `my-org/my-repo` and recreate it (or let the org rename), and a new, unrelated repository inherits the trust. Map `attribute.repository_id=assertion.repository_id` and `attribute.repository_owner_id=assertion.repository_owner_id` in `--attribute-mapping`, then condition and bind on those IDs instead — they don't get reassigned when a name does.

### The roles nobody's tutorial lists

The role list above already includes `storage.admin` at the *project* level — for a reason we only learned by getting it wrong first. Wiring this up for a real project, we started tighter: `storage.admin` scoped to just the Cloud Build staging bucket, on the theory that project-wide storage admin is a lot of blast radius for one deploy pipeline. Two failed deploys later, the reason became clear: `gcloud builds submit` doesn't only read and write objects in that bucket — before it uploads anything, it calls a *project-scoped* `storage.buckets.list` to confirm the bucket exists. No bucket-level binding, however permissive, can satisfy a call scoped to the whole project. The advice above is right; don't "improve" it.

The second gap isn't in the role list at all. **`roles/viewer` is required to stream build logs back to the CLI**, separate from anything Cloud Build- or Storage-specific. Without it, `gcloud builds submit` exits non-zero and the whole `nx deploy` chain reports failure — even though the Cloud Build job itself finished and pushed the image successfully. We nearly chased a phantom second bug before running `gcloud builds describe <id> --format="value(status)"` and seeing `SUCCESS` on a build the CLI, and therefore CI, had just reported as failed. `roles/logging.viewer` looks like the fix and isn't: the CLI's own error text checks for "Viewer/Owner of the project" — a primitive-role check, not a fine-grained permission.

The lesson generalizes past this one pipeline: **an error from a wrapper CLI ("forbidden from accessing bucket") describes where the failure surfaced, not why.** When a permission error survives an IAM grant that should have fixed it, stop guessing at roles and get the client's raw HTTP trace instead:

```bash
gcloud builds submit apps/web --tag $IMAGE --project $PROJECT --verbosity=debug
```

It names the exact API call and scope that got denied — in less time than a second guess costs.

## 02. The workflow

### Ask Nx what to ship

The whole file, then the four lines in it that matter.

`.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      projects:
        description: 'Comma-separated projects (empty = affected only)'
        required: false
        default: ''

permissions:
  contents: read
  actions: read
  id-token: write   # mint the OIDC token — without this, auth fails

# One deploy at a time. A second merge waits instead of racing Cloud Run.
concurrency:
  group: deploy-main
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      # The deploy target expands $PROJECT (see apps/web/project.json above).
      # auth@v2 exports GCP_PROJECT/GOOGLE_CLOUD_PROJECT, not PROJECT — without
      # this line the image ref silently becomes gcr.io//web:latest.
      PROJECT: ${{ secrets.GCP_PROJECT }}
    steps:
      # Full history: `affected` diffs two commits.
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud auth configure-docker gcr.io --quiet

      # Sets NX_BASE / NX_HEAD. Base = last commit this workflow
      # deployed successfully, so a red run is retried, not skipped.
      - uses: nrwl/nx-set-shas@v4

      - name: Deploy affected projects
        if: ${{ inputs.projects == '' }}
        run: pnpm nx affected -t deploy --parallel=1

      - name: Deploy selected projects
        if: ${{ inputs.projects != '' }}
        run: pnpm nx run-many -t deploy --parallel=1 --projects=${{ inputs.projects }}
```

### The four decisions

- **`id-token: write`** — without it there is no OIDC token to exchange and `auth@v2` fails with a message about missing credentials that sounds like a secrets problem.
- **`fetch-depth: 0`** — `affected` is a diff. A shallow clone gives it nothing to diff against.
- **`nx-set-shas`** — bases the diff on the last *successful* run of this workflow. If a deploy fails, the next merge redeploys everything that failed rather than pretending it shipped.
- **`--parallel=1`** — these tasks are Docker builds pushing to a registry. Running four at once on a two-core runner buys nothing and fills the disk.

The `workflow_dispatch` input is the escape hatch. When you need to force a service out — a secret rotated, a base image patched, no code change to point at — you run the workflow and type the project names, rather than inventing an empty commit.

## 03. The graph

### "Affected" is only as good as your dependency graph

This is the part every tutorial skips, and it is the part that will bite you. `nx affected` answers a graph question: *which projects depend on the files that changed?* If the graph doesn't know about a dependency, the answer is confidently wrong — and a wrong answer here means **your fix silently never deployed**. That failure is much worse than a workflow that errors, because nothing turns red.

### Gap one: dependencies your language has but Nx can't see

Our five Python services each vendor a shared library. Every `Dockerfile` does `COPY packages/`, and every `pyproject.toml` declares `py-shared = { path = "../packages" }`. Real dependency, universally understood — by everything except the Nx graph, which reads TypeScript imports.

So a change to the shared LLM client marked *nothing* as affected, and CI would have deployed *nothing*. Try it yourself below: toggle whether `implicitDependencies` is declared, and watch what `nx show projects --affected` returns for the same file change.

<div data-chart="affected-toggle">Before: `nx show projects --affected --files=packages/py_shared/llm.py -t deploy` returns `[]` — every service uses this file, and none is marked affected. After adding `implicitDependencies` to each service's `project.json`: the same command returns all five services. Enable JavaScript to try the toggle.</div>

The fix is one line per consumer, and it is worth a comment, because the next person will read it as redundant and delete it:

```json
{
  "name": "agents-create",
  // Each image COPYs the shared package, but the python path-dep
  // is invisible to the Nx graph — declare it or `affected` misses it.
  "implicitDependencies": ["agents-py-shared"]
}
```

### Gap two: files that belong to no project at all

Our five services share one `Dockerfile` at `apps/agents/Dockerfile`, parameterised by build arg. It sits one level above every project root, so Nx cannot attribute it to any project — change it and nothing is affected.

The tempting fix is `sharedGlobals` in `nx.json`. **We tried it; it does not work here.** It marked only the TypeScript projects, because the Python projects have no target whose inputs reference `default`. Rather than contort the config, we made the rule explicit in the workflow, where it is visible:

```yaml
- name: Deploy agent services on shared Dockerfile change
  run: |
    # This file builds all 5 images but lives outside every project
    # root, so Nx cannot attribute it. Deploy the five by hand.
    if git diff --name-only "$NX_BASE" "$NX_HEAD" | grep -qx 'apps/agents/Dockerfile'; then
      pnpm nx run-many -t deploy --parallel=1 \
        --projects=agents-create,agents-review,agents-resolve,agents-plan,agents-learn
    fi
```

> **The general rule.** Before you trust `affected` with production, list the ways your build crosses a language or a directory boundary — vendored packages, generated clients, shared Dockerfiles, root config. For each one, run `nx show projects --affected --files=<that file>` and check the answer against what you know. Every mismatch is a deploy that will quietly not happen.

## 04. Proof

### Verify both halves

A deploy pipeline has two jobs and most people only test one. Shipping the right thing is the obvious half. *Not* shipping the wrong thing is the half that saves you at 2am, and it needs its own test.

| Merge | Expected | Actual |
|---|---|---|
| Workflow + 5 project.json files | 5 agent services, not web | 5 new revisions, web untouched |
| Documentation only | Nothing | `NX No tasks were run` |

The second row is the one to celebrate. A green run that deployed nothing means the pipeline understands your repo rather than rebuilding the world on every commit.

Confirm against the platform, not the workflow log — a step can exit 0 having done nothing:

```bash
for s in create review plan resolve learn web; do
  gcloud run services describe codemagpie-$s --region us-central1 \
    --format='value(status.latestReadyRevisionName, status.conditions[0].lastTransitionTime)'
done
```

## 05. Consequences

### What turning this on will find

Deploying from CI changes which tests run, and that surfaces things hand-deploying hid. Ours went red on the first attempt, in a service the change never touched.

Three tests in the plan agent asserted the issue title reached the model:

```python
prompt = mock.messages.create.call_args.kwargs["messages"][0]["content"]
assert "Add dark mode" in prompt        # green locally, red in CI
```

`messages[0]` is the *system* prompt. The assertions had been checking the wrong string ever since a system message was introduced — and a fourth, `assert "Additional instructions" not in prompt`, had been passing vacuously the whole time.

They passed locally because the developer's virtualenv still held a months-old build of the shared package, from before the system message existed. CI installs from source, so CI was right. Nobody had noticed, because nothing had ever marked that project as affected — *the same graph gap, showing up as a stale test instead of a missed deploy.*

> **Expect this.** The first honest `affected` run tests projects that have not been tested in months. Budget an afternoon for it, and read every failure as information rather than an obstacle — a test that was green on a stale local environment was never actually passing.

### The rest of the punch list

- **Registry permissions are two roles, not one.** `gcr.io` is backed by Artifact Registry but still consults the legacy Cloud Storage bucket. Grant both `artifactregistry.writer` and `storage.admin` until you have fully migrated to `*-docker.pkg.dev`.
- **`--update-env-vars` merges, it does not replace.** Rolling a config change back means setting every variable back to its old value — it won't unset one. If the newer revision *added* a variable, `--update-env-vars` can't remove it; use `--remove-env-vars KEY` for that one key, or `--clear-env-vars` to wipe all of them.
- **Pin the platform.** `docker build --platform linux/amd64` in the deploy target, so a deploy from an Apple Silicon laptop produces the same image the runner does.
- **Keep `latest` honest.** Tagging with the commit SHA as well as `latest` makes a rollback a one-line `gcloud run deploy --image ...:<sha>` instead of a rebuild.

## 06. Tips and tricks

### Small wins that pay off immediately

- **Preview the blast radius before you merge.** `nx show projects --affected --files=<path> -t deploy` takes a hypothetical diff and prints exactly what would ship. Run it against your actual staged changes (`git diff --name-only main`) before you push, not after CI tells you.
- **Post it as a PR comment.** A bot comment reading "this PR redeploys: agents-create, agents-review, agents-resolve, agents-plan, agents-learn" turns blast radius into something a reviewer signs off on, instead of something they discover in the deploy log.
- **Pin image digests, not just tags, for base images.** `FROM python:3.12-slim` can change under you between two otherwise-identical merges. `FROM python:3.12-slim@sha256:...` makes "nothing in this diff changed" actually mean nothing changed.
- **Don't let a flaky merge train cause a deploy storm.** `concurrency: group: deploy-main` (already in the workflow above) queues runs instead of racing them, but on a busy day that queue still fires once per merge. If you squash-merge PRs instead of merging every commit to `main`, you get one deploy per shipped change instead of one per commit.

### "A one-line shared-lib change just redeployed all 5 services — is that right?"

Yes — and it's the fix from [section 03](#03-the-graph) working exactly as designed. Once `implicitDependencies` tells Nx that all five services depend on `py_shared`, *any* change there correctly marks all five as affected. The alternative — nothing redeploys — is the bug this whole post exists to close. Don't "fix" this by loosening `implicitDependencies`; that just reopens gap one.

But correct and proportionate aren't the same thing. A one-character comment fix doesn't need five redeploys any more than a `Dockerfile` change needing five redeploys was fine to skip. Two things actually narrow the blast radius, instead of just accepting it:

**1. Filter out changes that can't affect runtime behavior.** Nx's `namedInputs` in `nx.json` let you define a `production` fileset that excludes files that never change what ships — tests, docs, lint config:

```json
// nx.json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "production": [
      "default",
      "!{projectRoot}/**/test_*.py",
      "!{projectRoot}/**/*.spec.py",
      "!{projectRoot}/**/*.md"
    ]
  }
}
```

Then scope every `deploy` target to that filtered set:

```json
// each project.json
{
  "targets": {
    "deploy": {
      "inputs": ["production", "^production"]
    }
  }
}
```

`^production` is the part that matters here — it applies the same filter to *dependencies*, so a test-only or docs-only change inside `py_shared` no longer marks the five consumers as affected. A real code change still does, exactly as before.

**2. Split the library along its actual fault lines.** "One shared library" used by five services is usually five separate contracts that happen to live in one folder. If `agents-plan` only imports `py_shared.prompts` and never touches `py_shared.retry`, a change to retry logic still redeploys it, because `implicitDependencies` is project-level, not symbol-level. The real fix isn't cleverer config — it's a smaller library. Split `py_shared` into `py_shared_prompts`, `py_shared_retry`, `py_shared_llm`, and declare `implicitDependencies` per consumer against only what it actually imports. More libraries to maintain, but the graph starts telling the truth at a finer grain — the same idea as gap one, applied recursively.

If neither is worth doing yet, do the cheap version: make the blast radius visible before it surprises someone, with the PR-comment trick above. "This touches 5 services" should be a decision made at review time, not a surprise in the deploy log.

## 07. Where to stop

### Keep the hand-deploy

The goal is not to remove the ability to deploy from a laptop. It is to remove the *obligation*. Because CI runs the exact same `nx deploy` target, both paths stay in step, and you keep a fast manual route for the times a merge is too slow — an incident, a bisect, a live debugging session against a real revision.

What genuinely changes is the default. Merging is now the deploy, so what is on `main` is what is running. That single property is worth more than every other line in the workflow.

Left deliberately undone, and reasonable to add next: a smoke check on the new revision before it takes traffic, tagged revisions with a gradual rollout, and an environment-protection rule so production deploys wait for an approval.

---

Written from a working pipeline: 5 Cloud Run services, 1 Nx monorepo, 0 stored credentials. Commands are given for `gcr.io` and `us-central1` — substitute your own registry host and region.
