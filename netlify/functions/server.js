const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/download', async (req, res) => {
    const { youtubeUrl } = req.body;

    // Verifica se a URL do YouTube foi enviada
    if (!youtubeUrl) {
        return res.status(400).json({ error: 'URL do YouTube não fornecida.' });
    }

    try {
        // Faz uma requisição POST para o yt5s para obter o link de download
        const response = await axios.post('https://yt5s.com/api/ajax', {
            url: youtubeUrl,
            format: 'mp4'
        });

        // Verifica se foi possível obter o link de download
        if (!response.data) {
            return res.status(500).json({ error: 'Não foi possível obter o link de download do vídeo.' });
        }

        // Obtém o link de download do vídeo em 720p (ou outro formato desejado)
        const downloadLink = response.data.dl_link;

        // Executa o comando para baixar o vídeo utilizando o wget
        const downloadCommand = `wget -O video.mp4 ${downloadLink}`;

        exec(downloadCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao baixar o vídeo: ${error.message}`);
                return res.status(500).json({ error: 'Erro ao baixar o vídeo.' });
            }
            console.log(`Vídeo baixado com sucesso: ${stdout}`);

            // Envie o arquivo de vídeo baixado como resposta
            const videoPath = `${__dirname}/video.mp4`;
            res.download(videoPath, 'video.mp4', (err) => {
                if (err) {
                    console.error('Erro ao enviar o arquivo de vídeo:', err);
                    return res.status(500).json({ error: 'Erro ao enviar o arquivo de vídeo.' });
                }
                console.log('Arquivo de vídeo enviado com sucesso.');
                // Limpa o arquivo de vídeo após o envio
                exec(`rm -rf ${videoPath}`);
            });
        });
    } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        res.status(500).json({ error: 'Erro ao buscar vídeo.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
