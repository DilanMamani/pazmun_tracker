#!/usr/bin/env python3
"""
Repairs participants whose photo made it to Supabase Storage (or didn't)
but whose DB row still points at the old Drive link, after the previous
run's DB connection dropped mid-way. Checks Storage first (cheap) before
re-downloading from Drive. Reconnects to Postgres on any connection error.
"""
import io
import os
import re
import subprocess
import tempfile

import psycopg2
import requests
from PIL import Image

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


def storage_exists(base_url, path):
    r = requests.head(f"{base_url}/storage/v1/object/public/{BUCKET}/{path}", timeout=10)
    return r.status_code == 200


def pdf_first_page_to_jpeg_bytes(pdf_bytes):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "in.pdf")
        out_prefix = os.path.join(tmp, "out")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        subprocess.run(
            ["pdftoppm", "-jpeg", "-r", "150", "-f", "1", "-l", "1", pdf_path, out_prefix],
            check=True, capture_output=True,
        )
        out_file = out_prefix + "-1.jpg"
        if not os.path.exists(out_file):
            out_file = out_prefix + ".jpg"
        with open(out_file, "rb") as f:
            return f.read()


def download_and_normalize(drive_id):
    r = requests.get(
        f"https://drive.google.com/uc?export=view&id={drive_id}",
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=20,
    )
    r.raise_for_status()
    content = r.content

    if content[:4] == b"%PDF":
        content = pdf_first_page_to_jpeg_bytes(content)
    elif "image" not in r.headers.get("content-type", ""):
        raise ValueError(f"unexpected content-type: {r.headers.get('content-type')}")

    img = Image.open(io.BytesIO(content)).convert("RGB")
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


def connect(db_url):
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    return conn


def main():
    load_env()
    base_url = os.environ["VITE_SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SECRET_KEY"]
    db_url = os.environ["DATABASE_URL"]

    conn = connect(db_url)
    cur = conn.cursor()
    cur.execute(
        "select id, qr_code, full_name, photo_url from participants where photo_url like %s",
        ("%drive.google%",),
    )
    rows = cur.fetchall()
    print(f"Pendientes: {len(rows)}")

    ok, failed = 0, []
    for pid, qr_code, full_name, photo_url in rows:
        path = f"{qr_code}.jpg"
        public_url = f"{base_url}/storage/v1/object/public/{BUCKET}/{path}"
        try:
            if not storage_exists(base_url, path):
                drive_id = drive_id_from_url(photo_url)
                if not drive_id:
                    failed.append((full_name, "sin id de drive"))
                    continue
                data = download_and_normalize(drive_id)
                upload(base_url, service_key, path, data)

            for attempt in range(2):
                try:
                    cur.execute("update participants set photo_url = %s where id = %s", (public_url, pid))
                    break
                except (psycopg2.InterfaceError, psycopg2.OperationalError):
                    conn = connect(db_url)
                    cur = conn.cursor()
            ok += 1
        except Exception as e:
            failed.append((full_name, str(e)[:120]))

    print(f"Reparadas: {ok} / {len(rows)}")
    if failed:
        print(f"\n{len(failed)} fallaron de nuevo:")
        for name, reason in failed:
            print(f"  - {name}: {reason}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
