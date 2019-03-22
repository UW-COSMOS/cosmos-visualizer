async function handler(req, res, next, plugins) {
  const {db} = plugins;
  let params = {};
  params['doc_id'] = req.query.doc_id || '\\w+' // Get all documents by default
  params['stack_id'] = req.query.stack_id || 'default' // not needed yet, but will be

  const regex = '^(?:img/){1}(?:${doc_id:raw})(?:_input.pdf).*\/(.*[^\\d])(:?\\d+.png)$'

  try {
    let types = await db.any(
      `WITH a AS (
      SELECT DISTINCT
        substring(
          target_img_path, '$(regex)'
        ) AS type
      FROM equations.figures_and_tables
      )
      SELECT * FROM a
      WHERE type IS NOT null
      ORDER BY type ASC`, params
    );
    res.reply(req,res, next, types);
  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
};

module.exports = {
  path: '/model/extraction-type',
  displayPath: '/model/extraction-type',
  methods: ['GET'],
  description: 'Retrieve model extracted entity types',
  parameters: {
    'doc_id': {
      'type': 'text',
      'description': 'Document on which to focus'
    },
  },
  requiredParameters: [ ],
  requiresOneOf: [ ],
  fields: {
    'doc_id': {
      'type': 'text',
      'description': 'Document on which to focus'
    },
  },
  examples: [
    '/api/v1/model/extraction-type?doc_id=1',
  ],
  handler: handler
}

