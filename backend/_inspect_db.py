"""Throwaway DB inspection — deleted after use. Prints no secrets."""
from app.database.connection import engine
from sqlalchemy import text

with engine.connect() as c:
    try:
        v = c.execute(text("SELECT version_num FROM alembic_version")).scalar()
    except Exception as e:
        v = f"ERR {e}"
    print("alembic_version:", v)

    for typ in ("productstatus", "orderstatus"):
        try:
            labels = c.execute(text(
                "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid "
                "WHERE t.typname=:t ORDER BY enumsortorder"
            ), {"t": typ}).fetchall()
            print(f"{typ} labels:", [r[0] for r in labels])
        except Exception as e:
            print(f"{typ} enum err:", e)

    try:
        cols = c.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='order_items' ORDER BY ordinal_position"
        )).fetchall()
        print("order_items cols:", [r[0] for r in cols])
    except Exception as e:
        print("order_items cols err:", e)

    try:
        art_nullable = c.execute(text(
            "SELECT is_nullable FROM information_schema.columns WHERE table_name='orders' AND column_name='artisan_id'"
        )).scalar()
        print("orders.artisan_id is_nullable:", art_nullable)
    except Exception as e:
        print("artisan_id nullable err:", e)

    for tbl in ("users", "products", "inventory", "orders", "order_items"):
        try:
            n = c.execute(text(f"SELECT count(*) FROM {tbl}")).scalar()
            print(f"{tbl} count:", n)
        except Exception as e:
            print(f"{tbl} count err:", e)
