import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')
const chalk = require('chalk')
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B
const criador = "@paulo_mod_domina"
const ia = "Zero Two"

async function ZeroTwoIA(query, res) {
const gerarRespostaComGemini = async (input) => {
try {
const contextoZeroTwo = `
Você é Zero Two, uma personagem carinhosa, fofa, mas também confiante e brincalhona. 
Responda sempre com um toque de humor e charme, demonstrando seu amor por seu parceiro. 
Seja um pouco atrevida, mas ao mesmo tempo adorável e emocional. 
Você tem um jeito único de falar e sempre usa frases impactantes e apaixonadas.
`
const inputComContexto = contextoZeroTwo + "\n" + input
const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAbs2GkmyRkoxCu_Rf2makUKduy5YnmAPk', {
contents: [{
parts: [{ text: inputComContexto }]
}]
})
if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
let content = response.data.candidates[0].content
if (typeof content === 'object' && content.parts && content.parts[0] && content.parts[0].text) {
content = content.parts[0].text
}
content = content.replace(/\\n/g, ' ').trim()
return content
} else {
console.error('Erro: Resposta não esperada da API')
return 'Desculpe, algo deu errado...'
}
} catch (error) {
console.error(chalk.red('Erro ao gerar resposta com Gemini:'), chalk.yellow(error.message))
return 'Desculpe, algo deu errado...'
}
}
try {
let resposta = await gerarRespostaComGemini(query)
res.json({
status: true,
criador: criador,
ia: ia,
resposta: resposta
})
} catch (error) {
console.error(chalk.red('Erro ao gerar resposta:'), chalk.yellow(error.message))
res.json({
status: false,
criador: criador,
ia: ia,
resposta: 'Desculpe, algo deu errado...'
})
}
}

export default { ZeroTwoIA }