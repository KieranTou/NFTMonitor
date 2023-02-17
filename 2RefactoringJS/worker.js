// worker.js
const fib = (num) => {
    setTimeout(() => {
        console.log("start");
    },5000);
    if (num === 1 || num === 2) {
        return num;
    }
    let a = 1, b = 2, sum = 0;
    for (let i = 3; i <= num; i++) {
        sum = a + b;
        a = b;
        b = sum;
    }
    return sum;
}
 

process.on('message', num => { //接受主进程传递参数
    const result = fib(num);
 
    process.send(JSON.stringify({ //返回
        num,
        result,
        pid: process.pid
    }))
    process.kill(process.pid)
})