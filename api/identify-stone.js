// Use este código, que começa com "import"
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

        // Recebendo o 'contexto' do frontend
        const { image, contexto } = request.body;
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        let promptText = `
        Você é um geólogo especialista e avaliador de gemas. Sua tarefa é analisar a imagem fornecida e identificar a pedra ou mineral.

        O usuário forneceu as seguintes informações de CONTEXTO (use isso para ajudar na identificação):
        "${contexto || 'Nenhuma informação de contexto foi fornecida.'}"

        Responda estritamente como um único objeto JSON. O objeto deve conter uma chave "identification", que é um objeto com a seguinte estrutura:
        {
          "identification": {
            "name": "Nome da Pedra/Mineral",
            "curiosity": "Uma curiosidade científica ou histórica interessante e breve sobre esta pedra.",
            "estimated_value": "Forneça uma faixa de valor estimada para este *tipo* de pedra. Seja específico sobre a unidade (ex: 'por quilate' para gemas lapidadas, 'por grama/kg' para espécimes brutos, ou 'por espécime' para drusas)."
          }
        }

        Se você não conseguir identificar a pedra, mesmo com o contexto, retorne um JSON com a chave "identification" como null:
        { "identification": null }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
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
            max_tokens: 1500,
        });

        const aiResultString = completion.choices[0].message.content;
        const parsedResult = JSON.parse(aiResultString);

        return response.status(200).json(parsedResult);

    } catch (error) {
        console.error('Erro geral na função da API:', error);
        return response.status(500).json({ error: 'Falha interna do servidor.', details: error.message });
    }
}
