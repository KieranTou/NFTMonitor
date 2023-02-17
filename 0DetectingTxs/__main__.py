import json
from args import args
from web3 import Web3
import pandas as pd
from multiprocessing import Pool
# connect the goerli node
web3 = Web3(Web3.HTTPProvider(args.infura_http_url))
# json read contract ABI
with open("./args/abi.json") as f:
    abi = json.load(f)
# get contract object
contract = web3.eth.contract(address=args.contract_address, abi=abi)

# Assign a process to every 20 transactions
def traversal(txs,id):
    for tx_ in txs[id*20:id*20+20]:
        tx_hash = web3.toHex(tx_)
        tx = web3.eth.getTransaction(tx_hash)
        if tx.to == args.contract_address:
            # get the abi of tx
            myInput = tx.input
            # get gas by pandas
            df = pd.read_csv('gas.csv')
            df.columns=['maxFeePerGas','maxPriorityFeePerGas']
            # Average the last 20 items
            maxFeePerGas = df['maxFeePerGas'].tail(20).mean()
            maxPriorityFeePerGas = df['maxPriorityFeePerGas'].tail(20).mean()
            # build my tx
            myTx = {
                    'nonce': web3.eth.get_transaction_count(args.Address),
                    'data': myInput,
                    'maxFeePerGas': maxFeePerGas,
                    'maxPriorityFeePerGas': maxPriorityFeePerGas,
                    'to' : args.contract_address,
                    'from': args.Address,
                    # 'value': web3.toWei(0.02, 'ether')
                    'value': tx.value
                }
            # sign tx
            signed_txn = web3.eth.account.sign_transaction(myTx, private_key=args.PRIVATEKEY)
            # send tx
            send_mint_contract_abi = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            # get receipt
            transaction_receipt_abi = web3.eth.wait_for_transaction_receipt(send_mint_contract_abi)
            p.close()
            p.join()
            break

if __name__ == '__main__':
    # monitor the blockchain changes
    # Every time a block is packaged on the chain, crawl its transaction
    pre_blockNumbers = web3.eth.get_block_number()
    while True:
        now_blockNumbers = web3.eth.get_block_number()
        if now_blockNumbers == pre_blockNumbers:
            continue
        latest_block = web3.eth.get_block(web3.eth.default_block)  # "latest"
        # get the tx in the latest block
        transactions = latest_block.transactions
        # use 8 core for processes
        p = Pool(8)
        for id in range(int(web3.eth.get_block_transaction_count('latest')/20)+1):
            p.apply_async(traversal,args=(transactions,id))
        # close processes
        p.close()
        # wait for close
        p.join()
        print('All subprocesses done.')

        pre_blockNumbers = pre_blockNumbers + 1