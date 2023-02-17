// import node_modules required
const cluster = require("cluster");
const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config({ path: ".env" });
const utils = ethers.utils;
const zero_address =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// connect the node provider
const providerETH = new ethers.providers.JsonRpcProvider(process.env.QUICK_URL);

// monitor if a new block is packaged on the chain
let pre_blockNumber = 0;
async function isNewBlockPackaged() {
  let new_blockNumber = await providerETH.getBlockNumber();
  if (new_blockNumber != pre_blockNumber) {
    pre_blockNumber = new_blockNumber;
    return [true, new_blockNumber];
  } else {
    return [false, -1];
  }
}

// check the connect is true or not
async function isConnect(provider) {
  // console.log(provider.getNetwork());  Promise {<pending>}
  const network = await provider.getNetwork();
  console.log(network);
  pre_blockNumber = await providerETH.getBlockNumber();
}
// isConnect(providerETH);

// get signature of event
let event_Transfer = "Transfer(address,address,uint256)"; //0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
let event_TransferSingle =
  "TransferSingle(address,address,address,uint256,uint256)"; //0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62
let event_ClaimMint = "ClaimMint(address,uint256)"; //0x5d404f369772cfab2b65717fca9bc2077efeab89a0dbec036bf0c13783154eb1
function getSignatureOfEvent(event) {
  return utils.keccak256(utils.toUtf8Bytes(event));
}

// judge the event is or not Mint
// 1. ERC1155 also be Transfer 0x3aad526f6cfa1c47b9ad4af4ec491bbaca9b6b6aa02ac2d7ecbbb5f0464b4b74 so through supportInterface?
// 2. Not only Transfer is mint 0x33f6dfc58be0ca42f5b00e81041baeeb14bc822324fbd0648065222d96414a22 by array?
// Judge whether it is a mint transaction
function isMint(logs) {
  for (let j = logs.length - 1; j >= 0; j--) {
    // Judge the event type through logs topics[0]
    let event = logs[j].topics[0];
    let from_Transfer = logs[j].topics[1];
    let from_TransferSingle = logs[j].topics[2];
    // Tranfer
    if (
      event ==
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
      from_Transfer == zero_address
    ) {
      let contract = logs[j].address; //contract address or logic contracr address
      let to = utils.defaultAbiCoder.decode(["address"], logs[j].topics[2]);
      // let tokenId = utils.defaultAbiCoder.decode(['uint256'],logs[j].topics[3]).toString();
      return [true, contract, to];
    }
    // TransferSingle
    else if (
      event ==
        "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62" &&
      from_TransferSingle == zero_address
    ) {
      let contract = logs[j].address;
      let to = utils.defaultAbiCoder.decode(["address"], logs[j].topics[3]);
      // let operator = utils.defaultAbiCoder.decode(['address'],logs[j].topics[1]);
      // let [id,value] = utils.defaultAbiCoder.decode(['uint256','uint256'],logs[j].data).toString();
      return [true, contract, to];
    } else {
      return [false, -1, -1];
    }
  }
}
// get tx's details
async function getTx(tx_hash) {
  let tx = await providerETH.getTransaction(tx_hash);
  // console.log(tx.gasPrice.toString(), tx.data.slice(0, 10));
  return [tx.gasPrice.toString(), tx.data.slice(0, 10)];
}
// getTx('0x787aa911444530b4bd29bea2e692f03666f6de0c6247a9226b6d2ed5f581c98f');

// get receipts
async function processReceipt(txs_hash) {
  for (let i = txs_hash.length - 1; i >= 0; i--) {
    let receipt = await providerETH.getTransactionReceipt(txs_hash[i]);
    let logs = receipt.logs;
    // Exclude transfer between EOA
    if (logs.length != 0) {
      let [mint_flag, contract, to] = isMint(logs);
      if (mint_flag) {
        // console.log(contract, to, txs_hash[i]);
        let [gasPrice, method] = await getTx(txs_hash[i]);
        return [txs_hash[i], contract, to, gasPrice, method];
      }
    }
  }
}

// the main function..
async function main(block) {
  // let [flag, block] = await isNewBlockPackaged();
  // if (flag) {
  let blockInfo = await providerETH.getBlock(block);
  let txs_hash = blockInfo["transactions"];
  let time = blockInfo["timestamp"];
  console.log(
    `current timeStamp is ${time} monitor the new block is ${block} it has ${txs_hash.length} txs`
  );
  // start muti-processing ??
  let [tx_hash, contract, to, gasPrice, method] = await processReceipt(
    txs_hash
  ).catch((err) => {});
  // insert function to store txs information
  let data = [block, tx_hash, contract, to, gasPrice, method, time];
  fs.writeFile("test.csv", `\n${data.toString()}`, { flag: "a" }, (err) => {
    if (err) {
      return console.error(err);
    }
  });
  // }
}

// Run every 4 seconds
setInterval(async () => {
  let [flag, block] = await isNewBlockPackaged();
  if (flag) {
    if (cluster.isMaster) {
      console.log(`主进程 ${process.pid} 正在运行`);
      cluster.fork();
      cluster.on("exit", (worker, code, signal) => {
        console.log(`工作进程 ${worker.process.pid} 已退出`);
      });
    } else {
      console.log(`this is ${process.pid} running`);
      main(block);
    }
  }
}, 4000);
