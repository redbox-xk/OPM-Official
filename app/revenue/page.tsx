export default function Revenue() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-6">Revenue Transparency</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Total OPM Staked</h2>
          <p className="text-3xl mt-4">--</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Revenue Deposited</h2>
          <p className="text-3xl mt-4">--</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Rewards Distributed</h2>
          <p className="text-3xl mt-4">--</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Estimated APY</h2>
          <p className="text-3xl mt-4">--%</p>
        </div>

      </div>
    </main>
  );
}
