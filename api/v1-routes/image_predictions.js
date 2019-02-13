const handler = (req, res, next, plugins) => {
  if (req.query.image_id === 'next') {
    plugins.db.all(`
      SELECT
        image_id,
        doc_id,
        page_no,
        stack,
        file_path,
        created
      FROM images_predictions
      WHERE (tag_start IS NULL OR tag_start < datetime('now', '-5 minutes'))
        AND image_id NOT IN (SELECT image_id FROM image_tags)
      ORDER BY random()
      LIMIT 1
    `, (error, row) => {
      // Update the tag start
      plugins.db.run(`
        UPDATE images_predictions
        SET tag_start = current_timestamp
        WHERE image_id = ?
      `, row.image_id)
      res.reply(req, res, next, row)
    })
  } else if ( req.query.image_id === 'validate') {
    let where = ''
    let params = []
    if (req.query.validated == false) {
      where = 'WHERE validator IS NULL'
    } else if (req.query.validated == true) {
      where = 'WHERE validator IS NOT NULL'
    } else {
      where = ''
    }
    plugins.db.all(`
      SELECT
        images_predictions.image_id,
        doc_id,
        page_no,
        stack,
        file_path,
        images_predictions.created
      FROM images_predictions
      JOIN image_tags_predictions
        ON images_predictions.image_id = image_tags_predictions.image_id
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
        UPDATE images_predictions
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
      FROM images_predictions
      WHERE image_id = ?
    `, req.query.image_id, (error, row) => {
      res.reply(req, res, next, row)
    })
  }
};

module.exports = {
  path: '/image_predictions/:image_id?',
  displayPath: '/image_predictions',
  methods: ['GET'],
  description: 'Get image metadata for images that have gone through the segmentation algorithm',
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
    '/api/v1/image_predictions/456',
    '/api/v1/image_predictions/next',
  ],
  handler: handler
}
