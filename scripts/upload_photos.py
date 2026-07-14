#!/usr/bin/env python3
"""
Downloads each participant's photo from Google Drive (hotlinking doesn't
work reliably as <img src> — confirmed by testing) and re-uploads it to a
public Supabase Storage bucket, then points photo_url at the new stable URL.

Run: python3 scripts/upload_photos.py
"""
import os
import re
import io

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


def ensure_bucket(base_url, service_key):
    r = requests.post(
        f"{base_url}/storage/v1/bucket",
        headers={"Authorization": f"Bearer {service_key}", "apikey": service_key},
        json={"id": BUCKET, "name": BUCKET, "public": True},
    )
    if r.status_code not in (200, 201) and "already exists" not in r.text:
        raise RuntimeError(f"bucket create failed: {r.status_code} {r.text}")


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
    if "image" not in r.headers.get("content-type", ""):
        raise ValueError(f"unexpected content-type: {r.headers.get('content-type')}")

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
    return f"{base_url}/storage/v1/object/public/{BUCKET}/{path}"


def main():
    load_env()
    base_url = os.environ["VITE_SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SECRET_KEY"]

    ensure_bucket(base_url, service_key)

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("select id, qr_code, full_name, photo_url from participants where photo_url is not null")
    rows = cur.fetchall()

    ok, failed = 0, []
    for pid, qr_code, full_name, photo_url in rows:
        drive_id = drive_id_from_url(photo_url)
        if not drive_id:
            failed.append((full_name, "url sin id de drive"))
            continue
        try:
            data = download_and_normalize(drive_id)
            public_url = upload(base_url, service_key, f"{qr_code}.jpg", data)
            cur.execute("update participants set photo_url = %s where id = %s", (public_url, pid))
            conn.commit()
            ok += 1
        except Exception as e:
            failed.append((full_name, str(e)[:120]))

    print(f"Subidas: {ok} / {len(rows)}")
    if failed:
        print(f"\n{len(failed)} fallaron:")
        for name, reason in failed:
            print(f"  - {name}: {reason}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
