-- CreateEnum
CREATE TYPE "AdminTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "AdminTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AdminTicketStatus" NOT NULL DEFAULT 'OPEN',
    "raisedById" TEXT NOT NULL,
    "adminResponse" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminTicket_ticketNumber_key" ON "AdminTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "AdminTicket_raisedById_createdAt_idx" ON "AdminTicket"("raisedById", "createdAt");

-- CreateIndex
CREATE INDEX "AdminTicket_status_createdAt_idx" ON "AdminTicket"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminTicket" ADD CONSTRAINT "AdminTicket_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminTicket" ADD CONSTRAINT "AdminTicket_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
