const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());

app.post('/download', async (req, res) => {
    const { youtubeUrl } = req.body;

    // Verifica se a URL do YouTube foi enviada
    if (!youtubeUrl) {
        return res.status(400).json({ error: 'URL do YouTube não fornecida.' });
    }

    try {
        // Faz uma requisição para o ssyoutube para obter o link de download do vídeo em 720p
        const response = await axios.get(`https://ssyoutube.com/download/${youtubeUrl}`);

        // Verifica se foi possível obter o link de download
        if (!response.data) {
            return res.status(500).json({ error: 'Não foi possível obter o link de download do vídeo.' });
        }

        // Executa o comando para baixar o vídeo utilizando o ssyoutube
        const downloadLink = response.data;
        const downloadCommand = `wget -O video.mp4 ${downloadLink}`;

        exec(downloadCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao baixar o vídeo: ${error.message}`);
                return res.status(500).json({ error: 'Erro ao baixar o vídeo.' });
            }
            console.log(`Vídeo baixado com sucesso: ${stdout}`);
            res.json({ message: 'Vídeo baixado com sucesso.' });
        });
    } catch (error) {
        console.error(`Erro ao buscar o vídeo: ${error.message}`);
        res.status(500).json({ error: 'Erro ao buscar o vídeo.' });
    }
});

// Netlify Lambda handler
module.exports = app;
