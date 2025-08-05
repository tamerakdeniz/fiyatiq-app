"""
Secure Authentication System
Handles user registration, login, password hashing, JWT tokens, and security features
"""

import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from typing import Optional

import bcrypt
import jwt
from database import Kullanici, get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session

# Security Configuration
SECRET_KEY = "your-secret-key-change-in-production-use-env-variable"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
MAX_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_MINUTES = 30

# Security schemes
security = HTTPBearer()

# Pydantic Models for Authentication
class UserRegister(BaseModel):
    """User registration model with validation"""
    ad: str
    soyad: str
    email: EmailStr
    password: str
    telefon: Optional[str] = None
    sehir: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength - simplified for demo"""
        if len(v) < 6:
            raise ValueError('Şifre en az 6 karakter olmalıdır')
        return v
    
    @validator('ad', 'soyad')
    def validate_names(cls, v):
        """Validate names"""
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        if not v.replace(' ', '').isalpha():
            raise ValueError('Name must contain only letters and spaces')
        return v.strip().title()

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: dict

class UserProfile(BaseModel):
    """User profile model for responses"""
    id: int
    ad: str
    soyad: str
    email: str
    telefon: Optional[str]
    sehir: Optional[str]
    kayit_tarihi: datetime
    son_giris: Optional[datetime]
    email_verified: bool
    
    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    """Password change model"""
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength - simplified for demo"""
        if len(v) < 6:
            raise ValueError('Şifre en az 6 karakter olmalıdır')
        return v

# Password Hashing Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT refresh token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Authentication Functions
def authenticate_user(db: Session, email: str, password: str) -> Optional[Kullanici]:
    """Authenticate user with email and password"""
    user = db.query(Kullanici).filter(Kullanici.email == email).first()
    
    if not user:
        return None
    
    # Check if account is locked
    if user.account_locked_until and user.account_locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is locked until {user.account_locked_until.strftime('%Y-%m-%d %H:%M:%S')}"
        )
    
    # Check if account is active
    if not user.aktif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Verify password
    if not verify_password(password, user.hashed_password):
        # Increment failed login attempts
        user.failed_login_attempts += 1
        
        # Lock account if too many failed attempts
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.account_locked_until = datetime.utcnow() + timedelta(minutes=ACCOUNT_LOCKOUT_MINUTES)
            user.failed_login_attempts = 0  # Reset counter
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked due to too many failed login attempts. Try again after {ACCOUNT_LOCKOUT_MINUTES} minutes."
            )
        
        db.commit()
        return None
    
    # Reset failed login attempts on successful login
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.account_locked_until = None
    
    # Update last login time
    user.son_giris = datetime.utcnow()
    db.commit()
    
    return user

def register_user(db: Session, user_data: UserRegister) -> Kullanici:
    """Register a new user"""
    # Check if email already exists
    existing_user = db.query(Kullanici).filter(Kullanici.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create new user
    new_user = Kullanici(
        ad=user_data.ad,
        soyad=user_data.soyad,
        email=user_data.email,
        hashed_password=hashed_password,
        telefon=user_data.telefon,
        sehir=user_data.sehir,
        kayit_tarihi=datetime.utcnow(),
        aktif=True,
        email_verified=False,  # Require email verification in production
        failed_login_attempts=0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Kullanici:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(Kullanici).filter(Kullanici.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.aktif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user

# Optional dependency for current user (returns None if not authenticated)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Kullanici]:
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

# Security helper functions
def generate_verification_token() -> str:
    """Generate secure verification token"""
    return secrets.token_urlsafe(32)

def send_verification_email(email: str, token: str):
    """Send email verification (implement with your email service)"""
    # This is a placeholder - implement with your email service
    # Examples: SendGrid, AWS SES, SMTP, etc.
    print(f"Email verification token for {email}: {token}")
    # In production, send actual email with verification link

def change_password(db: Session, user: Kullanici, password_data: PasswordChange) -> bool:
    """Change user password"""
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_hashed_password = hash_password(password_data.new_password)
    
    # Update password
    user.hashed_password = new_hashed_password
    db.commit()
    
    return True

# Security audit logging
class SecurityLog:
    """Security event logging"""
    
    @staticmethod
    def log_login_attempt(email: str, success: bool, ip_address: str = None):
        """Log login attempts"""
        timestamp = datetime.utcnow().isoformat()
        status = "SUCCESS" if success else "FAILED"
        print(f"[{timestamp}] LOGIN {status}: {email} from {ip_address}")
        # In production, save to secure log file or database
    
    @staticmethod
    def log_registration(email: str, ip_address: str = None):
        """Log user registrations"""
        timestamp = datetime.utcnow().isoformat()
        print(f"[{timestamp}] REGISTRATION: {email} from {ip_address}")
    
    @staticmethod
    def log_password_change(email: str, ip_address: str = None):
        """Log password changes"""
        timestamp = datetime.utcnow().isoformat()
        print(f"[{timestamp}] PASSWORD_CHANGE: {email} from {ip_address}")

# Input sanitization
def sanitize_input(input_string: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not input_string:
        return ""
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', 'script', 'javascript', 'onload', 'onerror']
    sanitized = input_string
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()

# Rate limiting helper (basic implementation)
class RateLimiter:
    """Basic rate limiting implementation"""
    
    def __init__(self):
        self.attempts = {}
    
    def is_allowed(self, identifier: str, max_attempts: int = 10, window_minutes: int = 15) -> bool:
        """Check if request is within rate limits"""
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        # Remove old attempts outside the window
        self.attempts[identifier] = [
            attempt for attempt in self.attempts[identifier] 
            if attempt > window_start
        ]
        
        # Check if under limit
        if len(self.attempts[identifier]) >= max_attempts:
            return False
        
        # Add current attempt
        self.attempts[identifier].append(now)
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()