async function handler(req, res, next, plugins) {
  const {db} = plugins;
  let params = {};

  try {
    // Simple and hacky!
    let types = [
      {id: 'Figure', name: 'Figure'},
      {id: 'Table', name: 'Table'},
      {id: 'Equation', name: 'Equation'}
    ];
    res.reply(req,res, next, types);
  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
};

const params = {
  'all': {
    'type': 'boolean',
    'description': 'Return all results'
  }
};

module.exports = {
  path: '/model/extraction-type',
  displayPath: '/model/extraction-type',
  methods: ['GET'],
  description: 'Retrieve model-extracted entity types',
  parameters: params,
  requiredParameters: [ ],
  requiresOneOf: [ ],
  fields: params,
  examples: [
    '/api/model/extraction-type?all=true',
  ],
  handler: handler
}

