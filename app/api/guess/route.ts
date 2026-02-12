import { NextRequest, NextResponse } from "next/server";

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function parseDataUrl(imageData: string) {
  const matches = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!matches) {
    return null;
  }

  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

function parseModelText(text: string) {
  const cleanText = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleanText) as {
      guess?: string;
      confidence?: number;
      reason?: string;
    };
  } catch {
    return {
      guess: cleanText,
      confidence: 50,
      reason: "模型没有返回 JSON，已使用原始文本。",
    };
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 GEMINI_API_KEY。" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { imageData?: string }
    | null;

  const imageData = body?.imageData;

  if (!imageData) {
    return NextResponse.json({ error: "缺少 imageData。" }, { status: 400 });
  }

  const imagePayload = parseDataUrl(imageData);

  if (!imagePayload) {
    return NextResponse.json({ error: "imageData 格式不正确。" }, { status: 400 });
  }

  const prompt =
    "你正在玩你画我猜。请仅返回 JSON，格式为: {\"guess\":\"你猜测的内容\",\"confidence\":0-100数字,\"reason\":\"一句简短理由\"}。不要输出任何额外文字。";

  const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imagePayload.mimeType,
                data: imagePayload.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();

    return NextResponse.json(
      {
        error: `Gemini API 请求失败: ${errorText}`,
      },
      { status: 502 },
    );
  }

  const geminiData = (await geminiResponse.json()) as {
    candidates?: GeminiCandidate[];
  };

  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return NextResponse.json(
      { error: "Gemini 未返回可解析结果。" },
      { status: 502 },
    );
  }

  const parsed = parseModelText(text);

  return NextResponse.json({
    guess: parsed.guess ?? "未识别",
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
        : 50,
    reason: parsed.reason ?? "模型未提供理由。",
  });
}
