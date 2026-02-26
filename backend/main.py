from fastapi import FastAPI
from backend.pos import create_payment

app = FastAPI()

@app.post("/create_payment/")
async def create_payment_endpoint(amount: int, merchant: str):
    qr_id = create_payment(amount, merchant)
    return {"qrId": qr_id}
