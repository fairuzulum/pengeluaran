-- CreateTable
CREATE TABLE "FinancialSettings" (
    "id" SERIAL NOT NULL,
    "monthlySalary" DECIMAL(15,2) NOT NULL,
    "startingBalance" DECIMAL(15,2) NOT NULL,
    "startingMonthYear" TEXT NOT NULL,
    "projectionMonthsCount" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "category" TEXT NOT NULL,
    "isPaidThisMonth" BOOLEAN NOT NULL DEFAULT false,
    "dueDateDay" INTEGER,
    "endMonthYear" TEXT,
    "notes" TEXT,
    "settingsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialIncome" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "monthYear" TEXT NOT NULL,
    "notes" TEXT,
    "settingsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "monthYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "settingsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationExpense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "FinancialSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialIncome" ADD CONSTRAINT "SpecialIncome_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "FinancialSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationExpense" ADD CONSTRAINT "SimulationExpense_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "FinancialSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
