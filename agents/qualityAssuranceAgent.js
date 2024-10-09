
const { cohereLLM } = require('../server/cohereLangChainSetup');
const sharedDataStore = require('../shared/sharedDataStore_1');
const tools = require('./tools');


async function execute(input) {
  const { input_data, optimization_findings } = input;

 // Prepare the tools description
 const toolsDescription = tools
 .map((tool) => `${tool.name}: ${tool.description}`)
 .join('\n');

const prompt = `
You are the **Quality Assurance AI Agent**, a specialist in product quality evaluation within a smart factory environment.

**Role and Responsibilities:**
- **Assess Product Quality:** Evaluate the quality of products based on machine sensor data and production parameters.
- **Identify Quality Concerns:** Detect potential quality issues that may arise from production inefficiencies or equipment malfunctions.
- **Provide Feedback:** Offer actionable feedback and recommendations to enhance product quality.
- **Collaboration:** Incorporate insights from the Process Optimization Agent to understand the impact of process changes on quality.

You have access to the following tools:
${toolsDescription}

When you need to use a tool, output a line in the format:

[Tool Request]: <tool_name>:<tool_input>

Given the following machine sensor data:
${input_data}

Optimization findings from the Process Optimization Agent:
${optimization_findings || 'No optimization findings'}

And use the search_documents tool

**Objective:**
As the quality expert, assess the provided data and optimization findings to evaluate the potential impact on product quality.

**Output Requirements:**
- Provide the **top 2 specific quality concerns** and feedback, in bullet points.
- Focus solely on quality evaluation and necessary corrective actions and avoid overlap with predictive maintenance and process optimization agent
- Ensure feedback is actionable and aimed at maintaining or improving product quality.

`;

  //const response = await cohereLLM.generate({ prompt });
    //const response = await cohereLLM.call(prompt);
    //console.log(prompt);
    const response = await cohereLLM.chat(
      {
        model: "command-r",
        messages: [
          { role: "user",
            content: prompt
          }
        ]
      }
    );

    let trimResponse= response.message.content[0].text;

  // Check if the model wants to use a tool
  //const toolRequestRegex = /\[Tool Request\]:\s*(\w+):(.+)/;
  const toolRequestRegex = /\[Tool Request\]?:\s*(\w+):\s*"?(.*?)"?$/m;

  const match = trimResponse.match(toolRequestRegex);

  let feedback = null;

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

Based on this information, provide the top 2 specific quality concerns and feedback, in bullet points.

Focus on quality evaluation and necessary corrective actions.
As a reminder, You are the **Quality Assurance AI Agent**, a specialist in product quality evaluation within a smart factory environment.

**Role and Responsibilities:**
- **Assess Product Quality:** Evaluate the quality of products based on machine sensor data and production parameters.
- **Identify Quality Concerns:** Detect potential quality issues that may arise from production inefficiencies or equipment malfunctions.
- **Provide Feedback:** Offer actionable feedback and recommendations to enhance product quality.
- **Collaboration:** Incorporate insights from the Process Optimization Agent to understand the impact of process changes on quality.

`;

      //console.log('New Prompt after Tool Use:', newPrompt);

     

      const finalResponse = await cohereLLM.chat(
        {
          model: "command-r",
          messages: [
            { role: "user",
              content: newPrompt
            }
          ]
        }
      );

      trimResponse = finalResponse.message.content[0].text;

     // console.log('Final Model Output:', trimResponse);
    } else {
      console.log(`Tool ${toolName} not found.`);
    }
  }


   feedback = {
    maintenance: 'Detected increased wear due to parameter changes.',
    optimization: 'Surface finish quality has decreased.',
  };
  await sharedDataStore.addHistory({
    timestamp: new Date(),
    inputData: JSON.parse(input_data),
    agent: 'Quality Assurance',
    output: trimResponse,
    feedback,
    qualityIssues: trimResponse,
  });

  return { output: trimResponse, feedback };
}

module.exports = { execute };
