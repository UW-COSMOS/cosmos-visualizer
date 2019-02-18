/*
Handler for both `image` and `image_prediction` routes
*/
const {wrapHandler} = require('./util')

module.exports = (type)=> {
  /* If type is prediction we are only going to get images
   * that are in a stack marked 'prediction', same goes for
   * annotation type */
  if (!['prediction','annotation'].includes(type)) {
    throw "Only 'prediction' and 'annotation' are supported"
  }

  const baseSelect = `
    SELECT
      i.image_id,
      doc_id,
      page_no,
      stack_id stack,
      file_path,
      i.created
    FROM image i
    JOIN image_stack istack USING (image_id)
    JOIN stack USING (stack_id)`

  const handler = async (req, res, next, plugins) => {
    const {db} = plugins;
    if (req.query.image_id === 'next') {
      let row = await db.one(`
        ${baseSelect}
        WHERE (
              tag_start IS NULL
           OR tag_start < now() - interval '5 minutes' )
          AND image_id NOT IN (SELECT image_id FROM image_tag JOIN image_stack USING (image_stack_id))
          AND stack_type = $1
        ORDER BY random()
        LIMIT 1`, [type]);
      await db.query(`
        UPDATE image
        SET tag_start = now()
        WHERE image_id = $1`, [row.image_id]);
      res.reply(req, res, next, row);

    } else if ( req.query.image_id === 'validate') {
      let where = 'WHERE true'
      let params = []
      if (req.query.validated == false) {
        where = 'WHERE validator IS NULL'
      } else if (req.query.validated == true) {
        where = 'WHERE validator IS NOT NULL'
      }
      where += "\nAND stack_type = $1"

      try {
        let row = await db.one(`
          ${baseSelect}
          JOIN image_tag it
            ON istack.image_stack_id = it.image_stack_id
          ${where}
          ORDER BY random()
          LIMIT 1`, [type]);

        if (!row) {
          return res.reply(req, res, next, []);
        } else {
          return res.reply(req, res, next, row);
        }

        // Update the tag start
        await db.none(`
          UPDATE image
          SET tag_start = now()
          WHERE image_id = $1`, [row.image_id]);

      } catch(error) {
        console.log(error)
        return res.error(req, res, next, 'An internal error occurred', 500)
      }
      res.reply(req, res, next, row);
    } else {
      let row = await db.one(`
        ${baseSelect}
        WHERE image_id = $1`,
        [req.query.image_id]
      );
      res.reply(req, res, next, row);
    }
  }

  return wrapHandler(handler);
};
