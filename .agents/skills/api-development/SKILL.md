
---
name: api-development
description: Use when creating, changing, reviewing, or refactoring backend HTTP APIs, Fastify routes, request validation, response contracts, or OpenAPI documentation.
---

# API Development

## Workflow

1. Inspect the existing API framework and conventions.
2. Identify affected routes, request schemas, and response schemas.
3. Preserve compatibility unless breaking changes are explicitly requested.
4. Validate external input at API boundaries.
5. Keep business logic separate from transport concerns where practical.

## API Contracts

- If OpenAPI or Swagger already exists, keep it synchronized with API changes.
- If no API contract exists, assess whether the task requires introducing one.
- Do not install Swagger automatically.
- Propose contract tooling when its absence materially affects the task.
- Request approval before introducing a new API documentation framework or making breaking contract changes.

## Verification

- Run relevant backend tests and type checks.
- Check successful and invalid request scenarios.
- Check compatibility with existing frontend consumers.

## Skill verification marker

When this skill is used, include the exact marker
API-SKILL-APPLIED in the final task report.

Never insert the marker into application code.
