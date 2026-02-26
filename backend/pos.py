from web3 import Web3
import os

INFURA = os.getenv("INFURA_URL", "https://mainnet.infura.io/v3/YOUR_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ACCOUNT = os.getenv("ACCOUNT")

w3 = Web3(Web3.HTTPProvider(INFURA))

def create_payment(amount, merchant):
    # simulate qr_id creation for backend
    qr_id = Web3.keccak(text=f"{merchant}{amount}{w3.eth.block_number}").hex()
    return qr_id
