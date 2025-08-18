# Repository Guidelines

## Project Structure & Module Organization
- Keep production code in `src/` and tests in `tests/`.
- Place scripts and one-offs in `scripts/`; assets (images/fonts) in `assets/`.
- Put examples or sample apps in `examples/`; docs in `docs/`.
- Use `.env` for local secrets and commit a redacted `.env.example`.

## Build, Test, and Development Commands
- If a `Makefile` exists: `make help` to list tasks; common targets: `make setup`, `make dev`, `make test`, `make lint`, `make build`.
- Node projects: `npm ci` (install), `npm run dev` (watch), `npm test` (unit), `npm run build` (prod bundle).
- Python projects: `pip install -r requirements.txt` or `pip install -e .[dev]`, run `pytest -q`, and `ruff/black` for lint/format if configured.
- When unsure, check `package.json` scripts, `pyproject.toml`, or `Makefile` for canonical commands.

## Coding Style & Naming Conventions
- Prefer small, single‑purpose modules and clear public APIs.
- Naming: directories/kebab‑case, files snake_case (Python) or kebab/camel (JS/TS), classes PascalCase, constants UPPER_SNAKE.
- Formatting: follow project tooling when present (Prettier/ESLint for JS/TS; Black/Ruff for Python). Aim for zero lint warnings.
- Keep functions <50 lines; document non‑obvious decisions in code comments.

## Testing Guidelines
- Mirror `src/` structure under `tests/`.
- Naming: Python `test_*.py`; JS/TS `*.test.ts|tsx` or `*.spec.ts|tsx`.
- Target ≥80% coverage for changed code; include edge cases and error paths.
- Run the fast unit suite before pushing; add integration tests when behavior spans modules.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Commits should be small and reviewable; include context in the body.
- PRs: clear description, linked issues (`Closes #123`), before/after notes or screenshots, test plan, and any migration steps.

## Security & Configuration Tips
- Never commit real secrets. Use `.env` and update `.env.example` when keys change.
- Validate and sanitize all external inputs; prefer parameterized queries and prepared statements.
