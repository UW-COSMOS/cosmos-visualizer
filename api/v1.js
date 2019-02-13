const Larkin = require('@macrostrat/larkin')
const fs = require('fs')
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(`${__dirname}/annotations.sqlite`)

// Define a new larkin instance
let v1 = new Larkin({
  version: 1,
  license: 'MIT',
  description: 'Routes for powering image-tagger'
})

// Add postgres
v1.registerPlugin('db', db)

//Recursively read all the route definition files in the folder /routes and register them
fs.readdirSync(`${__dirname}/v1-routes`).forEach(file => {
  // Make sure we don't accidentally read something like .DS_Store
  if (file.split('.').pop() === 'js') {
    v1.registerRoute(require(`./v1-routes/${file}`))
  }
})

module.exports = v1
