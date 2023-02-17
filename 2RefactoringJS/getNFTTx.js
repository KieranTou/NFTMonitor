const { ethers } = require("ethers");
require("dotenv").config({ path: ".env" });
const { insertTx, selectAllTx } = require("./database.js");
const fs = require("fs");
const { util } = require("echarts");
// const detectProxyTarget = require("ethers-proxies").detectProxyTarget;

// const supportsInterfaceABI = [{"constant":true,"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"}];
const supportsInterfaceABI = [
  "function supportsInterface(bytes4) view returns (bool)",
  // "function implementation() public view returns (address)"  //Proxy     FALSE!! no variable
  "function getImplementation() view returns (address implementation)",
];

// connect the node provider
const providerETH = new ethers.providers.JsonRpcProvider(process.env.QUICK_URL);

let pre_blockNumber = 0;

let whiteList = [];
try {
  // read contents of the file
  const data = fs.readFileSync("whitelist.csv", "UTF-8");
  // split the contents by new line
  const lines = data.split(/\r?\n/);
  // print all lines
  lines.forEach((line) => {
    whiteList.push(line);
    // console.log(line);
  });
} catch (err) {
  console.error(err);
}
let blackList = [];
try {
  // read contents of the file
  const data = fs.readFileSync("blacklist.csv", "UTF-8");
  // split the contents by new line
  const lines = data.split(/\r?\n/);
  // print all lines
  lines.forEach((line) => {
    blackList.push(line);
    // console.log(line);
  });
} catch (err) {
  console.error(err);
}

// check the connect is true or not
async function isConnect(provider) {
  // console.log(provider.getNetwork());  Promise {<pending>}
  const network = await provider.getNetwork();
  console.log(network);
  pre_blockNumber = await providerETH.getBlockNumber();
}
isConnect(providerETH);

// monitor if a new block is packaged on the chain
async function isNewBlockPackaged() {
  let new_blockNumber = await providerETH.getBlockNumber();
  if (new_blockNumber != pre_blockNumber) {
    pre_blockNumber = new_blockNumber;;
    return [true, new_blockNumber];
  } else {
    return [false, -1];
  }
}

async function isCodeAddress(address) {
  let code = await providerETH.getCode(address);
  if (code == "0x") {
    return false;
  } else {
    return true;
  }
}

// judge whether an address is a NFT contract address
async function isNFTContract(address) {
  let provider = providerETH;
  let abi = supportsInterfaceABI;
  let contract = new ethers.Contract(address, abi, provider);
  try {
    isERC721 = await contract.supportsInterface("0x80ac58cd");
    isERC1155 = await contract.supportsInterface("0xd9b67a26");
  } catch (err) {
    isERC721 = false;
    isERC1155 = false;
  }
  if (isERC721) {
    // console.log("ERC721");
    return true;
  } else if (isERC1155) {
    // console.log("ERC1155");
    return true;
  } else {
    return false;
  }
}
// async function test(){
//     // test NFT ERC721 BAYC
//     console.log(await isNFTContract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"));
//     // test token ERC20
//     console.log(await isNFTContract("0xc3761EB917CD790B30dAD99f6Cc5b4Ff93C4F9eA"));
// }
// test();

// 0x5c891d76584b46bC7F1E700169a76569Bb77d2Db Proxy OKXFootballCup
// 0x9C32185b81766a051E08dE671207b34466DD1021

// tx.input is in white-list or black-list?
function isMint(signature) {
  let flag = whiteList.indexOf(signature);
  if (flag != -1) {
    return true;
  }
  return false;
}
function isNotInBlackList(signature) {
  let flag = blackList.indexOf(signature);
  if (flag == -1) {
    return true;
  }
  return false;
}

// judge the address if is a proxy contract,if ture return its logic contract
async function isProxy(address) {
  let provider = providerETH;
  let abi = supportsInterfaceABI;
  let contract = new ethers.Contract(address, abi, provider);
  try {
    logic = await contract.getImplementation();
    console.log(logic);
    return [true, logic];
  } catch (err) {
    // console.log("its not proxy contract");
    return [false, 0];
  }
}

