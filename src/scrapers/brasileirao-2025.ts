import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')
const util = require('util')

class BrasileiraoScraper {
  constructor() {
    // Endpoints públicos do Globo Esporte
    this.tabelaUrl = 'https://api.globoesporte.globo.com/tabela/d1a37fa4-e948-43a6-ba53-ab24ab3a45b1/classificacao'
    this.jogosUrl = 'https://api.globoesporte.globo.com/tabela/d1a37fa4-e948-43a6-ba53-ab24ab3a45b1/jogos'
    this.artilhariaUrl = 'https://api.globoesporte.globo.com/tabela/d1a37fa4-e948-43a6-ba53-ab24ab3a45b1/artilharia'
    this.noticiasUrl = 'https://ge.globo.com/futebol/brasileirao-serie-a/'
    this.headers = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json, text/plain, */*'
    }
  }

  async obterTabela() {
    try {
      const res = await axios.get(this.tabelaUrl, { headers: this.headers })
      const times = res.data.classificacao || []
      return times.map(time => ({
        posicao: time.ordem,
        nome: time.nome_popular,
        sigla: time.sigla,
        escudo: time.escudo,
        pontos: time.pontos,
        jogos: time.jogos,
        vitorias: time.vitorias,
        empates: time.empates,
        derrotas: time.derrotas,
        saldo_gols: time.saldo_gols,
        aproveitamento: time.aproveitamento
      }))
    } catch (erro) {
      console.error('Erro ao obter tabela:', erro.message)
      return []
    }
  }

  async obterArtilheiros() {
    try {
      const res = await axios.get(this.artilhariaUrl, { headers: this.headers })
      const artilheiros = res.data.artilharia || []
      return artilheiros.map((jogador, idx) => ({
        posicao: idx + 1,
        jogador: jogador.nome,
        time: jogador.time,
        gols: jogador.gols
      }))
    } catch (erro) {
      console.error('Erro ao obter artilheiros:', erro.message)
      return []
    }
  }

  async obterRodadaAtual() {
    try {
      const res = await axios.get(this.jogosUrl, { headers: this.headers })
      const jogos = res.data.lista_jogos || []
      return jogos.map(jogo => ({
        mandante: jogo.equipes?.mandante?.nome_popular || 'A definir',
        visitante: jogo.equipes?.visitante?.nome_popular || 'A definir',
        data: jogo.data_realizacao || 'A definir',
        hora: jogo.hora_realizacao || 'A definir',
        estadio: jogo.sede?.nome_popular || 'A definir',
        local: jogo.sede?.cidade || 'Local a definir',
        status: jogo.status || 'Agendado'
      }))
    } catch (erro) {
      console.error('Erro ao obter rodada atual:', erro.message)
      return []
    }
  }

  async obterDados() {
    try {
      const [tabela, artilheiros, rodada] = await Promise.all([
        this.obterTabela(),
        this.obterArtilheiros(),
        this.obterRodadaAtual()
      ])
      return {
        status: true,
        criador: "@paulo_mod_domina",
        resultados: {
          campeonato: "Brasileirão Série A 2026",
          temporada: 2026,
          tabela,
          artilheiros,
          rodada_atual: rodada
        }
      }
    } catch (erro) {
      return {
        status: false,
        criador: "@paulo_mod_domina",
        codigo: 500,
        dados: { erro: { mensagem: erro.message } }
      }
    }
  }

  async executar() {
    const resultado = await this.obterDados()
    if (require.main === module) {
      console.log(util.inspect(resultado, { depth: 5, colors: true }))
      return
    }
    return resultado
  }
}

if (require.main === module) {
  const scraper = new BrasileiraoScraper()
  scraper.executar().catch(erro => {
    console.error('Erro ao executar o scraper:', erro)
    process.exit(1)
  })
}

export default BrasileiraoScraper