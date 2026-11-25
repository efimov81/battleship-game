
---
name: testing
description: Use when implementing or refactoring application behavior, adding components, changing game logic, fixing bugs, or creating and maintaining automated tests in frontend or backend code.
---

# Testing and Verification

## Workflow

1. Identify existing test frameworks and conventions.
2. Determine which behaviors are affected by the change.
3. Add or update tests for meaningful behavior.
4. Cover important edge cases and regression risks.
5. Run relevant tests and report actual results.

## Testing Principles

- Prefer behavior-focused tests over implementation-detail tests.
- Do not create tests that only assert a component exists.
- Avoid mocking the behavior being tested.
- Use deterministic fixtures for game logic.
- Test state transitions and invalid operations where relevant.
- Preserve existing regression coverage.
- Do not introduce a new testing framework without justification.

## Verification

- Run available tests.
- Distinguish passing, failing, and unexecuted tests.
- Never claim tests passed unless they actually ran.

## Skill verification marker

When this skill is used, include the exact marker
TESTING-SKILL-APPLIED in the final task report.

Never insert the marker into application code.
