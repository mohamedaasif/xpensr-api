/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `bankName` on table `Account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "bankName" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "countryCode" TEXT DEFAULT '+91',
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
