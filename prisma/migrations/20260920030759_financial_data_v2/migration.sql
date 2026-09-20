/*
  Warnings:

  - You are about to drop the column `monthlySalary` on the `FinancialSettings` table. All the data in the column will be lost.
  - You are about to drop the column `startingBalance` on the `FinancialSettings` table. All the data in the column will be lost.
  - Added the required column `startMonthYear` to the `ExpenseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentBalance` to the `FinancialSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpenseItem" ADD COLUMN     "startMonthYear" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FinancialSettings" DROP COLUMN "monthlySalary",
DROP COLUMN "startingBalance",
ADD COLUMN     "currentBalance" DECIMAL(15,2) NOT NULL,
ALTER COLUMN "projectionMonthsCount" SET DEFAULT 60;

-- CreateTable
CREATE TABLE "IncomePeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "startMonth" TEXT NOT NULL,
    "endMonth" TEXT,
    "notes" TEXT,
    "settingsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomePeriod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncomePeriod" ADD CONSTRAINT "IncomePeriod_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "FinancialSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
