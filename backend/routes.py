from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database import get_db
from db_models import User
from schemas import UserCreate
from utils import hash_password, verify_password
from starlette.middleware.sessions import SessionMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm  



router = APIRouter()

#  Function to Set Up Session Middleware (Call this in `main.py`)
def setup_session(app):
    app.add_middleware(SessionMiddleware, secret_key="your_secret_key_here")


#  Function to Get User Session Data
def get_current_user(request: Request):
    user_id = request.session.get("user_id")
    username = request.session.get("username")

    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")

    return {"user_id": user_id, "username": username}


#  REGISTER USER ROUTE
@router.post("/register")
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing_user = await db.execute(select(User).filter(User.email == user.email))
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and create user
    new_user = User(username=user.username, email=user.email, hashed_password=hash_password(user.password))
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"message": "User registered successfully"}


#  LOGIN USER ROUTE (WITH SESSION)
@router.post("/login")
async def login_user(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    print("Login API called")

    # Fetch user by email
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    #  Store user details in session
    request.session["user_id"] = user.id
    request.session["username"] = user.username

    return {"message": "Login successful", "username": user.username}


#  LOGOUT USER ROUTE
@router.post("/logout")
async def logout_user(request: Request):
    request.session.clear()  # Clears session data
    return {"message": "Logged out successfully"}


#  CHECK SESSION ROUTE
@router.get("/session-info")
async def session_info(request: Request):
    return {
        "user_id": request.session.get("user_id"),
        "username": request.session.get("username")
    }
