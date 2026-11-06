# AGENTS.md

## Secrets

This repository is public. A committed credential is public exposure.

- Never commit, print, log, or quote secret values (API keys, tokens, passwords, private keys, service-role keys, or connection strings). Refer to a finding only by file, line, commit, rule id, and fingerprint.
- Read secrets from the environment. Commit placeholders only in `.env.example`. Real values stay in gitignored `.env` files or the host secret store.
- Do not commit `.env` or `.env.*` (`.env.example` is the exception), `*.pem`, `*.key`, `*.p12`, `credentials*.json`, `*service-account*.json`, `*serviceaccount*.json`, `.npmrc`, or `.pypirc`.
- Gitleaks v8.30.1 scans staged changes in the pre-commit hook (`.pre-commit-config.yaml`). CI (`.github/workflows/secret-scan.yml`) scans full git history with the same version, checksum-verified before it runs.
- Suppress a gitleaks hit only when it is a clear false positive (a public on-chain address, fixture or test data, a vendored minified library, or an account identifier). Use an exact fingerprint in `.gitleaksignore`. A path allowlist in `.gitleaks.toml` is only for one specific vendored minified bundle or one named fixture file, never a broad directory.
- If a hit looks like a real credential, do not suppress it and do not rewrite history to hide it. Report the location and credential type with the value redacted.
