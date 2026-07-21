# Build Log

Honest, dated entries - what was built, why it mattered, and one honest detail (what broke, what took longer than expected, what was learned). This is the raw material every piece of build-in-public content gets drafted from.

---

## Day 1 — Database schema + Prisma setup

Designed and shipped the core database schema today: Users, Teams
(many-to-many via a join table, since people can belong to multiple
teams), UsageRecord for tracking AI spend per person, and a Budget
model that can attach to either a user or a team for per-user +
team-rollup budgets.

Honest detail: spent almost as much time debugging environment issues
as writing the schema. Prisma 7 changed its config format entirely
(new prisma.config.ts file, explicit output paths) since my last
exposure to it, so had to check current docs instead of assuming.
Bigger surprise: Windows 11's Smart App Control silently blocked
Prisma's migration engine from running at all, with a cryptic
"spawn UNKNOWN" error that took real digging to trace back to an OS-level
security feature, not Prisma itself. Lesson: environment setup issues
on a fresh machine are their own kind of "bug" worth expecting, even
before writing any app logic.

