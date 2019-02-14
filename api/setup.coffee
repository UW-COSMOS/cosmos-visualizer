PGPromise = require('pg-promise')
uuidv4 = require('uuid/v4')
fs = require 'fs'
{join} = require 'path'
{TSParser} = require 'tsparser'

folder = process.argv[2]
datasetName = process.argv[3] || folder

if not folder
  console.log('No folder of docs specified. Example: node setup.js docs1 <optional dataset name>')
  process.exit()


pgp = PGPromise {promiseLib: Promise, pgNative: true}

db = pgp("postgres://postgres:postgres@db:5432/annotations")

sleep = (ms)->
  new Promise((resolve)=>setTimeout(resolve, ms))

runQuery = (args...)->
  try
    await db.query args...
  catch err
    console.error err.toString()

runFromFile = (fn)->
  SQL = fs.readFileSync "#{__dirname}/#{fn}", "utf8"
  statements = TSParser.parse(SQL, 'pg', ';')
  db.tx (ctx)->
    for statement in statements
      await runQuery statement

fn = (args...)->join(__dirname, args...)

insertImage = "INSERT INTO image
      (image_id, doc_id, page_no, stack, file_path)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING"


setup = ->
  # Entire setup script using helpers above
  connected = false
  while not connected
    try
      await db.connect()
      connected = true
    catch err
      console.error "Can't connect to database yet"
      await sleep(1000)

  await runFromFile("schema.sql")
  await runFromFile("tag-data.sql")

  # Read the folder
  for entry in fs.readdirSync fn(folder)
    stats = fs.statSync fn(folder, entry)
    # For each entry check if it is a directory
    continue unless stats.isDirectory()
    # Now we know this is a document
    doc_id = entry
    # Get all the pages for this document and insert them into the database
    for page in fs.readdirSync fn(folder, doc_id, 'png')
      parts = page.split('_')
      continue unless parts.length
      page_no = parts[1]

      file_path = fn(folder, doc_id, png, page)
      vals = [uuidv4(), doc_id, page_no, datasetName, file_path]
      await db.one insertImage, vals

main = do ->
  try
    await setup()
  catch err
    console.error err.toString()
