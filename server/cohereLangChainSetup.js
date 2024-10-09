
require('dotenv').config();
const { CohereClientV2 } = require('cohere-ai');
const cohereLLM = new CohereClientV2({ token: process.env.COHERE_API_KEY });        



module.exports = { cohereLLM };
