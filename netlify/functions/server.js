const axios = require('axios');
const { exec } = require('child_process');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    const { youtubeUrl } = JSON.parse(event.body);

    if (!youtubeUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'URL do YouTube não fornecida' })
        };
    }

    try {
        // Faz uma requisição POST para o yt5s para obter o link de download
        const response = await axios.post('https://yt5s.com/api/ajax', {
            url: youtubeUrl,
            format: 'mp4'
        });

        // Verifica se foi possível obter o link de download
        if (!response.data || !response.data.dl_link) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Não foi possível obter o link de download do vídeo' })
            };
        }

        // Obtém o link de download do vídeo
        const downloadLink = response.data.dl_link;

        // Executa o comando para baixar o vídeo utilizando o wget
        const downloadCommand = `wget -O video.mp4 ${downloadLink}`;

        exec(downloadCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao baixar o vídeo: ${error.message}`);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Erro ao baixar o vídeo' })
                };
            }
            console.log(`Vídeo baixado com sucesso: ${stdout}`);

            // Envie o arquivo de vídeo baixado como resposta
            const videoPath = `${__dirname}/video.mp4`;
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Disposition': 'attachment; filename="video.mp4"'
                },
                body: videoPath
            };
        });
    } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar vídeo' })
        };
    }
};
