const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const path = require('path');

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
        // Caminho absoluto para youtube-dl
        const youtubeDLPath = path.join(__dirname, 'node_modules', '.bin', 'youtube-dl');

        // Comando para buscar o título e ID do vídeo
        const getInfoCommand = `${youtubeDLPath} -e --get-id ${youtubeUrl}`;
        const { stdout: videoTitle, stderr } = await execPromise(getInfoCommand);

        if (stderr) {
            console.error(`Erro ao obter informações do vídeo: ${stderr}`);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao obter informações do vídeo' })
            };
        }

        // Sanitiza o título do vídeo para garantir que seja um nome de arquivo válido
        const sanitizedTitle = sanitize(videoTitle.trim());

        // Comando para baixar o vídeo
        const downloadCommand = `${youtubeDLPath} -o video.mp4 ${youtubeUrl}`;
        const downloadResult = await execPromise(downloadCommand);

        if (downloadResult.stderr) {
            console.error(`Erro ao baixar o vídeo: ${downloadResult.stderr}`);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao baixar o vídeo' })
            };
        }

        // Verifica se o arquivo de vídeo foi baixado com sucesso
        const videoPath = path.join(__dirname, 'video.mp4');
        if (!fs.existsSync(videoPath)) {
            console.error('Arquivo de vídeo não encontrado após o download');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Arquivo de vídeo não encontrado após o download' })
            };
        }

        // Renomeia o arquivo de vídeo com o título sanitizado
        const renamedVideoPath = path.join(__dirname, `${sanitizedTitle}.mp4`);
        fs.renameSync(videoPath, renamedVideoPath);

        // Retorna o arquivo de vídeo renomeado como resposta
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp4"`
            },
            body: fs.createReadStream(renamedVideoPath)
        };
    } catch (error) {
        console.error('Erro ao buscar ou baixar vídeo:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar ou baixar vídeo' })
        };
    }
};

function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}
