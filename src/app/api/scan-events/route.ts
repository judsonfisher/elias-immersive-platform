import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const eventSchema = z.object({
  type: z.enum(["MOVE", "ZOOM", "TAG_CLICK", "HOTSPOT_CLICK", "DWELL"]),
  timestamp: z.string(),
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
  positionZ: z.number().nullable().optional(),
  targetId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  duration: z.number().nullable().optional(),
});

const batchSchema = z.object({
  scanId: z.string().min(1),
  sessionId: z.string().min(1),
  events: z.array(eventSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    // Handle both application/json and text/plain (from sendBeacon)
    const text = await req.text();
    const body = JSON.parse(text);
    const data = batchSchema.parse(body);

    // Verify session exists and belongs to this scan
    const session = await prisma.scanSession.findFirst({
      where: { id: data.sessionId, scanId: data.scanId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 404 }
      );
    }

    // Batch insert events
    await prisma.scanEvent.createMany({
      data: data.events.map((event) => ({
        sessionId: data.sessionId,
        type: event.type,
        timestamp: new Date(event.timestamp),
        positionX: event.positionX ?? null,
        positionY: event.positionY ?? null,
        positionZ: event.positionZ ?? null,
        targetId: event.targetId ?? null,
        metadata: event.metadata
          ? (event.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        duration: event.duration ?? null,
      })),
    });

    // Update session aggregate counters
    const movesInBatch = data.events.filter((e) => e.type === "MOVE").length;
    const zoomsInBatch = data.events.filter((e) => e.type === "ZOOM").length;

    if (movesInBatch > 0 || zoomsInBatch > 0) {
      await prisma.scanSession.update({
        where: { id: data.sessionId },
        data: {
          totalMoves: { increment: movesInBatch },
          totalZooms: { increment: zoomsInBatch },
        },
      });
    }

    // Update tag click counts
    const tagClicks = data.events.filter(
      (e) => e.type === "TAG_CLICK" && e.targetId
    );
    for (const click of tagClicks) {
      await prisma.scanTag.updateMany({
        where: { scanId: data.scanId, tagId: click.targetId! },
        data: { totalClicks: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true, count: data.events.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Event ingestion error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
