const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.reward.createMany({
    data: [
      {
        name: "ตัดผมฟรี 1 ครั้ง",
        description: "ฟรีค่าบริการตัดผม 1 ครั้ง สำหรับทรงใดก็ได้",
        pointsCost: 10,
        discountType: "FREE_SERVICE",
      },
      {
        name: "ส่วนลด 50 บาท",
        description: "ส่วนลด 50 บาท สำหรับบริการใดก็ได้",
        pointsCost: 5,
        discountValue: 50,
        discountType: "FIXED_AMOUNT",
      },
      {
        name: "ส่วนลด 10%",
        description: "รับส่วนลด 10% จากยอดรวมการใช้บริการ",
        pointsCost: 3,
        discountValue: 10,
        discountType: "PERCENTAGE",
      }
    ],
    skipDuplicates: true
  });
  console.log("Rewards seeded");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
