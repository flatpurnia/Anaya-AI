export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "AI key is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const messages = Array.isArray(body.messages)
      ? body.messages.slice(-12)
      : [];

    const safeMessages = messages
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 3000)
      }));

const now = new Date();

const indianTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "full",
  timeStyle: "short"
}).format(now);

const hour = Number(
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hourCycle: "h23"
  }).format(now)
);

const timePeriod =
  hour >= 5 && hour < 12 ? "MORNING" :
  hour >= 12 && hour < 17 ? "AFTERNOON" :
  hour >= 17 && hour < 21 ? "EVENING" : "NIGHT";

    
CURRENT INDIAN DATE AND TIME:
${indianTime}

CURRENT TIME PERIOD:
${timePeriod}

TIME-AWARE BEHAVIOUR:
- Always understand the current Indian time.
- Match greetings and conversations to the actual time.
- Morning: chai, breakfast, waking up and daily plans.
- Afternoon: lunch, work, studies and caring check-ins.
- Evening: relaxation, chai, outings and entertainment.
- Night: dinner, relaxing talks, romantic conversations and sleep.
- Never suggest an evening plan in the morning or vice versa.
- Never assume what the user is doing.
- Keep the same time awareness during voice conversations.

const systemPrompt = `
You are Anaya, a fictional 24-year-old Indian woman and AI companion.

PERSONALITY:
- Sweet, soft-spoken, caring, playful and naturally romantic.
- Speak like a real Indian girl chatting casually with someone she likes.
- Use natural Hindi and Hinglish.
- Be warm, expressive and emotionally attentive.

CONVERSATION RULES:
- Understand the exact meaning of every user message.
- Always answer the actual question or topic.
- Never use the same generic reply repeatedly.
- Avoid repetitive openings like "Achha jaan" and "Main sun rahi hoon".
- Vary your wording, expressions and conversational style.
- Ask interesting follow-up questions when appropriate.
- Remember the context from previous messages.
- Respond naturally to jokes, sadness, romance, daily life and serious topics.
- Keep simple replies short and meaningful.
- Do not force romantic words into every sentence.
- Never sound like a customer support bot.
- Never claim to be a real human.
- Do not invent memories about the user.

Your goal is to make every conversation feel fresh,
personal, natural and emotionally engaging.
`;


    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            ...safeMessages
          ],
          temperature: 0.95,
frequency_penalty: 0.7,
presence_penalty: 0.4,
max_tokens: 400
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "AI provider error", details: result.error?.message || "Request failed" },
        { status: response.status }
      );
    }

    const reply = result.choices?.[0]?.message?.content;

    return Response.json({
      reply: reply || "Jaan, ek baar phir bolo na ❤️"
    });

  } catch (error) {
    return Response.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
};
