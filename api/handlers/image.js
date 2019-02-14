/*
Handler for both `image` and `image_prediction` routes
*/
module.exports = (tablename)=> {
  return async (req, res, next, plugins) => {
    const {db} = plugins;
    if (req.query.image_id === 'next') {
      let row = await db.one(`
        SELECT
          image_id,
          doc_id,
          page_no,
          stack,
          file_path,
          created
        FROM ${tablename}
        WHERE (tag_start IS NULL OR tag_start < datetime('now', '-5 minutes'))
          AND image_id NOT IN (SELECT image_id FROM image_tags)
        ORDER BY random()
        LIMIT 1`);
      await db.query(`
        UPDATE ${tablename}
        SET tag_start = current_timestamp
        WHERE image_id = $1`, [row.image_id]);
      res.reply(req, res, next, row);

    } else if ( req.query.image_id === 'validate') {
      let where = ''
      let params = []
      if (req.query.validated == false) {
        where = 'WHERE validator IS NULL'
      } else if (req.query.validated == true) {
        where = 'WHERE validator IS NOT NULL'
      } else {
        where = ''
      }
      try {
        let row = await db.one(`
          SELECT
            i.image_id,
            doc_id,
            page_no,
            stack,
            file_path,
            i.created
          FROM ${tablename} i
          JOIN image_tag it
            ON i.image_id = it.image_id
          ${where}
          ORDER BY random()
          LIMIT 1`);

        if (!row) {
          return res.reply(req, res, next, []);
        }

        // Update the tag start
        await db.none(`
          UPDATE ${tablename}
          SET tag_start = current_timestamp
          WHERE image_id = $1`, [row.image_id]);

      } catch(error) {
        console.log(error)
        return res.error(req, res, next, 'An internal error occurred', 500)
      }
      res.reply(req, res, next, row);
    } else {
      let row = await db.one(`
        SELECT
          image_id,
          doc_id,
          page_no,
          stack,
          file_path,
          created
        FROM ${tablename}
        WHERE image_id = $1`,
        [row.image_id]
      );
      res.reply(req, res, next, row);
    }
  }
};
