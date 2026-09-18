-- AlterTable
ALTER TABLE "MockExam" ADD COLUMN "estimatedPercentile" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TargetSchool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "quota" INTEGER,
    "cutoffScore" REAL,
    "targetPercentile" REAL,
    "targetNet" REAL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TargetSchool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TargetSchool" ("createdAt", "id", "name", "note", "targetNet", "userId") SELECT "createdAt", "id", "name", "note", "targetNet", "userId" FROM "TargetSchool";
DROP TABLE "TargetSchool";
ALTER TABLE "new_TargetSchool" RENAME TO "TargetSchool";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
