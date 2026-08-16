const yaml = require('js-yaml');

// Extrai o conteúdo de cercas de código, se houver.
function stripFences(text) {
  const blocks = [...text.matchAll(/^```[\w-]*[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean);
  return blocks.length ? blocks.join('\n---\n') : text.trim();
}

module.exports = (output) => {
  const raw = String(output ?? '');
  const hadFences = /^```/m.test(raw);
  const text = stripFences(raw);

  if (!text) {
    return { pass: false, score: 0, reason: 'Saída vazia.' };
  }

  let docs;
  try {
    docs = yaml.loadAll(text);
  } catch (e) {
    return { pass: false, score: 0, reason: 'YAML inválido: ' + e.message };
  }

  const valid = docs.filter((d) => d !== null && d !== undefined);
  if (valid.length === 0) {
    return { pass: false, score: 0, reason: 'Nenhum documento YAML com conteúdo.' };
  }

  const naoMapa = valid.findIndex((d) => typeof d !== 'object' || Array.isArray(d));
  if (naoMapa !== -1) {
    return {
      pass: false,
      score: 0,
      reason: `Documento ${naoMapa + 1} não é um mapeamento (provável texto solto fora do YAML).`,
    };
  }

  return {
    pass: true,
    score: 1,
    reason:
      `${valid.length} documento(s) YAML válido(s)` +
      (hadFences ? ' — atenção: saída veio dentro de cercas de código.' : '.'),
  };
};