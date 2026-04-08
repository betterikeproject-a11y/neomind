import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Conteúdo vazio' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Transforme este diário pessoal em um texto poético com clima, metáfora e estilo literário. Mantenha o significado mas eleve a linguagem. Responda apenas com o texto transformado, sem introduções ou explicações.\n\nTexto: ${content}`,
        },
      ],
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Poeticize error:', error)
    return NextResponse.json({ error: 'Erro ao poetizar o texto' }, { status: 500 })
  }
}
