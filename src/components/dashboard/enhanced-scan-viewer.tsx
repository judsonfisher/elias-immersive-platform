"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { SDKControls } from "./sdk-controls";
import { SampleDataBadge } from "./sample-data-badge";
import { ShowcaseEventCapture } from "@/lib/matterport/showcase-client";
import { buildShowcaseUrl } from "@/lib/matterport/utils";
import { AnnotationPanel } from "@/components/annotations/annotation-panel";
import { AnnotationForm } from "@/components/annotations/annotation-form";
import { toast } from "sonner";

interface Scan {
  id: string;
  name: string;
  type: "MATTERPORT" | "NIRA";
  embedUrl: string;
  matterportSid: string | null;
  description: string | null;
}

interface AnnotationData {
  id: string;
  content: string;
  type: "NOTE" | "ISSUE" | "COMMENT";
  status: "OPEN" | "RESOLVED";
  color: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  createdAt: Date;
  author: { firstName: string; lastName: string };
}

interface EnhancedScanViewerProps {
  scans: Scan[];
  propertyName: string;
  isMock: boolean;
  /** When true, hides the scan tab bar chrome and fullscreen button for embed context */
  minimal?: boolean;
  /** Annotations for the active scan (passed from parent server component) */
  annotations?: AnnotationData[];
  /** Whether the ANNOTATIONS feature is enabled */
  showAnnotations?: boolean;
  /** Callback when annotation is created — parent should refetch annotations */
  onAnnotationCreated?: () => void;
}

export function EnhancedScanViewer({
  scans,
  propertyName,
  isMock,
  minimal = false,
  annotations = [],
  showAnnotations = false,
  onAnnotationCreated,
}: EnhancedScanViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeControl, setActiveControl] = useState<string | null>(null);
  const [annotationPosition, setAnnotationPosition] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [isWaitingForClick, setIsWaitingForClick] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const captureRef = useRef<ShowcaseEventCapture | null>(null);

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

  // Cleanup SDK capture on scan change or unmount
  useEffect(() => {
    return () => {
      if (captureRef.current) {
        captureRef.current.destroy();
        captureRef.current = null;
      }
    };
  }, [activeIndex]);

  // Handle annotation mode activation
  useEffect(() => {
    if (activeControl !== "annotate") {
      setIsWaitingForClick(false);
      return;
    }

    // If SDK is not connected, annotation placement is unavailable
    if (!captureRef.current) {
      toast.warning("Cannot place annotations — SDK is not connected");
      setActiveControl(null);
      return;
    }

    setIsWaitingForClick(true);
    toast.info("Click on the 3D scan to place an annotation");

    let cancelled = false;

    async function waitForClick() {
      if (!captureRef.current || cancelled) return;

      const position = await captureRef.current.waitForClickPosition();
      if (cancelled) return;

      if (position) {
        setAnnotationPosition(position);
        setIsWaitingForClick(false);
      } else {
        // Timed out — reset
        setIsWaitingForClick(false);
        setActiveControl(null);
      }
    }

    waitForClick();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeControl]);

  const isLiveMode = !isMock;
  const isActiveMatterport = activeScan?.type === "MATTERPORT";

  // Build the iframe URL — append SDK params in live mode for Matterport scans
  const iframeSrc = activeScan
    ? isLiveMode && isActiveMatterport
      ? buildShowcaseUrl(activeScan.embedUrl)
      : activeScan.embedUrl
    : "";

  // Connect to Matterport SDK when iframe loads
  const handleIframeLoad = useCallback(async () => {
    if (!isLiveMode || !isActiveMatterport || !iframeRef.current || !activeScan?.matterportSid) {
      return;
    }

    // Destroy previous capture if any
    if (captureRef.current) {
      captureRef.current.destroy();
      captureRef.current = null;
    }

    try {
      const capture = new ShowcaseEventCapture(activeScan.id);
      const sdk = await capture.connect(iframeRef.current);
      if (sdk) {
        captureRef.current = capture;
      } else {
        // SDK connection failed (e.g. invalid key) — viewer still works
        toast.warning("SDK controls unavailable — 3D viewer is unaffected", {
          duration: 4000,
        });
      }
    } catch (err) {
      // Unexpected error (e.g. SDK script failed to load)
      console.warn("Matterport SDK setup failed:", err);
    }
  }, [isLiveMode, isActiveMatterport, activeScan?.id, activeScan?.matterportSid]);

  // Navigate to annotation position in the 3D scan
  const handleAnnotationNavigate = useCallback(
    async (position: { x: number; y: number; z: number }) => {
      if (captureRef.current) {
        await captureRef.current.lookAtPosition(position);
      }
    },
    []
  );

  // Handle annotation form close
  const handleAnnotationFormClose = useCallback(() => {
    setAnnotationPosition(null);
    setActiveControl(null);
    setIsWaitingForClick(false);
  }, []);

  // Handle annotation created
  const handleAnnotationCreated = useCallback(() => {
    setAnnotationPosition(null);
    setActiveControl(null);
    setIsWaitingForClick(false);
    onAnnotationCreated?.();
  }, [onAnnotationCreated]);

  const showAnnotationPanel = showAnnotations && !minimal;

  return (
    <div className="flex">
      {/* Main viewer */}
      <div
        ref={containerRef}
        className={cn(
          "flex flex-1 flex-col",
          isFullscreen ? "bg-background" : ""
        )}
      >
        {/* Scan tabs + controls — hidden in minimal (embed) mode unless multiple scans */}
        {(!minimal || scans.length > 1) && (
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

            {!minimal && (
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
            )}
          </div>
        )}

        {/* SDK Controls toolbar — only for Matterport scans, hidden in minimal mode */}
        {!minimal && activeScan?.type === "MATTERPORT" && (
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-1">
            <SDKControls
              isMock={isMock}
              capture={captureRef.current}
              activeControl={activeControl}
              onControlChange={setActiveControl}
              showAnnotate={showAnnotations}
            />
            {activeControl && (
              <span className="text-xs text-muted-foreground">
                {activeControl === "tags" && "Click tags in the scan to view details"}
                {activeControl === "measure" && "Click two points to measure distance"}
                {activeControl === "dollhouse" && "Dollhouse view active"}
                {activeControl === "floorplan" && "Floor plan view active"}
                {activeControl === "annotate" && isWaitingForClick && "Click on the 3D scan to place a pin..."}
                {activeControl === "annotate" && annotationPosition && "Fill in the annotation details"}
              </span>
            )}
          </div>
        )}

        {/* Scan description — hidden in minimal mode */}
        {activeScan?.description && !isFullscreen && !minimal && (
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
            isFullscreen || minimal ? "flex-1" : "aspect-video lg:aspect-[21/9]"
          )}
        >
          {activeScan ? (
            <iframe
              key={activeScan.id}
              ref={iframeRef}
              src={iframeSrc}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={`${activeScan.name} — ${propertyName}`}
              onLoad={handleIframeLoad}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No scan selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Annotation panel — shown when feature enabled */}
      {showAnnotationPanel && (
        <div className="flex flex-col">
          {/* Annotation form — shown when a position is selected */}
          {annotationPosition && activeScan && (
            <AnnotationForm
              scanId={activeScan.id}
              position={annotationPosition}
              onClose={handleAnnotationFormClose}
              onCreated={handleAnnotationCreated}
            />
          )}

          <AnnotationPanel
            annotations={annotations}
            onNavigate={captureRef.current ? handleAnnotationNavigate : undefined}
            onRefresh={onAnnotationCreated}
          />
        </div>
      )}
    </div>
  );
}
