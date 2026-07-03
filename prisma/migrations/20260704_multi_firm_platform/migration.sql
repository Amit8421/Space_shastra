-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "firmId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "firmId" TEXT,
ADD COLUMN     "username" TEXT NOT NULL DEFAULT 'admin',
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "firms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schemaName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "firms_slug_key" ON "firms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "firms_schemaName_key" ON "firms"("schemaName");

-- CreateIndex
CREATE INDEX "sessions_firmId_idx" ON "sessions"("firmId");

-- CreateIndex
CREATE INDEX "users_firmId_idx" ON "users"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "users_firmId_username_key" ON "users"("firmId", "username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
