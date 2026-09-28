from typing import Optional, List, Tuple, Type, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from fastapi import HTTPException, status
from app.db.base import Base


class DuplicateMasterItemException(Exception):
    def __init__(self, message: str = "An option with this name already exists in this category."):
        self.message = message
        super().__init__(self.message)


def list_master_items(
    model: Type[Base],
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    item_name: Optional[str] = None,
    is_active: Optional[bool] = True,
    sort_by: str = "sort_order",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[Any], int]:
    query = db.query(model)

    # Status filter
    if is_active is not None:
        query = query.filter(model.is_active == is_active)

    # Category filter (for Symptom, NeurologicalExamOption, DiagnosticTest)
    if category and hasattr(model, "category") and category.lower() != "all":
        query = query.filter(model.category.ilike(category.strip()))

    # Item name filter (for NeurologicalExamOption)
    if item_name and hasattr(model, "item_name"):
        query = query.filter(model.item_name.ilike(item_name.strip()))

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        search_filters = [model.name.ilike(term)]

        # Search additional fields if present on model
        if hasattr(model, "category"):
            search_filters.append(model.category.ilike(term))
        if hasattr(model, "item_name"):
            search_filters.append(model.item_name.ilike(term))
        if hasattr(model, "generic_name"):
            search_filters.append(model.generic_name.ilike(term))
        if hasattr(model, "urdu_label"):
            search_filters.append(model.urdu_label.ilike(term))
        if hasattr(model, "roman_urdu"):
            search_filters.append(model.roman_urdu.ilike(term))

        query = query.filter(or_(*search_filters))

    total = query.count()

    # Sorting: primary sort column, secondary sort by name
    primary_col = getattr(model, sort_by, getattr(model, "sort_order", model.name))
    if sort_order.lower() == "desc":
        query = query.order_by(desc(primary_col), asc(model.name))
    else:
        query = query.order_by(asc(primary_col), asc(model.name))

    # Pagination
    offset = max(0, (page - 1) * page_size)
    items = query.offset(offset).limit(page_size).all()

    return items, total


def get_master_item(model: Type[Base], db: Session, item_id: int) -> Optional[Any]:
    return db.query(model).filter(model.id == item_id).first()


def create_master_item(
    model: Type[Base],
    db: Session,
    data: dict,
    created_by_id: Optional[int] = None
) -> Any:
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Option name cannot be empty."
        )

    # Duplicate check within same category/item if applicable
    dup_query = db.query(model).filter(model.name.ilike(name))
    if "category" in data and hasattr(model, "category") and data.get("category"):
        dup_query = dup_query.filter(model.category.ilike(data["category"].strip()))
    if "item_name" in data and hasattr(model, "item_name") and data.get("item_name"):
        dup_query = dup_query.filter(model.item_name.ilike(data["item_name"].strip()))

    existing = dup_query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An option with name '{name}' already exists in this category."
        )

    item_data = dict(data)
    item_data["name"] = name
    if "created_by_id" in [c.name for c in model.__table__.columns]:
        item_data["created_by_id"] = created_by_id

    item = model(**item_data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_master_item(
    model: Type[Base],
    db: Session,
    item_id: int,
    data: dict
) -> Optional[Any]:
    item = get_master_item(model, db, item_id)
    if not item:
        return None

    # If name is being changed, check for duplicate
    if "name" in data and data["name"] is not None:
        new_name = data["name"].strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Option name cannot be empty."
            )
        dup_query = db.query(model).filter(
            model.name.ilike(new_name),
            model.id != item_id
        )
        cat = data.get("category") or getattr(item, "category", None)
        if cat and hasattr(model, "category"):
            dup_query = dup_query.filter(model.category.ilike(cat.strip()))
        
        item_n = data.get("item_name") or getattr(item, "item_name", None)
        if item_n and hasattr(model, "item_name"):
            dup_query = dup_query.filter(model.item_name.ilike(item_n.strip()))

        if dup_query.first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An option with name '{new_name}' already exists in this category."
            )
        setattr(item, "name", new_name)

    # Update other fields
    for field, val in data.items():
        if field not in ("id", "name") and val is not None and hasattr(item, field):
            if isinstance(val, str):
                setattr(item, field, val.strip())
            else:
                setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return item


def set_master_item_status(
    model: Type[Base],
    db: Session,
    item_id: int,
    is_active: bool
) -> Optional[Any]:
    item = get_master_item(model, db, item_id)
    if not item:
        return None
    item.is_active = is_active
    db.commit()
    db.refresh(item)
    return item
