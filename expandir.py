#!/usr/bin/env python3
"""Expande consultas de zonas amplias (CABA / GBA) a una query por barrio o partido."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# 48 barrios oficiales de CABA
BARRIOS_CABA = [
    "Agronomía",
    "Almagro",
    "Balvanera",
    "Barracas",
    "Belgrano",
    "Boedo",
    "Caballito",
    "Chacarita",
    "Coghlan",
    "Colegiales",
    "Constitución",
    "Flores",
    "Floresta",
    "La Boca",
    "La Paternal",
    "Liniers",
    "Mataderos",
    "Monte Castro",
    "Monserrat",
    "Nueva Pompeya",
    "Núñez",
    "Palermo",
    "Parque Avellaneda",
    "Parque Chacabuco",
    "Parque Chas",
    "Parque Patricios",
    "Puerto Madero",
    "Recoleta",
    "Retiro",
    "Saavedra",
    "San Cristóbal",
    "San Nicolás",
    "San Telmo",
    "Vélez Sársfield",
    "Versalles",
    "Villa Crespo",
    "Villa del Parque",
    "Villa Devoto",
    "Villa General Mitre",
    "Villa Lugano",
    "Villa Luro",
    "Villa Ortúzar",
    "Villa Pueyrredón",
    "Villa Real",
    "Villa Riachuelo",
    "Villa Santa Rita",
    "Villa Soldati",
    "Villa Urquiza",
]

PARTIDOS_ZONA_NORTE = [
    "Vicente López",
    "San Isidro",
    "San Fernando",
    "Tigre",
    "Escobar",
    "Pilar",
    "José C. Paz",
    "Malvinas Argentinas",
    "San Miguel",
]

PARTIDOS_ZONA_OESTE = [
    "Morón",
    "La Matanza",
    "Tres de Febrero",
    "Hurlingham",
    "Ituzaingó",
    "Merlo",
    "Moreno",
    "General Rodríguez",
    "Marcos Paz",
]

PARTIDOS_ZONA_SUR = [
    "Avellaneda",
    "Lanús",
    "Lomas de Zamora",
    "Quilmes",
    "Berazategui",
    "Florencio Varela",
    "Almirante Brown",
    "Esteban Echeverría",
    "Ezeiza",
    "Presidente Perón",
    "San Vicente",
]

PARTIDOS_GBA = sorted(
    set(PARTIDOS_ZONA_NORTE + PARTIDOS_ZONA_OESTE + PARTIDOS_ZONA_SUR)
)

# Zona normalizada (lower, sin acentos opcionales) -> lista de localidades + sufijo de formato
# formato: "barrio" -> "{rubro} en {loc}, CABA" ; "partido" -> "{rubro} en {loc}"
ZONAS: list[tuple[re.Pattern[str], list[str], str]] = [
    (
        re.compile(
            r"^(caba|capital\s+federal|ciudad\s+(aut[oó]noma\s+)?de\s+buenos\s+aires|"
            r"ciudad\s+de\s+buenos\s+aires|c\.?\s*a\.?\s*b\.?\s*a\.?)$",
            re.I,
        ),
        BARRIOS_CABA,
        "caba",
    ),
    (
        re.compile(r"^zona\s+norte$", re.I),
        PARTIDOS_ZONA_NORTE,
        "partido",
    ),
    (
        re.compile(r"^zona\s+oeste$", re.I),
        PARTIDOS_ZONA_OESTE,
        "partido",
    ),
    (
        re.compile(r"^zona\s+sur$", re.I),
        PARTIDOS_ZONA_SUR,
        "partido",
    ),
    (
        re.compile(
            r"^(gba|gran\s+buenos\s+aires|conurbano(\s+bonaerense)?)$",
            re.I,
        ),
        PARTIDOS_GBA,
        "partido",
    ),
]


def _split_rubro_zona(query: str) -> tuple[str, str] | None:
    """Si la query es '{rubro} en {zona}', devolver (rubro, zona). Si no, None."""
    q = query.strip()
    # Última ocurrencia de " en " para no romper rubros raros
    m = re.search(r"\s+en\s+", q, flags=re.I)
    if not m:
        return None
    rubro = q[: m.start()].strip()
    zona = q[m.end() :].strip()
    if not rubro or not zona:
        return None
    return rubro, zona


def expand_query(query: str) -> list[str]:
    """Devuelve lista de queries (1 si no expandió, N si sí)."""
    q = query.strip()
    if not q:
        return []
    parts = _split_rubro_zona(q)
    if not parts:
        return [q]
    rubro, zona = parts
    for pat, locs, kind in ZONAS:
        if pat.match(zona.strip()):
            out: list[str] = []
            for loc in locs:
                if kind == "caba":
                    out.append(f"{rubro} en {loc}, CABA")
                else:
                    out.append(f"{rubro} en {loc}")
            return out
    return [q]


def expand_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        for q in expand_query(line):
            if q not in seen:
                seen.add(q)
                out.append(q)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Expandir queries de zonas amplias")
    ap.add_argument("input", help="Archivo de queries (una por línea)")
    ap.add_argument("output", help="Archivo de salida expandido")
    ap.add_argument(
        "--no-expand",
        action="store_true",
        help="Copiar tal cual (sin expandir zonas)",
    )
    args = ap.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)
    if not in_path.is_file():
        print(f"ERROR: no existe {in_path}", file=sys.stderr)
        return 1

    raw = in_path.read_text(encoding="utf-8").splitlines()
    if args.no_expand:
        queries = []
        seen: set[str] = set()
        for line in raw:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line not in seen:
                seen.add(line)
                queries.append(line)
    else:
        queries = expand_lines(raw)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(queries) + ("\n" if queries else ""), encoding="utf-8")
    print(f"Entrada: {len([l for l in raw if l.strip() and not l.strip().startswith('#')])} query(s)")
    print(f"Salida: {len(queries)} query(s) -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
