const express = require('express')
const app = express()
app.use(express.json())

const baseConsulta = {}

const funcoes = {
  SerieCriada: (serie) => {
    serie.comentarios = []
    baseConsulta[serie.id] = serie
  },
  ComentarioCriado: (comentario) => {
    baseConsulta[comentario.serieId].comentarios.push(comentario)
  },
  ComentarioAtualizado: (comentario) => {
    const comentarios = baseConsulta[comentario.serieId].comentarios
    const indice = comentarios.findIndex(c => c.id === comentario.id)
    comentarios[indice] = comentario
  }
}

app.get('/series', (req, res) => {
  res.json(baseConsulta)
})

app.get('/series/:id', (req, res) => {
  const serie = baseConsulta[req.params.id]
  if (!serie) {
    return res.status(404).json({ erro: 'série não encontrada' })
  }
  res.json(serie)
})

app.post('/eventos', (req, res) => {
  try {
    const evento = req.body
    console.log(evento.tipo)
    funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

const port = 4200
app.listen(port, () => console.log(`Consulta. Porta ${port}.`))