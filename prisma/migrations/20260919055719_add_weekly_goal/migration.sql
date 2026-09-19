-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "weeklyQuestions" INTEGER,
    "weeklyMinutes" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);
