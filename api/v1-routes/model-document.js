async function handler(req, res, next, plugins) {
  const {db} = plugins;
  let params = {};
  params['stack_id'] = req.query.stack_id || 'default'; // not needed yet, but will be

  let q = `SELECT docid FROM equations.docids;`;
  try {
    let docs = await db.any(q, params);
    res.reply(req,res, next, docs);
  } catch (error) {
    return res.error(req, res, next, error.toString(), 500);
  }
};

const params = {
  'all': {
    'type': 'boolean',
    'description': 'Return all results'
  }
};

module.exports = {
  path: '/model/document',
  displayPath: '/model/document',
  methods: ['GET'],
  description: 'Retrieve model documents',
  parameters: params,
  requiredParameters: [ ],
  requiresOneOf: [ ],
  fields: params,
  examples: [
    '/api/v1/model/document',
  ],
  handler: handler
}


