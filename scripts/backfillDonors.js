const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const { upsertDonorFromUser } = require('../services/donorSyncService');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodbytap';

async function runBackfill() {
  await mongoose.connect(MONGODB_URI);

  let processed = 0;
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const cursor = User.find({ role: 'donor' }).cursor();

    for (let user = await cursor.next(); user != null; user = await cursor.next()) {
      processed += 1;

      try {
        const result = await upsertDonorFromUser(user);
        if (result) {
          synced += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;
        console.error(`Failed syncing donor user ${user._id}:`, error.message);
      }
    }

    console.log('Donor backfill complete');
    console.log(JSON.stringify({ processed, synced, skipped, failed }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

runBackfill().catch((error) => {
  console.error('Donor backfill failed:', error.message);
  process.exit(1);
});
