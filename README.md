# AI 你画我猜（Next.js + Gemini API）

这是一个在线你画我猜小游戏：
- 玩家在网页画布作画；
- 点击按钮后，后端 API Route 把图片发送到 Gemini 接口；
- 返回 AI 猜测结果、置信度和简短理由。

## 技术栈

- Next.js (App Router)
- TypeScript
- Gemini REST API（**不使用 SDK，直接调用官方接口地址**）

## 启动

1. 安装依赖：

```bash
npm install
```

2. 创建环境变量文件 `.env.local`：

```bash
GEMINI_API_KEY=你的密钥
# 可选，默认 gemini-1.5-flash
GEMINI_MODEL=gemini-1.5-flash
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 打开 `http://localhost:3000`

## 关键实现

- 前端绘图：`app/page.tsx`
- 后端调用 Gemini：`app/api/guess/route.ts`
