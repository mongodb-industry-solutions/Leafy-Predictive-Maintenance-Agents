
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const {CohereEmbeddings} = require('@langchain/cohere');
const { CohereClientV2 } = require('cohere-ai');

const uri = process.env.MONGODB_ATLAS_URI;
const client = new MongoClient(uri);
const db = process.env.MONGODB_ATLAS_DB;
const col = process.env.MONGODB_ATLAS_AGENTS_DOCUMENTS_COLLECTION;

const collection = client
  .db(db)
  .collection(col);

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

embeddings = new CohereEmbeddings({
  model:"embed-english-v3.0",
})

const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
  collection: collection,
  embeddingKey: 'embedding',
  indexName: 'ai_agent_vector_index',
  textKey: 'content',
});

module.exports = { vectorStore };
