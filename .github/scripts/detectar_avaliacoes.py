#!/usr/bin/env python3
"""
Mapeia os arquivos alterados em um PR para as suítes promptfoo que precisam rodar.

Regras:
  1. Toda pasta que contém um promptfooconfig.yaml é uma suíte de avaliação.
  2. Uma suíte é selecionada quando um arquivo alterado:
     a) está dentro da pasta da suíte (prompt.md, promptfooconfig.yaml, asserts/, rubric/ ...); ou
     b) é referenciado pelo config via file:// (ex.: file://../rubric/judge.xml).
  3. README.md é documentação humana e não dispara avaliação.
  4. Um prompt.md alterado que não é coberto por nenhuma suíte é reportado como
     "sem avaliação" — o gate reprova, pois não há teste que sustente a aprovação.

Entrada : lista de arquivos alterados (um por linha) em stdin.
Saída   : JSON {"suites": [...], "sem_avaliacao": [...]} em stdout.
"""
import json
import os
import re
import sys
from pathlib import Path

RAIZ = Path.cwd().resolve()
IGNORAR = {"README.md"}
REF = re.compile(r"file://([^\s'\"}\]]+)")


def suites_do_repositorio():
    for cfg in sorted(RAIZ.rglob("promptfooconfig.yaml")):
        if any(p in {".git", "node_modules", ".github"} for p in cfg.parts):
            continue
        pasta = cfg.parent
        deps = set()
        for alvo in REF.findall(cfg.read_text(encoding="utf-8")):
            caminho = (pasta / alvo).resolve()
            if caminho.exists():  # descarta falsos positivos citados em texto
                deps.add(caminho)
        yield pasta, deps


def dentro(arquivo: Path, pasta: Path) -> bool:
    try:
        arquivo.relative_to(pasta)
        return True
    except ValueError:
        return False


def main():
    alterados = [
        (RAIZ / linha.strip()).resolve()
        for linha in sys.stdin
        if linha.strip() and Path(linha.strip()).name not in IGNORAR
    ]
    suites = list(suites_do_repositorio())

    selecionadas, cobertos = [], set()
    for pasta, deps in suites:
        gatilhos = [
            a for a in alterados
            if dentro(a, pasta) or any(a == d or dentro(a, d) for d in deps)
        ]
        if gatilhos:
            rel = pasta.relative_to(RAIZ).as_posix()
            selecionadas.append({"pasta": rel, "id": rel.replace("/", "__")})
            cobertos.update(gatilhos)

    sem_avaliacao = sorted(
        a.relative_to(RAIZ).as_posix()
        for a in alterados
        if a.name == "prompt.md" and a not in cobertos
    )
    json.dump({"suites": selecionadas, "sem_avaliacao": sem_avaliacao}, sys.stdout,
              ensure_ascii=False)


if __name__ == "__main__":
    main()
