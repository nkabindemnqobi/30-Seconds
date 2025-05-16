const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");



const getAiClient = () => {
  const endpoint = "https://models.github.ai/inference";
  const token = process.env.GITHUB_AI_TOKEN; 

  if (!token) {
    throw new Error("Missing GITHUB_AI_TOKEN environment variable");
  }

  return ModelClient(endpoint, new AzureKeyCredential(token));
}

async function generateHint(itemName, category) {
  const systemPrompt = 'You are a game assistant providing hints for a guessing game.';
  const userPrompt = `Give a clever hint for guessing "${itemName}" in the category "${category}". 
  The hint must be fair, challenging, and not reveal the answer directly.
  Respond with just the hint — no extra text, quotes, or formatting.`;

  try {
    const model = "meta/Meta-Llama-3-8B-Instruct";
    const aiClient = getAiClient();
    const systemPrompt = 'You are a game assistant providing hints for a guessing game.';
    const userPrompt = `Give a clever hint for guessing "${itemName}" in the category "${category}". 
    The hint must be fair, challenging, and not reveal the answer directly.
    Respond with just the hint — no extra text, quotes, or formatting.`;
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
    throw new Error(err.message);
  }
}

module.exports = {
  generateHint
};
