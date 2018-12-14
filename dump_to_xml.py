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
import sqlite3
import os, sys
from PIL import Image
from shutil import copyfile
conn = sqlite3.connect('annotations.sqlite')
conn.row_factory = sqlite3.Row
cur_images = conn.cursor()
cur = conn.cursor()

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

    cur_images.execute("SELECT DISTINCT(image_id) FROM image_tags WHERE tagger IS NOT NULL;")
    for image in cur_images.fetchall():
        E = lxml.builder.ElementMaker()
        ROOT = E.annotation
        FOLDER = E.folder
        FILENAME = E.filename
        SIZE = E.size
        OBJ = E.object
        cur.execute("SELECT * FROM images WHERE image_id=?", (image["image_id"], ))
        img = cur.fetchone()
        imge = Image.open("%s/%s" % (input_dir, img["file_path"]))
        oldwidth, oldheight = imge.size
        scalefactor = min(1920/oldwidth, 1920/oldheight)
        imge.thumbnail((1920, 1920), Image.ANTIALIAS)
        width, height = imge.size

        the_doc = ROOT(
                FOLDER("COSMOS_annotated"),
                FILENAME(image["image_id"] + ".png"),
                SIZE(E.width(str(width)), E.height(str(height))),
                )
        cur.execute("SELECT * FROM image_tags INNER JOIN tags ON image_tags.tag_id=tags.tag_id WHERE image_id=?", (img["image_id"],))
        for img_tag in cur:
            x = int(scalefactor*img_tag['x'])
            y = int(scalefactor*img_tag['y'])
            width = int(scalefactor*img_tag['width'])
            height = int(scalefactor*img_tag['height'])

            the_doc.append(E.object(E.name(img_tag['name']), E.bndbox(E.xmin(str(x)), E.ymin(str(y)), E.xmax(str(x + width)), E.ymax(str(y+height)))))
        with open("%s/annotations/%s.xml" % (output_dir, image["image_id"]), "wb") as fout:
            fout.write(lxml.etree.tostring(the_doc, pretty_print=True))

        # copy from img['file_path'] to images/%s.png % img["image_id"]
        imge.save("%s/images/%s.png" % (output_dir, img["image_id"]))
