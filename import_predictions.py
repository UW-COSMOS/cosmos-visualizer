"""
File: import_segmentations.py
Author: Ian Ross
Email: iross@cs.wisc.edu
Description: # TODO
"""
import uuid
import lxml.etree as etree
import sqlite3
import psycopg2
import glob
import os, sys
from PIL import Image
from shutil import copyfile


#conn = psycopg2.connect('postgres://postgres@db:5432/annotations')
conn = psycopg2.connect('postgres://postgres@localhost:54321/annotations')
cur_images = conn.cursor()
cur = conn.cursor()
cur.execute("SELECT tag_id, name FROM tag;")
tag_map = {}
for tag in cur:
    tag_map[tag[1]] = tag[0]

if __name__ == '__main__':
    # Need as input: pile of xml, pile of pngs
    if len(sys.argv) <= 2:
        print("Please specify xml and PNG directories! python import_segmentations.py [location_of_xmls] [location_of_pngs]")
        sys.exit(1)
    xml_path = sys.argv[1]
    png_path = sys.argv[2]
    if len(sys.argv) == 4:
        stack = sys.argv[3]
    else:
        stack = "default"

    cur.execute("INSERT INTO stack (stack_id, stack_type) VALUES (%s, %s) ON CONFLICT DO NOTHING;", (stack, "prediction"))
    conn.commit()

    for xml in glob.glob("%s/*.xml" % xml_path):
        with open(xml) as fin:
            doc = etree.parse(fin)

        # TODO: these filepaths need to be cleaned up/corrected/mapped to the 'live' pile
        try:
            image_filepath = glob.glob("%s/%s" % (png_path, doc.xpath("//filename/text()")[0]))[0]
#            image_filepath = glob.glob("%s/%s*png" % (png_path, xml.replace(xml_path, "").replace(".xml","")))[0]
        except:
            # TODO?: try to find the image some other way?
            print("Couldn't find PNG associated with %s! Skipping." % xml)
            print("\tExpected: %s/%s" % (png_path, doc.xpath("//filename/text()")[0]))
        imge = Image.open(image_filepath)
        image_width, image_height = imge.size

        # TODO: we'll keep track of these as we run them (embedded in file names, most likely)

        # doc_id = TODO: need to map these back to the GDD docid
        doc_id, page_no = os.path.basename(xml).split(".pdf_")
        page_no = int(os.path.splitext(page_no)[0])
        # page_no = TODO

        # ASSUME: These all come out of the standard pipeline, with the file naming scheme of [docid].pdf_[pageno].[png/xml]

        cur.execute("SELECT image_id FROM image WHERE doc_id=%s AND page_no=%s", (doc_id, page_no))
        check = cur.fetchone()
        if check is None:
            image_id = uuid.uuid4()
        else:
            image_id = check[0]

        # TODO: image_filepath needs to be relative to the "base" image path (e.g. /images/ when internal to the docker container)

        cur.execute("INSERT INTO image (image_id, doc_id, page_no, file_path) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;", (str(image_id), doc_id, page_no, image_filepath))
        cur.execute("INSERT INTO image_stack (image_id, stack_id) VALUES (%s, %s) RETURNING image_stack_id", (str(image_id), stack))
        image_stack_id = cur.fetchone()[0]
        conn.commit()

        # loop through tags
        for record in doc.xpath("//object"):
            image_tag_id = uuid.uuid4()
            tag_name = record.xpath('name/text()')[0]
            tag_id = tag_map[tag_name]
            xmin = int(record.xpath('bndbox/xmin/text()')[0])
            ymin = int(record.xpath('bndbox/ymin/text()')[0])
            xmax = int(record.xpath('bndbox/xmax/text()')[0])
            ymax = int(record.xpath('bndbox/ymax/text()')[0])

            cur.execute("INSERT INTO image_tag (image_tag_id, image_stack_id, tag_id, geometry) VALUES (%s, %s, %s, ST_Collect(ARRAY[ST_MakeEnvelope(%s, %s, %s, %s)])) ON CONFLICT DO NOTHING;", (str(image_tag_id), image_stack_id, tag_id, xmin, ymin, xmax, ymax))

            conn.commit()

