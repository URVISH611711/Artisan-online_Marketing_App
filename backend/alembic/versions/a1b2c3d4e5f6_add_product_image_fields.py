"""Add image_type, storage_path, user_id, is_primary to product_images

Revision ID: a1b2c3d4e5f6
Revises: f6931705041d
Create Date: 2026-08-29

NOTE: This migration only adds new nullable columns to the existing
product_images table. No existing rows or columns are modified.
The live schema was created from schema.sql (not alembic), so we
use down_revision = 'f6931705041d' (the only existing migration).
Do NOT attempt to autogenerate a baseline — that is a separate cleanup.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f6931705041d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the imagetype enum in Postgres first
    imagetype_enum = postgresql.ENUM(
        'original', 'transparent', 'mask', 'final', 'hero', 'alternate', 'lifestyle',
        name='imagetype',
        create_type=False,
    )
    imagetype_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'product_images',
        sa.Column('image_type', sa.Enum(
            'original', 'transparent', 'mask', 'final', 'hero', 'alternate', 'lifestyle',
            name='imagetype',
        ), nullable=True, server_default='original'),
    )
    op.add_column(
        'product_images',
        sa.Column('storage_path', sa.String(1024), nullable=True),
    )
    op.add_column(
        'product_images',
        sa.Column(
            'user_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
    )
    op.add_column(
        'product_images',
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_index('ix_product_images_user_id', 'product_images', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_product_images_user_id', table_name='product_images')
    op.drop_column('product_images', 'is_primary')
    op.drop_column('product_images', 'user_id')
    op.drop_column('product_images', 'storage_path')
    op.drop_column('product_images', 'image_type')
    # Drop the enum type
    op.execute("DROP TYPE IF EXISTS imagetype")
