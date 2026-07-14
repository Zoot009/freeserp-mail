-- CreateTable
CREATE TABLE "Branding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "brandColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "senderName" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "unsubscribeText" TEXT NOT NULL DEFAULT 'You''re receiving this because you signed up.',
    "socialInstagram" TEXT NOT NULL DEFAULT '',
    "socialX" TEXT NOT NULL DEFAULT '',
    "socialLinkedin" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branding_projectId_key" ON "Branding"("projectId");

-- AddForeignKey
ALTER TABLE "Branding" ADD CONSTRAINT "Branding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

