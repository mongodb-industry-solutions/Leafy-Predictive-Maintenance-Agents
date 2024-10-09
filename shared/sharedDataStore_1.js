
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_ATLAS_URI;
const dbName = process.env.MONGODB_ATLAS_DB;
const col1 = process.env.MONGODB_ATLAS_AGENTS_KEYVALUE_COLLECTION;
const col2 = process.env.MONGODB_ATLAS_AGENTS_HISTORY_COLLECTION;

const client = new MongoClient(uri);

let db;
let keyValueCollection;
let historyCollection;

// Connect to MongoDB
async function connectDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db(dbName);
      keyValueCollection = db.collection(col1);
      historyCollection = db.collection(col2);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }
}

async function write(key, value) {
  try {
    await connectDB();
    await keyValueCollection.updateOne(
      { key },
      { $set: { value } },
      { upsert: true }
    );
    console.log(`Key "${key}" written successfully.`);
  } catch (error) {
    console.error(`Error writing key "${key}":`, error);
  }
}

async function read(key) {
  try {
    await connectDB();
    const result = await keyValueCollection.findOne({ key });
    return result ? result.value : null;
  } catch (error) {
    console.error(`Error reading key "${key}":`, error);
    return null;
  }
}

async function addHistory(entry) {
  try {
    await connectDB();
    await historyCollection.insertOne(entry);
    //console.log(entry);
    console.log('History entry added successfully.');
  } catch (error) {
    console.error('Error adding history entry:', error);
  }
}

async function getHistory() {
  try {
    await connectDB();
    const history = await historyCollection.find({}).sort({ timestamp: 1 }).toArray();
    return history;
  } catch (error) {
    console.error('Error retrieving history:', error);
    return [];
  }
}

async function calculateKPIs() {
  try {
    const history = await getHistory();
    let totalSurfaceFinish = 0;
    let count = 0;

    history.forEach((entry) => {
      let inputData = entry.inputData;

      if (typeof inputData === 'string') {
        try {
          inputData = JSON.parse(inputData);
        } catch (error) {
          console.error('Error parsing inputData:', error);
          return; 
        }
      }

      if (inputData && inputData.surfaceFinish !== undefined) {
        totalSurfaceFinish += parseFloat(inputData.surfaceFinish);
        count += 1;
      }
    });

    const averageSurfaceFinish = count > 0 ? (totalSurfaceFinish / count).toFixed(2) : 0;

    return {
      averageSurfaceFinish,
    };
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return {};
  }
}

async function closeConnection() {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

module.exports = {
  write,
  read,
  addHistory,
  getHistory,
  calculateKPIs,
  closeConnection,
};
