// Deploys the OnePremium Locked-Utility + ALM ecosystem.
// Usage: npx hardhat run scripts/deploy-ecosystem.js --network mainnet
const hre = require("hardhat");

async function main() {
  const ethers = hre.ethers;

  // --- Addresses (mainnet) ---
  const OPM_ADDRESS = "0xE430b07F7B168E77B07b29482DbF89EafA53f484";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const OPM_WETH_POOL = "0x1ddb29e16c6b0cc23fea7fd42cf3f6bd368b30c0"; // OPM/WETH V3 pool
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // Chainlink ETH/USD feed (used as the reference oracle for the ALM band).
  const ETH_USD_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
  const DECIMALS_SCALE = ethers.parseUnits("1", 18); // 1e18

  console.log("Deploying OPMMembership (soulbound NFT)...");
  const Membership = await ethers.getContractFactory("OPMMembership");
  const membership = await Membership.deploy("https://onepremium.de/api/membership/");
  await membership.waitForDeployment();
  const membershipAddr = await membership.getAddress();
  console.log("  OPMMembership:", membershipAddr);

  console.log("Deploying OPMMembershipVault (locked-utility wrapper)...");
  const Vault = await ethers.getContractFactory("OPMMembershipVault");
  const vault = await Vault.deploy(OPM_ADDRESS, USDC_ADDRESS, membershipAddr, DECIMALS_SCALE);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("  OPMMembershipVault:", vaultAddr);

  console.log("Wiring membership minter -> vault...");
  await (await membership.setMinter(vaultAddr)).wait();

  console.log("Deploying OPMLiquidityVault (ALM smart vault)...");
  const ALM = await ethers.getContractFactory("OPMLiquidityVault");
  const alm = await ALM.deploy(OPM_WETH_POOL, OPM_ADDRESS, WETH_ADDRESS, ETH_USD_FEED);
  await alm.waitForDeployment();
  const almAddr = await alm.getAddress();
  console.log("  OPMLiquidityVault:", almAddr);

  console.log("Routing 5% of staking rewards to the ALM vault...");
  await (await vault.setLiquidityRouter(almAddr, 500)).wait(); // 500 bps = 5%

  console.log("\nDeployment complete:");
  console.log(JSON.stringify({ membershipAddr, vaultAddr, almAddr }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
