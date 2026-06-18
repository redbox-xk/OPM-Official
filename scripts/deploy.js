async function main() {
  const OPM_ADDRESS = "0xe430b07f7b168e77b07b29482dbf89eafa53f484";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  const Staking = await ethers.getContractFactory("OPMStaking");
  const staking = await Staking.deploy(OPM_ADDRESS, USDC_ADDRESS);

  await staking.waitForDeployment();

  console.log("Staking deployed to:", await staking.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
