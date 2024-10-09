require('dotenv').config();
const { MongoClient } = require('mongodb');
const { CohereClient } = require('cohere-ai');
const fs = require('fs');

const uri = process.env.MONGODB_ATLAS_URI;
const client = new MongoClient(uri);
const db = process.env.MONGODB_ATLAS_DB;
const col = process.env.MONGODB_ATLAS_AGENTS_DOCUMENTS_COLLECTION;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function indexDocuments() {
  try {
    await client.connect();
    const database = client.db(db);
    const collection = database.collection(col);

    const documents = JSON.parse(fs.readFileSync('data/documents.json'));

    for (const doc of documents) {
      const response = await cohere.v2.embed({
        texts: [doc.content],
        model: 'embed-english-v3.0',
        inputType: 'search_document',
        embeddingTypes:[
          "float"
        ]
      });
     // console.log(response);
      const embedding = response.embeddings.float[0];

      await collection.insertOne({
        ...doc,
        embedding,
      });
    }

    console.log('Documents indexed successfully.');
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

indexDocuments().catch(console.error);
