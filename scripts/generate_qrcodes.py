#!/usr/bin/env python3
"""
Generates one PNG QR code per participant, pointing to their public profile
page. Files are named after the person's email and split into two folders
by role.

Run: python3 scripts/generate_qrcodes.py
Requires DATABASE_URL in .env.
"""
import os
import re

import psycopg2
import qrcode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://pazmun-tracker.vercel.app"
OUT_DIR = os.path.join(ROOT, "inputs", "qr_codes")
COMITE_DIR = os.path.join(OUT_DIR, "comite")
RESTO_DIR = os.path.join(OUT_DIR, "delegados_pajes_asesores")


def load_env():
    env_path = os.path.join(ROOT, ".env")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k, v)


def safe_filename(value):
    return re.sub(r"[^A-Za-z0-9@._-]", "_", value)


def main():
    load_env()
    db_url = os.environ["DATABASE_URL"]

    os.makedirs(COMITE_DIR, exist_ok=True)
    os.makedirs(RESTO_DIR, exist_ok=True)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("select full_name, role, email, qr_code from participants order by role, full_name")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    used_names = {}
    used_name_fallback = []
    generated = 0

    for full_name, role, email, qr_code in rows:
        if email:
            base = safe_filename(email)
        else:
            base = safe_filename(full_name)
            used_name_fallback.append(full_name)

        folder = COMITE_DIR if role == "autoridad" else RESTO_DIR
        count = used_names.get(base, 0)
        used_names[base] = count + 1
        filename = f"{base}.png" if count == 0 else f"{base}-{count + 1}.png"

        url = f"{BASE_URL}/p/{qr_code}"
        img = qrcode.make(url, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=3)
        img.save(os.path.join(folder, filename))
        generated += 1

    print(f"Generados {generated} PNG en:")
    print(f"  {COMITE_DIR}")
    print(f"  {RESTO_DIR}")

    dupes = {k: v for k, v in used_names.items() if v > 1}
    if dupes:
        print(f"\n{len(dupes)} emails repetidos (se generaron con sufijo -2, revisar si son la misma persona o un error de registro):")
        for base, count in dupes.items():
            print(f"  - {base} ({count} personas)")

    if used_name_fallback:
        print(f"\n{len(used_name_fallback)} personas sin email — se usó su nombre como nombre de archivo:")
        for name in used_name_fallback:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
