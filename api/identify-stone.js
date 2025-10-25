import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Este handler agora responde ao endpoint /api/identify-stone
export default async function handler(request, response) {
    try {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        // MODIFICADO: Removido 'restricoes' e 'tipo_culinaria'
        const { image } = request.body;
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        // --- MODIFICADO: NOVO PROMPT PARA O GEÓLOGO COM IA ---
        let promptText = `
        Você é um geólogo especialista e avaliador de gemas. Sua tarefa é analisar a imagem fornecida e identificar a pedra ou mineral.

        Responda estritamente como um único objeto JSON. O objeto deve conter uma chave "identification", que é um objeto com a seguinte estrutura:
        {
          "identification": {
            "name": "Nome da Pedra/Mineral",
            "curiosity": "Uma curiosidade científica ou histórica interessante e breve sobre esta pedra.",
            "estimated_value": "Forneça uma faixa de valor estimada para este *tipo* de pedra. Seja específico sobre a unidade (ex: 'por quilate' para gemas lapidadas, 'por grama/kg' para espécimes brutos, ou 'por espécime' para drusas)."
          }
        }

        Exemplo de resposta para uma Ametista:
        {
          "identification": {
            "name": "Ametista (Variedade de Quartzo)",
            "curiosity": "Os gregos antigos acreditavam que a ametista podia prevenir a embriaguez. Seu nome vem do grego 'amethystos', que significa 'não bêbado'.",
            "estimated_value": "Gemas de ametista de boa qualidade variam de $5 a $50 por quilate. Drusas e espécimes brutos são vendidos por peso, custando cerca de $10 a $100 por kg, dependendo da qualidade."
          }
        }

        Se você não conseguir identificar a pedra, retorne um JSON com a chave "identification" como null:
        { "identification": null }
        `;
        // --- FIM DO NOVO PROMPT ---


        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // gpt-4o é excelente para isso
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: promptText },
                        { type: "image_url", image_url: { "url": image } },
                    ],
                },
            ],
            max_tokens: 1500, // Reduzido, pois a resposta é mais curta
        });

        const aiResultString = completion.choices[0].message.content;
        const parsedResult = JSON.parse(aiResultString);

        return response.status(200).json(parsedResult);

    } catch (error) {
        console.error('Erro geral na função da API:', error);
        return response.status(500).json({ error: 'Falha interna do servidor.', details: error.message });
    }
}