import { getDatabase } from "@/lib/mongodb";

// Safety: only initialize credits where it's missing or null.
// This avoids resetting existing users' balances.
async function main() {
  const db = await getDatabase();
  const coll = db.collection("userinformation");

  const filter = { $or: [{ credits: { $exists: false } }, { credits: null }] };
  const res = await coll.updateMany(filter, {
    $set: { credits: 20, updatedAt: new Date() },
  });
  console.log(
    `Initialized credits to 20 for ${res.modifiedCount} user(s) that lacked credits`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
