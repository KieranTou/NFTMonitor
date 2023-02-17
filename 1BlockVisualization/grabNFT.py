from args import args
from web3 import Web3
from multiprocessing import Pool
from requests import get
import time
import database as db

# connect the infra mainnet node
# web3 = Web3(Web3.HTTPProvider(args.infura_http_url))
web3 = Web3(Web3.HTTPProvider(""))


# monitor if a new block is packaged on the chain
pre_blockNumber = web3.eth.get_block_number()
def isChainChanges():
    global pre_blockNumber
    # current block numbers
    new_blockNumber = web3.eth.get_block_number()
    if new_blockNumber != pre_blockNumber:
        # print("monitor the new block ",new_blockNumber)
        pre_blockNumber += 1
        return True
    else:
        return False

# judge whether an address is a contract address
def isContract(address):
    # web3.toHex(b'') == '0x'
    if web3.eth.get_code(address) == b'' :
        return False
    else:
        return True

# make url for http request for etherscan
def makeAPIUrl(module,action,address,**kwargs):
    url = args.base_url + f"?module={module}&action={action}&address={address}&apikey={args.api_key}"
    for key,value in kwargs.items():
        url += f"&{key}={value}"
    return url

# get the ABI of contract
def getContractABI(address):
    get_abi_url = makeAPIUrl("contract","getabi",address)
    response = get(get_abi_url)
    data = response.json()
    abi = data["result"]
    return abi   

# judge whether an address is a NFT (ERC1155/ERC721) contract address
def isNFTContract(address):
    abi = getContractABI(address)
    contract = web3.eth.contract(address=address, abi=abi)
    return contract.functions.supportsInterface("0xd9b67a26").call() or contract.functions.supportsInterface("0x80ac58cd").call()

# processiong the all txs in one block
# 1 core for 1 block to prevent missing of block
def iterateTxs(txs,localtime):
    # print("start a new processing")
    ti = time.time()
    for tx_ in txs:
        tx_hash = web3.toHex(tx_)
        tx = web3.eth.getTransaction(tx_hash)
        # first judge if it is contract address then judge if it is NFT address
        address = tx.to
        if isContract(address):
            # because some address is not NFT will Error
            try: 
                if isNFTContract(address):
                    minter_address = tx["from"]
                    gas = tx["gas"]
                    gasPrice = tx["gasPrice"]
                    time = localtime
                    try:
                        print(minter_address,address,gas,gasPrice,time)
                        db.insertTx(minter_address,address,gas,gasPrice,time)
                        pass
                    except Exception as err:
                        print("insert error:",err)
                        pass
                pass
            except Exception:
                pass
    tf = time.time()
    print(f"this blcok is use {tf-ti}")
    # print("close a processing")
    p.close()
    p.join()
    

if __name__ == '__main__':
    # use 8 core for processes
    p = Pool(8)
    while True:
        if isChainChanges():
            localtime = time.time()
            latest_block = web3.eth.get_block(web3.eth.default_block)  # "latest"
            print(f"the block is {web3.eth.get_block_number()},it has {web3.eth.get_block_transaction_count('latest')} transactions")
            # get the tx in the latest block
            transactions = latest_block.transactions
            p.apply_async(iterateTxs,args=(transactions,localtime))  # remember input tuple