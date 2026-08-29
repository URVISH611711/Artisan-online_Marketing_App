"""
Case-insensitive coercion of client-supplied strings into model enums.

Model enums store lowercase values (``ProductStatus.DRAFT == "draft"``) while
clients variously send ``"draft"``, ``"DRAFT"`` or ``"Draft"``. The original
call sites did ``ProductStatus(value.upper())``, which could only ever raise —
``"DRAFT"`` is not a valid *value* of the enum, only a member *name*. That made
every status transition return HTTP 400, so a product could never move from
DRAFT to PUBLISHED.
"""
from enum import Enum
from typing import Optional, Type, TypeVar

E = TypeVar("E", bound=Enum)


def coerce_enum(enum_cls: Type[E], value: object) -> Optional[E]:
    """
    Resolve ``value`` to a member of ``enum_cls``, or ``None`` if nothing matches.

    Returns ``None`` rather than raising so callers choose the failure mode: a
    filter can ignore an unknown value, while a mutation can turn it into a 400.

    Resolution order: exact value, lowercased value, then member name
    (so ``"OUT_OF_STOCK"`` finds the member whose value is ``"out_of_stock"``).
    """
    if isinstance(value, enum_cls):
        return value
    if not isinstance(value, str):
        return None

    raw = value.strip()
    if not raw:
        return None

    for candidate in (raw, raw.lower()):
        try:
            return enum_cls(candidate)
        except ValueError:
            pass

    return enum_cls.__members__.get(raw.upper())
