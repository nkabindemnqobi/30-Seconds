const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";
const token = process.env.GITHUB_AI_TOKEN; 

if (!token) {
  throw new Error("Missing GITHUB_AI_TOKEN environment variable");
}

const aiClient = ModelClient(endpoint, new AzureKeyCredential(token));

async function generateHint(itemName, category) {
  const systemPrompt = 'You are a game assistant providing hints for a guessing game.';
  const userPrompt = `Give a clever hint for guessing "${itemName}" in the category "${category}". 
  The hint must be fair, challenging, and not reveal the answer directly.
  Respond with just the hint — no extra text, quotes, or formatting.`;
  //console.log("Generate hint is being called !!!!!!")
  try {
    const response = await aiClient.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        top_p: 1,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }
    //console.log("Hint has been generated!!");
    return response.body.choices[0].message.content.trim();
  } catch (err) {
    throw new Error("Hint generation failed");
  }
}

module.exports = {
  generateHint
};
