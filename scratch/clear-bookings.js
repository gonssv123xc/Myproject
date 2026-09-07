const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching bookings...");
  const allBookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' }
  });

  if (allBookings.length <= 1) {
    console.log(`Only ${allBookings.length} booking(s) found. Nothing to delete.`);
    return;
  }

  // Keep the most recent booking
  const keepBooking = allBookings[0];
  const idsToDelete = allBookings.slice(1).map(b => b.id);

  console.log(`Deleting ${idsToDelete.length} bookings. Keeping booking ID: ${keepBooking.id}`);

  const deleteResult = await prisma.booking.deleteMany({
    where: {
      id: { in: idsToDelete }
    }
  });

  console.log(`Successfully deleted ${deleteResult.count} bookings.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
