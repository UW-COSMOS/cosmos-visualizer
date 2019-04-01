async function handler(req, res, next, plugins) {
  const {db} = plugins;
  let params = {};
  params['doc_id'] = req.query.doc_id || '\\w+'; // Get all documents by default
  params['stack_id'] = req.query.stack_id || 'default'; // not needed yet, but will be
  params['btype'] = req.query.type || '\\w+';
  params['query'] = req.query.query || '\\w+';

  // We limit query results by default now,
  // (for pagination) which may not be appropriate in general
  let offs = req.query.offset || 0;
  if (offs < 0) {
    offs = 0;
  }
  params['offset'] = offs;
  params['limit'] = req.query.limit || 10;

  let base = `
    SELECT * FROM model_results.entity
    WHERE path_data ~ '$<btype:raw>\\d'`;

  const q_ = req.query.query || "";
  if (q_ != '') {
    base += "AND target_unicode ilike '%%$<query:raw>%%'"
  }

  const countQ = base.replace("*", "count(*)")
  // For pagination
  const q = base+" OFFSET $<offset> LIMIT $<limit>"
  try {
    // This is inefficient, maybe a separate request
    // to get count is in order?
    const {count} = await db.one(countQ, params);
    res.set('x-total-count', count);

    const types = await db.any(q, params);
    res.reply(req, res, next, types);
  } catch (error) {
    return res.error(req, res, next, error.toString(), 500);
  }
};

const params = {
  'doc_id': {
    'type': 'text',
    'description': 'Document on which to focus'
  },
  'type': {
    'type': 'text',
    'description': 'Entity type to focus on'
  },
  'query': {
    'type': 'text',
    'description': 'String to search for'
  },
  // Make compatible with pagination
  'offset': {
    'type': 'integer',
    'description': 'Query offset'
  },
  'limit': {
    'type': 'integer',
    'description': 'Query result limit'
  }
};

module.exports = {
  path: '/model/extraction',
  displayPath: '/model/extraction',
  methods: ['GET'],
  description: 'Retrieve model extracted entities',
  parameters: params,
  requiredParameters: [ ],
  requiresOneOf: [ ],
  fields: params,
  examples: [
    '/api/v1/model/extraction?doc_id=1&type=Figure%20Caption&query=foo',
  ],
  handler: handler
}

