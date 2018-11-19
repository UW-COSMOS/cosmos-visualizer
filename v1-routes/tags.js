module.exports = {
  path: '/tags/:tag_id',
  displayPath: '/tags',
  methods: ['GET'],
  description: 'Get available image tags',
  parameters: {
    'tag_id': {
      'positional': true,
      'description': `A valid tag identifier, or 'all' in order to retrieve all available tags`
    }
  },
  requiredParameters: [ ],
  requiresOneOf: [ 'tag_id' ],
  fields: {
    'tag_id': {
      'type': 'integer',
      'description': 'The unique tag identifier'
    },
    'name': {
      'type': 'text',
      'description': 'The name of the tag'
    },
    'description': {
      'type': 'text',
      'description': 'The description of the tag'
    },
    'color': {
      'type': 'text',
      'description': 'A valid hex code'
    }
  },
  examples: [
    '/api/v1/tags/2',
    '/api/v1/tags/all',
  ],
  handler: (req, res, next) => {
    if (req.query.tag_id === 'all') {
      res.reply(req, res, next, [{tag_id: 'random', 'name': 'my tag', 'description': 'what', 'color': '#000000'}])
    } else {
    res.reply(req, res, next, [{tag_id: req.query.tag_id, 'name': 'my tag', 'description': 'what', 'color': '#000000'}])
    }
  }
}
