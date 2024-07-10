const axios = require('axios');
const { exec } = require('child_process');

exports.handler = async function(event, context) {
    // Adiciona headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    };

    if (event.httpMethod === 'OPTIONS') {
        // Retorna resposta para requisições OPTIONS
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        // Retorna erro para métodos não permitidos
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    const { youtubeUrl } = JSON.parse(event.body);

    if (!youtubeUrl) {
        // Retorna erro se a URL do YouTube não foi fornecida
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'URL do YouTube não fornecida' })
        };
    }

    try {
        // Faz uma requisição GET para o SaveFrom para obter o link de download
        const response = await axios.get(`https://sfrom.net/${youtubeUrl}`);

        // Verifica se foi possível obter o link de download
        if (!response.data || !response.data.result) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Não foi possível obter o link de download do vídeo' })
            };
        }

        // Obtém o link de download do vídeo
        const downloadLink = response.data.result.split('"')[1];

        // Executa o comando para baixar o vídeo utilizando o wget
        const downloadCommand = `wget -O video.mp4 ${downloadLink}`;

        // Retorna uma promessa para lidar com a execução do comando
        return new Promise((resolve, reject) => {
            exec(downloadCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao baixar o vídeo: ${error.message}`);
                    resolve({
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({ error: 'Erro ao baixar o vídeo' })
                    });
                } else {
                    console.log(`Vídeo baixado com sucesso: ${stdout}`);

                    // Envie o arquivo de vídeo baixado como resposta
                    const videoPath = `${__dirname}/video.mp4`;
                    resolve({
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'video/mp4',
                            'Content-Disposition': 'attachment; filename="video.mp4"'
                        },
                        body: videoPath
                    });
                }
            });
        });
    } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar vídeo' })
        };
    }
};
