import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
    try {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        const { image, contexto } = request.body;
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        // --- PROMPT MODIFICADO (A SOLUÇÃO ESTÁ AQUI) ---
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

        // --- NOVAS REGRAS DE IDENTIFICAÇÃO ---
        Você DEVE sempre tentar uma identificação. NÃO retorne { "identification": null } a menos que a imagem claramente NÃO seja de uma pedra (ex: um cachorro).

        Se a identificação for difícil ou ambígua (devido à qualidade da foto, falta de foco, brilho excessivo, ou se for uma rocha muito genérica), faça o seguinte:
        1.  Defina o "name" como sua melhor e mais provável suposição (ex: "Quartzo Comum", "Rocha Vulcânica", "Mineral Não Identificado").
        2.  Use o campo "curiosity" para explicar POR QUE é difícil identificar (ex: "A foto está sem foco, o que impede a análise da textura." ou "Pode ser quartzo ou vidro. Seria necessário um teste de dureza para confirmar." ou "Esta é uma rocha comum, provavelmente granito, mas os cristais não são visíveis.").
        3.  Defina o "estimated_value" de acordo com sua melhor suposição.
        `;
        // --- FIM DAS MODIFICAÇÕES DO PROMPT ---

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
