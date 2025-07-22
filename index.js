require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const calcularVolumes = (items) => {
  let totalVolumes = 0;

  items.forEach(item => {
    const title = item.title.toLowerCase();
    const quantity = item.quantity;

    if (title.includes('330ml') || title.includes('500ml') || title.includes('gás') || title.includes('caixona')) {
      totalVolumes += quantity;
    } else if (title.includes('eletrólito') || title.includes('eletrólitos')) {
      totalVolumes += Math.ceil(quantity / 6);
    }
  });

  return totalVolumes;
};

app.post('/webhook-order-created', async (req, res) => {
  const order = req.body;
  const orderNumber = order.name;
  const lineItems = order.line_items;

  const volumes = calcularVolumes(lineItems);

  try {
    const response = await axios.post('https://api.tiny.com.br/api2/pedido.alterar.php', null, {
      params: {
        token: process.env.TINY_API_TOKEN,
        formato: 'json',
        numero: orderNumber.replace('#', ''),
        volumes
      }
    });

    if (response.data.retorno.status === 'OK') {
      console.log(`✔ Pedido ${orderNumber} → ${volumes} volumes enviados com sucesso`);
      res.status(200).send('Volumes enviados ao Tiny com sucesso!');
    } else {
      console.error(`Erro Tiny:`, response.data);
      res.status(500).send('Erro ao enviar volumes ao Tiny.');
    }
  } catch (err) {
    console.error('Erro de conexão com Tiny:', err);
    res.status(500).send('Erro ao conectar com a API do Tiny.');
  }
});

app.get('/', (req, res) => {
  res.send('Servidor do Webhook está rodando.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webhook rodando na porta ${PORT}`));