const fs = require('fs')
const uuidv4 = require('uuid/v4')
const asyncEachLimit = require('async/eachLimit')
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(`${__dirname}/annotations.sqlite`)

function setup(callback) {
  db.serialize(() => {
    db.get(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'images';`, (error, row) => {
      if (error || !row) {
        let setupSQL = fs.readFileSync(`${__dirname}/schema.sql`, 'utf8')

        db.exec(setupSQL, (error) => {
          callback(null)
        })
      } else {
        callback(null)
      }
    })
  })
}

setup(() => {
  // Read the folder
  asyncEachLimit(fs.readdirSync(`${__dirname}/cosmos_docs`), 1, (entry, callback) => {
    // For each entry check if it is a directory
    let stats = fs.statSync(`${__dirname}/cosmos_docs/${entry}`)

    // If it is a directory it is a document
    if (stats.isDirectory()) {
      // Now we know this is a document
      const doc_id = entry

      // Get all the pages for this document and insert them into the database
      asyncEachLimit(fs.readdirSync(`${__dirname}/cosmos_docs/${doc_id}/png`), 1, (page, done) => {
        let parts = page.split('_')
        if (parts.length) {
          const page_no = parts[1]

          db.run(`INSERT INTO images (image_id, doc_id, page_no, stack, file_path) VALUES (?, ?, ?, ?, ?)`, [uuidv4(), doc_id, page_no, 'cosmos1', `cosmos_docs/${doc_id}/png/${page}`], (error) => {
            done()
          })
        } else {
          done()
        }
      }, () => {
        callback()
      })
    } else {
      callback(null)
    }
  }, (error) => {
    console.log('done')
  })
})
