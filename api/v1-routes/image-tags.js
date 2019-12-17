module.exports = {
  path: '/image/:image_id/:stack_id/tags',
  displayPath: '/image/:image_id/:stack_id/tags',
  methods: ['GET', 'POST'],
  description: 'Retrieve or add tags for a given image',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier`
    },
    'stack_id': {
      'positional': true,
      'description': `A valid stack identifier`
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
    '/api/v1/image/2/tags',
  ],
  handler: require("../handlers/image-tag")("image_tag")
}
