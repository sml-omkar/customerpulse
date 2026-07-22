-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "resolvedStartedAt" TIMESTAMP(3),
ADD COLUMN     "ticketTurnOverTime" DOUBLE PRECISION,
ADD COLUMN     "totalResolvedMinutes" INTEGER NOT NULL DEFAULT 0;
