var mysql = require("mysql");


var con = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: "",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Mysql Connected!");
});

module.exports = {
  selectAllTx: function () {
    let sql = "select * from transactions";
    con.query(sql, (err, res) => {
      if (err) {
        return err;
      }
      console.log(res);
    });
  },
  insertTx: function (
    minter_address,
    contract_address,
    blockNumber,
    // maxFeePerGas,
    // maxPriorityFeePerGas,
    gasPrice,
    time,
    txHash
  ) {
    // minter_address = "" + minter_address;
    // contract_address = "" + contract_address;
    // txHash = "" + txHash;
    let sql = `INSERT INTO transactions (minter_address, contract_address,gasPrice,time,blockNumber,tx_hash) VALUES (hex(${minter_address}), hex(${contract_address}),${gasPrice},${time},${blockNumber},hex(${txHash}))`;
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  },
  addContract() {},
};

