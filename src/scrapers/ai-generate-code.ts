import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')

const supportedLanguages = [
'JavaScript', 'C#', 'C++', 'Java', 'Ruby', 'Go', 'Python', 'Custom'
]

const supportedModels = [
'gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo',
'claude-3-opus', 'claude-3-5-sonnet'
]

async function generateCode(prompt, language = 'JavaScript', model = 'gpt-4o-mini') {
if (!supportedLanguages.includes(language)) {
return {
status: false,
error: `Nenhum idioma disponível. Use um dos seguintes: ${supportedLanguages.join(', ')}`
}
}
if (!supportedModels.includes(model)) {
return {
status: false,
error: `O modelo de IA está ausente. Selecione um.: ${supportedModels.join(', ')}`
}
}
const finalPrompt = language === 'Custom' ? prompt : `Escreva código na linguagem ${language} para: ${prompt}`
try {
const response = await axios.post('https://best-ai-code-generator.toolzflow.app/api/chat/public',
{
chatSettings: {
model: model,
temperature: 0.3,
contextLength: 16385,
includeProfileContext: false,
includeWorkspaceInstructions: false,
includeExampleMessages: false
},
messages: [
{
role: 'system',
content: 'Você é um assistente útil que escreve código na linguagem solicitada.'
},
{
role: 'user',
content: finalPrompt
}
],
response_format: {
type: 'json_schema',
json_schema: {
name: 'code_response',
strict: true,
schema: {
type: 'object',
properties: {
code: { type: 'string', description: 'Generated code' }
},
required: ['code']
}
}
}
},
{
headers: {
'Content-Type': 'application/json',
'Origin': 'https://best-ai-code-generator.toolzflow.app',
'Referer': 'https://best-ai-code-generator.toolzflow.app/',
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
'Accept': '*/*'
}
}
)
const rawCode = response.data?.code || ''
const formattedCode = rawCode
.replace(/\\n/g, '\n')
.replace(/\\t/g, '\t')
.replace(/\\"/g, '"')
return {
status: true,
code: formattedCode.trim() || 'nenhum código gerado.'
}
} catch (e) {
return {
status: false,
error: `Falha na solicitação: ${e.message}`
}
}
}

//generateCode('criar função de validação otp', 'Python', 'claude-3-5-sonnet')
//.then(res => console.log(res.code))

export default { generateCode, supportedLanguages, supportedModels }