# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@smartflowsystems.com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Measures

This repository implements the following security measures:

### 1. Automated Scanning
- **CodeQL Analysis**: Runs on every push and pull request
- **Dependabot**: Automatic dependency vulnerability scanning
- **Secret Scanning**: Detects accidentally committed secrets

### 2. Branch Protection
- **Protected main branch**: Requires pull request reviews
- **Status checks**: CI/CD must pass before merging
- **No force pushes**: Prevents history rewriting on main

### 3. Dependency Management
- **Automated updates**: Dependabot creates PRs for security updates
- **Version pinning**: Critical dependencies are pinned
- **Audit on CI**: `npm audit` / `pip-audit` runs on every build

### 4. Secure Coding Practices
- **Input validation**: All user inputs are validated
- **Output encoding**: Prevents XSS attacks
- **Parameterized queries**: Prevents SQL injection
- **HTTPS only**: All communications encrypted
- **CORS configured**: Restrictive CORS policies

### 5. Access Control
- **Principle of least privilege**: Minimal permissions
- **Environment variables**: Secrets stored securely
- **No hardcoded credentials**: All secrets in environment

## Security Best Practices

When contributing to this repository:

1. **Never commit secrets** - Use `.env` files and `.gitignore`
2. **Keep dependencies updated** - Merge Dependabot PRs promptly
3. **Follow secure coding guidelines** - See our contributing guide
4. **Use strong authentication** - Enable 2FA on your GitHub account
5. **Review code carefully** - Security issues can hide in plain sight

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions as soon as possible

## Contact

For security concerns, contact: **security@smartflowsystems.com**

For general support: **support@smartflowsystems.com**

---

**SmartFlow Systems** - Security First
