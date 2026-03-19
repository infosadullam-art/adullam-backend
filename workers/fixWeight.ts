import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Met tous les poids nuls à 0
  const result = await prisma.product.updateMany({
    where: { weight: null },
    data: { weight: 0 },
  });

  console.log(`Poids mis à jour pour ${result.count} produits.`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
