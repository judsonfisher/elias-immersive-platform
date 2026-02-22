-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('NOTE', 'ISSUE', 'COMMENT');

-- CreateEnum
CREATE TYPE "AnnotationStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FeatureKey" ADD VALUE 'SHARE_LINKS';
ALTER TYPE "FeatureKey" ADD VALUE 'ANNOTATIONS';
ALTER TYPE "FeatureKey" ADD VALUE 'EMBED_WIDGET';
ALTER TYPE "FeatureKey" ADD VALUE 'SCHEDULED_REPORTS';

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxViews" INTEGER,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "status" "AnnotationStatus" NOT NULL DEFAULT 'OPEN',
    "color" TEXT NOT NULL DEFAULT '#ef4444',
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "positionZ" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scanId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embed_configs" (
    "id" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "allowedDomains" TEXT[],
    "brandingColor" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "embed_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "recipients" TEXT[],
    "lastSentAt" TIMESTAMP(3),
    "nextSendAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_token_idx" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_propertyId_idx" ON "share_links"("propertyId");

-- CreateIndex
CREATE INDEX "annotations_scanId_idx" ON "annotations"("scanId");

-- CreateIndex
CREATE INDEX "annotations_authorId_idx" ON "annotations"("authorId");

-- CreateIndex
CREATE INDEX "annotations_type_idx" ON "annotations"("type");

-- CreateIndex
CREATE INDEX "annotations_status_idx" ON "annotations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "embed_configs_apiKey_key" ON "embed_configs"("apiKey");

-- CreateIndex
CREATE INDEX "embed_configs_apiKey_idx" ON "embed_configs"("apiKey");

-- CreateIndex
CREATE INDEX "embed_configs_propertyId_idx" ON "embed_configs"("propertyId");

-- CreateIndex
CREATE INDEX "report_schedules_organizationId_idx" ON "report_schedules"("organizationId");

-- CreateIndex
CREATE INDEX "report_schedules_nextSendAt_idx" ON "report_schedules"("nextSendAt");

-- CreateIndex
CREATE INDEX "report_schedules_isActive_idx" ON "report_schedules"("isActive");

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embed_configs" ADD CONSTRAINT "embed_configs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
