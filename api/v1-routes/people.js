const uuidv4 = require('uuid/v4')
const { wrapHandler } = require('../handlers/util')

const handler = async (req, res, next, plugins) => {
  const { db } = plugins;
  let where = (req.query.person_id != 'all') ? `WHERE person_id = ?` : ''
  let params = (req.query.person_id != 'all') ? [req.query.person_id] : []
  let people = await db.any(`
      SELECT
        person_id,
        name,
        tagger,
        validator,
        created
      FROM person
      ${where}`, params);
  res.reply(req, res, next, people);

}
module.exports = {
  path: '/people/:person_id?',
  displayPath: '/people',
  methods: ['GET'],
  description: 'Retrieve a person',
  parameters: {
    'person_id': {
      'positional': true,
      'description': `A valid person identifier or 'all'`
    },
    'name': {
      'type': 'text',
      'description': 'The name of the person'
    },
    'annotator': {
      'type': 'boolean',
      'description': 'Whether or not the person is an annotator'
    },
    'validator': {
      'type': 'boolean',
      'description': 'Whether or not the person is a validator'
    },
    'key': {
      'type': 'text',
      'description': 'An API authentication key required to create users'
    }
  },
  requiredParameters: [],
  requiresOneOf: [],
  fields: {
    'person_id': {
      'type': 'integer',
      'description': 'The unique person identifier'
    },
    'name': {
      'type': 'text',
      'description': 'The name of the person'
    },
    'annotator': {
      'type': 'boolean',
      'description': 'Whether or not the person is an annotator'
    },
    'validator': {
      'type': 'boolean',
      'description': 'Whether or not the person is a validator'
    },
    'created': {
      'type': 'text',
      'description': 'Date and time user account was created'
    }
  },
  examples: [
    '/api/v1/people/abc123',
  ],
  handler: wrapHandler(handler)
}
