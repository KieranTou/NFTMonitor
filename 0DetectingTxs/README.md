Web3Robot
├── CalculateGas.py  # 
├── README.md
├── SimulateTx.py  # 
├── __main__.py  # 
├── __pycache__
│   └── csv.cpython-39.pyc
├── args
│   ├── __init__.py
│   ├── __pycache__
│   │   ├── __init__.cpython-39.pyc
│   │   └── args.cpython-39.pyc
│   ├── abi.json  # 
│   └── args.py  # 
├── contracts
│   └── test.sol  # 
├── gas.csv  #
└── getContract.py  # 

>  README is created by `tree -L 3 -I "node_modules" > README.md`

- CalculateGas.py
Calculate the current GAS that makes the transaction successful
- SimulateTx.py
Simulate other users sending transactions
- args.py
Store commonly used parameters
- gas.csv
Gas of transaction in pending we crawled

- __main__.py
When the target contract address is known, every time there are eligible transactions in the latest packaged block, crawl its transaction ABI and pursue orders
- abi.json
ABI of target contract
- getContract.py
