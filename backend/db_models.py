from sqlalchemy import Column, Integer, String, Float, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from database import Base  

class Prediction(Base):
    __tablename__ = "predictions"
    __table_args__ = {"schema": "main"}  

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("main.users.id", ondelete="SET NULL"), nullable=True)
    image_filename = Column(String, nullable=False)
    prediction_type = Column(String, nullable=False)  # 'disease' or 'ripeness'
    prediction_result = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now())

    #  Define relationship with User
    user = relationship("User", back_populates="predictions")


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "main"}  

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    #  Define relationship with Prediction
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
