const HOST = "192.168.0.188"
const axios = require('axios')
const express = require('express')
const app = express()
app.use(express.json())

const palavrasProibidas = ['morre', 'final', 'assassino', 'traidor']

const moderar = async (comentario) => {
  const encontradas = palavrasProibidas.filter(p => comentario.texto.includes(p))
  comentario.status = encontradas.length > 0 ? 'spoiler' : 'liberado'
  await axios.post(`http://${HOST}:10000/eventos`, {
    tipo: 'ComentarioModerado',
    dados: {
      id: comentario.id,
      texto: comentario.texto,
      serieId: comentario.serieId,
      status: comentario.status
    }
  })
}

const funcoes = {
  ComentarioCriado: moderar,
  ComentarioEditado: moderar
}

app.post('/eventos', async (req, res) => {
  try {
    const evento = req.body
    console.log(evento.tipo)
    await funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

const port = 4300
app.listen(port, async () => {
  console.log(`Moderação. Porta ${port}.`)
  let historico = []
  try {
    const resp = await axios.get(`http://${HOST}:10000/eventos`)
    historico = resp.data
  } catch (e) {
    console.log('Barramento indisponível')
    return
  }
  const ultimoEvento = {}
  const tipos = ['ComentarioCriado', 'ComentarioEditado', 'ComentarioModerado']
  historico.forEach((evento) => {
    if (tipos.includes(evento.tipo)) {
      ultimoEvento[evento.dados.id] = evento
    }
  })
  for (const evento of historico) {
    try {
      if (ultimoEvento[evento.dados.id] === evento && evento.tipo !== 'ComentarioModerado') {
        await funcoes[evento.tipo](evento.dados)
      }
    } catch (e) {}
  }
})