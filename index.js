require('./db_sql.js').init();

require('./stackbuy.js').run();

setInterval( () => {
    require('./stackbuy.js').run();
}, 5 * 1000);
