-- AlterTable
ALTER TABLE "Task" ADD COLUMN "handoffAgentId" TEXT,
ADD COLUMN "handoffNote" TEXT,
ADD COLUMN "handoffReply" TEXT;

-- CreateTable
CREATE TABLE "TaskGrant" (
    "id" TEXT NOT NULL,
    "permission" "PermissionLevel" NOT NULL DEFAULT 'DRAFT',
    "taskId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskGrant_taskId_connectorId_key" ON "TaskGrant"("taskId", "connectorId");

-- CreateIndex
CREATE INDEX "TaskGrant_taskId_idx" ON "TaskGrant"("taskId");

-- CreateIndex
CREATE INDEX "Task_handoffAgentId_idx" ON "Task"("handoffAgentId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_handoffAgentId_fkey" FOREIGN KEY ("handoffAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskGrant" ADD CONSTRAINT "TaskGrant_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskGrant" ADD CONSTRAINT "TaskGrant_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
