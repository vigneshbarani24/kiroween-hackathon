-- AlterTable
ALTER TABLE "Resurrection" ADD COLUMN     "abapAnalysis" JSONB,
ADD COLUMN     "abapCode" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "complexity" INTEGER,
ADD COLUMN     "linesOfCode" INTEGER,
ADD COLUMN     "transformationPlan" JSONB;

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "resurrectionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "output" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCPLog" (
    "id" TEXT NOT NULL,
    "resurrectionId" TEXT,
    "serverName" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "params" JSONB,
    "response" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MCPLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowStep_resurrectionId_idx" ON "WorkflowStep"("resurrectionId");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- CreateIndex
CREATE INDEX "MCPLog_resurrectionId_idx" ON "MCPLog"("resurrectionId");

-- CreateIndex
CREATE INDEX "MCPLog_serverName_idx" ON "MCPLog"("serverName");

-- CreateIndex
CREATE INDEX "MCPLog_calledAt_idx" ON "MCPLog"("calledAt");

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_resurrectionId_fkey" FOREIGN KEY ("resurrectionId") REFERENCES "Resurrection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MCPLog" ADD CONSTRAINT "MCPLog_resurrectionId_fkey" FOREIGN KEY ("resurrectionId") REFERENCES "Resurrection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
