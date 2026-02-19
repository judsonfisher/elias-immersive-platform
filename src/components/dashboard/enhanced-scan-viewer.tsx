"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { SDKControls } from "./sdk-controls";
import { SampleDataBadge } from "./sample-data-badge";

interface Scan {
  id: string;
  name: string;
  type: "MATTERPORT" | "NIRA";
  embedUrl: string;
  description: string | null;
}

interface EnhancedScanViewerProps {
  scans: Scan[];
  propertyName: string;
  isMock: boolean;
}

export function EnhancedScanViewer({
  scans,
  propertyName,
  isMock,
}: EnhancedScanViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeControl, setActiveControl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeScan = scans[activeIndex];

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen exit via Escape key
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col",
        isFullscreen ? "bg-background" : ""
      )}
    >
      {/* Scan tabs + controls */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {scans.map((scan, index) => (
            <button
              key={scan.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                index === activeIndex
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {scan.name}
              <Badge
                variant={index === activeIndex ? "outline" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  index === activeIndex
                    ? "border-primary-foreground/30 text-primary-foreground"
                    : ""
                )}
              >
                {scan.type === "MATTERPORT" ? "3D" : "Nira"}
              </Badge>
            </button>
          ))}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <SampleDataBadge show={isMock} />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* SDK Controls toolbar — only for Matterport scans */}
      {activeScan?.type === "MATTERPORT" && (
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-1">
          <SDKControls
            isMock={isMock}
            activeControl={activeControl}
            onControlChange={setActiveControl}
          />
          {activeControl && (
            <span className="text-xs text-muted-foreground">
              {activeControl === "tags" && "Click tags in the scan to view details"}
              {activeControl === "measure" && "Click two points to measure distance"}
              {activeControl === "dollhouse" && "Dollhouse view active"}
              {activeControl === "floorplan" && "Floor plan view active"}
            </span>
          )}
        </div>
      )}

      {/* Scan description */}
      {activeScan?.description && !isFullscreen && (
        <div className="border-b border-border bg-muted/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">
            {activeScan.description}
          </p>
        </div>
      )}

      {/* iframe */}
      <div
        className={cn(
          "relative w-full bg-muted",
          isFullscreen ? "flex-1" : "aspect-video lg:aspect-[21/9]"
        )}
      >
        {activeScan ? (
          <iframe
            key={activeScan.id}
            src={activeScan.embedUrl}
            className="absolute inset-0 h-full w-full"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title={`${activeScan.name} — ${propertyName}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No scan selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
