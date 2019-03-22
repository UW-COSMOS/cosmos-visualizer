const PGPromise = require('pg-promise');

const initOptions = {
  promiseLib: Promise,
  pgNative: true,
  query(e) {
    console.log(e.query);
  }
}

const pgp = PGPromise(initOptions);
module.exports = pgp("postgres://postgres@db:5432/annotations");

