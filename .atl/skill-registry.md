# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When writing Go tests, using teatest, or adding test coverage. | go-testing | /home/winter/.config/opencode/skills/go-testing/SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | /home/winter/.config/opencode/skills/branch-pr/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | /home/winter/.config/opencode/skills/issue-creation/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | /home/winter/.config/opencode/skills/skill-creator/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". | judgment-day | /home/winter/.config/opencode/skills/judgment-day/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### go-testing
- Use table-driven tests with `t.Run(tt.name, ...)` for multiple scenarios.
- For Bubbletea state transitions, test `Model.Update()` directly.
- Use `teatest.NewTestModel()` for full interactive TUI flows.
- Use golden file tests for rendered output stability.
- Validate both success and error paths for funcs returning errors.
- Mock side effects via interfaces and use `t.TempDir()` for filesystem tests.
- Keep tests close to source files (`*_test.go` beside implementation).

### branch-pr
- Every PR MUST link an approved issue (`status:approved`) using `Closes/Fixes/Resolves #N`.
- Every PR MUST have exactly one `type:*` label.
- Branch name MUST match `type/description` with lowercase `a-z0-9._-`.
- Follow conventional commits (`type(scope): description` or `type: description`).
- Include summary, change table, and test plan in PR body.
- Run `shellcheck` on modified shell scripts before opening PR.
- Never include `Co-Authored-By` or AI attribution in commits.

### issue-creation
- Blank issues are disabled; always use bug or feature template.
- New issues are `status:needs-review` until a maintainer adds `status:approved`.
- Questions belong in Discussions, not Issues.
- Search for duplicates before creating a new issue.
- Bug reports must include reproduction steps and expected vs actual behavior.
- Feature requests must include problem statement, proposal, and impacted area.

### skill-creator
- Create skills only for reusable, repeated, non-trivial workflows.
- Use structure `skills/{name}/SKILL.md` with optional `assets/` and `references/`.
- Frontmatter must include `name`, `description` with trigger, Apache-2.0, and metadata.
- Keep critical patterns explicit and examples minimal.
- Use local file references (not web links) in `references/`.
- Register newly created skills in project AGENTS instructions.

### judgment-day
- Run TWO blind judges in parallel; never sequential.
- Synthesize findings as confirmed/suspect/contradiction only after both finish.
- Classify warnings as real vs theoretical; theoretical stays INFO.
- Fix only confirmed issues, then re-run both judges.
- After 2 fix iterations, ask user before continuing further cycles.
- Do not push/commit until re-judgment completes.
- Never mark APPROVED with any confirmed CRITICAL or real WARNING remaining.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /run/media/winter/DATA/Code/footbal-game/AGENTS.md | Index — project conventions and architecture guidelines |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
