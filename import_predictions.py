"""
File: import_segmentations.py
Author: Ian Ross
Email: iross@cs.wisc.edu
Description: # TODO
"""
import uuid
import lxml.etree as etree
import sqlite3
import glob
import os, sys
from PIL import Image
from shutil import copyfile
conn = sqlite3.connect('annotations.sqlite')
conn.row_factory = sqlite3.Row
cur_images = conn.cursor()
cur = conn.cursor()
cur.execute("SELECT tag_id, name FROM tags;")
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

    # for each image, need image_id|doc_id|page_no|stack|height|width|file_path|tag_start|created
    # for each tag, need image_tag_id|image_id|tag_id|tagger|validator|x|y|width|height|created
    # need to associate

    for xml in glob.glob("%s/*.xml" % xml_path):
        with open(xml) as fin:
            doc = etree.parse(fin)
        #in this initial set.
        image_id = uuid.uuid4()

        # TODO: these filepaths need to be cleaned up/corrected/mapped to the 'live' pile
        try:
            image_filepath = glob.glob("%s/%s*png" % (png_path, xml.replace(xml_path, "").replace(".xml","")))[0]
        except:
            print("Couldn't find PNG associated with %s! Skipping." % xml)
        imge = Image.open(image_filepath)
        image_width, image_height = imge.size
        h_ratio = image_height/1920
        w_ratio = image_width/1920

        w_diff = float(1920-image_width)
        h_diff = float(1920-image_height)
        w_diff = 0
        h_diff = 0

        # TODO: we'll keep track of these as we run them (embedded in file names, most likely)
        # doc_id = TODO: need to map these back to the GDD docid
        # stack = TODO
        # page_no = TODO

        cur.execute("INSERT INTO images_predictions (image_id, height, width, file_path) VALUES (?, ?, ?, ?);", (str(image_id), image_height, image_width, image_filepath))
        conn.commit()

        # loop through tags
        for record in doc.xpath("//object"):
            image_tag_id = uuid.uuid4()
            tag_name = record.xpath('name/text()')[0]
            tag_id = tag_map[tag_name]
            xmin = int(record.xpath('bndbox/xmin/text()')[0])-w_diff/2
            ymin = int(record.xpath('bndbox/ymin/text()')[0])-h_diff/2
            xmax = int(record.xpath('bndbox/xmax/text()')[0])-w_diff/2
            ymax = int(record.xpath('bndbox/ymax/text()')[0])-h_diff/2
            width = xmax - xmin
            height = ymax - ymin
            cur.execute("INSERT INTO image_tags_predictions (image_tag_id, image_id, tag_id, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?);", (str(image_tag_id), str(image_id), tag_id, xmin, ymin, width, height))
            conn.commit()
            # insert into blah blah blah




    #    if len(sys.argv) <= 2:
    #        print("Please specify and input and output directory! python dump_to_xml.py [location_of_images] [output]")
    #        sys.exit(1)
    #    input_dir = sys.argv[1]
    #    output_dir = sys.argv[2]
    #
    #    if not os.path.exists("%s/" % output_dir):
    #        os.mkdir("%s" % output_dir)
    #    if not os.path.exists("%s/annotations" % output_dir):
    #        os.mkdir("%s/annotations" % output_dir)
    #    if not os.path.exists("%s/images" % output_dir):
    #        os.mkdir("%s/images" % output_dir)
    #
    #    cur_images.execute("SELECT DISTINCT(image_id) FROM image_tags WHERE tagger IS NOT NULL;")
    #    for image in cur_images.fetchall():
    #        E = lxml.builder.ElementMaker()
    #        ROOT = E.annotation
    #        FOLDER = E.folder
    #        FILENAME = E.filename
    #        SIZE = E.size
    #        OBJ = E.object
    #        cur.execute("SELECT * FROM images WHERE image_id=?", (image["image_id"], ))
    #        img = cur.fetchone()
    #        imge = Image.open("%s/%s" % (input_dir, img["file_path"]))
    #        oldwidth, oldheight = imge.size
    #        scalefactor = min(1920/oldwidth, 1920/oldheight)
    #        imge.thumbnail((1920, 1920), Image.ANTIALIAS)
    #        width, height = imge.size
    #
    #        the_doc = ROOT(
    #                FOLDER("COSMOS_annotated"),
    #                FILENAME(image["image_id"] + ".png"),
    #                SIZE(E.width(str(width)), E.height(str(height))),
    #                )
    #        cur.execute("SELECT * FROM image_tags INNER JOIN tags ON image_tags.tag_id=tags.tag_id WHERE image_id=?", (img["image_id"],))
    #        for img_tag in cur:
    #            x = int(scalefactor*img_tag['x'])
    #            y = int(scalefactor*img_tag['y'])
    #            width = int(scalefactor*img_tag['width'])
    #            height = int(scalefactor*img_tag['height'])
    #
    #            the_doc.append(E.object(E.name(img_tag['name']), E.bndbox(E.xmin(str(x)), E.ymin(str(y)), E.xmax(str(x + width)), E.ymax(str(y+height)))))
    #        with open("%s/annotations/%s.xml" % (output_dir, image["image_id"]), "wb") as fout:
    #            fout.write(lxml.etree.tostring(the_doc, pretty_print=True))
    #
    #        # copy from img['file_path'] to images/%s.png % img["image_id"]
    #        imge.save("%s/images/%s.png" % (output_dir, img["image_id"]))
