#!/usr/bin/env python3
"""
Creates a staff login (Supabase Auth user + staff_profiles row).

Usage: python3 scripts/create_staff_account.py correo@ejemplo.com staff
       python3 scripts/create_staff_account.py correo@ejemplo.com admin
"""
import os
import secrets
import sys

import psycopg2
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env():
    with open(os.path.join(ROOT, ".env")) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k, v)


def main():
    if len(sys.argv) < 2:
        print("uso: python3 scripts/create_staff_account.py correo@ejemplo.com [staff|admin]")
        sys.exit(1)

    email = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else "staff"
    if role not in ("staff", "admin"):
        print("el rol debe ser 'staff' o 'admin'")
        sys.exit(1)

    load_env()
    base_url = os.environ["VITE_SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SECRET_KEY"]
    password = secrets.token_urlsafe(9)

    r = requests.post(
        f"{base_url}/auth/v1/admin/users",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "application/json",
        },
        json={"email": email, "password": password, "email_confirm": True},
    )
    if r.status_code != 200:
        print(f"error al crear cuenta: {r.status_code} {r.text}")
        sys.exit(1)

    user_id = r.json()["id"]

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        "insert into staff_profiles (id, email, role) values (%s, %s, %s)",
        (user_id, email, role),
    )
    cur.close()
    conn.close()

    print(f"Cuenta creada: {email} ({role})")
    print(f"Contraseña temporal: {password}")


if __name__ == "__main__":
    main()
