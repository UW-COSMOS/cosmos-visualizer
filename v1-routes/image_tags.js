const async = require('async')

module.exports = {
  path: '/image/:image_id/tags',
  displayPath: '/image/:image_id/tags',
  methods: ['GET', 'POST'],
  description: 'Retrieve or add tags for a given image',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier`
    },
    'tags': {
      'description': 'An array of tag objects. Each object must have a tag_id, min_x, min_y, max_x, max_y'
    },
    'tagger': {
      'type': 'text',
      'description': 'The person who added the tags'
    },
    'validator': {
      'type': 'text',
      'description': 'The person who validated the tags'
    }
  },
  requiredParameters: [ ],
  requiresOneOf: [ 'image_id' ],
  fields: {
    'image_id': {
      'type': 'integer',
      'description': 'The unique image identifier'
    },
    'tags': {
      'type': 'text',
      'description': 'The applicable tags'
    },
  },
  examples: [
    '/api/v1/image/2/tags',
  ],
  handler: (req, res, next, plugins) => {
    if (req.method === 'GET') {
      plugins.db.all(`
        SELECT
          tags.tag_id,
          tags.name,
          image_tags.x_min,
          image_tags.y_min,
          image_tags.x_max,
          image_tags.y_max,
          image_tags.tagger,
          image_tags.validator,
          image_tags.created,
          image_tags.validated
        FROM tags
        JOIN image_tags ON image_tags.tag_id = tags.tag_id
        WHERE image_tags.image_id = ?
      `, req.query.image_id, (error, tags) => {
        res.reply(req, res, next, tags)
      })
    } else {
      // Validate the input
      let incoming = req.body

      if (!incoming.tagger && !incoming.validator) {
        return res.error(req, res, next, 'Missing a "tagger" or "validator" property', 400)
      }
      if (!incoming.tags) {
        return res.error(req, res, next, 'Missing "tags" property', 400)
      }
      try {
        incoming.tags = JSON.parse(incoming.tags)
      } catch(e) {
        return res.error(req, res, next, 'Could not parse tags', 400)
      }

      incoming.tags.forEach(tag => {
        if (!tag.tag_id) {
          return res.error(req, res, next, 'A tag is missing a tag_id', 400)
        }
        if (!tag.x_min) {
          return res.error(req, res, next, 'A tag is missing an x_min', 400)
        }
        if (!tag.y_min) {
          return res.error(req, res, next, 'A tag is missing an y_min', 400)
        }
        if (!tag.x_max) {
          return res.error(req, res, next, 'A tag is missing an x_max', 400)
        }
        if (!tag.y_max) {
          return res.error(req, res, next, 'A tag is missing an x_max', 400)
        }

        if (incoming.validator) {
          if (!'is_valid' in tag) {
            return res.error(req, res, next, 'When validating each tag must specify a "is_valid" parameter', 400)
          }
        }
      })

      // Alright...I think we are good to go
      // If we are validating tags
      if (incoming.validator) {
        async.eachLimit(incoming.tags, 1, (tag, callback) => {
          plugins.db.run(`
            UPDATE image_tags
            SET validator = ?, validated = current_timestamp, is_valid = ?
            WHERE image_id = ? AND tag_id = ?
          `, [incoming.validator, tag.is_valid, req.query.image_id, tag.tag_id], (error) => {
            if (error) {
              return callback(error)
            }
            callback(null)
          })
        }, (error) => {
          if (error) {
            return res.error(req, res, next, 'An error occurred while inserting tags', 500)
          }
          res.reply(req, res, next, 'Success')
        })

      } else {
        async.eachLimit(incoming.tags, 1, (tag, callback) => {
          plugins.db.run(`
            INSERT INTO image_tags (image_id, tag_id, x_min, y_min, x_max, y_max, tagger)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [req.query.image_id, tag.tag_id, tag.x_min, tag.y_min, tag.x_max, tag.y_max, incoming.tagger], (error) => {
            if (error) {
              return callback(error)
            }
            callback(null)
          })
        }, (error) => {
          if (error) {
            return res.error(req, res, next, 'An error occurred while inserting tags', 500)
          }
          res.reply(req, res, next, 'Success')
        })
      }

      res.reply(req, res, next, ['Add tags'])
    }
  }
}
