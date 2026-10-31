"""Converte SVGs de diagramas (padrão dos exemplos EX-nn) na fonte JSON `fluxo-word/1.0`.

Reconhece caixas, decisões, grupos, raias, marcadores, barras, textos e conectores e tenta
anexar os textos às formas (rótulo e subtítulo) conforme as regras de layout do renderizador.
O que não se encaixa vira texto solto, para que nada se perca. A conversão pode ser parcial
(item 10 dos requisitos); a fidelidade é verificada por `packages/core/src/fidelidade.test.ts`.

Uso:  python -I tools/svg_para_json.py docs/exemplos packages/core/modelos [01 02 ...]
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

NS = "{http://www.w3.org/2000/svg}"
LINHA, DESTAQUE, TEXTO, SEC, GRUPO, BRANCO = "#8a949c", "#2f6fdc", "#1d2a33", "#56636d", "#f1f0ec", "#ffffff"
HERDADOS = ("fill", "stroke", "stroke-width", "font-size", "text-anchor", "font-weight")
TOL_Y = 2.0  # mesma ordem de grandeza da tolerância do teste de fidelidade (2,5)


def num(v) -> float:
    return float(v)


def limpo(n: float):
    return int(n) if float(n).is_integer() else round(n, 2)


@dataclass
class Linha:
    x: float
    y: float
    s: str


@dataclass
class Bloco:
    """Um elemento <text> do SVG, já achatado em linhas."""

    ordem: int
    linhas: list[Linha]
    tam: float
    peso: str
    ancora: str
    cor: str
    usado: bool = False


@dataclass
class Forma:
    ordem: int
    tipo: str  # rect | polygon | circle
    x: float
    y: float
    w: float
    h: float
    attrs: dict
    el: dict = field(default_factory=dict)


def norm(cor: str | None) -> str:
    return (cor or "none").lower()


def herdar(no: ET.Element, pais: list[ET.Element], nome: str):
    for e in [no, *reversed(pais)]:
        if nome in e.attrib:
            return e.attrib[nome]
    return None


def ler(svg: Path):
    raiz = ET.parse(svg).getroot()
    vb = [num(v) for v in raiz.attrib["viewBox"].split()]
    base = num(raiz.attrib.get("font-size", 13))
    formas: list[Forma] = []
    blocos: list[Bloco] = []
    caminhos: list[tuple[int, dict, str]] = []
    ordem = 0

    def visitar(no: ET.Element, pais: list[ET.Element]):
        nonlocal ordem
        nome = no.tag.removeprefix(NS)
        if nome in ("defs", "marker"):
            return
        h = {k: herdar(no, pais, k) for k in HERDADOS}
        if nome == "rect":
            a = {**no.attrib, **{k: v for k, v in h.items() if v and k not in no.attrib}}
            formas.append(Forma(ordem, "rect", num(a["x"]), num(a["y"]), num(a["width"]), num(a["height"]), a))
        elif nome == "polygon":
            pts = [num(v) for v in re.findall(r"-?\d+(?:\.\d+)?", no.attrib["points"])]
            xs, ys = pts[0::2], pts[1::2]
            a = {**no.attrib, **{k: v for k, v in h.items() if v and k not in no.attrib}}
            formas.append(Forma(ordem, "polygon", min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys), a))
        elif nome == "circle":
            r = num(no.attrib["r"])
            formas.append(Forma(ordem, "circle", num(no.attrib["cx"]) - r, num(no.attrib["cy"]) - r, 2 * r, 2 * r, dict(no.attrib)))
        elif nome == "path":
            a = {**no.attrib, **{k: v for k, v in h.items() if v and k not in no.attrib}}
            caminhos.append((ordem, a, no.attrib["d"]))
        elif nome == "text":
            x0, y0 = num(no.attrib.get("x", 0)), num(no.attrib.get("y", 0))
            spans = [c for c in no if c.tag.removeprefix(NS) == "tspan"]
            if spans:
                y, linhas = y0, []
                for sp in spans:
                    y = num(sp.attrib["y"]) if "y" in sp.attrib else y + num(sp.attrib.get("dy", 0))
                    linhas.append(Linha(num(sp.attrib.get("x", x0)), y, (sp.text or "").strip()))
            else:
                linhas = [Linha(x0, y0, (no.text or "").strip())]
            blocos.append(Bloco(ordem, linhas, num(h["font-size"] or base), h["font-weight"] or "normal", h["text-anchor"] or "start", norm(h["fill"] or "#000000")))
            ordem += 1
            return
        ordem += 1
        for filho in no:
            visitar(filho, [*pais, no])

    visitar(raiz, [])
    return vb, base, formas, blocos, caminhos


def caminho_para_pontos(d: str) -> list[list[float]]:
    pts, x, y = [], 0.0, 0.0
    for cmd, a, b in re.findall(r"([MHVL])\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+))?", d):
        if cmd == "H":
            x = num(a)
        elif cmd == "V":
            y = num(a)
        else:
            x, y = num(a), num(b)
        pts.append([limpo(x), limpo(y)])
    return pts


def dentro(f: Forma, x: float, y: float, folga: float = 0.5) -> bool:
    return f.x - folga <= x <= f.x + f.w + folga and f.y - folga <= y <= f.y + f.h + folga


def contem(a: Forma, b: Forma) -> bool:
    return a is not b and a.x <= b.x and a.y <= b.y and a.x + a.w >= b.x + b.w and a.y + a.h >= b.y + b.h


def estilo_da_forma(a: dict) -> tuple[str | None, str]:
    """(estilo, fundo) a partir dos atributos do SVG."""
    fill, stroke = norm(a.get("fill")), norm(a.get("stroke"))
    if fill == DESTAQUE and stroke == DESTAQUE:
        return "destaque", "nenhum"
    estilo = "secundario" if "stroke-dasharray" in a else None
    fundo = {BRANCO: "branco", GRUPO: "grupo"}.get(fill, "nenhum")
    return estilo, fundo


class Conversor:
    def __init__(self, svg: Path, tipo: str):
        self.vb, self.base, self.formas, self.blocos, self.caminhos = ler(svg)
        self.tipo = tipo
        self.numero = svg.stem.split("-")[1]
        self.elementos: list[tuple[int, dict]] = []
        self.contadores: dict[str, int] = {}
        self.nos: list[tuple[Forma, dict]] = []

    def id(self, prefixo: str) -> str:
        self.contadores[prefixo] = self.contadores.get(prefixo, 0) + 1
        return f"{prefixo}{self.contadores[prefixo]}"

    # ---- textos ---------------------------------------------------------------------------
    def candidatos(self, f: Forma, centro: bool, alinh: str = "meio"):
        ancora, x = {"meio": ("middle", f.x + f.w / 2), "inicio": ("start", f.x + 16), "fim": ("end", f.x + f.w - 16)}[alinh]
        saida = []
        for b in self.blocos:
            if b.usado:
                continue
            if all(dentro(f, ln.x, ln.y, 0.5) for ln in b.linhas):
                if not centro or (b.ancora == ancora and all(abs(ln.x - x) <= 1 for ln in b.linhas)):
                    saida.append(b)
        return saida

    def anexar_rotulo(self, f: Forma, el: dict, estilo: str | None) -> None:
        """Rótulo + subtítulo de caixa/decisão, em qualquer alinhamento (caixas), se o layout previsto reproduz o original."""
        for alinh in ("meio", "inicio", "fim") if el["forma"] == "caixa" else ("meio",):
            if self._rotulo(f, el, estilo, alinh):
                if alinh != "meio":
                    el["alinhamento"] = alinh
                return
        for alinh in ("meio", "inicio", "fim") if el["forma"] == "caixa" else ("meio",):
            if self._linhas(f, el, estilo, alinh):
                if alinh != "meio":
                    el["alinhamento"] = alinh
                return

    def _linhas(self, f: Forma, el: dict, estilo: str | None, alinh: str) -> bool:
        """Texto em vários níveis (sobretítulo, título, detalhes): cada linha com seu tamanho, peso, cor e distância."""
        blocos = self.candidatos(f, True, alinh)
        todos = [b for b in self.blocos if not b.usado and all(dentro(f, ln.x, ln.y, 0.5) for ln in b.linhas)]
        if not blocos or len(blocos) != len(todos):
            return False
        linhas = sorted(((ln, b) for b in blocos for ln in b.linhas), key=lambda t: t[0].y)
        cor_titulo = SEC if estilo == "secundario" else TEXTO
        cor_sub = TEXTO if estilo == "destaque" else SEC
        ys = [ln.y for ln, _ in linhas]
        total = ys[-1] - ys[0]
        saida = []
        for i, (ln, b) in enumerate(linhas):
            item: dict = {"texto": ln.s}
            sec = b.cor == cor_sub and (b.cor != cor_titulo or abs(b.tam - 11.5) < 0.01)
            if sec:
                item["secundario"] = True
            elif b.cor != cor_titulo:
                item["cor"] = b.cor if b.cor.startswith("#") else "#ffffff"
            padrao_tam = 11.5 if sec else self.base
            if abs(b.tam - padrao_tam) > 0.01:
                item["tamanho"] = limpo(b.tam)
            if b.peso == "600":
                item["negrito"] = True
            if i > 0 and abs(ys[i] - ys[i - 1] - 15) > 0.01:
                item["dy"] = limpo(round(ys[i] - ys[i - 1], 2))
            saida.append(item)
        ajuste = ys[0] - (f.y + f.h / 2 - total / 2 + 4)
        if abs(ajuste) > 0.01:
            el["ajusteY"] = limpo(round(ajuste, 2))
        el["linhas"] = saida
        for _, b in linhas:
            b.usado = True
        return True

    def _rotulo(self, f: Forma, el: dict, estilo: str | None, alinh: str) -> bool:
        blocos = sorted(self.candidatos(f, True, alinh), key=lambda b: b.linhas[0].y)
        linhas = [(ln, b) for b in blocos for ln in b.linhas]
        if not linhas:
            return False
        cor_titulo = SEC if estilo == "secundario" else TEXTO
        cor_sub = TEXTO if estilo == "destaque" else SEC
        eh_sub = lambda b: abs(b.tam - 11.5) < 0.01 and b.peso != "600" and b.cor == cor_sub  # noqa: E731
        n_titulo = len(linhas)
        while n_titulo > 0 and eh_sub(linhas[n_titulo - 1][1]):
            n_titulo -= 1
        titulo, sub = linhas[:n_titulo], linhas[n_titulo:]
        if not titulo:  # só subtítulo: não é um rótulo no nosso layout
            return False
        tams = {b.tam for _, b in titulo}
        pesos = {b.peso for _, b in titulo}
        if len(tams) != 1 or len(pesos) != 1 or any(b.cor != cor_titulo for _, b in titulo):
            return False
        ys = [ln.y for ln, _ in linhas]
        gaps = [round(y2 - y1, 2) for y1, y2 in zip(ys, ys[1:])]
        n_alto = max(n_titulo - 1, 0) + (1 if sub and titulo else 0)  # lacunas que seguem o espaçamento do título
        g_alto, g_sub = gaps[:n_alto], gaps[n_alto:]
        if len(set(g_alto)) > 1 or len(set(g_sub)) > 1:
            return False
        padrao = 17 if sub else 15
        passo = g_alto[0] if g_alto else padrao
        passo_sub = g_sub[0] if g_sub else passo
        previsto = f.y + f.h / 2 - sum(gaps) / 2 + 4
        if abs(ys[0] - previsto) > TOL_Y:
            return False
        tam, peso = tams.pop(), pesos.pop()
        el["texto"] = "\n".join(ln.s for ln, _ in titulo)
        if abs(tam - self.base) > 0.01:
            el["tamanho"] = limpo(tam)
        if sub:
            el["subtitulo"] = "\n".join(ln.s for ln, _ in sub)
            if peso != "600":
                el["negrito"] = False
        elif peso == "600":
            el["negrito"] = True
        if passo != (17 if sub else 15):
            el["espacamento"] = limpo(passo)
        if sub and len(sub) > 1 and passo_sub != passo:
            el["espacamentoSub"] = limpo(passo_sub)
        for _, b in linhas:
            b.usado = True
        return True

    def anexar_grupo(self, f: Forma, el: dict) -> None:
        for b in self.candidatos(f, False):
            if b.peso != "600" or abs(b.tam - self.base) > 0.01 or b.cor != TEXTO:
                continue
            alvo = "fim" if b.ancora == "end" else "inicio" if b.ancora == "start" else None
            x = f.x + f.w - 16 if alvo == "fim" else f.x + 16
            if alvo and all(abs(ln.x - x) <= 1 and abs(ln.y - (f.y + 24 + i * 15)) <= TOL_Y for i, ln in enumerate(b.linhas)):
                el["texto"] = "\n".join(ln.s for ln in b.linhas)
                if alvo == "fim":
                    el["alinhamento"] = "fim"
                b.usado = True
                return

    def anexar_raia(self, f: Forma, el: dict) -> None:
        for b in self.candidatos(f, False):
            if b.peso != "600" or abs(b.tam - 12) > 0.01 or b.ancora != "start":
                continue
            n = len(b.linhas)
            if all(abs(ln.x - (f.x + 12)) <= 1 for ln in b.linhas) and abs(b.linhas[0].y - (f.y + f.h / 2 - (n - 1) * 7.5 + 4)) <= TOL_Y:
                el["texto"] = "\n".join(ln.s for ln in b.linhas)
                b.usado = True
                return

    def anexar_marcador(self, f: Forma, el: dict) -> None:
        for b in self.candidatos(f, True):
            if b.cor == "white" and abs(b.tam - 10) < 0.01 and abs(b.linhas[0].y - (f.y + f.h / 2 + 4)) <= TOL_Y:
                el["texto"] = b.linhas[0].s
                b.usado = True
                return

    # ---- formas ---------------------------------------------------------------------------
    def converter_formas(self) -> None:
        for f in self.formas:
            a, tipo = f.attrs, f.tipo
            fill, stroke = norm(a.get("fill")), norm(a.get("stroke"))
            rx = num(a["rx"]) if "rx" in a else None
            geo = {"x": limpo(f.x), "y": limpo(f.y), "w": limpo(f.w), "h": limpo(f.h)}
            if tipo == "circle":
                el = {"id": self.id("m"), "forma": "marcador", "x": limpo(f.x + f.w / 2), "y": limpo(f.y + f.h / 2)}
                if f.w != 22:
                    el["raio"] = limpo(f.w / 2)
                if norm(a.get("fill")) != DESTAQUE:
                    el["cor"] = norm(a.get("fill"))
                self.anexar_marcador(f, el)
            elif tipo == "polygon":
                estilo, fundo = estilo_da_forma(a)
                el = {"id": self.id("d"), "forma": "decisao", **geo}
                if estilo:
                    el["estilo"] = estilo
                if fundo != "nenhum" and estilo != "destaque":
                    el["fundo"] = fundo
                self.anexar_rotulo(f, el, estilo)
                self.nos.append((f, el))
            elif stroke == "none":
                if rx == 3 and fill in (LINHA, DESTAQUE):
                    el = {"id": self.id("b"), "forma": "barra", **geo}
                    if fill == DESTAQUE:
                        el["estilo"] = "destaque"
                else:
                    el = {"id": self.id("t"), "forma": "retangulo", **geo}
                    if fill != GRUPO:
                        el["preenchimento"] = fill
            elif fill == GRUPO and rx is None:
                el = {"id": self.id("r"), "forma": "raia", **geo}
                if num(a.get("stroke-width", 1)) != 1:
                    el["espessura"] = limpo(num(a["stroke-width"]))
                self.anexar_raia(f, el)
            elif (fill == GRUPO and rx == 8) or (rx is not None and any(contem(f, o) for o in self.formas if o.tipo != "rect" or o is not f)):
                el = {"id": self.id("g"), "forma": "grupo", **geo}
                if fill != GRUPO:
                    el["fundo"] = {BRANCO: "branco"}.get(fill, "nenhum")
                self.anexar_grupo(f, el)
            else:
                estilo, fundo = estilo_da_forma(a)
                el = {"id": self.id("n"), "forma": "caixa", **geo}
                if estilo:
                    el["estilo"] = estilo
                if fundo != "nenhum" and estilo != "destaque":
                    el["fundo"] = fundo
                if rx is not None and rx != 8:
                    el["raio"] = limpo(rx)
                self.anexar_rotulo(f, el, estilo)
                self.nos.append((f, el))
            self.elementos.append((f.ordem, el))

    def converter_textos(self) -> None:
        for b in self.blocos:
            if b.usado:
                continue
            l0 = b.linhas[0]
            if abs(b.tam - 15) < 0.01 and b.peso == "600" and l0.x == 24 and l0.y == 34:
                self.titulo = l0.s
                continue
            el = {"id": self.id("x"), "forma": "texto", "x": limpo(l0.x), "y": limpo(l0.y), "texto": "\n".join(ln.s for ln in b.linhas)}
            if abs(b.tam - self.base) > 0.01:
                el["tamanho"] = limpo(b.tam)
            if b.peso == "600":
                el["negrito"] = True
            if b.ancora != "start":
                el["alinhamento"] = {"middle": "meio", "end": "fim"}[b.ancora]
            if len(b.linhas) > 1:
                passo = round(b.linhas[1].y - b.linhas[0].y, 2)
                if passo != 15:
                    el["espacamento"] = limpo(passo)
            if b.cor == SEC:
                el["estilo"] = "secundario"
            elif b.cor != TEXTO:
                el["cor"] = b.cor if b.cor.startswith("#") else "#ffffff"
            self.elementos.append((b.ordem, el))

    def ligar(self, x: float, y: float):
        """Elemento (caixa, decisão, marcador, nota) cuja borda contém o ponto, e o lado tocado."""
        achados = []
        for f, el in self.nos:
            for lado, cond in (
                ("esquerda", abs(x - f.x) < 0.6 and f.y - 0.5 <= y <= f.y + f.h + 0.5),
                ("direita", abs(x - (f.x + f.w)) < 0.6 and f.y - 0.5 <= y <= f.y + f.h + 0.5),
                ("cima", abs(y - f.y) < 0.6 and f.x - 0.5 <= x <= f.x + f.w + 0.5),
                ("baixo", abs(y - (f.y + f.h)) < 0.6 and f.x - 0.5 <= x <= f.x + f.w + 0.5),
            ):
                if cond:
                    achados.append((f.w * f.h, el["id"], lado))
                    break
        return min(achados) if achados else None

    def converter_caminhos(self) -> None:
        for ordem, a, d in self.caminhos:
            pts = caminho_para_pontos(d)
            if len(pts) < 2:
                continue
            sw = num(a.get("stroke-width", 1.25))
            if abs(sw - 1.25) > 0.01:
                el = {"id": self.id("l"), "forma": "linha", "x1": pts[0][0], "y1": pts[0][1], "x2": pts[-1][0], "y2": pts[-1][1], "espessura": limpo(sw)}
                if "stroke-opacity" in a:
                    el["opacidade"] = num(a["stroke-opacity"])
                self.elementos.append((ordem, el))
                continue
            ini, fim = "marker-start" in a, "marker-end" in a
            el = {"id": self.id("k"), "pontos": pts, "seta": "ambas" if ini and fim else "inicio" if ini else "fim" if fim else "nenhuma"}
            if "stroke-dasharray" in a:
                el["estilo"] = "tracejado"
            de, para = self.ligar(*pts[0]), self.ligar(*pts[-1])
            if de and para and de[1] != para[1]:
                el.update({"de": de[1], "ladoDe": de[2], "para": para[1], "ladoPara": para[2]})
            self.conectores.append((ordem, el))

    def barramentos(self) -> None:
        """Conectores soltos que se encontram (tronco compartilhado) viram ligações reais origem -> destino.

        Cada trecho ligado a formas forma um componente; as extremidades com seta são destinos e as demais
        extremidades tocando formas são origens. O desenho original é mantido em `pontos` (caminho pelo tronco)
        até a forma ser movida, quando a rota automática assume.
        """
        soltos = [(o, c) for o, c in self.conectores if "de" not in c]
        if len(soltos) < 2:
            return

        def sobre(p, a, b):  # ponto p sobre o segmento ab (ortogonal)
            return min(a[0], b[0]) - 0.6 <= p[0] <= max(a[0], b[0]) + 0.6 and min(a[1], b[1]) - 0.6 <= p[1] <= max(a[1], b[1]) + 0.6

        pai = list(range(len(soltos)))

        def raiz(i):
            while pai[i] != i:
                pai[i] = pai[pai[i]]
                i = pai[i]
            return i

        def segs(c):
            return list(zip(c["pontos"], c["pontos"][1:]))

        for i, (_, a) in enumerate(soltos):
            for j in range(i + 1, len(soltos)):
                b = soltos[j][1]
                if any(sobre(q, *sb) for sa in segs(a) for q in sa for sb in segs(b)) or any(sobre(q, *sa) for sb in segs(b) for q in sb for sa in segs(a)):
                    pai[raiz(i)] = raiz(j)
        grupos: dict[int, list[int]] = {}
        for i in range(len(soltos)):
            grupos.setdefault(raiz(i), []).append(i)

        consumidos: set[int] = set()
        novos: list[tuple[int, dict]] = []
        for membros in grupos.values():
            if len(membros) < 2:
                continue
            origens, destinos = [], []  # (id, lado, ponto, tracejado)
            for i in membros:
                c = soltos[i][1]
                tr = c.get("estilo") == "tracejado"
                for ponto, seta in ((c["pontos"][0], c["seta"] in ("inicio", "ambas")), (c["pontos"][-1], c["seta"] in ("fim", "ambas"))):
                    lig = self.ligar(*ponto)
                    if lig:
                        (destinos if seta else origens).append((lig[1], lig[2], ponto, tr))
            if not origens or not destinos:
                continue
            pontos_tronco = [pt for i in membros for pt in soltos[i][1]["pontos"]]
            for o_id, o_lado, o_pt, o_tr in origens:
                for d_id, d_lado, d_pt, d_tr in destinos:
                    if o_id == d_id:
                        continue
                    caminho = self.trilha(o_pt, d_pt, [soltos[i][1]["pontos"] for i in membros])
                    if not caminho:
                        continue
                    el = {"id": self.id("k"), "de": o_id, "para": d_id, "ladoDe": o_lado, "ladoPara": d_lado, "pontos": caminho, "seta": "fim"}
                    if o_tr or d_tr:
                        el["estilo"] = "tracejado"
                    novos.append((min(soltos[i][0] for i in membros), el))
            consumidos.update(membros)
        if not novos:
            return
        mantidos = [(o, c) for k, (o, c) in enumerate(soltos) if k not in consumidos]
        self.conectores = [(o, c) for o, c in self.conectores if "de" in c] + mantidos + novos

    def trilha(self, ini, fim, linhas):
        """Menor caminho ortogonal de ini a fim percorrendo apenas os trechos dados (junções em T incluídas)."""
        nos = {tuple(p) for ln in linhas for p in ln} | {tuple(ini), tuple(fim)}
        arestas: dict[tuple, set] = {n: set() for n in nos}
        for ln in linhas:
            seg = list(zip(ln, ln[1:]))
            for a, b in seg:
                a, b = tuple(a), tuple(b)
                no_seg = sorted((n for n in nos if min(a[0], b[0]) - 0.01 <= n[0] <= max(a[0], b[0]) + 0.01 and min(a[1], b[1]) - 0.01 <= n[1] <= max(a[1], b[1]) + 0.01 and (a[0] == b[0] == n[0] or a[1] == b[1] == n[1])), key=lambda n: abs(n[0] - a[0]) + abs(n[1] - a[1]))
                for u, v in zip(no_seg, no_seg[1:]):
                    arestas[u].add(v)
                    arestas[v].add(u)
        fila, vistos = [[tuple(ini)]], {tuple(ini)}
        while fila:
            cam = fila.pop(0)
            if cam[-1] == tuple(fim):
                saida = [list(p) for p in cam]
                limpo_ = [saida[0]]
                for k in range(1, len(saida) - 1):
                    a, b, c = limpo_[-1], saida[k], saida[k + 1]
                    if not ((a[0] == b[0] == c[0]) or (a[1] == b[1] == c[1])):
                        limpo_.append(b)
                return limpo_ + [saida[-1]]
            for v in arestas[cam[-1]]:
                if v not in vistos:
                    vistos.add(v)
                    fila.append([*cam, v])
        return None

    def rotulos_de_conectores(self) -> None:
        """Textos secundários junto a um conector (fora de qualquer caixa) viram o rótulo dele."""

        def dist(x, y, a, b):
            px = min(max(x, min(a[0], b[0])), max(a[0], b[0]))
            py = min(max(y, min(a[1], b[1])), max(a[1], b[1]))
            return ((x - px) ** 2 + (y - py) ** 2) ** 0.5

        restantes = []
        for ordem, el in self.elementos:
            if el["forma"] != "texto" or el.get("estilo") != "secundario" or el.get("negrito") or chr(10) in el["texto"]:
                restantes.append((ordem, el))
                continue
            x, y = el["x"], el["y"]
            if any(dentro(f, x, y, 0) for f, _ in self.nos):
                restantes.append((ordem, el))
                continue
            melhor = None
            for _, c in self.conectores:
                if "rotulo" in c:
                    continue
                for a, b in zip(c["pontos"], c["pontos"][1:]):
                    d = dist(x, y - 4, a, b)
                    if d <= 14 and (melhor is None or d < melhor[0]):
                        melhor = (d, c)
            if not melhor:
                restantes.append((ordem, el))
                continue
            c = melhor[1]
            tam = el.get("tamanho", 11.5)
            alinh = el.get("alinhamento", "inicio")
            pts = c["pontos"]
            i = (len(pts) - 1) // 2
            ax, ay = (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2 - 6
            rot = {"texto": el["texto"]}
            if not (alinh == "meio" and tam == 11.5 and abs(ax - x) <= 0.6 and abs(ay - y) <= 0.6):
                rot.update({"x": x, "y": y, "alinhamento": alinh})
                if tam != 11.5:
                    rot["tamanho"] = tam
            c["rotulo"] = rot
        self.elementos = restantes

    def converter(self) -> dict:
        self.titulo = ""
        self.conectores: list[tuple[int, dict]] = []
        self.converter_formas()
        self.converter_textos()
        self.converter_caminhos()
        self.barramentos()
        self.rotulos_de_conectores()
        tela = {"largura": limpo(self.vb[2]), "altura": limpo(self.vb[3])}
        if abs(self.base - 13) > 0.01:
            tela["fonteBase"] = limpo(self.base)
        return {
            "schema": "fluxo-word/1.0",
            "id": f"modelo-ex-{self.numero}",
            "tipo": self.tipo,
            "titulo": self.titulo,
            "revisao": 1,
            "tela": tela,
            "elementos": [e for _, e in sorted(self.elementos, key=lambda t: t[0])],
            "conectores": [e for _, e in sorted(self.conectores, key=lambda t: t[0])],
        }


def tipos_do_documento(md: Path) -> dict[str, str]:
    return {m[1]: m[2] for m in re.finditer(r"\|\s*(EX-\d+)\s*\|[^|]*\|\s*`([^`]+)`", md.read_text(encoding="utf-8"))}


def main(argv: list[str]) -> None:
    origem, destino = Path(argv[1]), Path(argv[2])
    quais = set(argv[3:])
    tipos = tipos_do_documento(origem.parent / "Requisitos_Suplemento_Word_Fluxos.md")
    destino.mkdir(parents=True, exist_ok=True)
    for svg in sorted(origem.glob("EX-*.svg")):
        n = svg.stem.split("-")[1]
        if quais and n not in quais:
            continue
        d = Conversor(svg, tipos.get(svg.stem, "livre")).converter()
        (destino / f"ex-{n}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        textos = sum(1 for e in d["elementos"] if e["forma"] == "texto")
        print(f"{svg.stem}: {len(d['elementos'])} elementos ({textos} textos soltos), {len(d['conectores'])} conectores")


if __name__ == "__main__":
    main(sys.argv)
