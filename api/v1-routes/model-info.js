const sql = `
WITH p AS (
SELECT
	count(DISTINCT image_id) pages,
	count(DISTINCT doc_id) documents
FROM image
),
a AS (
SELECT
	target_img_path path
FROM equations.figures_and_tables
UNION ALL
SELECT assoc_img_path path
FROM equations.figures_and_tables
),
b AS (
SELECT DISTINCT ON (path)
	path
FROM a
)
SELECT
 count(path) FILTER (WHERE path ~ 'Figure\\d') figures,
 count(path) FILTER (WHERE path ~ 'Table\\d') AS tables,
 count(path) FILTER (WHERE path ~ 'Equation\\d') equations,
 (SELECT pages FROM p),
 (SELECT documents FROM p)
FROM b`

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


