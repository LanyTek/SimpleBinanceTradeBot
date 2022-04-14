var sqlite3 = require('sqlite3').verbose();
var moment = require('moment')

db = null;

function init() {
	db = new sqlite3.Database('db.sqlite3');
	db.serialize(function() {

		db.run("CREATE TABLE IF NOT EXISTS orders (	buyid BIGINT PRIMARY KEY, ticker TEXT, buyquantity DOUBLE, buyprice DOUBLE, buytime INTEGER, status TEXT, \
													sellid BIGINT, sellquantity DOUBLE, sellprice DOUBLE, selltime INTEGER)");
		
	});
}

function add_buy_order(orderid, ticker, quantity, price, cb) {
	db.run("INSERT INTO orders(buyid, ticker, buyquantity, buyprice, buytime, status) VALUES(?,?,?,?,?,?)", [orderid, ticker, quantity, price, moment().unix(), 'NEW'], function(err) {
		cb(err);
	});
}

function get_top_order(ticker, cb) {
	// usually 1 ticker have only 1 buy order 
	db.all("SELECT * FROM orders WHERE ticker = ? ORDER BY buyprice ASC", [ticker], function(err, rows) {
		if(err) { cb(err, rows); return; }

		if(rows.length == 0) { cb(null, null); return;}

		cb(null, rows[0]);
    });
}

function get_number_order(ticker, cb) {
    
  db.get("SELECT COUNT(*) as cnt FROM orders WHERE ticker = ?", [ticker], function(err, row) {
      if (row == undefined) {
          cb(err, 0);
      } else {
          cb(err, row.cnt);
      }  
  });
}

function update_sell_order(orderid, quantity, price, orderidbuy, cb) {
	var stmt = db.prepare("UPDATE orders SET sellid = ?, sellquantity = ?, sellprice = ?, selltime = ?, status = ? where buyid = ?");
	stmt.run(orderid, quantity, price, moment().unix(), "SELLING", orderidbuy);
	stmt.finalize();
    cb(null);
}

function remove_order(orderid, cb) {
	db.run('DELETE FROM orders WHERE buyid=?', orderid, function(err) {
		cb(err);
	});
}

function get_top_sell_order(ticker, cb) {
	db.all("SELECT * FROM orders WHERE ticker = ? and status = 'SELLING' ORDER BY sellprice ASC", [ticker], function(err, rows) {
		if(err) { cb(err, rows); return; }

		if(rows.length == 0) { cb(null, null); return;}

		cb(null, rows[0]);
    });
}

module.exports = {
	init,
	add_buy_order,
	get_top_order,
	get_number_order,
	update_sell_order,
	remove_order,
	get_top_sell_order,
}