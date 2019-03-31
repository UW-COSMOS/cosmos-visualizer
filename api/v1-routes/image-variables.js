module.exports = {
  path: '/image/:image_id/variables',
  displayPath: '/image/:image_id/variables',
  methods: ['GET'],
  description: 'Retrieve variables on a given image',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier`
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
    '/api/v1/image/2/equations',
  ],
  handler: require("../handlers/image-variable")
}