// get the receipt
async function getReceipt(txHash){
  const utils = ethers.utils;
  let receipt = await providerETH.getTransactionReceipt(txHash);
  // console.log(receipt);
  let logs = receipt.logs;
  console.log(logs);
  let data = utils.defaultAbiCoder.decode(['uint256','uint256'],'0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001');
  console.log(data[0].toString());
  let to = utils.defaultAbiCoder.decode(['address'],logs[0].topics[3])
  console.log(to.toString());
}

// judge the event is or not Transfer
let event = "Transfer(address,address,uint256)";

function getSignatureOfEvent(event){
  const utils = ethers.utils;
  return utils.keccak256(utils.toUtf8Bytes(event));
}
let eventTopic = getSignatureOfEvent(event)
// console.log(eventTopic); 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
getReceipt("0x078f41cedd0c6b0b5aacdbece4f9fab828118f1a019a8688953b4f6b14012bb1")

// processiong the all txs in one block
async function processTx(block, timestamp, transactions) {
  for (let i = transactions.length - 1; i >= 0; i--) {
    let tx = await providerETH.getTransaction(transactions[i]);
    let address = tx.to;
    // console.log(address);
    if (await isCodeAddress(address)) {
      // console.log("isCodeAddress");
      let signature = tx.data.substring(0, 10);
      if (isNotInBlackList(signature)) {
        if (isNFTContract(address)) {
          let flag_mint = isMint(signature);
          if (flag_mint) {
            console.log(
              tx.from,
              address,
              tx.blockNumber,
              tx.gasPrice.toNumber(),
              timestamp,
              tx.hash
            );
            insertTx(
              tx.from,
              address,
              tx.blockNumber,
              tx.gasPrice,
              timestamp,
              tx.hash
            );
            // selectAllTx();
            let data = [
              tx.from,
              address,
              tx.blockNumber,
              tx.gasPrice,
              timestamp,
              tx.hash,
            ];
            fs.writeFile("test.csv", `\n${data.toString()}`, {flag:'a'},(err) => {
              if (err) {
                return console.error(err);
              }
            });
          }
        } else {
          let [flag_proxy, logic] = await isProxy(address);
          if (flag_proxy) {
            console.log("isProxy");
            if (isNFTContract(logic)) {
              let flag_mint = isMint(signature);
              if (flag_mint) {
                console.log(
                  tx.from,
                  address,
                  tx.blockNumber,
                  tx.gasPrice.toNumber(),
                  timestamp,
                  tx.hash
                );
                insertTx(
                  tx.from,
                  address,
                  tx.blockNumber,
                  tx.gasPrice,
                  timestamp,
                  tx.hash
                );
                // selectAllTx();
                let data = [
                  tx.from,
                  address,
                  tx.blockNumber,
                  tx.gasPrice,
                  timestamp,
                  tx.hash,
                ];
                fs.writeFile("test.csv", `\n${data.toString()}`,{flag:'a'},(err) => {
                  if (err) {
                    return console.error(err);
                  }
                });
              }
            }
          }
        }
      }
    }
    // console.log(tx);
  }
  // console.log(`the block ${block} is completed`);
}

// main function
async function main() {
  // console.log(await isNFTContract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"));

  // setTimeout(()=>{console.log("start");},3000)
  [flag, block] = await isNewBlockPackaged();
  if (flag) {
    // console.log(block);
    // console.log(block);
    blockInfo = await providerETH.getBlock(block);
    // console.log(blockInfo);
    txs = blockInfo["transactions"];
    time = blockInfo["timestamp"];
    tx_count = txs.length;
    console.log(`monitor the new block is ${block} it has ${tx_count} txs`);
    //   console.log(txs);
    processTx(block, time, txs);
  }
}

// setInterval(() => {
//   main();
// }, 4000);
// main();


