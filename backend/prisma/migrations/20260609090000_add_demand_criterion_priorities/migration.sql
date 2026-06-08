CREATE TYPE "demand_criterion_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "student_demand"
ADD COLUMN "pricePriority" "demand_criterion_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "locationPriority" "demand_criterion_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "areaPriority" "demand_criterion_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "roommatePriority" "demand_criterion_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "roomTypePriority" "demand_criterion_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "amenityPriority" "demand_criterion_priority" NOT NULL DEFAULT 'MEDIUM';
