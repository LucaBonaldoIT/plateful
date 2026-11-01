# Security Policy

## Supported versions

Plateful is under active development. Security fixes are applied to the latest version on `main` and to the deployed app. Older commits are not patched.

## Reporting a vulnerability

Please **do not report security issues in public issues or pull requests.**

Report privately through GitHub:

1. Open the [Security tab](https://github.com/LucaBonaldoIT/plateful/security) of the repository.
2. Choose **Report a vulnerability**.

If that option is unavailable, email **me@lucabonaldo.dev** with the subject "Plateful security".

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The affected version, commit or URL, and your browser.

## What to expect

- Acknowledgment of your report within a few business days.
- An assessment and, where confirmed, a fix or mitigation plan.
- Credit in the release notes if you would like it.

Please allow reasonable time to fix an issue before any public disclosure.

## Scope

Plateful is a static, client-side application with no backend, accounts, cookies or server-side storage. Relevant areas include:

- Import of user JSON files, such as malformed input causing crashes, resource exhaustion, prototype pollution or script injection.
- Cross-site scripting through user-controlled content (names, plan titles) rendered by the UI.
- Any unintended network request or data leaving the device.
- Vulnerabilities in the build tooling or dependencies that affect the shipped app.

Out of scope: issues that require an already-compromised browser or device, and loss of data caused by the user clearing browser storage.
