module.exports = {
  path: '/image/:image_id?',
  displayPath: '/image',
  methods: ['GET'],
  description: 'Get image metadata',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier, 'next' to retrieve a random image for tagging, or 'validate' to retrieve a random image for validation`
    },
    'validated': {
      'type': 'boolean',
      'description': `When specifying 'next' or 'validate', will limit possible results to either images that have been validated at least once or images that have not been validated.`
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
          AND image_id NOT IN (SELECT image_id FROM image_tags)
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
    }  else if ( req.query.image_id = 'validate') {
      let where = ''
      let params = []
      if (req.query.validated == false) {
        where = 'WHERE images.image_id IN (SELECT DISTINCT image_id FROM image_tags WHERE validator IS NULL)'
      } else if (req.query.validated == true) {
        where = 'WHERE images.image_id IN (SELECT DISTINCT image_id FROM image_tags WHERE validator IS NOT NULL)'
      } else {
        where = ''
      }
      plugins.db.all(`
        SELECT
          images.image_id,
          doc_id,
          page_no,
          stack,
          file_path,
          images.created
        FROM images
        JOIN image_tags ON images.image_id = image_tags.image_id
        ${where}
        ORDER BY random()
        LIMIT 1
      `, (error, row) => {
        if (error) {
          console.log(error)
          return res.error(req, res, next, 'An internal error occurred', 500)
        }
        if (!row) {
          return res.reply(req, res, next, [])
        }
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
