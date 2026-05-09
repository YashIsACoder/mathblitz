-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "lhs" REAL NOT NULL,
    "rhs" REAL NOT NULL,
    "operation" TEXT NOT NULL,
    "correctAnswer" REAL NOT NULL,
    "typedAnswer" REAL,
    "isCorrect" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL,
    CONSTRAINT "Attempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeaknessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "scores" TEXT NOT NULL,
    "insights" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Attempt_sessionId_idx" ON "Attempt"("sessionId");

-- CreateIndex
CREATE INDEX "Attempt_operation_idx" ON "Attempt"("operation");

-- CreateIndex
CREATE INDEX "Attempt_timestamp_idx" ON "Attempt"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "WeaknessProfile_userId_key" ON "WeaknessProfile"("userId");
