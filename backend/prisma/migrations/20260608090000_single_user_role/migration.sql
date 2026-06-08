ALTER TABLE "user" ADD COLUMN "role" "account_role" NOT NULL DEFAULT 'USER';

UPDATE "user"
SET "role" = CASE
  WHEN "roles" @> ARRAY['ADMIN']::"account_role"[] THEN 'ADMIN'::"account_role"
  WHEN "roles" @> ARRAY['HOST']::"account_role"[] THEN 'HOST'::"account_role"
  WHEN "roles" @> ARRAY['STUDENT']::"account_role"[] THEN 'STUDENT'::"account_role"
  ELSE 'USER'::"account_role"
END;

ALTER TABLE "user" DROP COLUMN "roles";
