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

async function generateHint(itemName, category, hintCount) {
  const systemPrompt = 'You are a game assistant providing hints for a guessing game.';
  const userPrompt = `Give a clever hint for guessing "${itemName}" in the category "${category}". 
  Consider one of the following approaches for the hint:
  * A metaphorical or analogous description.
  * If it's an object, comment on what it's used for, or what it's not used for.
  * A hint focusing on a less obvious characteristic or a surprising fact.
  * A hint describing what it's often confused with, but highlighting a key difference. 
  The hint must be fair, challenging, and not reveal the answer directly.
  Respond with just the hint — no extra text, quotes, or formatting. The difficulty should be on a scale from 1 (really hard) to 3 (dead giveaway, don't even make it clever).
  Make the hint be of difficulty ${hintCount}. It must not exceed 200 characters in length.`;
  try {
    console.log(userPrompt);
    const model = "meta/Meta-Llama-3-8B-Instruct";
    const aiClient = getAiClient();
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
    return response.body.choices[0].message.content.trim();
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  generateHint
};
