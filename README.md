1. create a .env file with filled value
2. deploy your contract to testnet:
```
forge create --rpc-url {rpc_link} --private-key {private_key_without_0x} ./Delegation.sol:Delegation --broadcast
```
3. run
`yarn start:viem`
or
`yarn start:ethers`

PS. ethers cannot send transaction yet, seems like beta function incomplete
