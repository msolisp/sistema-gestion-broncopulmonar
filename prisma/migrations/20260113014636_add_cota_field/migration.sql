-- AlterTable (idempotent - safe for rerun)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MedicalKnowledge' 
        AND column_name = 'imageUrl'
    ) THEN
        ALTER TABLE "MedicalKnowledge" ADD COLUMN "imageUrl" TEXT;
    END IF;
END $$;

-- AlterTable (idempotent - safe for rerun)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Patient' 
        AND column_name = 'cota'
    ) THEN
        ALTER TABLE "Patient" ADD COLUMN "cota" DOUBLE PRECISION;
    END IF;
END $$;
