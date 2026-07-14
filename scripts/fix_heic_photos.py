#!/usr/bin/env python3
"""
Last-mile fix for the 2 participants whose Drive photo is HEIC, which PIL
can't decode without pillow_heif's opener registered.
"""
import io
import os
import re

import psycopg2
import pillow_heif
import requests
from PIL import Image

pillow_heif.register_heif_opener()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKET = "photos"


def load_env():
    with open(os.path.join(ROOT, ".env")) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k, v)


def drive_id_from_url(url):
    m = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", url)
    return m.group(1) if m else None


def download_and_normalize(drive_id):
    r = requests.get(
        f"https://drive.google.com/uc?export=view&id={drive_id}",
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=20,
    )
    r.raise_for_status()
    img = Image.open(io.BytesIO(r.content)).convert("RGB")
    img.thumbnail((500, 500), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82, optimize=True)
    return buf.getvalue()


def upload(base_url, service_key, path, data):
    r = requests.post(
        f"{base_url}/storage/v1/object/{BUCKET}/{path}",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        },
        data=data,
        timeout=30,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"upload failed: {r.status_code} {r.text}")


def main():
    load_env()
    base_url = os.environ["VITE_SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SECRET_KEY"]

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        "select id, qr_code, full_name, photo_url from participants where photo_url like %s",
        ("%drive.google%",),
    )
    rows = cur.fetchall()
    print(f"Pendientes: {len(rows)}")

    for pid, qr_code, full_name, photo_url in rows:
        drive_id = drive_id_from_url(photo_url)
        path = f"{qr_code}.jpg"
        public_url = f"{base_url}/storage/v1/object/public/{BUCKET}/{path}"
        try:
            data = download_and_normalize(drive_id)
            upload(base_url, service_key, path, data)
            cur.execute("update participants set photo_url = %s where id = %s", (public_url, pid))
            print(f"  ok: {full_name}")
        except Exception as e:
            print(f"  FALLO: {full_name}: {e}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
