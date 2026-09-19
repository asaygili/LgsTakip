-- CreateTable
CREATE TABLE "MistakeFile" (
    "id" TEXT NOT NULL,
    "mistakeId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MistakeFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MistakeFile" ADD CONSTRAINT "MistakeFile_mistakeId_fkey" FOREIGN KEY ("mistakeId") REFERENCES "Mistake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
