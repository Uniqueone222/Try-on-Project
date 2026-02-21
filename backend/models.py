"""
Database models for Virtual Try-On application
(SQLAlchemy models for future database integration)
"""

from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Screenshot(Base):
    """Model for storing screenshot metadata"""
    __tablename__ = "screenshots"
    
    id = Column(Integer, primary_key=True)
    filename = Column(String, unique=True, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String, default="image/png")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ShirtCatalog(Base):
    """Model for managing shirt inventory"""
    __tablename__ = "shirt_catalog"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True)
    file_name = Column(String)
    color = Column(String)
    description = Column(String)
    file_path = Column(String)
    width = Column(Integer)  # Image width
    height = Column(Integer)  # Image height
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProcessingJob(Base):
    """Model for tracking image processing tasks"""
    __tablename__ = "processing_jobs"
    
    id = Column(Integer, primary_key=True)
    input_filename = Column(String)
    output_filename = Column(String)
    processing_type = Column(String)  # enhance, brightness, etc.
    status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_time = Column(Float)  # seconds
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
