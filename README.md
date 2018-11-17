# Image-Tagger

Image-tagger is a *really* basic web UI that allows the definition of rectangular
tagged areas on images for an arbitrary list of object categories. It is designed
for rapid, distributed generation of training data for machine learning models.
Rectangular areas are sufficient for the initially envisioned use case of
categorizing parts of a scientific paper (figures, tables, etc.).

Unlike other tools of its ilk, image-tagger is completely decoupled from its backend.
It requires specification of a base API route on initialization; this API can be
implemented however but is expected to have several routes:

- `/image [GET]`: returns the URL of the next image to tag, and
  its natural size `{url, width, height}`
- `/tags [GET]`: list of possible tags
- `/tags [POST]`: set tags on an image, as
  an array of `{x,y,width,height,tag: "TAG_NAME"}` objects

Additional API routes could be added to expand functionality,
but have not yet been implemented:

- `/images [GET]`: URL and number of tags on each potential image
- `/image/<image_id>/tags [GET]`: currently set tags for an image

Of course, the images need to be accessible at whatever URL is returned by
the API.

## Installation

Building the UI requires the [Parcel](https://parceljs.org/) bundler to be installed
globally, so the full installation process is

```
npm install -g parcel-bundler
npm install
```

After this, a development version can be run using
`parcel index.html`.

