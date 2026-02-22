"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { EnhancedScanViewer } from "./enhanced-scan-viewer";

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
  scanId: string;
}

interface ScanViewerWithAnnotationsProps {
  scans: Scan[];
  propertyName: string;
  isMock: boolean;
  annotations: AnnotationData[];
  showAnnotations: boolean;
}

export function ScanViewerWithAnnotations({
  scans,
  propertyName,
  isMock,
  annotations,
  showAnnotations,
}: ScanViewerWithAnnotationsProps) {
  const router = useRouter();

  const handleAnnotationCreated = useCallback(() => {
    // Trigger server-side re-fetch of annotations
    router.refresh();
  }, [router]);

  return (
    <EnhancedScanViewer
      scans={scans}
      propertyName={propertyName}
      isMock={isMock}
      annotations={annotations}
      showAnnotations={showAnnotations}
      onAnnotationCreated={handleAnnotationCreated}
    />
  );
}
