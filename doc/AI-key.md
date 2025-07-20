Gemini API

import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `AIzaSyCXVeAS0dFqYMjGDRBqRgewJU70zQu7Oa4`.
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "Gemini 2.5 Flash-Lite Preview 06-17",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();


kimi API

# Kimi API密钥配置
KIMI_API_KEY=sk-tGf3nDkiVxPEigWriinQ0oCuPHCXX61ZqxYObExQDZGPyEBx

调用示例：

const OpenAI = require("openai");
 
const client = new OpenAI({
    apiKey: "$MOONSHOT_API_KEY",    
    baseURL: "https://api.moonshot.cn/v1",
});
 
async function main() {
    const completion = await client.chat.completions.create({
        model: "moonshot-v1-8k",         
        messages: [ 
            {role: "system", content: "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。"},
            {role: "user", content: "你好，我叫李雷，1+1等于多少？"}
        ],
        temperature: 0.3
    });
    console.log(completion.choices[0].message.content);
}
 
main();
