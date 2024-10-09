
const { cohereLLM } = require('../server/cohereLangChainSetup');
const sharedDataStore = require('../shared/sharedDataStore_1');
const tools = require('./tools');


async function execute(input) {
  const { input_data, quality_feedback } = input;

  const history = await sharedDataStore.getHistory();
  const recentIssues = history.slice(-5).map((h) => h.qualityIssues).join('; ');


  // Prepare the tools description
  const toolsDescription = tools
    .map((tool) => `${tool.name}: ${tool.description}`)
    .join('\n');

 const prompt = `
 You are the **Predictive Maintenance AI Agent**, a specialist in machinery maintenance within a smart factory environment.

 **Role and Responsibilities:**
 - **Monitor Equipment Health:** Continuously analyze machine sensor data to assess the current health status of equipment.
 - **Predict Failures:** Utilize historical data and real-time sensor readings to predict potential equipment failures before they occur.
 - **Recommend Maintenance Actions:** Provide actionable maintenance recommendations to prevent unexpected downtime and extend machinery lifespan.
 - **Collaboration:** Incorporate feedback from the Quality Assurance Agent to refine maintenance strategies.
 
 You have access to the following tools:
${toolsDescription}

You must have to use a tool, so output a line in the format:

[Tool Request]: <tool_name>:<tool_input>

Given the following machine sensor data:
${input_data}

Recent quality issues:
${recentIssues || 'None'}

Feedback from the Quality Assurance Agent:
${quality_feedback || 'No feedback'}

And use the search_documents tool


**Objective:**
As the maintenance expert, analyze the provided sensor data and recent quality issues to identify potential equipment failures.

**Output Requirements:**
- Provide the **top 2 specific maintenance actions** to prevent downtime, in bullet points.
- Focus solely on maintenance-related tasks  and avoid overlapping with optimization or quality concerns.
- Ensure recommendations are actionable and based on data-driven insights.

Provide the **top 2 specific maintenance actions** to prevent downtime, in bullet points.

Focus solely on maintenance-related tasks and avoid overlapping with optimization or quality concerns.

**Example Output:**
- Increase lubrication frequency for the spindle motor to reduce wear.
- Calibrate temperature sensors to ensure accurate readings and prevent overheating.

`;

 // console.log('Prompt: ', prompt);
  //const response = await cohereLLM.call(prompt);
  const response = await cohereLLM.chat(
    {
      model: "command-r",
      messages: [
        { 
          role: "user",
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

   // console.log(`Model requested tool: ${toolName} with input: ${toolInput}`);

    // Find the tool
    const tool = tools.find((t) => t.name === toolName);
    if (tool) {
      // Execute the tool
      const toolResult = await tool.func(toolInput);
     // console.log(`Tool Result: ${toolResult}`);

      // Update the prompt with the tool result
      const newPrompt = `
You previously requested to use the tool ${toolName} with input "${toolInput}" and received the following result:

${toolResult}

Based on this information, provide the top 2 specific maintenance actions to prevent downtime, in bullet points.

Focus solely on maintenance-related tasks and avoid overlapping with optimization or quality concerns.

As a reminder, You are the **Predictive Maintenance AI Agent**, a specialist in machinery maintenance within a smart factory environment.

**Role and Responsibilities:**
- **Monitor Equipment Health:** Continuously analyze machine sensor data to assess the current health status of equipment.
- **Predict Failures:** Utilize historical data and real-time sensor readings to predict potential equipment failures before they occur.
- **Recommend Maintenance Actions:** Provide actionable maintenance recommendations to prevent unexpected downtime and extend machinery lifespan.
- **Collaboration:** Incorporate feedback from the Quality Assurance Agent to refine maintenance strategies.

**Example Output:**
- Increase lubrication frequency for the spindle motor to reduce wear.
- Calibrate temperature sensors to ensure accurate readings and prevent overheating.


`;

     // console.log('New Prompt after Tool Use:', newPrompt);

     

      const finalResponse = await cohereLLM.chat(
        {
          model: "command-r",
          messages: [
            { 
              role: "user",
              content: newPrompt
            }
          ]
        }
      )

      trimResponse = finalResponse.message.content[0].text;

     // console.log('Final Model Output:', trimResponse);
    } else {
      console.log(`Tool ${toolName} not found.`);
    }
  }


  await sharedDataStore.write('maintenanceData', trimResponse);



  await sharedDataStore.addHistory({
    timestamp: new Date(),
    inputData: JSON.parse(input_data),
    agent: 'Predictive Maintenance',
    output: trimResponse,
    qualityIssues: quality_feedback ? quality_feedback.maintenance : null,
  });

  return trimResponse;
}

module.exports = { execute };
