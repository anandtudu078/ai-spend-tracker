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

## Day 4 — CSV upload with validation and duplicate protection

Built the first real data pipeline into the app today: a CSV upload
flow that parses AI usage data, matches each row to a user by email,
validates every field, and writes clean rows into the UsageRecord
table. Bad rows (missing fields, unknown emails) are reported back
individually by row number instead of failing the whole upload.

Honest detail: had a good conversation with myself about what this
tool can actually promise. Turns out neither Anthropic nor OpenAI
track usage by employee at all — they only see API keys and
workspaces. So "per-employee attribution" only works if a company
already issues individual API keys per person, which not everyone
does. Worth being upfront about that limitation rather than pretending
the tool magically knows who used what.

Also caught a real data-integrity bug during testing: uploading the
same CSV twice created duplicate spend records, silently doubling
someone's numbers. Fixed it by checking existing records

## Day 5 — Overview and Usage pages now show real data

Wired up both dashboard pages to actually display data instead of
placeholder text. The Usage page now shows a real table of every
uploaded usage record, and the Overview page shows total spend plus a
bar chart of spend by model. Restructured both pages as server
components that query Prisma directly, splitting the interactive
upload form out into its own client component so the two concerns
(data fetching vs. interactivity) stay properly separated.

Honest detail: caught two small but real issues while testing. First,
leftover duplicate rows from earlier manual testing were still sitting
in the database, which would have shown wrong totals in the new chart
if I hadn't


## Day 6 — Team creation and member management

Built the ability to create teams and add members to them by email —
the last piece needed before team-scoped budgets become possible. Any
signed-in user can create a team, and adding a member just requires
typing their email; it's validated against existing users the same
way CSV upload attribution works.

Honest detail: hit a genuinely interesting bug while testing. Creating
a team failed with a foreign key error — turned out I was testing
under a Clerk account that had signed up while my ngrok tunnel wasn't
running, so the sign-up webhook never fired and that user was never
synced into my own database. Clerk knew about the account; my app
didn't. It's a real limitation of testing webhooks locally: the tunnel
has to be actively running for new sign-ups to sync, which won't be
an issue once this is deployed with a permanent URL, but is an easy
trap during local dev.

## Day 7 — Budget creation with real-time spend tracking

Built budget creation for both teams and individuals, with custom date
ranges and a real spend calculation against actual usage data — not
just a static number. For team budgets, this meant rolling up spend
across every member of the team within the budget's date range, which
is exactly the kind of aggregation this whole project is meant to make
easy.

Honest detail: this was the smoothest phase so far, and I think that's
because the schema decisions made back in Phase 1 (Budget being able
to attach to either a user or a team, the TeamMembership join table)
paid off directly here. Good early data modeling meant this feature
came together without any real fighting — a nice contrast to some of
the earlier phases.