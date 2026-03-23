export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) return res.status(500).json({ error: "API 토큰이 세팅되지 않았습니다." });

    try {
        // 1. 상태 확인 (폴링 로직)
        if (req.body.predictionId) {
            const pollResponse = await fetch("https://api.replicate.com/v1/predictions/" + req.body.predictionId, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
            });
            const prediction = await pollResponse.json();
            
            if (!pollResponse.ok) return res.status(pollResponse.status).json(prediction);
            return res.status(200).json(prediction);
        }

        // 2. 텍스트와 목소리 주소 받기
        const { text, speakerUrl } = req.body;
        if (!text) return res.status(400).json({ error: "텍스트를 입력해주세요!" });

        // 🚨 [추가된 철통 방어막] 아기 목소리 주소를 세팅 안 하고 서버로 넘어왔을 때의 예외 처리!
        if (speakerUrl === "여기에_아기_목소리_주소를_넣으십쇼") {
            return res.status(400).json({ error: "3살 아기 목소리 주소가 아직 세팅되지 않았습니다! index.html에서 주소를 먼저 교체해 주십쇼." });
        }

        // 3. AI에게 목소리 생성 주문 넣기
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // XTTS-v2 공식 모델 버전
                version: "684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
                input: {
                    text: text,
                    language: "ko", 
                    // 사용자가 화면에서 선택한 주소를 그대로 넣습니다!
                    speaker: speakerUrl || "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav", 
                    cleanup_voice: false
                }
            }),
        });

        const prediction = await response.json();
        
        if (!response.ok) return res.status(response.status).json(prediction);
        
        return res.status(200).json(prediction); 

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
    }
}
