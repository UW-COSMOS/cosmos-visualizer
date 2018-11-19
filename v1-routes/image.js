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
  handler: (req, res, next) => {
    if (req.query.image_id === 'next') {
      res.reply(req, res, next, {image_id: 'random', 'width': 123, 'height': 123})
    } else {
      res.reply(req, res, next, [{image_id: req.query.image_id, 'width': 456, 'height': 456}])
    }
  }
}
