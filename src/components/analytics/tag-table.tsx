"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TagData } from "@/lib/matterport";

interface TagTableProps {
  tags: TagData[];
}

function formatDwellTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function TagTable({ tags }: TagTableProps) {
  const sorted = [...tags].sort((a, b) => b.totalClicks - a.totalClicks);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tag Engagement</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags tracked for this scan.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Dwell Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.label}</TableCell>
                  <TableCell>
                    {tag.category && (
                      <Badge variant="secondary" className="text-xs">
                        {tag.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {tag.totalClicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDwellTime(tag.totalDwellTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
