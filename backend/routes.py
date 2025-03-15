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
from db_models import Prediction 
from collections import Counter
from sqlalchemy.sql import func
from datetime import datetime, timedelta  




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




# Fetch all predictions for the logged-in user
@router.get("/user-predictions")
async def get_user_predictions(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not logged in")

    result = await db.execute(select(Prediction).filter(Prediction.user_id == user_id))
    predictions = result.scalars().all()

    disease_distribution = {}
    ripeness_distribution = {}

    for pred in predictions:
        if pred.prediction_type == "disease":
            disease_distribution[pred.prediction_result] = disease_distribution.get(pred.prediction_result, 0) + 1
        elif pred.prediction_type == "ripeness":
            ripeness_distribution[pred.prediction_result] = ripeness_distribution.get(pred.prediction_result, 0) + 1

    return {
        "total": len(predictions),
        "disease_count": sum(disease_distribution.values()),
        "ripeness_count": sum(ripeness_distribution.values()),
        "disease_distribution": disease_distribution,
        "ripeness_distribution": ripeness_distribution,
        "predictions": [
            {
                "type": pred.prediction_type,
                "result": pred.prediction_result,
                "confidence": f"{pred.confidence * 100:.2f}%",
                "date": pred.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            } for pred in predictions
        ]
    }

# Helper function to filter data based on time period
def filter_by_time(query, time_filter):
    now = datetime.utcnow()
    if time_filter == "today":
        return query.filter(Prediction.timestamp >= now - timedelta(days=1))
    elif time_filter == "this_week":
        return query.filter(Prediction.timestamp >= now - timedelta(weeks=1))
    elif time_filter == "this_month":
        return query.filter(Prediction.timestamp >= now.replace(day=1))
    return query  # Default is all-time data




#api for user report details
@router.get("/user-report")
async def get_user_report(request: Request, time_filter: str = "all", db: AsyncSession = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not logged in")

    # Get filtered predictions
    query = select(Prediction).filter(Prediction.user_id == user_id)
    query = filter_by_time(query, time_filter)
    result = await db.execute(query)
    predictions = result.scalars().all()

    if not predictions:
        return {"message": "No predictions available for this period"}

    # Count disease occurrences (excluding 'healthy')
    disease_counts = Counter(pred.prediction_result for pred in predictions if pred.prediction_type == "disease" and pred.prediction_result != "healthy")
    ripeness_counts = Counter(pred.prediction_result for pred in predictions if pred.prediction_type == "ripeness")

    # Determine most common disease (excluding "healthy")
    most_common_disease = disease_counts.most_common(1)[0] if disease_counts else ("None", 0)

    # Severity Analysis
    high_confidence = sum(1 for pred in predictions if pred.confidence > 0.75)
    low_confidence = sum(1 for pred in predictions if pred.confidence <= 0.75)

    # Month-to-month comparison
    last_month = datetime.utcnow().replace(day=1) - timedelta(days=1)
    last_month_query = select(Prediction).filter(
        Prediction.user_id == user_id, Prediction.timestamp >= last_month.replace(day=1), Prediction.timestamp < last_month
    )
    last_month_result = await db.execute(last_month_query)
    last_month_predictions = last_month_result.scalars().all()
    last_month_count = len(last_month_predictions)
    current_count = len(predictions)

    trend = f"+{current_count - last_month_count} increase" if current_count > last_month_count else f"{last_month_count - current_count} decrease"
    disease_trend = "Increase in disease cases" if disease_counts else "Stable disease count"
    ripeness_trend = "More overripe detections" if ripeness_counts.get("Overripe", 0) > ripeness_counts.get("Ripe", 0) else "Healthy ripeness balance"

    return {
        "total_predictions": len(predictions),
        "disease_count": sum(disease_counts.values()),
        "ripeness_count": sum(ripeness_counts.values()),
        "most_common_disease": most_common_disease[0],
        "most_common_disease_count": most_common_disease[1],
        "high_confidence": high_confidence,
        "low_confidence": low_confidence,
        "trend": trend,
        "disease_trend": disease_trend,
        "ripeness_trend": ripeness_trend
    }
