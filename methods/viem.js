import { createWalletClient, http, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { holesky } from 'viem/chains'
import { walletClient } from './viemRelay.js'

const abi = [
  {
    "type": "function",
    "name": "initialize",
    "inputs": [],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "ping",
    "inputs": [],
    "outputs": [],
    "stateMutability": "pure"
  },
];

const relay = privateKeyToAccount(process.env.RELAY_PRIVATE_KEY)

const walletClient = createWalletClient({
  account: relay,
  chain: holesky,
  transport: http(),
})

const contractAddress = process.env.CONTRACT_ADDRESS;

const eoa = privateKeyToAccount(process.env.EOA_PRIVATE_KEY)

// 1. Authorize designation of the Contract onto the EOA.
const authorization = await walletClient.signAuthorization({
  account: eoa,
  contractAddress,
})

// 1-1. Alternatively, you can use the `prepareAuthorization` method
//    to generate a preparation for further sign-use.
// const preparation = await walletClient.prepareAuthorization({
//   account: eoa,
//   contractAddress,
// })
// const authorization = await walletClient.signAuthorization(preparation);

console.log('--------->, authorization', authorization);

// 2. Designate the Contract on the EOA, and invoke the
//    `initialize` function.

const hash = await walletClient.sendTransaction({
  authorizationList: [authorization],
  //                  ↑ 3. Pass the Authorization as a parameter.
  data: encodeFunctionData({
    abi,
    functionName: 'initialize',
  }),
  to: eoa.address,
})

// console.log('--------->, hash', hash);
