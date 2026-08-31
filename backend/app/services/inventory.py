"""Inventory ↔ product-status reconciliation.

The marketplace shows products whose status is PUBLISHED (in stock) or
OUT_OF_STOCK (visible but not purchasable). The database is the single source
of truth for both the stock level and purchasability, so whenever stock changes
we must keep ``Product.status`` consistent with it — automatically, and never
from a value sent by the client.

Rules (intentionally minimal — this is standard e-commerce behavior):
  * PUBLISHED    and stock hits 0  → OUT_OF_STOCK  (auto de-list from buying)
  * OUT_OF_STOCK and stock  > 0    → PUBLISHED     (auto re-list on restock)
  * DRAFT / PROCESSING / READY / ARCHIVED are never touched — a product that
    was never published must not become purchasable just because it has stock,
    and an archived product must stay hidden.
"""
from app.models.product import Product, ProductStatus


def reconcile_availability(product: Product, available: int) -> None:
    """Toggle a product between PUBLISHED and OUT_OF_STOCK based on real stock.

    Mutates ``product.status`` in place; the caller owns the transaction/commit.
    """
    if product.status == ProductStatus.PUBLISHED and available <= 0:
        product.status = ProductStatus.OUT_OF_STOCK
    elif product.status == ProductStatus.OUT_OF_STOCK and available > 0:
        product.status = ProductStatus.PUBLISHED
