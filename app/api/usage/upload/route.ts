import Papa from "papaparse";
import { prisma } from "@/lib/prisma";

type CsvRow = {
  email: string;
  provider: string;
  model: string;
  input_tokens: string;
  output_tokens: string;
  cost_usd: string;
  date: string;
};

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();

  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return Response.json(
      { error: "CSV parsing failed", details: parsed.errors },
      { status: 400 }
    );
  }

  const rows = parsed.data;
  const errors: { row: number; reason: string }[] = [];
  const validRecords: {
    userId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    source: "CSV_UPLOAD";
    occurredAt: Date;
  }[] = [];

  // Look up all users by email in one query, so we're not hitting the
  // database once per row.
  const emails = rows.map((r) => r.email?.trim()).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
  });
  const emailToUserId = new Map(users.map((u) => [u.email, u.id]));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 accounts for header row + 1-indexing

    const email = row.email?.trim();
    const userId = email ? emailToUserId.get(email) : undefined;

    if (!email) {
      errors.push({ row: rowNum, reason: "Missing email" });
      return;
    }
    if (!userId) {
      errors.push({ row: rowNum, reason: `No user found for email: ${email}` });
      return;
    }

    const inputTokens = parseInt(row.input_tokens, 10);
    const outputTokens = parseInt(row.output_tokens, 10);
    const costUsd = parseFloat(row.cost_usd);
    const occurredAt = new Date(row.date);

    if (!row.provider) {
      errors.push({ row: rowNum, reason: "Missing provider" });
      return;
    }
    if (!row.model) {
      errors.push({ row: rowNum, reason: "Missing model" });
      return;
    }
    if (Number.isNaN(inputTokens) || Number.isNaN(outputTokens)) {
      errors.push({ row: rowNum, reason: "Invalid token counts" });
      return;
    }
    if (Number.isNaN(costUsd)) {
      errors.push({ row: rowNum, reason: "Invalid cost_usd" });
      return;
    }
    if (Number.isNaN(occurredAt.getTime())) {
      errors.push({ row: rowNum, reason: "Invalid date" });
      return;
    }

    validRecords.push({
      userId,
      provider: row.provider.trim(),
      model: row.model.trim(),
      inputTokens,
      outputTokens,
      costUsd,
      source: "CSV_UPLOAD",
      occurredAt,
    });
  });

  let insertedCount = 0;
  let skippedCount = 0;

  if (validRecords.length > 0) {
    // Skip rows that already exist (same user, provider, model, and date)
    // to avoid double-counting spend on repeated uploads.
    const existing = await prisma.usageRecord.findMany({
      where: {
        OR: validRecords.map((r) => ({
          userId: r.userId,
          provider: r.provider,
          model: r.model,
          occurredAt: r.occurredAt,
        })),
      },
      select: { userId: true, provider: true, model: true, occurredAt: true },
    });

    const existingKeys = new Set(
      existing.map(
        (e) =>
          `${e.userId}|${e.provider}|${e.model}|${e.occurredAt.toISOString()}`
      )
    );

    const newRecords = validRecords.filter(
      (r) =>
        !existingKeys.has(
          `${r.userId}|${r.provider}|${r.model}|${r.occurredAt.toISOString()}`
        )
    );

    skippedCount = validRecords.length - newRecords.length;

    if (newRecords.length > 0) {
      await prisma.usageRecord.createMany({
        data: newRecords,
      });
      insertedCount = newRecords.length;
    }
  }

  return Response.json({
    inserted: insertedCount,
    skipped: skippedCount,
    failed: errors.length,
    errors,
  });
}