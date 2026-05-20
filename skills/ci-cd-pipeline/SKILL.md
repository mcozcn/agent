---
name: ci-cd-pipeline
description: Automates the "Test -> Build -> Deploy" cycle using GitHub Actions or similar tools.
allowed-tools: Read, Write, Bash
---

# CI/CD Pipeline Automation

> "Automate everything that can be automated."

This skill provides templates and strategies for setting up robust CI/CD pipelines.

## 🎯 When to Use
- When you need to automate testing before merging.
- When you want to deploy automatically to staging/production on push.
- When you need to run linters, security scans, or type checks automatically.

## 🛠️ Components

### 1. GitHub Actions Workflows

**`.github/workflows/ci.yml` (Continuous Integration)**
Runs on every Pull Request.
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**`.github/workflows/cd.yml` (Continuous Deployment)**
Runs on push to main branch.
```yaml
name: CD
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### 2. Pre-commit Hooks (Husky)
Prevent bad code from being committed.

- **`pre-commit`**: Runs `lint-staged` to lint only changed files.
- **`pre-push`**: Runs full test suite.

## 🚀 Principles
1. **Fail Fast**: Tests should run first and fail quickly if something is wrong.
2. **Idempotency**: Retrying a failed job should be safe.
3. **Secrets Management**: NEVER commit secrets. Use environment variables.
4. **Artifacts**: Build once, deploy anywhere.

## Usage
To set up a pipeline, ask the agent:
> "Set up a CI/CD pipeline for a Next.js app on Vercel"
> "Add a pre-commit hook to run ESLint"
