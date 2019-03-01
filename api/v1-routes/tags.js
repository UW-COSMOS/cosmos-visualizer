const {wrapHandler} = require('../handlers/util')

const handler = async (req, res, next, plugins) => {
  const {db} = plugins;
  if (req.query.tag_id === 'all') {
    let tags = await db.any(`
      SELECT
        tag_id,
        name,
        description,
        color,
        created
      FROM tag`)
    res.reply(req, res, next, tags)
  } else {
    let tags = await db.any(`
      SELECT
        tag_id,
        name,
        description,
        color,
        created
      FROM tag
      WHERE tag_id = $1`, [req.query.tag_id]);
    res.reply(req, res, next, tag);
  }
}

module.exports = {
  path: '/tags/:tag_id?',
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
  handler: wrapHandler(handler)
}
