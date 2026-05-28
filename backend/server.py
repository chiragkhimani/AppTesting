"""
FastAPI mirror of the PHP/MySQL backend for the Emergent preview environment.

Mirrors the production PHP routes EXACTLY (same paths, same JSON shapes):
  Public:
    GET  /api/products.php
    GET  /api/products.php?id={id}
    POST /api/auth/login.php
  Protected (Authorization: Bearer <token>):
    GET  /api/users.php
    POST /api/users.php
    GET  /api/orders.php
    GET  /api/orders.php?user_id={id}
    POST /api/orders.php
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
import re
from typing import List, Optional
from datetime import datetime, timezone, timedelta

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

TOKEN_TTL_HOURS = 24

app = FastAPI(title="QA Demo Store API (FastAPI mirror)")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------- Password / token helpers ----------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def new_token() -> str:
    # 64 hex chars, opaque, cryptographically random
    return secrets.token_hex(32)


# ---------- Seed data ----------
SEED_USERS = [
    {"username": "standard_user",   "email": "standard@demo.test",    "first_name": "Standard",   "last_name": "User", "locked": False},
    {"username": "locked_out_user", "email": "locked@demo.test",      "first_name": "Locked Out", "last_name": "User", "locked": True},
    {"username": "problem_user",    "email": "problem@demo.test",     "first_name": "Problem",    "last_name": "User", "locked": False},
]

SEED_PRODUCTS = [
    {"id": 1, "name": "Sauce Labs Backpack",
     "description": "Carry.allTheThings() with this sleek, streamlined backpack. Padded laptop sleeve, water bottle pocket, and stylish design.",
     "price": 29.99, "category": "Bags", "stock": 25,
     "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80"},
    {"id": 2, "name": "Sauce Labs Bike Light",
     "description": "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes.",
     "price": 9.99, "category": "Accessories", "stock": 100,
     "image_url": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80"},
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


async def _next_id(collection: str) -> int:
    last = await db[collection].find_one({}, sort=[("id", -1)])
    return (last["id"] + 1) if last else 1


@app.on_event("startup")
async def seed_database():
    # If users exist but lack the new schema (email/password_hash), reset.
    sample = await db.users.find_one({})
    if sample and ("email" not in sample or "password_hash" not in sample):
        logger.info("Migrating users to v2 schema – dropping old users + tokens")
        await db.users.drop()
        await db.auth_tokens.drop()
        sample = None

    if sample is None:
        hashed = hash_password("secret_sauce")
        docs = []
        for i, u in enumerate(SEED_USERS, start=1):
            docs.append({
                "id": i,
                "username": u["username"],
                "email": u["email"],
                "password_hash": hashed,
                "first_name": u["first_name"],
                "last_name": u["last_name"],
                "locked": u["locked"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db.users.insert_many(docs)
        logger.info("Seeded %d users", len(docs))

    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([dict(p) for p in SEED_PRODUCTS])
        logger.info("Seeded products")

    await db.auth_tokens.create_index("token", unique=True)
    await db.users.create_index("username", unique=True)


# ---------- Pydantic models ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=60)
    email: str
    password: str = Field(min_length=4)
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class OrderRequest(BaseModel):
    first_name: str
    last_name: str
    address: str
    city: str
    zipcode: str
    items: List[OrderItemIn]


# ---------- Helpers ----------
def _user_public(u: dict) -> dict:
    return {
        "id": u["id"],
        "username": u["username"],
        "email": u.get("email", ""),
        "first_name": u.get("first_name", ""),
        "last_name": u.get("last_name", ""),
        "locked": bool(u.get("locked", False)),
        "created_at": u.get("created_at"),
    }


async def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    row = await db.auth_tokens.find_one({"token": token})
    if not row:
        raise HTTPException(status_code=401, detail="Invalid token")
    if row["expires_at"] < datetime.now(timezone.utc).isoformat():
        await db.auth_tokens.delete_one({"token": token})
        raise HTTPException(status_code=401, detail="Token expired")
    user = await db.users.find_one({"id": row["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"message": "QA Demo Store API – mirror of PHP backend"}


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


@api_router.post("/auth/login.php")
async def auth_login(payload: LoginRequest):
    user = await db.users.find_one({"username": payload.username})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Username and password do not match any user in this service")
    if user.get("locked"):
        raise HTTPException(status_code=403, detail="Sorry, this user has been locked out.")

    token = new_token()
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)).isoformat()
    await db.auth_tokens.insert_one({
        "token": token,
        "user_id": user["id"],
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "token": token,
        "expires_at": expires_at,
        "user": _user_public(user),
    }


# ---------- Protected routes ----------
@api_router.get("/users.php")
async def list_users(_: dict = Depends(current_user)):
    rows = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    rows.sort(key=lambda x: x["id"])
    return {"users": rows}


@api_router.post("/users.php", status_code=201)
async def create_user(payload: CreateUserRequest, _: dict = Depends(current_user)):
    if await db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    new_id = await _next_id("users")
    doc = {
        "id": new_id,
        "username": payload.username,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "first_name": payload.first_name or payload.username,
        "last_name": payload.last_name or "",
        "locked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    return {"user": _user_public(doc)}


@api_router.get("/orders.php")
async def list_orders(user_id: Optional[int] = None, _: dict = Depends(current_user)):
    query = {"user_id": user_id} if user_id is not None else {}
    rows = await db.orders.find(query, {"_id": 0}).to_list(1000)
    rows.sort(key=lambda x: x["id"], reverse=True)
    return {"orders": rows}


@api_router.post("/orders.php", status_code=201)
async def create_order(order: OrderRequest, user: dict = Depends(current_user)):
    if not order.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # SERVER-SIDE total: look up every product's price in DB.
    server_items = []
    total = 0.0
    for item in order.items:
        p = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=400, detail=f"Unknown product id {item.product_id}")
        line_total = round(float(p["price"]) * item.quantity, 2)
        total += line_total
        server_items.append({
            "product_id": p["id"],
            "name": p["name"],
            "price": float(p["price"]),
            "quantity": item.quantity,
        })

    total = round(total, 2)
    new_id = await _next_id("orders")
    doc = {
        "id": new_id,
        "user_id": user["id"],
        "first_name": order.first_name,
        "last_name": order.last_name,
        "address": order.address,
        "city": order.city,
        "zipcode": order.zipcode,
        "total": total,
        "items": server_items,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(doc)
    return {"success": True, "order_id": new_id, "total": total}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
