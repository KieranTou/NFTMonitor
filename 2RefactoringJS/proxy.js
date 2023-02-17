import detectProxyTarget from 'ethers-proxies';
import { InfuraProvider } from '@ethersproject/providers'
import { config } from 'dotenv';
config({path:".env"});
const provider = new InfuraProvider(1, process.env.INFURA_URL)
async function test(){
    const target = await detectProxyTarget('0xA7AeFeaD2F25972D80516628417ac46b3F2604Af', provider)
    console.log(target);
}
test();