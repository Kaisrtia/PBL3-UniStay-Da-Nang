-- DropForeignKey
ALTER TABLE "student_demand" DROP CONSTRAINT "student_demand_wardId_fkey";

-- AddForeignKey
ALTER TABLE "student_demand" ADD CONSTRAINT "student_demand_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
