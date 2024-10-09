
const { cohereLLM } = require('../server/cohereLangChainSetup');
const sharedDataStore = require('../shared/sharedDataStore_1');
const predictiveModel = require('../models/predictiveModel');
const tools = require('./tools');
const { trim } = require('lodash');

async function execute(input) {
  const { input_data, maintenance_findings, quality_feedback } = input;
  const input_data_json = JSON.parse(input_data);
  const predictedImpact = predictiveModel.predict(parseFloat(input_data_json.spindleSpeed));
  // Prepare the tools description
  const toolsDescription = tools
    .map((tool) => `${tool.name}: ${tool.description}`)
    .join('\n');

  const prompt = `
  You are the **Process Optimization AI Agent**, a specialist in enhancing production efficiency within a smart factory environment.

  **Role and Responsibilities:**
  - **Analyze Production Processes:** Evaluate current manufacturing processes to identify inefficiencies and bottlenecks.
  - **Optimize Parameters:** Adjust production parameters such as spindle speed, feed rate, and temperature to maximize efficiency and output quality.
  - **Integrate Insights:** Incorporate findings from the Predictive Maintenance and Quality Assurance Agents to inform optimization strategies.
  - **Utilize Predictive Models:** Leverage predictive models to anticipate the impact of parameter changes on production outcomes.
  
You have access to the following tools:
${toolsDescription}

You must have to use a tool, so output a line in the format:

[Tool Request]: <tool_name>:<tool_input>

Given the following machine sensor data:
${input_data}

Maintenance findings from the Predictive Maintenance Agent:
${maintenance_findings || 'No maintenance findings'}

Quality feedback from the Quality Assurance Agent:
${quality_feedback || 'No feedback'}

Predicted impact from ML model:
${predictedImpact}

And use the search_documents tool


**Objective:**
As the optimization expert, analyze the provided data and maintenance findings to adjust production parameters for enhanced efficiency.

**Output Requirements:**
- Provide the **top 2 specific process optimization recommendations** to enhance efficiency, in bullet points.
- Focus solely on production process adjustments and dont overlap with predictive maintenance or quality assurance agent output.
- Ensure recommendations are actionable and aimed at maximizing efficiency without compromising quality.

`;


    const response = await cohereLLM.chat(
      {
        model: "command-r",
        messages: [
          { role: "user",
            content: prompt
          }
        ]
      }
    )


    let trimResponse= response.message.content[0].text;

// Check if the model wants to use a tool
//const toolRequestRegex = /\[Tool Request\]:\s*(\w+):(.+)/;
const toolRequestRegex = /\[Tool Request\]?:\s*(\w+):\s*"?(.*?)"?$/m;

const match = trimResponse.match(toolRequestRegex);

if (match) {
  const toolName = match[1].trim();
  const toolInput = match[2].trim();

  console.log(`Model requested tool: ${toolName} with input: ${toolInput}`);

  // Find the tool
  const tool = tools.find((t) => t.name === toolName);
  if (tool) {
    // Execute the tool
    const toolResult = await tool.func(toolInput);
    //console.log(`Tool Result: ${toolResult}`);

    // Update the prompt with the tool result
    const newPrompt = `
You previously requested to use the tool ${toolName} with input "${toolInput}" and received the following result:

${toolResult}

Based on this information, provide the top 2 specific process optimization recommendations to enhance efficiency, in bullet points.

Focus on production process adjustments only.
`;

   // console.log('New Prompt after Tool Use:', newPrompt);



    const finalResponse = await cohereLLM.chat(
      {
        model: "command-r",
        messages: [
          { role: "user",
            content: newPrompt
          }
        ]
      }
    )

    trimResponse = finalResponse.message.content[0].text;

    //console.log('Final Model Output:', trimResponse);
  } else {
    console.log(`Tool ${toolName} not found.`);
  }
}



  const actualOutcome = parseFloat(input_data_json.surfaceFinish);
  predictiveModel.addDataPoint(parseFloat(input_data_json.spindleSpeed), actualOutcome);
  
  
  
  
  
  
  
  await sharedDataStore.write('optimizationData', trimResponse);

  await sharedDataStore.addHistory({
    timestamp: new Date(),
    inputData: input_data_json,
    agent: 'Process Optimization',
    output: trimResponse,
    surfaceFinish: actualOutcome,
  });

  return trimResponse;
}

module.exports = { execute };
