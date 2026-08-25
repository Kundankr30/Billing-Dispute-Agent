import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv()

def _key() -> bytes:
    key_b64 = os.environ["TOKEN_ENCRYPTION_KEY"]
    key = base64.b64decode(key_b64)
    assert len(key) == 32, f"Expected 32-byte key, got {len(key)} bytes — check TOKEN_ENCRYPTION_KEY with M1"
    return key

def _add_padding(s: str) -> str:
    """Node's toString('base64url') strips padding — Python's urlsafe decoder needs it restored."""
    return s + "=" * (-len(s) % 4)

def decrypt_token(encrypted: str) -> str:
    
    raw = base64.urlsafe_b64decode(_add_padding(encrypted))  
    nonce = raw[:12]
    ciphertext = raw[12:-16]    
    auth_tag = raw[-16:]        
    aesgcm = AESGCM(_key())
    plaintext_bytes = aesgcm.decrypt(nonce, ciphertext + auth_tag, None) 
    return plaintext_bytes.decode("utf-8")