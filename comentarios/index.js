const axios = require('axios')
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const app = express()
app.use(express.json())

const comentariosPorSerieId = {}

app.post('/series/:id/comentarios', async (req, res) => {
  const { texto } = req.body
  const comentario = {
    id: uuidv4(),
    texto,
    serieId: req.params.id,
    status: 'pendente'
  }
  const comentarios = comentariosPorSerieId[req.params.id] || []
  comentarios.push(comentario)
  comentariosPorSerieId[req.params.id] = comentarios
  await axios.post('http://localhost:10000/eventos', {
    tipo: 'ComentarioCriado',
    dados: comentario
  })
  res.status(201).json(comentarios)
})

app.get('/series/:id/comentarios', (req, res) => {
  res.json(comentariosPorSerieId[req.params.id] || [])
})

app.put('/series/:id/comentarios/:idComentario', async (req, res) => {
  const { texto } = req.body
  const comentarios = comentariosPorSerieId[req.params.id] || []
  const comentario = comentarios.find(c => c.id === req.params.idComentario)
  if (!comentario) {
    return res.status(404).json({ erro: 'comentário não encontrado' })
  }
  comentario.texto = texto
  comentario.status = 'pendente'
  const dados = {
    id: comentario.id,
    texto: comentario.texto,
    serieId: comentario.serieId,
    status: comentario.status
  }
  await axios.post('http://localhost:10000/eventos', {
    tipo: 'ComentarioEditado',
    dados
  })
  res.json(dados)
})

const funcoes = {
  ComentarioModerado: async (dados) => {
    const comentarios = comentariosPorSerieId[dados.serieId]
    const comentario = comentarios.find(c => c.id === dados.id)
    comentario.status = dados.status
    await axios.post('http://localhost:10000/eventos', {
      tipo: 'ComentarioAtualizado',
      dados: {
        id: comentario.id,
        texto: comentario.texto,
        serieId: comentario.serieId,
        status: comentario.status
      }
    })
  }
}

app.post('/eventos', async (req, res) => {
  try {
    const evento = req.body
    console.log(evento.tipo)
    await funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

const port = 4100
app.listen(port, () => console.log(`Comentários. Porta ${port}.`))