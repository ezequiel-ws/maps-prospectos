#!/usr/bin/env python3
"""Agrupa queries en batches para amortizar Docker/Chrome. Máx ~20 jobs."""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

SEP = "|||"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("queries_file")
    ap.add_argument("matrix_out")
    ap.add_argument("--max-jobs", type=int, default=20)
    ap.add_argument("--batch", type=int, default=4, help="queries por job (ideal 3-5)")
    args = ap.parse_args()

    lines = [
        l.strip()
        for l in Path(args.queries_file).read_text(encoding="utf-8").splitlines()
        if l.strip() and not l.strip().startswith("#")
    ]
    n = len(lines)
    if n == 0:
        Path(args.matrix_out).write_text("[]\n", encoding="utf-8")
        print("0")
        return 0

    batch = max(1, args.batch)
    jobs = math.ceil(n / batch)
    if jobs > args.max_jobs:
        batch = math.ceil(n / args.max_jobs)
        jobs = math.ceil(n / batch)

    matrix = []
    for i in range(0, n, batch):
        chunk = lines[i : i + batch]
        matrix.append({"i": len(matrix), "q": SEP.join(chunk), "n": len(chunk)})

    Path(args.matrix_out).write_text(
        json.dumps(matrix, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(
        f"Batch: {n} queries → {len(matrix)} jobs (batch≈{batch}, max={args.max_jobs})",
        file=sys.stderr,
    )
    print(len(matrix))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
