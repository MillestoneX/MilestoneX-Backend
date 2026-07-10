# Contributing to MilestoneX API

Thank you for considering a contribution to MilestoneX! This guide describes the workflow, coding standards, and review process we follow.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Branch Naming](#branch-naming)
4. [Commit Messages](#commit-messages)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)
8. [Reporting Bugs](#reporting-bugs)

---

## Getting Started

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-handle>/MilestoneX-Backend.git
   cd MilestoneX-Backend
   ```
2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   ```
3. Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
4. Start the local services with Docker Compose:
   ```bash
   docker compose up -d
   ```
5. Apply the database schema:
   ```bash
   npx prisma migrate dev
   ```

---

## Development Setup

| Command | Purpose |
|---|---|
| `npm run start:dev` | Start API with hot-reload |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage report |
| `npm run lint` | Check linting |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format all TypeScript files |
| `npm run format:check` | Check formatting without writing |
| `npx prisma studio` | Browse the database in a GUI |

---

## Branch Naming

Use the pattern `<type>/<short-description>`:

```
feat/campaign-bookmarks
fix/donation-idempotency
refactor/pagination-helper
docs/contributing-guide
chore/node-version-bump
```

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**Examples**:
```
feat(campaigns): add campaign bookmark service
fix: correct updateCampaign to use req.user.sub
docs: add JSDoc to stellar transactions service
chore: add .nvmrc pinning Node.js to v20
```

---

## Code Style

- **TypeScript strict mode** is enabled — avoid `any` unless necessary.
- **Prettier** handles formatting — run `npm run format` before committing.
- **ESLint** enforces code quality — run `npm run lint:fix` to auto-fix.
- Use `Logger` from `@nestjs/common` rather than `console.log`.
- Keep controllers thin — business logic lives in services.
- Prefer Prisma transactions for operations that touch multiple tables.
- Add `@ApiProperty` / `@ApiOperation` Swagger decorators to all public DTOs and endpoints.

---

## Testing

- Write unit tests for every new service method using `@nestjs/testing`.
- Place spec files alongside the source file (e.g. `campaigns.service.spec.ts`).
- Mock external dependencies (Prisma, Bull, Stellar SDK) with Jest `jest.fn()` / `jest.spyOn()`.
- Aim for meaningful assertions — test behaviour, not implementation.
- Run `npm run test:cov` and check that coverage does not drop.

---

## Pull Request Process

1. Ensure all tests pass: `npm run test`
2. Ensure there are no lint errors: `npm run lint`
3. Ensure formatting is clean: `npm run format:check`
4. Open a PR against the `main` branch with a clear title and description.
5. Link any related issues in the PR description.
6. At least one maintainer approval is required before merging.
7. Squash-merge is preferred to keep the history clean.

---

## Reporting Bugs

Open a GitHub Issue with:
- A clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, relevant config)

For security vulnerabilities, please email the maintainers directly rather than opening a public issue.
