import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

async function igstalk(username) {
    try {
        if (!username) throw new Error('Por favor, forneça o parâmetro: username (nome de usuário do Instagram)');

        const [profileResponse, storiesResponse, postsResponse] = await Promise.all([
            axios.post('https://free-tools-api.vercel.app/api/instagram-profile', { username }),
            axios.post('https://free-tools-api.vercel.app/api/instagram-viewer', { username, type: 'stories' }),
            axios.post('https://free-tools-api.vercel.app/api/instagram-viewer', { username, type: 'photo' })
        ]);

        return {
            profile_info: profileResponse.data,
            stories: storiesResponse.data.stories || [],
            latest_posts: postsResponse.data.posts || []
        };
    } catch (error) {
        throw new Error(error.message || 'Erro ao obter informações do perfil do Instagram');
    }
}

export default { igstalk };