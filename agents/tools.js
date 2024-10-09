const { CohereClient } = require('cohere-ai');
const { vectorStore } = require('../server/vectorStore');


const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const searchDocuments = {
  name: 'search_documents',
  description: 'Search through machine manuals and work orders for relevant information.',
  func: async (query) => {
    try {
    /*const response = await cohere.v2.embed({
      texts: [String(query)],
      model: 'embed-english-v3.0',
      inputType: 'search_query',
      embeddingTypes: ["float"],
    });
    const queryEmbedding = response.embeddings.float[0];
*/
    const results = await vectorStore.similaritySearch(String(query));

   /* const formattedResults = results.map((result => ({
      pageContent: result.pageContent,
      type: result.metadata.type,
      })))
    console.log(formattedResults);
      return formattedResults;
*/

    return results
      .map((result) => {
        const doc = result.pageContent;
        return `${result.metadata.type}: ${doc}`;
      })
      .join('\n');
      
    } catch (error) {
      console.error('Error in searchDocuments:', error);
      return 'An error occurred while searching documents.';
    }
  },
};

module.exports = [searchDocuments];
