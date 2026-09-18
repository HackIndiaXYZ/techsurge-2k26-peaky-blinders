import { PrismaClient } from "@prisma/client";
import { seedScenario } from "./scenario-seeder";

const prisma = new PrismaClient();

async function main() {
  await seedScenario("SCENARIO_ACCIDENTAL_TRANSFER");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
