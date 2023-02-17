# Simulate others' transactions
import json
from web3 import Web3
from args import args
# json read contract ABI
with open("./args/abi.json") as f:
    abi = json.load(f)
# connect the goerli node
web3 = Web3(Web3.HTTPProvider(args.infura_http_url))
# get contract object
contract = web3.eth.contract(address=args.contract_address, abi=abi)
# test transaction simulate another person
testTx = {
    'nonce': web3.eth.get_transaction_count(args.Address),
    'gas': 300000,  # gas is amount
    'gasPrice': int(web3.eth.gas_price*1.2),  # gasPrice is price
    'from': args.Address,
    'value': web3.toWei(0.02, 'ether')
}

# build Tx
mint_contract = contract.functions.publicMint(2, 20000000).buildTransaction(testTx)
# sign Tx
sign_mint_contract = web3.eth.account.sign_transaction(
        mint_contract, private_key=args.PRIVATEKEY)
# send Tx
send_mint_contract = web3.eth.send_raw_transaction(
        sign_mint_contract.rawTransaction)
# get receipt
transaction_receipt = web3.eth.wait_for_transaction_receipt(
        send_mint_contract)
print(transaction_receipt)

# print(contract.functions.maxSupply().call())  # 10000
# print(contract.functions.totalSupply().call())

