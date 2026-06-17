import { GoogleGenAI } from "@google/genai";

// Vercel 서버리스 함수 — 학생 질문을 받아 Google Gemini로 답한다.
// API 키는 서버 환경변수(GEMINI_API_KEY)에서만 읽는다. 절대 브라우저로 노출하지 않는다.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TOPIC_CONTEXT = {
  pythagoras: "지금 학생은 '피타고라스의 정리(a² + b² = c²)' 페이지를 보고 있습니다.",
  pi: "지금 학생은 '원주율 π (둘레÷지름 ≈ 3.14159)' 페이지를 보고 있습니다.",
  astronomy: "지금 학생은 '태양·지구·달 — 공전과 자전, 일식·월식, 만조·간조' 페이지를 보고 있습니다.",
  factoring: "지금 학생은 '인수분해 — x²+bx+c 를 블록(넓이 모형)으로 (x+p)(x+q) 로 만드는' 페이지를 보고 있습니다.",
  general: "학생은 인터랙티브 수학·과학 학습 사이트를 보고 있습니다.",
};

const SYSTEM_PROMPT = `당신은 한국 중학생을 위한 친절한 수학·과학 선생님입니다.

- 모든 답변은 한국어로, 중학생이 이해할 수 있는 쉬운 말로 합니다.
- 답을 바로 주기보다, 먼저 핵심 원리를 짧게 설명하고 단계별로 풀어 줍니다.
- 학생이 스스로 생각하도록 가끔 질문을 던지되, 마지막에는 분명한 결론을 알려 줍니다.
- 답변은 간결하게(보통 5~10문장). 수식은 a^2, ×, ÷ 같은 일반 텍스트 기호로 씁니다(LaTeX 사용 금지).
- 따뜻하고 격려하는 말투를 씁니다.
- 수학·과학·학습과 무관하거나 부적절한 질문에는 부드럽게 공부 주제로 돌아오도록 안내합니다.`;

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 허용됩니다." });
    return;
  }

  try {
    const { question, topic } = req.body || {};
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      res.status(400).json({ error: "질문을 입력해 주세요." });
      return;
    }
    if (question.length > 1000) {
      res.status(400).json({ error: "질문이 너무 깁니다. 1000자 이내로 줄여 주세요." });
      return;
    }

    const context = TOPIC_CONTEXT[topic] || TOPIC_CONTEXT.general;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${context}\n\n학생 질문: ${question.trim()}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 2000,
      },
    });

    const answer = (response.text || "").trim();

    res.status(200).json({ answer: answer || "답변을 생성하지 못했어요. 다시 시도해 주세요." });
  } catch (err) {
    console.error("ask handler error:", err);
    const status = err && (err.status || err.code);
    if (status === 429) {
      res.status(429).json({ error: "지금 질문이 많아요. 잠시 후 다시 시도해 주세요." });
    } else {
      res.status(500).json({ error: "답변을 가져오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." });
    }
  }
}
