const PGPromise = require('pg-promise');
const pgp = PGPromise({promiseLib: Promise, pgNative: true});
module.exports = pgp("postgres://postgres@db:5432/annotations");

