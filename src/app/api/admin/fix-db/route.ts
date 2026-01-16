import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const results = []

        // 1. Fix MedicalExam table
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "MedicalExam" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'portal interno';`)
            results.push("Added source column")
        } catch (e: any) {
            results.push(`Error adding source: ${e.message}`)
        }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "MedicalExam" ADD COLUMN IF NOT EXISTS "uploadedByUserId" TEXT;`)
            results.push("Added uploadedByUserId column")
        } catch (e: any) {
            results.push(`Error adding uploadedByUserId: ${e.message}`)
        }

        // 2. Create Notification table
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "patientId" TEXT NOT NULL,
          "examId" TEXT,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        );
      `)
            results.push("Created Notification table")

            // Add foreign key
            await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_patientId_fkey') THEN
            ALTER TABLE "Notification" ADD CONSTRAINT "Notification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)
            results.push("Added Notification FK")

            // Add index
            await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Notification_read_createdAt_idx" ON "Notification"("read", "createdAt");
      `)
            results.push("Added Notification Index")

        } catch (e: any) {
            results.push(`Error creating Notification table: ${e.message}`)
        }

        return NextResponse.json({ success: true, results })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
