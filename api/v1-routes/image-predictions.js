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
  handler: require("../handlers/image")("image_predictions")
}
