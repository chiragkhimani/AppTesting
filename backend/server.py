"""
FastAPI mirror of the PHP/MySQL backend for the Emergent preview environment.

v3 routes:
  Public:
    GET  /api/products
    GET  /api/products?id={id}
    POST /api/auth/login
    POST /api/signup
  Protected (Authorization: Bearer <token>):
    GET  /api/profile
    GET  /api/orders
    GET  /api/orders?user_id={id}
    POST /api/orders
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

OPENAPI_TAGS = [
    {"name": "Public", "description": "No authentication required."},
    {"name": "Auth", "description": "Login and account registration."},
    {"name": "Protected", "description": "Requires `Authorization: Bearer <token>` from login."},
]

app = FastAPI(
    title="QA Demo Store API",
    description=(
        "REST API for the QA Demo Store (v3). Mirror of the PHP/MySQL backend for preview/dev.\n\n"
        "**Authentication:** Call `POST /api/auth/login` to obtain a Bearer token (64 hex chars, 24h TTL). "
        "Send it on protected routes as `Authorization: Bearer <token>`.\n\n"
    ),
    version="3.0.0",
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

    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([dict(p) for p in SEED_PRODUCTS])
        logger.info("Seeded products")

    # Reset orders if schema lacks v3 fields (full_name/phone)
    sample_order = await db.orders.find_one({})
    if sample_order and ("full_name" not in sample_order or "phone" not in sample_order):
        logger.info("Dropping legacy orders (v3 schema change)")
        await db.orders.drop()

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
    total: float
    created_at: str
    items: List[OrderItemOut]


class LoginRequest(BaseModel):
    username: str = Field(examples=["standard_user"])
    password: str = Field(examples=["secret_sauce"])


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
    total: float


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
    return {"message": "QA Demo Store API v3 – mirror of PHP backend"}


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

    # SERVER-SIDE total recompute from DB prices
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
        "full_name": order.full_name,
        "address": order.address,
        "city": order.city,
        "state": order.state,
        "pincode": order.pincode,
        "phone": order.phone,
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
