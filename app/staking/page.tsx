export default function Staking() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">OPM Staking</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Your Position</h2>
          <p>Staked: -- OPM</p>
          <p>Pending Rewards: -- ETH</p>
          <button className="mt-4 bg-white text-black px-4 py-2 rounded-lg">
            Claim Rewards
          </button>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Stake Tokens</h2>
          <input
            type="number"
            placeholder="Amount"
            className="w-full p-2 bg-black border border-zinc-700 rounded mb-4"
          />
          <button className="w-full bg-white text-black px-4 py-2 rounded-lg mb-3">
            Approve
          </button>
          <button className="w-full bg-white text-black px-4 py-2 rounded-lg">
            Stake
          </button>
        </div>

      </div>
    </main>
  );
}
