import { ethers } from "ethers";

export default function TapToPay({ amount, tokenAddress, merchantAddress }: any) {
    const handlePay = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const token = new ethers.Contract(tokenAddress, [
            "function transfer(address to, uint256 amount) external returns (bool)"
        ], signer);
        await token.transfer(merchantAddress, amount);
        alert("Payment successful!");
    };

    return <button onClick={handlePay}>Tap to Pay</button>;
}
