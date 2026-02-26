import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { createPayment } from "../../lib/api";
import QRGenerator from "../../components/QRGenerator";

export default function MerchantPage() {
  const router = useRouter();
  const { id } = router.query;
  const [payments, setPayments] = useState<any[]>([]);
  const [amount, setAmount] = useState<number>(0);

  const handleCreatePayment = async () => {
    const qrId = await createPayment(amount, id as string);
    setPayments([...payments, { qrId, amount }]);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Merchant Dashboard: {id}</h1>
      <div className="flex gap-2 mb-4">
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="border p-2 rounded"/>
        <button onClick={handleCreatePayment} className="bg-green-600 text-white px-4 py-2 rounded">Create Payment</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {payments.map((p, idx) => (
          <div key={idx} className="border p-4 rounded shadow bg-white">
            <p>Amount: {p.amount} OPM</p>
            <QRGenerator qrId={p.qrId} />
          </div>
        ))}
      </div>
    </div>
  );
}
