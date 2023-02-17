import asyncio
import json
from websockets import connect
from args import args
from web3 import Web3
import pandas as pd
from multiprocessing import Pool
import time
from collections import Counter
import pandas as pd

# connect the goerli node
web3 = Web3(Web3.WebsocketProvider(args.infura_ws_url))

async def txWithoutContract():
    # ws connection
    async with connect(args.infura_ws_url,ping_interval=None) as ws:
        # request
        # time.sleep(5)
        await ws.send(
            '{"jsonrpc": "2.0", "id": 1, "method": "eth_subscribe", "params": ["newPendingTransactions"]}'
        )
        # response
        await ws.recv()
        # create list to store tx
        list=[]
        while True:
            try:
                # get the tx
                message = await asyncio.wait_for(ws.recv(), timeout=15)
                response = json.loads(message)
                txHash = response['params']['result']
                tx = web3.eth.get_transaction(txHash)
                # put the to_address to list
                list.append(tx.to)
                # txs > 30
                if len(list) > 30:
                    # sort:get the most popular address
                    counter_ = Counter(list)
                    contract_address = counter_.most_common(1)[0][0] # get the contract address
                    print(contract_address)
                    # the next tx.to equals contract_address and the contract_address amount is over 10
                    if tx.to == contract_address and counter_.most_common(1)[0][1]>10:
                        # print("got the contract address")
                        df = pd.read_csv('gas.csv')
                        df.columns=['maxFeePerGas','maxPriorityFeePerGas']
                        maxFeePerGas = df['maxFeePerGas'].tail(20).mean()
                        maxPriorityFeePerGas = df['maxPriorityFeePerGas'].tail(20).mean()
                        myInput = tx.input

                        myTx = {
                        'nonce': web3.eth.get_transaction_count(args.Address),
                        'data': myInput,
                        'maxFeePerGas': maxFeePerGas,
                        'maxPriorityFeePerGas': maxPriorityFeePerGas,
                        'to' : contract_address,
                        'from': args.Address,
                        'value': tx.value
                        }
                        # sign tx
                        signed_txn = web3.eth.account.sign_transaction(myTx, private_key=args.PRIVATEKEY)
                        # send tx
                        send_mint_contract_abi = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
                        # get receipt
                        transaction_receipt_abi = web3.eth.wait_for_transaction_receipt(send_mint_contract_abi)
                        print(transaction_receipt_abi)
                        list = []
                        break
                pass
            except Exception as err:
                print(err)
                pass
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    # asynic loop
    # while True:
    loop.run_until_complete(txWithoutContract())