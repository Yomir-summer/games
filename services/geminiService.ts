
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getGameOverMessage = async (score: number, coins: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `玩家在《监狱大逃亡》游戏中失败了。得分是 ${score}，金币是 ${coins}。
      请作为一个冷酷无情的监狱典狱长，给出一句简短的（30字以内）嘲讽或命令，语气要威严、铁血。
      直接输出这句话，不要有其他描述。`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "这里是铁笼，没有任何人能活着逃离。";
  } catch (error) {
    return "抓捕成功，送回禁闭室！";
  }
};
