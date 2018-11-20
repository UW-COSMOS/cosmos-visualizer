module.exports = {
  path: '/image/:image_id?',
  displayPath: '/image',
  methods: ['GET'],
  description: 'Get image metadata',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier, or 'next' in order to retrieve a random image for tagging`
    }
  },
  requiredParameters: [ ],
  requiresOneOf: [ 'image_id' ],
  fields: {
    'url': {
      'type': 'text',
      'description': 'The path to the image for tagging'
    },
    'width': {
      'type': 'integer',
      'description': 'The width of the image in pixels'
    },
    'height': {
      'type': 'integer',
      'description': 'The height of the image in pixels'
    }
  },
  examples: [
    '/api/v1/image/456',
    '/api/v1/image/next',
  ],
  handler: (req, res, next, plugins) => {
    if (req.query.image_id === 'next') {
      plugins.db.all(`
        SELECT
          image_id,
          doc_id,
          page_no,
          stack,
          file_path,
          created
        FROM images
        WHERE tag_start IS NULL OR tag_start < datetime('now', '-5 minutes')
        ORDER BY random()
        LIMIT 1
      `, (error, row) => {
        // Update the tag start
        plugins.db.run(`
          UPDATE images
          SET tag_start = current_timestamp
          WHERE image_id = ?
        `, row.image_id)
        res.reply(req, res, next, row)
      })
    } else {
      plugins.db.all(`
        SELECT
          image_id,
          doc_id,
          page_no,
          stack,
          file_path,
          created
        FROM images
        WHERE image_id = ?
      `, req.query.image_id, (error, row) => {
        res.reply(req, res, next, row)
      })
    }
  }
}
