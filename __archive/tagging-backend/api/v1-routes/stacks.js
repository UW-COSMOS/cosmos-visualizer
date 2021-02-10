const {wrapHandler} = require('../handlers/util')

const handler = async (req, res, next, plugins) => {
  const {db} = plugins;
  if (req.query.stack_id === 'all') {
    let stacks = await db.any(`
      SELECT
        stack_id,
        stack_type
      FROM stack`)
    res.reply(req, res, next, stacks)
  } else {
    let stacks = await db.any(`
      SELECT
        stack_id,
        stack_type
      FROM stack
      WHERE stack_id = $1`, [req.query.stack_id]);
    res.reply(req, res, next, stack_id);
  }
}

module.exports = {
  path: '/stacks/:stack_id?',
  displayPath: '/stacks',
  methods: ['GET'],
  description: 'Get available image stacks',
  parameters: {
    'stack_id': {
      'positional': true,
      'description': `A valid stack identifier, or 'all' in order to retrieve all available stacks`
    }
  },
  requiredParameters: [ ],
  requiresOneOf: [ 'stack_id' ],
  fields: {
    'stack_id': {
      'type': 'text',
      'description': 'The name of the stack of documents'
    },
    'stack_type': {
      'type': 'text',
      'description': 'The type of the stack (annotation or prediction); likely deprecated'
    }
  },
  examples: [
    '/api/v1/stacks/all',
    '/api/v1/stacks/geothermal',
  ],
  handler: wrapHandler(handler)
}
