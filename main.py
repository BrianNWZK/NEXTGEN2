import os
import time
import random
import threading
import requests
import logging
import asyncio
import json
import sqlite3
from flask import Flask, render_template
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Float, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
import uuid  # For generating unique API keys
from datetime import datetime
from typing import Any, Dict, List

load_dotenv()

# === CONFIG ===
# Use an absolute path for the database
DATABASE_URL = os.path.join(os.path.dirname(__file__), "business.db")
REVENUE_WALLETS = [
    # Your wallet addresses
]

# Ensure the directory for the database exists
db_directory = os.path.dirname(DATABASE_URL)
if not os.path.exists(db_directory):
    os.makedirs(db_directory)

# Load API keys
API_KEYS = os.getenv("API_KEYS", "default_api_key").split(",")
if not API_KEYS or API_KEYS == ["default_api_key"]:
    logging.warning("No API keys found in environment variables. Using default key.")

# === DATABASE SETUP ===
Base = declarative_base()

class Bot(Base):
    __tablename__ = 'bots'
    id = Column(String, primary_key=True)
    country = Column(String)
    language = Column(String)
    category = Column(String)
    strategy = Column(String)
    status = Column(String)
    api_key = Column(String)

class Revenue(Base):
    __tablename__ = 'revenue'
    id = Column(Integer, primary_key=True)
    bot_id = Column(String)
    amount = Column(Float)
    currency = Column(String)
    source = Column(String)
    wallet_address = Column(String)

# Create database engine
engine = create_engine(f"sqlite:///{DATABASE_URL}")
Base.metadata.create_all(engine)  # Ensure tables are created
Session = sessionmaker(bind=engine)

# Rest of your code...
