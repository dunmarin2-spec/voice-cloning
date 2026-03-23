export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) return res.status(500).json({ error: "API 토큰이 세팅되지 않았습니다." });

    try {
        if (req.body.predictionId) {
            const pollResponse = await fetch("https://api.replicate.com/v1/predictions/" + req.body.predictionId, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
            });
            const prediction = await pollResponse.json();
            
            if (!pollResponse.ok) return res.status(pollResponse.status).json(prediction);
            return res.status(200).json(prediction);
        }

        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "텍스트를 입력해주세요!" });

        // 🚨 [수정 완료] 404 에러를 뱉던 주소 대신, 가장 확실한 정석 주소로 뚫습니다!
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // 🚨 XTTS-v2(목소리 모델)의 가장 쌩쌩하고 검증된 공식 버전 번호입니다!
                version: "684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
                input: {
                    text: text,
                    language: "ko", 
                    speaker: "https://replicate.delivery/pbxt/Jt79w0xsT64R1JsiJ0AQoWeDpw8XhRxxTvwM6gM2/female.wav",
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
