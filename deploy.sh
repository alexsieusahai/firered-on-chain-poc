# spawn the contracts
npx hardhat run scripts/chain.js --network localhost
# run the server
nodemon --trace-warnings scripts/server.js 
