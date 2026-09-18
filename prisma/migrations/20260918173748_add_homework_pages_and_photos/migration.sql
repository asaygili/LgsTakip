-- AlterTable
ALTER TABLE "Homework" ADD COLUMN "pages" TEXT;

-- CreateTable
CREATE TABLE "HomeworkPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeworkId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeworkPhoto_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
