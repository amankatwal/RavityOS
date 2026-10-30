-- AlterTable
ALTER TABLE "User" ALTER COLUMN "agentCredits" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "tools" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'active',
    "requires_auth" BOOLEAN DEFAULT false,
    "auth_type" VARCHAR(50),
    "auth_provider" VARCHAR(100),
    "capabilities" JSONB DEFAULT '[]',
    "use_cases" JSONB DEFAULT '[]',
    "permissions" JSONB DEFAULT '[]',
    "approval_rules" JSONB,
    "config" JSONB,
    "risk_level" VARCHAR(30) DEFAULT 'low',
    "can_read" BOOLEAN DEFAULT false,
    "can_write" BOOLEAN DEFAULT false,
    "can_delete" BOOLEAN DEFAULT false,
    "can_execute" BOOLEAN DEFAULT true,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tools_slug_key" ON "tools"("slug");
