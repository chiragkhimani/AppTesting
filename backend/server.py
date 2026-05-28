"""
FastAPI mirror of the PHP/MySQL backend used for local preview & QA in this environment.

IMPORTANT: This file is ONLY for preview inside the Emergent sandbox so the React
frontend can be tested live. The real production backend is PHP + MySQL and lives
in /app/hostinger-deploy/api/. The endpoint contract (paths, request bodies,
response shapes) here mirrors the PHP endpoints exactly so the same frontend
works against both.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="QA Demo Store API (FastAPI mirror)")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Seed data (mirrors /app/hostinger-deploy/sql/seed.sql) ----------
SEED_USERS = [
    {"id": 1, "username": "standard_user", "password": "secret_sauce",
     "first_name": "Standard", "last_name": "User", "locked": False},
    {"id": 2, "username": "locked_out_user", "password": "secret_sauce",
     "first_name": "Locked Out", "last_name": "User", "locked": True},
    {"id": 3, "username": "problem_user", "password": "secret_sauce",
     "first_name": "Problem", "last_name": "User", "locked": False},
]

SEED_PRODUCTS = [
    {"id": 1, "name": "Sauce Labs Backpack",
     "description": "Carry.allTheThings() with this sleek, streamlined backpack. Padded laptop sleeve, water bottle pocket, and stylish design.",
     "price": 29.99, "category": "Bags", "stock": 25,
     "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80"},
    {"id": 2, "name": "Sauce Labs Bike Light",
     "description": "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes.",
     "price": 9.99, "category": "Accessories", "stock": 100,
     "image_url": "https://images.unsplash.com/photo-1544191696-15693072e0b5?w=600&q=80"},
    {"id": 3, "name": "Sauce Labs Bolt T-Shirt",
     "description": "Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray.",
     "price": 15.99, "category": "Apparel", "stock": 50,
     "image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80"},
    {"id": 4, "name": "Sauce Labs Fleece Jacket",
     "description": "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
     "price": 49.99, "category": "Apparel", "stock": 30,
     "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80"},
    {"id": 5, "name": "Sauce Labs Onesie",
     "description": "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeves.",
     "price": 7.99, "category": "Apparel", "stock": 80,
     "image_url": "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80"},
    {"id": 6, "name": "Test.allTheThings() T-Shirt (Red)",
     "description": "This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.",
     "price": 15.99, "category": "Apparel", "stock": 40,
     "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80"},
]


@app.on_event("startup")
async def seed_database():
    if await db.users.count_documents({}) == 0:
        await db.users.insert_many([dict(u) for u in SEED_USERS])
        logger.info("Seeded users")
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([dict(p) for p in SEED_PRODUCTS])
        logger.info("Seeded products")


# ---------- Pydantic models ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class OrderItemIn(BaseModel):
    product_id: int
    name: str
    price: float
    quantity: int


class OrderRequest(BaseModel):
    user_id: Optional[int] = None
    first_name: str
    last_name: str
    address: str
    city: str
    zipcode: str
    items: List[OrderItemIn]
    total: float


# ---------- Helpers ----------
def _clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


def _user_public(u: dict) -> dict:
    return {
        "id": u["id"],
        "username": u["username"],
        "first_name": u["first_name"],
        "last_name": u["last_name"],
        "locked": bool(u.get("locked", False)),
    }


# ---------- Routes (mirror PHP endpoints, including .php suffix) ----------
@api_router.get("/")
async def root():
    return {"message": "QA Demo Store API – mirror of PHP backend"}


@api_router.post("/login.php")
async def login(payload: LoginRequest):
    user = await db.users.find_one({"username": payload.username})
    if not user or user.get("password") != payload.password:
        raise HTTPException(status_code=401, detail="Username and password do not match any user in this service")
    if user.get("locked"):
        raise HTTPException(status_code=403, detail="Sorry, this user has been locked out.")
    return {"success": True, "user": _user_public(user)}


@api_router.get("/users.php")
async def list_users():
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return {"users": users}


@api_router.get("/products.php")
async def list_products(id: Optional[int] = None):
    if id is not None:
        p = await db.products.find_one({"id": id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"product": p}
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    products.sort(key=lambda x: x["id"])
    return {"products": products}


@api_router.post("/orders.php")
async def create_order(order: OrderRequest):
    if not order.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    last = await db.orders.find_one({}, sort=[("id", -1)])
    next_id = (last["id"] + 1) if last else 1

    doc = {
        "id": next_id,
        "user_id": order.user_id,
        "first_name": order.first_name,
        "last_name": order.last_name,
        "address": order.address,
        "city": order.city,
        "zipcode": order.zipcode,
        "total": round(order.total, 2),
        "items": [i.model_dump() for i in order.items],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(doc)
    return {"success": True, "order_id": next_id, "total": doc["total"]}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
