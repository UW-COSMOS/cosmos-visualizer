module.exports = {
  path: '/image/:image_id/phrases',
  displayPath: '/image/:image_id/phrases',
  methods: ['GET'],
  description: 'Retrieve phrases associated with equations for a given image',
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
    '/api/v1/image/2/phrases',
  ],
  handler: require("../handlers/image-phrase")
}
