"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

interface RoomSummaryProps {
  rooms: { name: string; count: number }[];
}

export function RoomSummary({ rooms }: RoomSummaryProps) {
  const maxCount = rooms.length > 0 ? rooms[0].count : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Items by Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms cataloged.</p>
        ) : (
          rooms.map((room) => (
            <div key={room.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                  {room.name}
                </span>
                <span className="text-muted-foreground">
                  {room.count} item{room.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{
                    width: `${(room.count / maxCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
