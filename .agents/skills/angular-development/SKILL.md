
---
name: angular-development
description: Use for Angular component creation, refactoring, templates, signals, state management, and frontend behavior changes.
---

# Angular Development

## Workflow

1. Inspect the existing Angular version and project conventions.
2. Identify component responsibilities before modifying code.
3. Prefer small, cohesive components over monolithic components.
4. Preserve existing behavior unless the task explicitly changes it.
5. Follow the Angular APIs supported by the installed version.

## Architecture

- Use Angular Signals for local reactive state where appropriate.
- Use computed() for derived reactive values.
- Avoid duplicating derived state.
- Prefer input() and output() when supported by the project.
- Keep game logic separate from presentation when practical.
- Avoid unnecessary services and abstractions.
- Do not introduce external state management libraries without a demonstrated need.

## Styling

- Tailwind CSS is the preferred styling system for this project.
- For new UI components, use Tailwind utility classes.
- Use the installation method compatible with the project's
  Angular version.
- Do not migrate unrelated existing components unless requested.
- Preserve existing functionality and appearance.

## Verification

- Run the available Angular build and relevant tests.
- Check template bindings and TypeScript errors.
- Report any verification that could not be completed.

## Skill verification marker

When this skill is used, include the exact marker
ANGULAR-SKILL-APPLIED in the final task report.

Never insert the marker into application code.
