const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const v1 = require('./v1')

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
