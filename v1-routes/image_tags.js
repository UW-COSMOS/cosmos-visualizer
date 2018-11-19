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
  handler: (req, res, next) => {
    if (req.method === 'GET') {
      res.reply(req, res, next, ['Return tags'])
    } else {
      res.reply(req, res, next, ['Add tags'])
    }
  }
}
