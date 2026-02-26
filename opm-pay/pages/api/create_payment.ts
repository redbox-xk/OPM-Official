import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { amount, merchant } = req.body;
  const qrId = ethers.keccak256(ethers.toUtf8Bytes(`${merchant}-${amount}-${Date.now()}`));
  res.status(200).json({ qrId });
}
