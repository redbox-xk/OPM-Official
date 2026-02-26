import { useEffect, useState } from "react";
import QRGenerator from "../components/QRGenerator";
import TapToPay from "../components/TapToPay";
import { createPayment } from "../lib/api";

export default function Home() {
  const [amount, setAmount] = useState<number>(0);
  const [qrId, setQrId] = useState<string>("");

  const handleCreatePayment = async () => {
    const id = await createPayment(amount, "merchant_wallet_address");
    setQrId(id);
  };

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      <h1 className="text-3xl font-bold mb-4">One Premium Payment Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="border p-2 rounded"/>
        <button onClick={handleCreatePayment} className="bg-blue-600 text-white px-4 py-2 rounded">Generate QR</button>
      </div>
      {qrId && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Scan to Pay</h2>
          <QRGenerator qrId={qrId} />
          <TapToPay amount={amount} tokenAddress="OPM_token_address" merchantAddress="merchant_wallet_address" />
        </div>
      )}
    </div>
  );
}
