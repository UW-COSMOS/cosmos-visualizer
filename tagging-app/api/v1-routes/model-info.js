const sql = `
SELECT
	count(DISTINCT image_id) pages,
	count(DISTINCT doc_id) documents
FROM image`

async function handler(req, res, next, plugins) {
  const {db} = plugins;
  let params = {};
  // We don't really use stack_id for now, but we'll need it eventually
  params['stack_id'] = req.query.stack_id || 'default'; // not needed yet, but will be

  try {
    const statistics = await db.one(sql, params);
    res.reply(req, res, next, statistics);
  } catch (error) {
    return res.error(req, res, next, error.toString(), 500);
  }
};

const params = {
  'stack_id': {
    'type': 'text',
    'description': 'Stack of documents to get statistics for'
  }
};

module.exports = {
  path: '/model/info',
  displayPath: '/model/info',
  methods: ['GET'],
  description: 'Get model extraction statistics',
  parameters: params,
  requiredParameters: [ ],
  requiresOneOf: [ ],
  fields: params,
  examples: [
    '/api/v1/info?stack_id=default',
  ],
  handler: handler
}


