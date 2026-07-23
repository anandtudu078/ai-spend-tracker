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

## Day 2 — Clerk auth + database sync via webhooks

Wired up full authentication today using Clerk: email/password + Google
sign-in, session handling, and a proper sign-in/sign-up UI, all working
end to end. The harder part was syncing Clerk's users into my own
Postgres database — Clerk only knows about auth, not my app's data
model, so every sign-up needs to create a matching row in my own User
table via a webhook.

Honest detail: this took way longer than expected. Prisma 7 quietly
requires an explicit database "driver adapter" now instead of just
reading a connection string automatically — a breaking change that
isn't obvious from a plain "module not found" error. Also had to set
up ngrok to let Clerk's servers reach my local machine at all, ran into
an outdated ngrok version blocking the tunnel, and finally traced a
failing webhook down to a single mistyped env variable name
(CLERK_WEBHOOK_SECRET_KEY vs CLERK_WEBHOOK_SECRET). None of these were
hard problems individually, but stacked together they ate most of the
day. Lesson: budget real time for "the webhook doesn't work and I don't
know why" — it's one of the most common walls in real app-building.

## Day 3 — Dashboard shell + a real git workflow lesson

Built the dashboard shell today: a persistent sidebar with four sections
(Overview, Usage, Teams, Budgets), routed properly with Next.js's App
Router layout system so the sidebar doesn't re-render on every page
navigation.

Honest detail: today's real lesson wasn't code, it was git. Discovered
that yesterday's Clerk auth PR had silently merged into main instead of
develop — the classic mistake of not double-checking the base branch
dropdown before creating a PR. Nothing was lost, but it took real
detective work (comparing branches commit by commit, diffing remote
refs) to confirm that and fix it safely. Also hit a filename-casing
mismatch (sidebar.tsx vs Sidebar.tsx) that works fine on Windows but
would've silently broken on deployment to Vercel's Linux servers.
Lesson: case-sensitivity and branch targeting are the kind of mistakes
that don't show up until much later if you don't check immediately.