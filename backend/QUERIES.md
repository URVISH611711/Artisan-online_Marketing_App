# Artisan-AI — Core SQL & ORM Queries

This document contains the critical CRUD queries, Marketplace search queries, and Sales aggregation queries written in both raw PostgreSQL and SQLAlchemy ORM format.

## 1. User System

### Find user by phone (Login)
**SQL:**
```sql
SELECT * FROM users WHERE phone = '+919876543210' AND deleted_at IS NULL;
```
**SQLAlchemy:**
```python
db.query(User).filter(User.phone == phone, User.deleted_at.is_(None)).first()
```

## 2. Product System

### Create Product Draft (Initial Voice Step)
**SQL:**
```sql
INSERT INTO product_drafts (id, user_id, current_step, draft_data, created_at, updated_at) 
VALUES ('uuid', 'user_uuid', 'voice_recorded', '{"transcript": "..."}', NOW(), NOW());
```
**SQLAlchemy:**
```python
draft = ProductDraft(user_id=user.id, current_step="voice_recorded", draft_data={"transcript": "..."})
db.add(draft)
db.commit()
```

### Get Artisan's Products with Images (ProductsScreen)
**SQL:**
```sql
SELECT p.*, pi.url 
FROM products p 
LEFT JOIN product_images pi ON p.id = pi.product_id 
WHERE p.artisan_id = 'artisan_uuid' AND p.deleted_at IS NULL 
ORDER BY p.created_at DESC;
```
**SQLAlchemy:**
```python
db.query(Product).options(joinedload(Product.images)).filter(
    Product.artisan_id == artisan_id,
    Product.deleted_at.is_(None)
).order_by(Product.created_at.desc()).all()
```

## 3. Marketplace & Search

### Full-Text Search with Filters (SearchResultsScreen)
**SQL:**
```sql
SELECT p.id, p.name, p.price, a.business_name
FROM products p
JOIN artisan_profiles a ON p.artisan_id = a.user_id
LEFT JOIN product_keywords pk ON p.id = pk.product_id
WHERE p.status = 'published'
  AND p.deleted_at IS NULL
  AND p.category_id = 'category_uuid'
  AND (p.name ILIKE '%saree%' OR pk.keyword ILIKE '%saree%')
GROUP BY p.id, a.business_name
ORDER BY p.views DESC
LIMIT 20 OFFSET 0;
```
**SQLAlchemy:**
```python
query = db.query(Product).join(ArtisanProfile).outerjoin(ProductKeyword).filter(
    Product.status == ProductStatus.PUBLISHED,
    Product.deleted_at.is_(None)
)

if category_id:
    query = query.filter(Product.category_id == category_id)
if search_term:
    search = f"%{search_term}%"
    query = query.filter(or_(Product.name.ilike(search), ProductKeyword.keyword.ilike(search)))

return query.group_by(Product.id).order_by(Product.views.desc()).limit(20).offset(0).all()
```

## 4. Inventory Management

### Reserve Stock (Transaction safe)
**SQL:**
```sql
UPDATE inventory 
SET available_quantity = available_quantity - 5,
    reserved_quantity = reserved_quantity + 5
WHERE product_id = 'product_uuid' AND available_quantity >= 5;
```
**SQLAlchemy:**
```python
# Using with_for_update() to prevent race conditions (Row-Level Locking)
inventory = db.query(Inventory).filter(Inventory.product_id == product_id).with_for_update().first()
if inventory.available_quantity >= requested_quantity:
    inventory.available_quantity -= requested_quantity
    inventory.reserved_quantity += requested_quantity
    db.commit()
```

## 5. Sales & Analytics

### Monthly Sales Aggregation (SalesScreen)
**SQL:**
```sql
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    SUM(total_amount) as revenue,
    COUNT(id) as total_orders
FROM orders 
WHERE artisan_id = 'artisan_uuid' AND status = 'completed'
GROUP BY month 
ORDER BY month DESC;
```
**SQLAlchemy:**
```python
from sqlalchemy import func

db.query(
    func.date_trunc('month', Order.created_at).label('month'),
    func.sum(Order.total_amount).label('revenue'),
    func.count(Order.id).label('total_orders')
).filter(
    Order.artisan_id == artisan_id,
    Order.status == OrderStatus.COMPLETED
).group_by('month').order_by(desc('month')).all()
```

### AI Business Insights (InsightsScreen)
**SQL:**
```sql
SELECT * FROM business_insights 
WHERE artisan_id = 'artisan_uuid' 
  AND is_read = FALSE 
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY severity DESC, created_at DESC;
```
