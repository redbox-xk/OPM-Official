import json
from web3 import Web3
from solcx import compile_standard, install_solc

# ---- CONFIG ----
INFURA_URL = "https://mainnet.infura.io/v3/1ea88c6195084cc3aaac41e2120eea1f"
PRIVATE_KEY = "0642176f1bd9818b63f0ff3d3e37c00227a268d693d1f14b46ab8a88195b6945"
ACCOUNT = "0xA030f95704BaCe944F22ec84b49E06C42772E625"

install_solc("0.8.20")

web3 = Web3(Web3.HTTPProvider(INFURA_URL))
chain_id = 1
nonce = web3.eth.get_transaction_count(ACCOUNT)

# ---- Compile Contracts ----
with open("contracts/OPMToken.sol") as f:
    opm_source = f.read()

compiled_sol = compile_standard({
    "language": "Solidity",
    "sources": {"OPMToken.sol": {"content": opm_source}},
    "settings": {"outputSelection": {"*": {"*": ["abi","metadata","evm.bytecode","evm.sourceMap"]}}}
}, solc_version="0.8.20")

bytecode = compiled_sol['contracts']['OPMToken.sol']['OPMToken']['evm']['bytecode']['object']
abi = compiled_sol['contracts']['OPMToken.sol']['OPMToken']['abi']

OPM = web3.eth.contract(abi=abi, bytecode=bytecode)

# ---- Deploy Token ----
tx = OPM.constructor().build_transaction({
    'chainId': chain_id,
    'from': ACCOUNT,
    'nonce': nonce,
    'gas': 8000000,
    'gasPrice': web3.to_wei('50', 'gwei')
})
signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
print("Deploying OPM token... TX HASH:", tx_hash.hex())
tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
print("Deployed at:", tx_receipt.contractAddress)
