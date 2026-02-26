import axios from "axios";
export const createPayment = async (amount: number, merchant: string) => {
    const res = await axios.post("/api/create_payment", { amount, merchant });
    return res.data.qrId;
};
