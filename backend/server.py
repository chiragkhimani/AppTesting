"""
FastAPI mirror of the PHP/MySQL backend for local development.

v4 routes:
  Public:
    GET  /api/products
    GET  /api/products?id={id}
    POST /api/auth/login
    POST /api/auth/forgot-password
    POST /api/signup
  Protected (Authorization: Bearer <token>):
    GET  /api/profile
    GET  /api/orders
    GET  /api/orders?user_id={id}
    POST /api/orders
    POST /api/cancel-order
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import re
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

TOKEN_TTL_HOURS = 24
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[+\d][\d\s\-()]{5,19}$")

# Match frontend checkoutPricing.js / PHP orders.php
TAX_RATE = 0.08
SHIPPING_FLAT = 5.99
FREE_SHIPPING_MIN = 100.0


def order_pricing(subtotal: float) -> dict:
    subtotal = round(float(subtotal), 2)
    shipping = 0.0 if subtotal >= FREE_SHIPPING_MIN else SHIPPING_FLAT
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + shipping + tax, 2)
    return {
        "subtotal": subtotal,
        "shipping": round(shipping, 2),
        "tax": tax,
        "total": total,
    }

OPENAPI_TAGS = [
    {"name": "Public", "description": "No authentication required."},
    {"name": "Auth", "description": "Login and account registration."},
    {"name": "Protected", "description": "Requires `Authorization: Bearer <token>` from login."},
]

app = FastAPI(
    title="QA Demo Store API",
    description=(
        "REST API for the QA Demo Store (v4). Mirror of the PHP/MySQL backend for preview/dev.\n\n"
        "**Authentication:** Call `POST /api/auth/login` to obtain a Bearer token (64 hex chars, 24h TTL). "
        "Send it on protected routes as `Authorization: Bearer <token>`.\n\n"
    ),
    version="4.0.0",
    openapi_tags=OPENAPI_TAGS,
)
api_router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False, description="Opaque token from POST /api/auth/login")

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
    return secrets.token_hex(32)


# ---------- Seed data ----------
SEED_USERS = [
    {"username": "standard_user",   "email": "standard@demo.test",    "first_name": "Standard",   "last_name": "User", "locked": False},
    {"username": "locked_out_user", "email": "locked@demo.test",      "first_name": "Locked Out", "last_name": "User", "locked": True},
    {"username": "problem_user",    "email": "problem@demo.test",     "first_name": "Problem",    "last_name": "User", "locked": False},
]

SEED_PRODUCTS = [
    {"id": 1, "name": "Urban Commute Backpack",
     "description": "A slim 20L everyday backpack with a padded 15-inch laptop sleeve, water-resistant exterior, and side bottle pocket. Ideal for office days and short trips.",
     "price": 49.99, "category": "Bags", "stock": 40,
     "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80"},
    {"id": 2, "name": "Trail Glow Bike Light",
     "description": "Bright USB-rechargeable bike light with three modes (steady, pulse, flash). Weather-sealed housing and tool-free mount for handlebars or helmets.",
     "price": 19.99, "category": "Accessories", "stock": 120,
     "image_url": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80"},
    {"id": 3, "name": "Soft Cotton Crew Tee",
     "description": "Midweight crew-neck T-shirt in breathable ringspun cotton. Pre-washed for a soft hand feel and a clean everyday fit.",
     "price": 22.99, "category": "Apparel", "stock": 85,
     "image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80"},
    {"id": 4, "name": "All-Weather Fleece Jacket",
     "description": "Quarter-zip midweight fleece that layers well for cool mornings. Soft brushed interior, zippered hand pockets, and a stand collar.",
     "price": 64.99, "category": "Apparel", "stock": 35,
     "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80"},
    {"id": 5, "name": "Cloud Soft Baby Onesie",
     "description": "Gentle organic-cotton onesie with reinforced snaps and expandable shoulders. Soft enough for sensitive skin and easy for quick changes.",
     "price": 14.99, "category": "Apparel", "stock": 60,
     "image_url": "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80"},
    {"id": 6, "name": "Classic Red Graphic Tee",
     "description": "Relaxed-fit graphic tee in durable cotton jersey. Colorfast print and a comfortable crew neck for casual wear.",
     "price": 24.99, "category": "Apparel", "stock": 55,
     "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80"},
    {"id": 7, "name": "Diamond Necklace",
     "description": "Elegant sterling-silver necklace with a brilliant-cut simulated diamond pendant. Adjustable chain and secure clasp for everyday or special-occasion wear.",
     "price": 129.99, "category": "Jewelry", "stock": 25,
     "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80"},
    {"id": 8, "name": "Wireless Earbuds Pro",
     "description": "True wireless earbuds with clear stereo sound, touch controls, and a compact charging case. Up to 24 hours total playtime with the case.",
     "price": 79.99, "category": "Electronics", "stock": 45,
     "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80"},
    {"id": 9, "name": "Ceramic Pour-Over Mug",
     "description": "12 oz ceramic mug with a comfortable handle and matte glaze. Microwave-safe and sized for coffee, tea, or desk-side sips.",
     "price": 16.49, "category": "Home", "stock": 90,
     "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=80"},
    {"id": 10, "name": "Memory Foam Seat Cushion",
     "description": "Ergonomic seat cushion with supportive memory foam and a breathable cover. Helps reduce pressure during long desk or travel sessions.",
     "price": 34.99, "category": "Home", "stock": 50,
     "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"},
    {"id": 11, "name": "Insulated Travel Tumbler",
     "description": "20 oz stainless steel tumbler that keeps drinks cold for 24 hours or hot for 8. Spill-resistant lid and slim fit for most cup holders.",
     "price": 28.99, "category": "Accessories", "stock": 75,
     "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80"},
    {"id": 12, "name": "Portable Bluetooth Speaker",
     "description": "Compact waterproof speaker with punchy bass and a 12-hour battery. Pair quickly over Bluetooth for patio, travel, or desk listening.",
     "price": 54.99, "category": "Electronics", "stock": 38,
     "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80"},
]


async def _next_id(collection: str) -> int:
    last = await db[collection].find_one({}, sort=[("id", -1)])
    return (last["id"] + 1) if last else 1


@app.on_event("startup")
async def seed_database():
    # Reset users if schema is older than v2 (lacks email/password_hash)
    sample = await db.users.find_one({})
    if sample and ("email" not in sample or "password_hash" not in sample):
        logger.info("Migrating users to v3 schema – dropping legacy users + tokens")
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

    # Refresh catalog when empty, still on the old Sauce Labs set, or fewer than seed count
    product_count = await db.products.count_documents({})
    sample_product = await db.products.find_one({})
    needs_product_refresh = (
        product_count == 0
        or product_count < len(SEED_PRODUCTS)
        or (sample_product and "Sauce Labs" in str(sample_product.get("name", "")))
        or (sample_product and "Test.allTheThings" in str(sample_product.get("name", "")))
    )
    if needs_product_refresh:
        await db.products.delete_many({})
        await db.products.insert_many([dict(p) for p in SEED_PRODUCTS])
        logger.info("Seeded/refreshed %d products", len(SEED_PRODUCTS))
    # Reset orders if schema lacks v3 fields (full_name/phone)
    sample_order = await db.orders.find_one({})
    if sample_order and ("full_name" not in sample_order or "phone" not in sample_order):
        logger.info("Dropping legacy orders (v3 schema change)")
        await db.orders.drop()
    else:
        # v4: backfill missing status on existing orders
        await db.orders.update_many(
            {"status": {"$exists": False}},
            {"$set": {"status": "pending"}},
        )
        # v5: legacy totals were item-only — treat as subtotal with $0 tax/shipping
        async for row in db.orders.find({"subtotal": {"$exists": False}}):
            await db.orders.update_one(
                {"id": row["id"]},
                {
                    "$set": {
                        "subtotal": float(row.get("total", 0)),
                        "shipping": 0.0,
                        "tax": 0.0,
                    }
                },
            )

    await db.auth_tokens.create_index("token", unique=True)
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)


# ---------- Pydantic models ----------
class UserPublic(BaseModel):
    id: int
    username: str
    email: str = ""
    first_name: str = ""
    last_name: str = ""
    locked: bool = False
    created_at: Optional[str] = None


class Product(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int


class OrderItemOut(BaseModel):
    product_id: int
    name: str
    price: float
    quantity: int


class OrderOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    address: str
    city: str
    state: str
    pincode: str
    phone: str
    subtotal: float = 0
    shipping: float = 0
    tax: float = 0
    total: float
    status: str = "pending"
    created_at: str
    items: List[OrderItemOut]


class LoginRequest(BaseModel):
    username: str = Field(examples=["standard_user"])
    password: str = Field(examples=["secret_sauce"])


class ForgotPasswordRequest(BaseModel):
    username: str = Field(examples=["standard_user"])
    password: str = Field(min_length=6, examples=["new_secret"])
    confirm_password: str = Field(min_length=6, examples=["new_secret"])


class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=60, examples=["alice"])
    email: str = Field(examples=["alice@example.com"])
    password: str = Field(min_length=6, examples=["hunter22"])

    @field_validator("username")
    @classmethod
    def _u(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-z0-9_.-]+$", v):
            raise ValueError("Username may only contain letters, numbers, '.', '_' or '-'")
        return v

    @field_validator("email")
    @classmethod
    def _e(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class LoginResponse(BaseModel):
    token: str
    expires_at: str
    user: UserPublic


class SignupResponse(BaseModel):
    success: bool
    message: str
    user: UserPublic


class ProductsListResponse(BaseModel):
    products: List[Product]


class ProductResponse(BaseModel):
    product: Product


class ProfileResponse(BaseModel):
    user: UserPublic


class OrdersListResponse(BaseModel):
    orders: List[OrderOut]


class CreateOrderResponse(BaseModel):
    success: bool
    order_id: int
    subtotal: float
    shipping: float
    tax: float
    total: float


class CancelOrderRequest(BaseModel):
    order_id: int = Field(ge=1, examples=[12])


class CancelOrderResponse(BaseModel):
    success: bool
    message: str
    order_id: int
    status: str


class RootResponse(BaseModel):
    message: str


class OrderRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=2, max_length=255)
    city: str = Field(min_length=1, max_length=80)
    state: str = Field(min_length=1, max_length=80)
    pincode: str = Field(min_length=3, max_length=20)
    phone: str
    items: List[OrderItemIn]

    @field_validator("phone")
    @classmethod
    def _p(cls, v: str) -> str:
        v = v.strip()
        if not PHONE_RE.match(v):
            raise ValueError("Invalid phone number")
        return v


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


async def current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = credentials.credentials
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
@api_router.get("/", response_model=RootResponse, tags=["Public"], summary="API root")
async def root():
    return {"message": "QA Demo Store API v4 – mirror of PHP backend"}


@api_router.get(
    "/products.php",
    tags=["Public"],
    summary="List all products or get one by id (.php alias)",
    include_in_schema=False,
)
@api_router.get(
    "/products",
    tags=["Public"],
    summary="List all products or get one by id",
    description="Omit `id` to list the catalog. Pass `id` to fetch a single product.",
    responses={
        200: {
            "description": "Product list (no `id`) or single product (`id` set)",
            "content": {
                "application/json": {
                    "examples": {
                        "list": {
                            "summary": "All products",
                            "value": {"products": [{"id": 1, "name": "Sauce Labs Backpack", "price": 29.99}]},
                        },
                        "single": {
                            "summary": "One product",
                            "value": {"product": {"id": 1, "name": "Sauce Labs Backpack", "price": 29.99}},
                        },
                    }
                }
            },
        },
        404: {"description": "Product not found"},
    },
)
async def list_products(id: Optional[int] = Query(None, description="Product id; omit to list all")):
    if id is not None:
        p = await db.products.find_one({"id": id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"product": p}
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    products.sort(key=lambda x: x["id"])
    return {"products": products}


@api_router.post(
    "/auth/login.php",
    response_model=LoginResponse,
    tags=["Auth"],
    summary="Login (.php alias)",
    include_in_schema=False,
)
@api_router.post(
    "/auth/login",
    response_model=LoginResponse,
    tags=["Auth"],
    summary="Login",
    description="Exchange username and password for a Bearer token (24-hour TTL).",
    responses={
        401: {"description": "Invalid credentials"},
        403: {"description": "Account locked"},
    },
)
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


@api_router.post(
    "/auth/forgot-password.php",
    response_model=ForgotPasswordResponse,
    tags=["Auth"],
    summary="Forgot password (.php alias)",
    include_in_schema=False,
)
@api_router.post(
    "/auth/forgot-password",
    response_model=ForgotPasswordResponse,
    tags=["Auth"],
    summary="Forgot password",
    description=(
        "Demo reset: set a new password by username + new password + confirm. "
        "Invalidates all existing tokens for that user."
    ),
    responses={
        400: {"description": "Validation error (mismatch / short password)"},
        403: {"description": "Account locked"},
        404: {"description": "Username not found"},
    },
)
async def forgot_password(payload: ForgotPasswordRequest):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Password and confirm_password do not match")
    user = await db.users.find_one({"username": payload.username.strip()})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that username")
    if user.get("locked"):
        raise HTTPException(status_code=403, detail="Sorry, this user has been locked out.")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(payload.password)}},
    )
    await db.auth_tokens.delete_many({"user_id": user["id"]})
    return {
        "success": True,
        "message": "Password updated successfully. You can now log in with your new password.",
    }


@api_router.post(
    "/signup.php",
    response_model=SignupResponse,
    status_code=201,
    tags=["Auth"],
    summary="Sign up (.php alias)",
    include_in_schema=False,
)
@api_router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=201,
    tags=["Auth"],
    summary="Sign up",
    description="Create a new user account.",
    responses={
        400: {"description": "Validation error or username/email already taken"},
    },
)
async def signup(payload: SignupRequest):
    if await db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username is already taken")
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_id = await _next_id("users")
    doc = {
        "id": new_id,
        "username": payload.username,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "first_name": payload.username,
        "last_name": "",
        "locked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    return {"success": True, "message": "Account created successfully", "user": _user_public(doc)}


# ---------- Protected routes ----------
@api_router.get(
    "/profile.php",
    response_model=ProfileResponse,
    tags=["Protected"],
    summary="Current user profile (.php alias)",
    include_in_schema=False,
)
@api_router.get(
    "/profile",
    response_model=ProfileResponse,
    tags=["Protected"],
    summary="Current user profile",
    responses={401: {"description": "Missing, invalid, or expired token"}},
)
async def profile(me: dict = Depends(current_user)):
    return {"user": _user_public(me)}


@api_router.get(
    "/orders.php",
    response_model=OrdersListResponse,
    tags=["Protected"],
    summary="List orders (.php alias)",
    include_in_schema=False,
)
@api_router.get(
    "/orders",
    response_model=OrdersListResponse,
    tags=["Protected"],
    summary="List orders",
    description="Returns orders for the authenticated user. Pass `user_id` to filter by another user.",
    responses={401: {"description": "Missing, invalid, or expired token"}},
)
async def list_orders(
    user_id: Optional[int] = Query(None, description="Filter by user id; defaults to caller"),
    me: dict = Depends(current_user),
):
    query = {"user_id": user_id} if user_id is not None else {"user_id": me["id"]}
    rows = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for row in rows:
        row.setdefault("status", "pending")
        if "subtotal" not in row:
            row["subtotal"] = float(row.get("total", 0))
            row["shipping"] = 0.0
            row["tax"] = 0.0
    rows.sort(key=lambda x: x["id"], reverse=True)
    return {"orders": rows}


@api_router.post(
    "/orders.php",
    response_model=CreateOrderResponse,
    status_code=201,
    tags=["Protected"],
    summary="Create order (.php alias)",
    include_in_schema=False,
)
@api_router.post(
    "/orders",
    response_model=CreateOrderResponse,
    status_code=201,
    tags=["Protected"],
    summary="Create order",
    description="Order total is always recomputed server-side from current product prices.",
    responses={
        400: {"description": "Validation error, empty cart, or unknown product id"},
        401: {"description": "Missing, invalid, or expired token"},
    },
)
async def create_order(order: OrderRequest, user: dict = Depends(current_user)):
    if not order.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # SERVER-SIDE subtotal from DB prices + tax/shipping
    server_items = []
    subtotal = 0.0
    for item in order.items:
        p = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=400, detail=f"Unknown product id {item.product_id}")
        line_total = round(float(p["price"]) * item.quantity, 2)
        subtotal += line_total
        server_items.append({
            "product_id": p["id"],
            "name": p["name"],
            "price": float(p["price"]),
            "quantity": item.quantity,
        })

    pricing = order_pricing(subtotal)
    new_id = await _next_id("orders")
    doc = {
        "id": new_id,
        "user_id": user["id"],
        "full_name": order.full_name,
        "address": order.address,
        "city": order.city,
        "state": order.state,
        "pincode": order.pincode,
        "phone": order.phone,
        "subtotal": pricing["subtotal"],
        "shipping": pricing["shipping"],
        "tax": pricing["tax"],
        "total": pricing["total"],
        "status": "pending",
        "items": server_items,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(doc)
    return {
        "success": True,
        "order_id": new_id,
        "subtotal": pricing["subtotal"],
        "shipping": pricing["shipping"],
        "tax": pricing["tax"],
        "total": pricing["total"],
    }


@api_router.post(
    "/cancel-order.php",
    response_model=CancelOrderResponse,
    tags=["Protected"],
    summary="Cancel order (.php alias)",
    include_in_schema=False,
)
@api_router.post(
    "/cancel-order",
    response_model=CancelOrderResponse,
    tags=["Protected"],
    summary="Cancel order",
    description="Soft-cancels an order owned by the authenticated user (status → cancelled).",
    responses={
        400: {"description": "Already cancelled or invalid order_id"},
        401: {"description": "Missing, invalid, or expired token"},
        403: {"description": "Order belongs to another user"},
        404: {"description": "Order not found"},
    },
)
async def cancel_order(payload: CancelOrderRequest, me: dict = Depends(current_user)):
    order = await db.orders.find_one({"id": payload.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("user_id") != me["id"]:
        raise HTTPException(status_code=403, detail="You can only cancel your own orders")
    if order.get("status", "pending") == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")

    await db.orders.update_one(
        {"id": payload.order_id},
        {"$set": {"status": "cancelled"}},
    )
    return {
        "success": True,
        "message": "Order cancelled",
        "order_id": payload.order_id,
        "status": "cancelled",
    }


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
