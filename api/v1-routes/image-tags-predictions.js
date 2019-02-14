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
  handler: require("../handler/image-tag")("image_tag_prediction")
}
