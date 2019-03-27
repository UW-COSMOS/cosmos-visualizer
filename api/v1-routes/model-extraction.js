async function handler(req, res, next, plugins) {
  const {db} = plugins;
  let params = {};
  params['doc_id'] = req.query.doc_id || '\\w+'; // Get all documents by default
  params['stack_id'] = req.query.stack_id || 'default'; // not needed yet, but will be
  params['btype'] = req.query.type || '\\w+';
  params['query'] = req.query.query || '\\w+';

  let q = `SELECT *
    FROM equations.figures_and_tables
    WHERE target_img_path ~ '$<doc_id:raw>.*$<btype:raw>\\d'`;

  const query = req.query.query || "";
  if (query != '') {
    q += "AND target_unicode ilike '%%$<query:raw>%%'"
  }

  if (query.length < 2) {
    q += " LIMIT 10"
  }


  try {
    let types = await db.any(q, params);
    res.reply(req,res, next, types);
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

