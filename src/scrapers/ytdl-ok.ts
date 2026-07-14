import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// YouTube Download Scrapers Funcionais - TESTADO E FUNCIONANDO
// Resultado do teste: ytmp3, ytboruto, savetube funcionaram

const ytmp3 = require('./ytmp3');
const ytboruto = require('./scraper-yt');
const savetube = require('./savetube');

export default {
  // Funcionais (testado e comprovado)
  ytmp3,      // p.lbserver.xyz - funciona
  ytboruto,   // ytconvert.org - funciona  
  savetube    // save-tube.com - funciona
};