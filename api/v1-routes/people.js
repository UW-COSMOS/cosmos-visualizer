const uuidv4 = require('uuid/v4')
const apiKey = require('../api_key')
const {wrapHandler} = require('../handlers/util')

const handler = async (req, res, next, plugins) => {
  const {db} = plugins;
  if (req.method === 'GET') {
    let where = (req.query.person_id != 'all') ? `WHERE person_id = ?` : ''
    let params = (req.query.person_id != 'all') ? [ req.query.person_id ] : []
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
  } else {
    // Validate the input
    let incoming = req.body;

    if (!incoming.name) {
      return res.error(req, res, next, 'A "name" must be provided', 400)
    }
    if (!incoming.key || incoming.key != apiKey) {
      return res.error(req, res, next, 'You do not have permission to create a person', 400)
    }
    let person_id = uuidv4()

    try {
      let params = [person_id, incoming.name, incoming.tagger || true, incoming.validator || false ];
      db.none(`
        INSERT INTO person (person_id, name, tagger, validator)
        VALUES ($1, $2, $3, $4)`, params);
      res.reply(req, res, next, {'person_id': person_id});
    } catch(error) {
      return res.error(req, res, next, 'Something went wrong while adding the person', 500)
    }
  }
}

module.exports = {
  path: '/people/:person_id?',
  displayPath: '/people',
  methods: ['GET', 'POST'],
  description: 'Retrieve or add a person',
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
  requiredParameters: [ ],
  requiresOneOf: [ ],
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
