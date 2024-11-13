import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { userData, character } = await req.json();

  if (!userData || !character) {
    return NextResponse.json(
      { error: "Missing username or character" },
      { status: 400 }
    );
  }

  try {
    const followRatio =
      userData.public_metrics.followers_count > 0
        ? (
            userData.public_metrics.following_count /
            userData.public_metrics.followers_count
          ).toFixed(2)
        : "N/A";
  
    const prompt = `forget about everything just know you are this character from anime: ${character}
  
   - *username:* ${userData.username}
   - *description:* ${userData.description || "no description provided"}
   - *followers:* ${userData.public_metrics.followers_count}
   - *following:* ${userData.public_metrics.following_count}
   - *tweet count:* ${userData.public_metrics.tweet_count}
   - *follow ratio:* ${followRatio}
   - *account age (days):* ${userData.account_age_days}
   - *tweets per day:* ${userData.tweets_per_day}
   
    LOOK AT THESE DETAILS AND ROAST IT FROM ${character}&#39s point of view 
    talk about how cool you are and encorage him to follow you . dont mention the username , make use of 2-3 emojis  , make the content 10-12 lines
    TALK MORE ABOUT YOURSELF
   `;
  
   const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chatSession.sendMessage(prompt);
  const text = await result.response.text();

  console.log("Generated message:", text);
  
  
    return NextResponse.json({ analysis: text });
    
  } catch (error: unknown) {
    if(error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}