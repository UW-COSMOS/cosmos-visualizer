module.exports = {
  path: '/image/:image_id?',
  displayPath: '/image',
  methods: ['GET'],
  description: 'Get image metadata',
  parameters: {
    'image_id': {
      'positional': true,
      'description': `A valid image identifier, 'next' to retrieve a random image for tagging, or 'validate' to retrieve a random image for validation`
    },
    'validated': {
      'type': 'boolean',
      'description': `When specifying 'next' or 'validate', will limit possible results to either images that have been validated at least once or images that have not been validated.`
    },
    'stack_name':{
      'type': 'text',
      'description': `Will filter the result to the requested 'stack' name. This allows distinction between different sets of annotations (or results). If not specified, the full collection is considered.`
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
  handler: require("../handlers/image")()
}
