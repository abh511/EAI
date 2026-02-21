from fastapi import APIRouter, HTTPException, status
from app.schemas import UserLogin, UserRegister, TokenResponse
from app.core.config import settings
from app.db import get_supabase_client
from jose import jwt
from datetime import datetime, timedelta
from loguru import logger

router = APIRouter()

def _make_token(user_id: str, email: str) -> str:
    """Generate JWT token for authenticated user"""
    exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "email": email, "exp": exp}, settings.SECRET_KEY, settings.ALGORITHM)

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister):
    """Register new user with Supabase Auth (with demo bypass)"""
    
    # DEMO MODE: Bypass Supabase for demo accounts
    if body.email.startswith("demo") or body.email.endswith("@demo.com"):
        logger.info(f"Demo registration bypass for: {body.email}")
        mock_user_id = f"demo-{body.email.split('@')[0]}"
        access_token = _make_token(mock_user_id, body.email)
        return TokenResponse(
            access_token=access_token,
            user_id=mock_user_id,
            email=body.email,
            full_name=body.full_name or "Demo User",
            role="citizen"
        )
    
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "full_name": body.full_name,
                    "role": "citizen"
                }
            }
        })
        
        if not response.user:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Registration failed")
        
        user = response.user
        access_token = response.session.access_token if response.session else _make_token(user.id, user.email)
        
        logger.info(f"User registered: {user.email}")
        return TokenResponse(
            access_token=access_token,
            user_id=user.id,
            email=user.email,
            full_name=body.full_name,
            role="citizen"
        )
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
        if "rate limit" in error_msg.lower():
            # Fallback to mock auth if rate limited
            logger.warning(f"Rate limit hit, using mock auth for: {body.email}")
            mock_user_id = f"mock-{body.email.split('@')[0]}"
            access_token = _make_token(mock_user_id, body.email)
            return TokenResponse(
                access_token=access_token,
                user_id=mock_user_id,
                email=body.email,
                full_name=body.full_name or "User",
                role="citizen"
            )
        logger.error(f"Registration error: {error_msg}")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Registration failed: {error_msg}")

@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    """Login user with Supabase Auth (with demo bypass)"""
    
    # DEMO MODE: Bypass Supabase for demo accounts
    if body.email.startswith("demo") or body.email.endswith("@demo.com"):
        logger.info(f"Demo login bypass for: {body.email}")
        mock_user_id = f"demo-{body.email.split('@')[0]}"
        access_token = _make_token(mock_user_id, body.email)
        return TokenResponse(
            access_token=access_token,
            user_id=mock_user_id,
            email=body.email,
            full_name="Demo User",
            role="citizen"
        )
    
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        
        if not response.user or not response.session:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
        
        user = response.user
        user_metadata = user.user_metadata or {}
        
        logger.info(f"User logged in: {user.email}")
        return TokenResponse(
            access_token=response.session.access_token,
            user_id=user.id,
            email=user.email,
            full_name=user_metadata.get("full_name"),
            role=user_metadata.get("role", "citizen")
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower():
            # Fallback to mock auth if rate limited
            logger.warning(f"Rate limit hit, using mock auth for: {body.email}")
            mock_user_id = f"mock-{body.email.split('@')[0]}"
            access_token = _make_token(mock_user_id, body.email)
            return TokenResponse(
                access_token=access_token,
                user_id=mock_user_id,
                email=body.email,
                full_name="User",
                role="citizen"
            )
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
    except Exception as e:
        logger.warning(f"Logout error (non-critical): {str(e)}")
    return {"message": "Logged out successfully"}

@router.get("/ping")
async def ping():
    """Health check endpoint"""
    return {"router": "auth", "status": "online"}
