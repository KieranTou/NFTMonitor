# Visualization of NFT contract in blockchain
## args/args.py
> Store commonly used parameters
## grabNFT.py
> Save the transaction information of transactions whose transaction 'to' is NFT in the block in the database
> Mainly for transactions
## insertNFT.py
> Check whether any address in the transaction table is not recorded in the contract table，insert it
> Mainly for contracts
## database.py
> operate database