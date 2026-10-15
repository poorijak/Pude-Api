-- CreateEnum
CREATE TYPE "QuestionMode" AS ENUM ('PICTURE_NAMING', 'WORD_CLUE', 'PHRASE', 'CONVERSATION');

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL,
    "mode" "QuestionMode" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "promptText" TEXT,
    "targetText" TEXT,
    "acceptedAnswers" TEXT[] NOT NULL,
    "hintMeaning" TEXT,
    "hintSyllable" TEXT,
    "situation" TEXT,
    "keyWords" TEXT[] NOT NULL,
    "exampleAnswers" TEXT[] NOT NULL,
    "expectedTopic" TEXT,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "imageAlt" TEXT,
    "imagePrompt" TEXT,
    "isPretest" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Question_level_check" CHECK ("level" > 0),
    CONSTRAINT "Question_stage_check" CHECK ("stage" > 0),
    CONSTRAINT "Question_sortOrder_check" CHECK ("sortOrder" > 0),
    CONSTRAINT "Question_pretest_active_check" CHECK (NOT "isPretest" OR "isActive")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_code_key" ON "Question"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Question_mode_level_stage_sortOrder_key" ON "Question"("mode", "level", "stage", "sortOrder");

-- CreateIndex
CREATE INDEX "Question_mode_level_stage_isActive_idx" ON "Question"("mode", "level", "stage", "isActive");

-- CreateIndex
CREATE INDEX "Question_isPretest_isActive_idx" ON "Question"("isPretest", "isActive");
