import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const startSchema = z.object({
  action: z.literal("start"),
  scanId: z.string().min(1),
  visitorId: z.string().min(1),
  deviceType: z.string().optional(),
  entryPoint: z.string().optional(),
});

const endSchema = z.object({
  action: z.enum(["end", "heartbeat"]),
  sessionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Handle both application/json and text/plain (from sendBeacon)
    const text = await req.text();
    const body = JSON.parse(text);
    const action = body.action;

    if (action === "start") {
      const data = startSchema.parse(body);

      const scan = await prisma.scan.findUnique({
        where: { id: data.scanId },
        select: { id: true },
      });
      if (!scan) {
        return NextResponse.json({ error: "Scan not found" }, { status: 404 });
      }

      const session = await prisma.scanSession.create({
        data: {
          scanId: data.scanId,
          visitorId: data.visitorId,
          deviceType: data.deviceType || null,
          entryPoint: data.entryPoint || "Direct",
        },
      });

      return NextResponse.json({ sessionId: session.id });
    }

    if (action === "end" || action === "heartbeat") {
      const data = endSchema.parse(body);

      const session = await prisma.scanSession.findUnique({
        where: { id: data.sessionId },
      });
      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      const duration = Math.floor(
        (Date.now() - session.startedAt.getTime()) / 1000
      );

      await prisma.scanSession.update({
        where: { id: data.sessionId },
        data: {
          duration,
          ...(action === "end" ? { endedAt: new Date() } : {}),
        },
      });

      return NextResponse.json({ ok: true, duration });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Session error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
