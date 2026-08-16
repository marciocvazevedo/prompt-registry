/**
 * Regra 8 — Toda regra de ingress/egress precisa de comentário explicativo,
 * aceito em qualquer posição sintaticamente válida do YAML:
 *   - linha(s) de comentário acima da regra (linhas em branco no meio são ok)
 *   - comentário inline na linha que abre a regra
 *   - qualquer comentário dentro do bloco da regra
 */

const indentOf = (l) => (l.match(/^ */) || [''])[0].length;
const isBlank = (l) => /^\s*$/.test(l);
const isCommentLine = (l) => /^\s*#/.test(l);

// "#" só é comentário fora de escalares entre aspas e precedido de espaço.
function hasComment(l) {
  let sq = false;
  let dq = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (c === "'" && !dq) sq = !sq;
    else if (c === '"' && !sq) dq = !dq;
    else if (c === '#' && !sq && !dq && (i === 0 || /\s/.test(l[i - 1]))) return true;
  }
  return false;
}

// Neutraliza cercas de código sem deslocar a numeração das linhas.
const stripFenceLines = (lines) => lines.map((l) => (/^\s*```/.test(l) ? '' : l));

// Localiza os itens de lista cujo pai imediato é "ingress:" ou "egress:".
function findRuleStarts(lines) {
  const keyStack = [];
  const parentKeyFor = (ind) => {
    for (let k = keyStack.length - 1; k >= 0; k--) {
      if (keyStack[k].indent <= ind) return keyStack[k].key;
    }
    return null;
  };

  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isBlank(line) || isCommentLine(line)) continue;

    const ind = indentOf(line);
    const body = line.slice(ind);

    if (/^---\s*$/.test(body)) {
      keyStack.length = 0; // novo documento YAML
      continue;
    }

    if (/^-(\s|$)/.test(body)) {
      const parent = parentKeyFor(ind);
      if (parent === 'ingress' || parent === 'egress') starts.push(i);

      const inlineKey = body.match(/^-\s+([\w.\/-]+):/);
      while (keyStack.length && keyStack[keyStack.length - 1].indent > ind) keyStack.pop();
      if (inlineKey) keyStack.push({ indent: ind + 2, key: inlineKey[1] });
      continue;
    }

    const keyMatch = body.match(/^([\w.\/-]+):/);
    if (keyMatch) {
      while (keyStack.length && keyStack[keyStack.length - 1].indent >= ind) keyStack.pop();
      keyStack.push({ indent: ind, key: keyMatch[1] });
    }
  }
  return starts;
}

function ruleIsCommented(lines, i) {
  const ruleIndent = indentOf(lines[i]);

  let end = lines.length - 1;
  for (let j = i + 1; j < lines.length; j++) {
    if (isBlank(lines[j]) || isCommentLine(lines[j])) continue;
    if (indentOf(lines[j]) <= ruleIndent) {
      end = j - 1;
      break;
    }
  }

  if (hasComment(lines[i])) return true; // inline
  for (let j = i + 1; j <= end; j++) {
    if (hasComment(lines[j])) return true; // dentro do bloco
  }
  for (let j = i - 1; j >= 0; j--) {
    if (isCommentLine(lines[j])) return true; // acima
    if (!isBlank(lines[j])) break;
  }
  return false;
}

module.exports = (output) => {
  const lines = stripFenceLines(String(output ?? '').split('\n'));
  const ruleStarts = findRuleStarts(lines);

  if (ruleStarts.length === 0) {
    return { pass: false, score: 0, reason: 'Nenhuma regra de ingress/egress encontrada.' };
  }

  const failures = ruleStarts
    .filter((i) => !ruleIsCommented(lines, i))
    .map((i) => `linha ${i + 1}: ${lines[i].trim()}`);

  if (failures.length > 0) {
    return {
      pass: false,
      score: 0,
      reason: `${failures.length}/${ruleStarts.length} regra(s) sem comentário -> ${failures.join(' | ')}`,
    };
  }

  return { pass: true, score: 1, reason: `${ruleStarts.length} regra(s) comentada(s).` };
};