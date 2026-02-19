-- CreateEnum
CREATE TYPE "FeatureKey" AS ENUM ('ANALYTICS', 'INVENTORY');

-- CreateEnum
CREATE TYPE "ScanEventType" AS ENUM ('MOVE', 'ZOOM', 'TAG_CLICK', 'HOTSPOT_CLICK', 'DWELL');

-- CreateEnum
CREATE TYPE "HeatmapTimeRange" AS ENUM ('DAY', 'WEEK', 'MONTH', 'ALL');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('FURNITURE', 'ELECTRONICS', 'APPLIANCE', 'FIXTURE', 'ART', 'JEWELRY', 'CLOTHING', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('INVENTORY_PDF', 'INVENTORY_CSV', 'ANALYTICS_PDF', 'ANALYTICS_CSV');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "organization_features" (
    "id" TEXT NOT NULL,
    "featureKey" "FeatureKey" NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabledBy" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "organization_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_sessions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "deviceType" TEXT,
    "entryPoint" TEXT,
    "totalMoves" INTEGER NOT NULL DEFAULT 0,
    "totalZooms" INTEGER NOT NULL DEFAULT 0,
    "scanId" TEXT NOT NULL,

    CONSTRAINT "scan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "type" "ScanEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "positionZ" DOUBLE PRECISION,
    "targetId" TEXT,
    "metadata" JSONB,
    "duration" DOUBLE PRECISION,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_tags" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "positionZ" DOUBLE PRECISION,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalDwellTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scanId" TEXT NOT NULL,

    CONSTRAINT "scan_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heatmap_snapshots" (
    "id" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeRange" "HeatmapTimeRange" NOT NULL,
    "dataPoints" JSONB NOT NULL,
    "peakZones" JSONB,
    "scanId" TEXT NOT NULL,

    CONSTRAINT "heatmap_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_items" (
    "id" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "positionZ" DOUBLE PRECISION,
    "scanTagId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "asset_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetItemId" TEXT NOT NULL,

    CONSTRAINT "asset_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_features_organizationId_idx" ON "organization_features"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_features_organizationId_featureKey_key" ON "organization_features"("organizationId", "featureKey");

-- CreateIndex
CREATE INDEX "scan_sessions_scanId_idx" ON "scan_sessions"("scanId");

-- CreateIndex
CREATE INDEX "scan_sessions_startedAt_idx" ON "scan_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "scan_events_sessionId_idx" ON "scan_events"("sessionId");

-- CreateIndex
CREATE INDEX "scan_events_type_idx" ON "scan_events"("type");

-- CreateIndex
CREATE INDEX "scan_tags_scanId_idx" ON "scan_tags"("scanId");

-- CreateIndex
CREATE UNIQUE INDEX "scan_tags_scanId_tagId_key" ON "scan_tags"("scanId", "tagId");

-- CreateIndex
CREATE INDEX "heatmap_snapshots_scanId_idx" ON "heatmap_snapshots"("scanId");

-- CreateIndex
CREATE INDEX "heatmap_snapshots_timeRange_idx" ON "heatmap_snapshots"("timeRange");

-- CreateIndex
CREATE INDEX "asset_items_propertyId_idx" ON "asset_items"("propertyId");

-- CreateIndex
CREATE INDEX "asset_items_roomName_idx" ON "asset_items"("roomName");

-- CreateIndex
CREATE INDEX "asset_items_category_idx" ON "asset_items"("category");

-- CreateIndex
CREATE INDEX "asset_photos_assetItemId_idx" ON "asset_photos"("assetItemId");

-- CreateIndex
CREATE INDEX "export_jobs_organizationId_idx" ON "export_jobs"("organizationId");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- AddForeignKey
ALTER TABLE "organization_features" ADD CONSTRAINT "organization_features_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "scan_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_tags" ADD CONSTRAINT "scan_tags_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heatmap_snapshots" ADD CONSTRAINT "heatmap_snapshots_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_items" ADD CONSTRAINT "asset_items_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_photos" ADD CONSTRAINT "asset_photos_assetItemId_fkey" FOREIGN KEY ("assetItemId") REFERENCES "asset_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
