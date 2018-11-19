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
- `/tags [GET]`: array of possible tags as `{id,name?,description?,
  color?}` objects
- `/image/<id>/tags [GET]`: currently set tags for an image
- `image/<id>/tags [POST]`: set tags on an image, as
  an array of `{x,y,width,height,tag: tag.id}` objects

Additional API routes could be added to expand functionality,
but have not yet been implemented:

- `/images [GET]`: URL and number of tags on each potential image

Of course, the images need to be accessible at whatever URL is returned by
the API.

## Installation

Building the UI requires the [Parcel](https://parceljs.org/) bundler to be installed
globally, so the full installation process is

```
npm install -g parcel-bundler
npm install
```

After this, a development version with hot reloading can be run on
`localhost` using `npm run-script watch`.
A space-efficient production build can be obtained using
`npm run-script build` and copied to the webserver (assumed right now
to be at the sub-directory `image-tagger/`) on the server.

