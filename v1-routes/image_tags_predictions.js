const async = require('async')
const uuidv4 = require('uuid/v4')

module.exports = {
  path: '/image_predictions/:image_id/tags',
  displayPath: '/image_predictions/:image_id/tags',
  methods: ['GET'],
  description: 'Retrieve or add tags for a given image',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier`
    },
    'tags': {
      'description': 'An array of tag objects. Each object must have a tag_id, min_x, min_y, max_x, max_y'
    },
    'validator': {
      'type': 'text',
      'description': 'The person who validated the tags'
    },
    'validated': {
      'type': 'boolean',
      'description': 'Only return validation tags'
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
    '/api/v1/image_predictions/2/tags',
  ],
  handler: (req, res, next, plugins) => {
    if (req.method === 'GET') {
      let where = []
      let params = [req.query.image_id]
      if ('validated' in req.query && req.query.validated === true) {
        where.push(`image_tags_predictions.validator IS NOT NULL`)
      } else if ('validated' in req.query && req.query.validated === false) {
        where.push(`image_tags_predictions.validator IS NULL`)
      }

      // TODO: Make sure this is a valid validator
      if ('validator' in req.query) {
        where.push('tagger != ? AND (validator != ? OR validator IS NULL)')
        params.push(req.query.validator, req.query.validator)
      }

      plugins.db.all(`
        SELECT
          image_tags_predictions.image_tag_id,
          tags.tag_id,
          tags.name,
          image_tags_predictions.x,
          image_tags_predictions.y,
          image_tags_predictions.width,
          image_tags_predictions.height,
          image_tags_predictions.tagger,
          image_tags_predictions.validator,
          image_tags_predictions.created
        FROM tags
        JOIN image_tags_predictions ON image_tags_predictions.tag_id = tags.tag_id
        WHERE image_tags_predictions.image_id = ?
        ${where.length ? ' AND ' + where.join(' AND ') : ''}
      `, params, (error, tags) => {
        if (error) {
          return res.error(req, res, next, 'An internal error occurred', 500)
        }
        res.reply(req, res, next, tags)
      })
    } else {
      // Validate the input
      let incoming = req.body

      if (!incoming.validator) {
        return res.error(req, res, next, 'Missing a "validator" property', 400)
      }
      if (!incoming.tags) {
        return res.error(req, res, next, 'Missing "tags" property', 400)
      }

      if (!(Array.isArray(incoming.tags))) {
        try {
           incoming.tags = JSON.parse(incoming.tags)
         } catch(e) {
           return res.error(req, res, next, 'Could not parse tags', 400)
         }
      }

      incoming.tags.forEach(tag => {
        if (!tag.tag_id) {
          return res.error(req, res, next, 'A tag is missing a tag_id', 400)
        }
        if (!tag.x) {
          return res.error(req, res, next, 'A tag is missing an x', 400)
        }
        if (!tag.y) {
          return res.error(req, res, next, 'A tag is missing an y', 400)
        }
        if (!tag.width) {
          return res.error(req, res, next, 'A tag is missing a width', 400)
        }
        if (!tag.height) {
          return res.error(req, res, next, 'A tag is missing a height', 400)
        }
      })

      incoming.tags = incoming.tags.map(tag => {
        if (!('image_tag_id' in tag)) {
          tag.image_tag_id = uuidv4()
        }
        return tag
      })
      // Alright...I think we are good to go
      async.eachLimit(incoming.tags, 1, (tag, callback) => {
        plugins.db.run(`
          INSERT INTO image_tags_predictions (image_tag_id, image_id, tag_id, x, y, width, height, validator)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tag.image_tag_id, req.query.image_id, tag.tag_id, tag.x, tag.y, tag.width, tag.height, incoming.validator], (error) => {
          if (error) {
            return callback(error)
          }
          callback(null)
        })
      }, (error) => {
        if (error) {
          console.log(error)
          return res.error(req, res, next, 'An error occurred while inserting tags', 500)
        }
        res.reply(req, res, next, incoming.tags)
      })
    }
  }
}
