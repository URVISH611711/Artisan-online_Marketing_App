import requests

r = requests.get("http://localhost:8000/api/v1/products/marketplace?sort_by=popular")
print("Status:", r.status_code)
if r.status_code == 200:
    for p in r.json():
        print(f"Product: {p['name']} - Orders: {p.get('orders')}")
else:
    print(r.text)
