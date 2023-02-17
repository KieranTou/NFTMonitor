import asyncio
import json
from web3 import Web3
from websockets import connect
from args import args
import csv
# connect the goerli node
web3 = Web3(Web3.HTTPProvider(args.infura_http_url))

async def getGas():
    # ws connection
    async with connect(args.infura_ws_url,ping_interval=None) as ws:
        # request
        await ws.send(
            '{"jsonrpc": "2.0", "id": 1, "method": "eth_subscribe", "params": ["newPendingTransactions"]}'
        )
        # response
        await ws.recv()
        while True:
            try:
                # get the tx
                message = await asyncio.wait_for(ws.recv(), timeout=15)
                response = json.loads(message)
                txHash = response['params']['result']
                tx = web3.eth.get_transaction(txHash)
                # Post-London Upgrade
                if 'maxPriorityFeePerGas' in tx:
                    maxFeePerGas = web3.fromWei(tx.maxFeePerGas, 'gwei')
                    maxPriorityFeePerGas = web3.fromWei(
                        tx.maxPriorityFeePerGas, 'gwei')
                # Pre-London Upgrade
                if 'gasPrice' in tx:
                    maxFeePerGas = web3.fromWei(tx.gasPrice, 'gwei')
                    maxPriorityFeePerGas = web3.fromWei(
                        tx.gasPrice, 'gwei') - 15 if (
                            web3.fromWei(tx.gasPrice, 'gwei') > 15) else 0
                print(maxFeePerGas, maxPriorityFeePerGas)
                # write Gas to CSV
                with open('gas.csv','a') as csv_file:
                    csv_writer = csv.writer(csv_file,delimiter=',')
                    row=[maxFeePerGas,maxPriorityFeePerGas]
                    csv_writer.writerow(row)
                pass
            except Exception as err:
                print(err)
                pass


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    # asynic loop
    while True:
        loop.run_until_complete(getGas())