const express = require('express')
const bodyParser = require('body-parser')
const Larkin = require('@macrostrat/larkin')
const fs = require('fs')

const db = require("./database-connection")

const app = express()

// Define a new larkin instance
let v1 = new Larkin({
  version: 1,
  license: 'MIT',
  description: 'Routes for powering image-tagger'
})

// Add postgres
v1.registerPlugin('db', db)

//Recursively read all the route definition files in the folder /routes and register them
for (var file of fs.readdirSync(`${__dirname}/v1-routes`)) {
  // Make sure we don't accidentally read something like .DS_Store
  if (file.split('.').pop() !== 'js') continue
  v1.registerRoute(require(`./v1-routes/${file}`))
}

app.disable('x-powered-by')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: "application/vnd.api+json" }))

// Map our larkin router to the uri /api/v1 and /api
app.use('/api/v1', v1.router)
app.use('/api', v1.router)

app.port = process.argv[2] || 5454

app.listen(app.port, function() {
  console.log(`image-tagger-api listening on port ${app.port}`)
})
