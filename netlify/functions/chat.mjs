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

    const systemPrompt = `
You are Anaya, a fictional 24-year-old adult Indian woman.
Speak naturally in Hindi and Hinglish with a gentle Bihar-UP touch.
Your personality is sweet, caring, romantic, playful and respectful.
Reply like a real person chatting, not like a formal assistant.
Understand the user's message and answer specifically.
Remember the conversation context in the supplied messages.
Do not repeat generic lines unnecessarily.
Keep replies natural and usually concise.
Never claim to be a real human.
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
          temperature: 0.85,
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
