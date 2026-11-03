import { inngest } from "@/app/inngest/client";
import { ajExpensive } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json(
      { success: false, message: "User not authenticated" },
      { status: 401 },
    );
  }

  const decision = await ajExpensive.protect(req, { userId: user.id })
  if (decision.isDenied()) {
    return NextResponse.json(
      { success: false, message: "Request denied" },
      { status: 429 },
    )
  }

  let runId: string;
  let response: string;
  try {
    const body = await req.json();
    runId = body.runId;
    response = body.response?.trim();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 },
    );
  }

  if (!runId || !response) {
    return NextResponse.json(
      { success: false, message: "Run ID and response are required" },
      { status: 400 },
    );
  }

  const run = await prisma.agentRun.findFirst({
    where: { id: runId, userEmail, status: "awaiting_input" },
    select: { id: true },
  });

  if (!run) {
    return NextResponse.json(
      { success: false, message: "Waiting agent run not found" },
      { status: 404 },
    );
  }

  try {
    await inngest.send({
      name: "agent/input.responded",
      data: { runId, response },
    });
    return NextResponse.json(
      { success: true, message: "Response sent" },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to send response" },
      { status: 500 },
    );
  }
}