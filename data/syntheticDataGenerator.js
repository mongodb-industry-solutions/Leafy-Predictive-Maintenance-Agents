
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_ATLAS_URI;
const db = process.env.MONGODB_ATLAS_DB;
const client = new MongoClient(uri);
const col = process.env.MONGODB_ATLAS_AGENTS_SENSORDATA_COLLECTION;

async function generateSyntheticData(numRecords) {
  try {
    await client.connect();
    const database = client.db(db);
    const collection = database.collection(col);

    const data = [];

    for (let i = 0; i < numRecords; i++) {
      const record = {
        timestamp: new Date(Date.now() + i * 1000),
        spindleSpeed: 1000 + Math.random() * 500,
        vibration: Math.random() * 5,
        temperature: 70 + Math.random() * 10,
        toolUsageTime: Math.random() * 100,
        wearRate: Math.random() * 0.05,
        surfaceFinish: Math.random() * 0.1,
        dimensionalAccuracy: 0.01 + Math.random() * 0.02,
      };
      data.push(record);
    }

    await collection.insertMany(data);
    console.log(`Inserted ${numRecords} records into ai_agents_sensor_data collection.`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

generateSyntheticData(1000);
