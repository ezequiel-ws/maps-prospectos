#!/usr/bin/env python3
"""Expande el rubro de cada query a sinónimos/variantes para cubrir más resultados."""
from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path

# clave normalizada (sin acentos, lower) -> lista de variantes a buscar
VARIANTES: dict[str, list[str]] = {
    "abogados": [
        "abogados",
        "abogado",
        "estudio jurídico",
        "estudio juridico",
        "abogado laboral",
        "abogado civil",
    ],
    "abogado": [
        "abogados",
        "abogado",
        "estudio jurídico",
        "abogado laboral",
    ],
    "odontologos": [
        "odontólogos",
        "odontólogo",
        "dentista",
        "clínica dental",
        "consultorio odontológico",
    ],
    "dentistas": [
        "dentista",
        "odontólogos",
        "clínica dental",
    ],
    "cirujanos plasticos": [
        "cirujano plástico",
        "cirugía estética",
        "clínica de estética",
        "medicina estética",
    ],
    "cirugia estetica": [
        "cirugía estética",
        "cirujano plástico",
        "clínica de estética",
        "medicina estética",
    ],
    "clinicas esteticas": [
        "clínica estética",
        "medicina estética",
        "cirugía estética",
    ],
    "inmobiliarias": [
        "inmobiliaria",
        "inmobiliarias",
        "agente inmobiliario",
        "martillero",
    ],
    "contadores": [
        "contador",
        "contadores",
        "estudio contable",
        "contador público",
    ],
    "arquitectos": [
        "arquitecto",
        "arquitectos",
        "estudio de arquitectura",
    ],
    "veterinarias": [
        "veterinaria",
        "veterinario",
        "clínica veterinaria",
    ],
    "psicologos": [
        "psicólogo",
        "psicólogos",
        "psicóloga",
        "consultorio psicológico",
    ],
    "plomeros": ["plomero", "plomería", "gasista plomero"],
    "electricistas": ["electricista", "electricistas", "instalaciones eléctricas"],
    "cerrajeros": ["cerrajero", "cerrajería", "cerrajeros 24 horas"],
    "gasistas": ["gasista", "gasista matriculado", "plomero gasista"],
    "mudanzas": ["mudanzas", "empresa de mudanzas", "fletes mudanzas"],
    "fumigadores": ["fumigación", "control de plagas", "fumigadores"],
    "aire acondicionado": [
        "aire acondicionado",
        "instalación aire acondicionado",
        "técnico aire acondicionado",
    ],
    "mecanicos": ["mecánico", "taller mecánico", "mecánica automotor"],
    "peluquerias": ["peluquería", "peluquerías", "salon de belleza", "hair salon"],
    "barberias": ["barbería", "barberias", "barber shop"],
    "unas": ["manicura", "uñas", "nail salon", "podología"],
    "gimnasios": ["gimnasio", "gimnasios", "gym"],
    "panaderias": ["panadería", "panaderías", "confitería"],
    "kioscos": ["kiosco", "kioscos", "maxikiosco"],
    "ferreterias": ["ferretería", "ferreterías"],
    "restaurantes": ["restaurante", "restaurantes", "parrilla", "comida casera"],
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s.lower().strip())


def variants_for_rubro(rubro: str) -> list[str]:
    r = rubro.strip()
    if not r:
        return []
    key = norm(r)
    # match exact or startswith / contained
    if key in VARIANTES:
        out = list(VARIANTES[key])
    else:
        out = None
        for k, vals in VARIANTES.items():
            if key == k or key.startswith(k) or k.startswith(key) or key in k or k in key:
                out = list(vals)
                break
        if out is None:
            out = [r]
    # always include original first
    seen: set[str] = set()
    final: list[str] = []
    for v in [r] + out:
        v = v.strip()
        if not v:
            continue
        nk = norm(v)
        if nk in seen:
            continue
        seen.add(nk)
        final.append(v)
    return final


def split_rubro_zona(query: str) -> tuple[str, str] | None:
    q = query.strip()
    m = re.search(r"\s+en\s+", q, flags=re.I)
    if not m:
        return None
    rubro = q[: m.start()].strip()
    zona = q[m.end() :].strip()
    if not rubro or not zona:
        return None
    return rubro, zona


def expand_query_variants(query: str) -> list[str]:
    parts = split_rubro_zona(query)
    if not parts:
        # sin "en": expandir el texto entero como rubro
        return variants_for_rubro(query) or ([query] if query.strip() else [])
    rubro, zona = parts
    return [f"{v} en {zona}" for v in variants_for_rubro(rubro)]


def expand_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        for q in expand_query_variants(line):
            if q not in seen:
                seen.add(q)
                out.append(q)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Expandir variantes de rubro")
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--no-variants", action="store_true")
    args = ap.parse_args()
    raw = Path(args.input).read_text(encoding="utf-8").splitlines()
    if args.no_variants:
        queries = [l.strip() for l in raw if l.strip() and not l.strip().startswith("#")]
    else:
        queries = expand_lines(raw)
    Path(args.output).write_text(
        "\n".join(queries) + ("\n" if queries else ""), encoding="utf-8"
    )
    print(f"Variantes: {len([l for l in raw if l.strip()])} → {len(queries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
