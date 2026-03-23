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

        // 🚨 [수정 포인트] 프론트엔드에서 보낸 'speakerUrl'을 추가로 받습니다.
        const { text, speakerUrl } = req.body;
        if (!text) return res.status(400).json({ error: "텍스트를 입력해주세요!" });

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // XTTS-v2 공식 버전
                version: "684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
                input: {
                    text: text,
                    language: "ko", 
                    // 🚨 [수정 포인트] 하드코딩된 주소 대신, 사용자가 화면에서 선택한 주소를 넣습니다!
                    speaker: speakerUrl || "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav", // 혹시 안 넘어오면 JFK로 기본값
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
