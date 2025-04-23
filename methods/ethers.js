import { ethers, Interface, isAddress, isBytesLike } from 'ethers';

// 定義 ABI
const contractAbi = [
  {
    type: 'function',
    name: 'initialize',
    inputs: [],
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'ping',
    inputs: [],
    outputs: [],
    stateMutability: 'pure',
  },
];

// 合約地址
const contractAddress = process.env.CONTRACT_ADDRESS;

// Relay 和 EOA 的私鑰
const relayPrivateKey = process.env.RELAY_PRIVATE_KEY;
const eoaPrivateKey = process.env.EOA_PRIVATE_KEY;

// Holesky 測試網提供者
const provider = new ethers.JsonRpcProvider('https://ethereum-holesky-rpc.publicnode.com/');

// 創建 Relay 和 EOA 錢包
const relayWallet = new ethers.Wallet(relayPrivateKey, provider);
const eoaWallet = new ethers.Wallet(eoaPrivateKey, provider);

// 規範化 bytes32 值，移除前導零並確保 32 字節
function normalizeBytes32(value) {
  if (!isBytesLike(value)) {
    throw new Error(`Invalid bytes32 value: ${value}`);
  }
  // 轉為 BigInt 並移除前導零
  const bigIntValue = BigInt(value);
  // 轉回 32 字節的十六進位字串
  const normalized = ethers.hexlify(ethers.toBeArray(bigIntValue));
  // 確保固定 32 字節
  return ethers.zeroPadValue(normalized, 32);
}

// 主函數
async function main() {
  // 1. 生成授權
  const authorization = await eoaWallet.authorize({
    address: contractAddress, // 使用 contractAddress
  });
  console.log('--------->, authorization', authorization);

  // 2. 提取並規範化簽名欄位
  const { r, s, yParity } = authorization.signature;

  // 3. 編碼 initialize 函數調用
  const contractInterface = new Interface(contractAbi);
  const initializeData = contractInterface.encodeFunctionData('initialize', []);

  // 4. 準備授權清單
  const authorizationList = [{
    address: authorization.address || contractAddress, // 確保 address 不為 undefined
    chainId: BigInt(authorization.chainId),
    nonce: BigInt(authorization.nonce),
    yParity,
    r,
    s,
  }];

  console.log('--------->, authorizationList', authorizationList);

  const tx = {
    to: eoaWallet.address,
    data: initializeData, // 僅包含 initializeData
    authorizationList, // 滿足 type: 4 的要求
    type: 4, // EIP-7702 交易類型
    maxFeePerGas: (await provider.getFeeData()).maxFeePerGas || ethers.parseUnits('20', 'gwei'),
    maxPriorityFeePerGas: (await provider.getFeeData()).maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei'),
    gasLimit: 1000000,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(relayWallet.address, 'pending'),
    accessList: [], // EIP-2930 存取清單
  };

  console.log('--------->, tx', tx);

  const txResponse = await relayWallet.sendTransaction(tx);
  console.log('--------->, hash', txResponse.hash);
}

main().catch(console.error);
