/*
  Warnings:

  - You are about to drop the `ActivityEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AgentRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CandidateProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobPreference` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentRun" DROP CONSTRAINT "AgentRun_userId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobMatchId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "CandidateProfile" DROP CONSTRAINT "CandidateProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "JobMatch" DROP CONSTRAINT "JobMatch_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobMatch" DROP CONSTRAINT "JobMatch_userId_fkey";

-- DropForeignKey
ALTER TABLE "JobPreference" DROP CONSTRAINT "JobPreference_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agentCredits" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "usuageCredits" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "ActivityEvent";

-- DropTable
DROP TABLE "AgentRun";

-- DropTable
DROP TABLE "Application";

-- DropTable
DROP TABLE "CandidateProfile";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "JobMatch";

-- DropTable
DROP TABLE "JobPreference";

-- DropEnum
DROP TYPE "ActivityEventType";

-- DropEnum
DROP TYPE "AgentRunStatus";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- DropEnum
DROP TYPE "JobMatchStatus";
