"use client";

import { useEffect, useRef, useState } from "react";

type GuessResponse = {
  guess: string;
  confidence: number;
  reason: string;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 540;

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(6);
  const [color, setColor] = useState("#111827");
  const [result, setResult] = useState<GuessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getContext = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    return canvas.getContext("2d");
  };

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getContext();

    if (!ctx) {
      return;
    }

    const { x, y } = getPoint(event);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    setDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) {
      return;
    }

    const ctx = getContext();

    if (!ctx) {
      return;
    }

    const { x, y } = getPoint(event);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const ctx = getContext();

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setResult(null);
    setError("");
  };

  const askAiToGuess = async () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const imageData = canvas.toDataURL("image/png");
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        const fallbackMessage = "请求失败，请稍后重试。";
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? fallbackMessage);
      }

      const data = (await response.json()) as GuessResponse;
      setResult(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "出现未知错误，请重试。";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>AI 你画我猜（Gemini）</h1>
      <p>在画布上涂鸦，点击“AI 猜一猜”后由后端调用 Gemini API 返回猜测。</p>

      <section className="card">
        <div className="toolbar">
          <label>
            线条粗细
            <input
              type="range"
              min={1}
              max={24}
              value={lineWidth}
              onChange={(event) => setLineWidth(Number(event.target.value))}
            />
          </label>

          <label>
            颜色
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </label>

          <button className="secondary" onClick={clearCanvas}>
            清空画布
          </button>
          <button className="primary" onClick={askAiToGuess} disabled={loading}>
            {loading ? "AI 猜测中..." : "AI 猜一猜"}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
        />

        {error ? <div className="result error">{error}</div> : null}

        {result ? (
          <div className="result">
            <strong>AI 猜测：</strong>
            <div>{result.guess}</div>
            <div>置信度：{result.confidence}%</div>
            <div>理由：{result.reason}</div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
