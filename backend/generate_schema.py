import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql
from sqlalchemy import create_mock_engine

from app.models import Base

def dump(sql, *multiparams, **params):
    print(sql.compile(dialect=postgresql.dialect()), ";")

engine = create_mock_engine('postgresql://', dump)

with open('schema.sql', 'w') as f:
    # Redirect stdout to file to capture the printed SQL
    sys.stdout = f
    Base.metadata.create_all(engine, checkfirst=False)
    sys.stdout = sys.__stdout__
    print("Schema successfully generated to schema.sql")
