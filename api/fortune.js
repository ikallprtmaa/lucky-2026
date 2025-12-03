export default async function handler(req, res) {
  const apiKeys = [
    process.env.VITE_API_KEY_1,
    process.env.VITE_API_KEY_2,
    process.env.VITE_API_KEY_3,
    process.env.VITE_API_KEY,
  ].filter((key) => key);

  if (apiKeys.length === 0) {
    return res.status(500).json({ error: 'Server API Key configuration error' });
  }

  const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  // 클라이언트에서 responseType을 받아옴 (기본값은 'json')
  const { prompt, responseType = 'json' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is missing' });
  }

  // responseType이 'json'일 때만 MIME 타입 강제 설정
  const generationConfig = {};
  if (responseType === 'json') {
    generationConfig.responseMimeType = 'application/json';
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${randomKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: generationConfig, // 동적 설정 적용
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      if (response.status === 429) {
        return res.status(429).json({ error: 'Too Many Requests' });
      }
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Server Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}