from args import args
from web3 import Web3
from multiprocessing import Pool
from requests import get
import database as db

# make url for http request for etherscan
def makeAPIUrl(module,action,address,**kwargs):
    url = args.base_url + f"?module={module}&action={action}&address={address}&apikey={args.api_key}"
    for key,value in kwargs.items():
        url += f"&{key}={value}"
    return url

# get the source code of contract
def getContractCode(address):
    get_sourceCode_url = makeAPIUrl("contract","getsourcecode",address)
    response = get(get_sourceCode_url)
    data = response.json()
    source_code = data["result"][0]["SourceCode"]
    return source_code
