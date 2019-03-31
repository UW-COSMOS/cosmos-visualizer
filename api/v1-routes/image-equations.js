module.exports = {
  path: '/image/:image_id/equations',
  displayPath: '/image/:image_id/equations',
  methods: ['GET'],
  description: 'Retrieve equations on a given image',
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
  handler: require("../handlers/image-equation")
}
