import os
from dotenv import load_dotenv

load_dotenv()

# Agent wallet private key (approved via approveAgent on HL)
AGENT_WALLET_KEY = os.getenv("AGENT_WALLET_KEY", "")

# Builder Code address for fee collection
BUILDER_ADDRESS = os.getenv("BUILDER_ADDRESS", "")

# Builder fee in tenths of basis points (50 = 5bps = 0.05%)
BUILDER_FEE = int(os.getenv("BUILDER_FEE", "50"))

# Hyperliquid network (mainnet or testnet)
HL_NETWORK = os.getenv("HL_NETWORK", "mainnet")

# Whether to use testnet API
IS_TESTNET = HL_NETWORK == "testnet"

API_URL = (
    "https://api.hyperliquid-testnet.xyz"
    if IS_TESTNET
    else "https://api.hyperliquid.xyz"
)
