export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) return res.status(500).json({ error: "API 토큰이 세팅되지 않았습니다." });

    try {
        // 1. 상태 확인 (방어막 로직 그대로 유지!)
        if (req.body.predictionId) {
            const pollResponse = await fetch("https://api.replicate.com/v1/predictions/" + req.body.predictionId, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
            });
            const prediction = await pollResponse.json();
            
            if (!pollResponse.ok) return res.status(pollResponse.status).json(prediction);
            return res.status(200).json(prediction);
        }

        // 2. 텍스트를 받아서 목소리 생성 주문 넣기
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "텍스트를 입력해주세요!" });

        const response = await fetch("https://api.replicate.com/v1/models/lucataco/xtts-v2/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                input: {
                    text: text, // 형님이 입력한 축하 메시지
                    language: "ko", // 한국어 패치 완료
                    // 클로닝할 타겟 목소리 (일단 테스트용으로 듣기 좋은 기본 여성 목소리 URL을 넣었습니다)
                    speaker: "https://replicate.delivery/pbxt/Jt79w0xsT64R1JsiJ0AQoWeDpw8XhRxxTvwM6gM2/female.wav" 
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
