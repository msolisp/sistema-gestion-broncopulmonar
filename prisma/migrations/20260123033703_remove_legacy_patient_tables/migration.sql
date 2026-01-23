/*
  Warnings:

  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalExam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PulmonaryFunctionTest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalExam" DROP CONSTRAINT "MedicalExam_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_patientId_fkey";

-- DropForeignKey
ALTER TABLE "PulmonaryFunctionTest" DROP CONSTRAINT "PulmonaryFunctionTest_patientId_fkey";

-- DropTable
DROP TABLE "Appointment";

-- DropTable
DROP TABLE "MedicalExam";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "Patient";

-- DropTable
DROP TABLE "PulmonaryFunctionTest";
