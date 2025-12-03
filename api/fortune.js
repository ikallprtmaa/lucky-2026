
export default async function handler(req, res) {
  const apiKeys = [
    process.env.VITE_API_KEY_1,
    process.env.VITE_API_KEY_2,
    process.env.VITE_API_KEY_3,
    process.env.VITE_API_KEY, // 기본 키
  ].filter((key) => key); // 비어있지 않은 키만 걸러냅니다.

  if (apiKeys.length === 0) {
    return res.status(500).json({ error: 'Server API Key configuration error' });
  }

  // 2. 키 중 하나를 랜덤으로 뽑습니다. (로드 밸런싱)
  const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is missing' });
  }

  try {
    // 3. 구글 Gemini API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${randomKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      
      // 429 에러(사용량 초과)인 경우 클라이언트에 알려줍니다.
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