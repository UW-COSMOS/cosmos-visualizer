"""
File: dump_to_xml.py
Author: Ian Ross
Email: iross@cs.wisc.edu
Description: Quick way to dump the annotations into VOC-formatted XML. As a
bonus (or a curse), it also resizes the images + bboxes to have a max dimension
of 1920 pixels.
"""

import lxml.etree
import lxml.builder
import psycopg2, psycopg2.extras
import os, sys
from PIL import Image
from shutil import copyfile
conn = psycopg2.connect("host=db port=5432 dbname=annotations user=postgres")
cur_images = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

def get_bbox_from_geom(geom):
    geom = [float(x) for x in geom]
    x = geom[0]
    y = geom[1]
    width = geom[2] - geom[0]
    height = geom[3] - geom[1]
    return x, y, width, height

if __name__ == '__main__':
    if len(sys.argv) <= 2:
        print("Please specify and input and output directory! python dump_to_xml.py [location_of_images] [output]")
        sys.exit(1)
    input_dir = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists("%s/" % output_dir):
        os.mkdir("%s" % output_dir)
    if not os.path.exists("%s/annotations" % output_dir):
        os.mkdir("%s/annotations" % output_dir)
    if not os.path.exists("%s/images" % output_dir):
        os.mkdir("%s/images" % output_dir)

    cur_images.execute("""
        SELECT DISTINCT(image_id), it.image_stack_id FROM image_tag it
            INNER JOIN image_stack istack ON istack.image_stack_id = it.image_stack_id
            WHERE it.tagger IS NOT NULL;
        """)

    for image in cur_images.fetchall():
        E = lxml.builder.ElementMaker()
        ROOT = E.annotation
        FOLDER = E.folder
        FILENAME = E.filename
        SIZE = E.size
        OBJ = E.object
        cur.execute("SELECT * FROM image WHERE image_id=%s", (image["image_id"], ))
        img = cur.fetchone()
        try:
            imge = Image.open(os.path.join(input_dir, img["file_path"]))
        except IOError:
            print(f"Couldn't find image at {os.path.join(input_dir, img['file_path'])}! Skipping.")
            continue
        oldwidth, oldheight = imge.size
        scalefactor = min(1920/oldwidth, 1920/oldheight)
        imge.thumbnail((1920, 1920), Image.ANTIALIAS)
        width, height = imge.size

        the_doc = ROOT(
                FOLDER("COSMOS_annotated"),
                FILENAME(image["image_id"] + ".png"),
                SIZE(E.width(str(width)), E.height(str(height))),
                )
        cur.execute("SELECT *, bbox_array(geometry) bboxes FROM image_tag INNER JOIN tag ON image_tag.tag_id=tag.tag_id WHERE image_stack_id=%s", (image["image_stack_id"],))
        for img_tag in cur:
            for bbox in img_tag["bboxes"]:
                x, y, width, height = get_bbox_from_geom(bbox)
                the_doc.append(E.object(E.name(img_tag['name']), E.tag_id(img_tag["image_tag_id"]), E.linked_to("" if img_tag["linked_to"] is None else img_tag["linked_to"]), E.bndbox(E.xmin(str(x)), E.ymin(str(y)), E.xmax(str(x + width)), E.ymax(str(y+height)))))

        with open("%s/annotations/%s.xml" % (output_dir, image["image_id"]), "wb") as fout:
            fout.write(lxml.etree.tostring(the_doc, pretty_print=True))

        # copy from img['file_path'] to images/%s.png % img["image_id"]
        imge.save("%s/images/%s.png" % (output_dir, img["image_id"]))

