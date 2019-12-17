/*
Handler for both `image` and `image_prediction` routes

Takes
*/
const {wrapHandler, buildWhereClause} = require('./util')

const recordTaggingStarted = async (db, image_id)=> {
  /* Record the start time for tagging (NOTE: this will overwrite earlier instances,
     but these should not be returned in the first place. This behavior might
     be undesired and could be changed) */
  await db.none(`
    UPDATE image
    SET tag_start = now()
    WHERE image_id = $1`, [image_id]);
};

module.exports = ()=> {

  const baseSelect = `
    SELECT
      i.image_id,
      i.doc_id,
      i.page_no,
      stack_id,
      file_path,
      i.created
    FROM image i
    JOIN image_stack istack USING (image_id)
    JOIN stack USING (stack_id)`

  const handler = async (req, res, next, plugins) => {
    const {db} = plugins;
    let query;
    let params={};

    // We always expect the stack type to be defined
    let filters = [
      "stack_type = $(stack_type)"
    ];
    let imageFilters = [];

    if (req.query.stack_id) {
        filters.push('stack_id = $(stack_id)');
        params['stack_id'] = req.query.stack_id;
    }

    if (process.env.MAGIC_MODE === '1'){
        if (req.query.doc_id) {
            imageFilters.push('i.doc_id = $(doc_id)');
            params['doc_id'] = req.query.doc_id;
        }
        if (req.query.page_no) {
            imageFilters.push('i.page_no = $(page_no)');
            params['page_no'] = req.query.page_no;
        }
    }

    /* This gets us the next ALREADY TAGGED image */
    if (req.query.image_id === 'next') {
      params['stack_type'] = 'annotation';

      let mainFilters = [
        ...filters,
        `(tag_start IS NULL OR tag_start < now() - interval '5 minutes')`,
        `image_id NOT IN (SELECT image_id FROM annotated)`
      ];

      query = `
        WITH annotation_stack AS (
          SELECT *
          FROM image_stack
          JOIN stack USING (stack_id)
          ${buildWhereClause(filters)}
        ),
        annotated AS (
          SELECT image_id
          FROM image_tag
          JOIN annotation_stack USING (image_stack_id)
        )
        ${baseSelect}
        ${buildWhereClause([...mainFilters, ...imageFilters])}`

    } else if ( req.query.image_id === 'validate') {

      params['stack_type'] = 'annotation'
      if (req.query.validated == false) {
        filters.push('validator IS NULL');
      } else if (req.query.validated == true) {
        filters.push('validator IS NOT NULL');
      }

      query = `
        ${baseSelect}
        JOIN image_tag it
        USING (image_stack_id)
        ${buildWhereClause([...filters, ...imageFilters])}`;

    } else if ( req.query.image_id === 'next_prediction') {

      params['stack_type'] = 'prediction';

      query = `
       ${baseSelect}
       ${buildWhereClause([...filters, ...imageFilters])}`;

    } else if ( req.query.image_id === 'next_eqn_prediction') {
      //TODO : this type should key into the stack_type column in the stack table instead of the stack_id like it does now
      params['stack_type'] = 'prediction';

      // Make sure we only get images with phrases or tags
      query = `
        ${baseSelect}
        JOIN equations.equation p
          ON p.image_id = i.image_id
        ${buildWhereClause([...filters, ...imageFilters])}`;

    } else {
      // Reset filters entirely, so we don't expect a specific stack type
      filters = [];

      if ('image_id' in req.query) {
        filters.push("image_id = $(image_id)");
        params['image_id'] = req.query.image_id;
      }
      // Ignore preset filters
      if (  'stack_id' in params ) {
        // Return that specific stack id
        filters.push("stack_id = $(stack_id)");
        query = `
          ${baseSelect}
          ${buildWhereClause([...filters, ...imageFilters])}`;
      } else {
        /*
        No specific stack_id is expected, so we return a list of stacks which contain
        this image
        */
        query = `
          ${baseSelect.replace("stack_id,", "array_agg(stack.stack_id) stack_ids,")}
          ${buildWhereClause([...filters, ...imageFilters])}
          GROUP BY image_id, doc_id, page_no, file_path, created `;
      }
    }

    query += ` ORDER BY random() LIMIT 1`

    let row = await db.one(query, params);

    if ('stack_type' in params && params['stack_type'] === 'annotation') {
      await recordTaggingStarted(db, row.image_id);
    }

    if (!row) { row = [] }
    return res.reply(req, res, next, row);

  }

  return wrapHandler(handler);
};
