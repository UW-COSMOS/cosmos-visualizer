# Image-Tagger

Image-tagger is basic web UI that allows the definition of rectangular
tagged areas on images for an arbitrary list of object categories. It is designed
for both rapid, distributed generation of training data for machine learning models
and viewing of model classification results.
This frontend was created to support the COSMOS knowledge-base extraction pipeline.

Rectangular areas were sufficient for the initially envisioned use case of
categorizing parts of a scientific paper (figures, tables, etc.), but the ability
to define multi-rectangular tags was added recently to allow the incorporation
of entities split over lines.

Unlike similar tools, image-tagger is open-source, client-side software. It is
completely decoupled from its backend.
It requires specification of a base API route on initialization; this API can be
implemented however but is expected to have several routes:

- `/image [GET]`: returns the URL of the next image to tag, and
  its natural size `{url, width, height}`
- `/tags [GET]`: array of possible tags as `{id,name?,description?,
  color?}` objects. If `name` is not provided, it will be guessed
  from the `id`. If `color` isn't given, an arbitrary color will
  be assigned.

- `/image/<id>/tags [GET]`: currently set tags for an image
- `image/<id>/tags [POST]`: set tags on an image, as
  an array of `{x,y,width,height,tag: tag.id}` objects

## Options settable from environment variables

Environment variables can be used to set several variables that might
change with different locations of the server.

- `PUBLIC_URL`: the URL basename the app will be served from (defaults to`/`)
- `API_BASE_URL`: the URL path for [`image-tagger-api`](https://github.com/UW-COSMOS/image-tagger-api)
- `IMAGE_BASE_URL`: the URL path beneath which images are stored


## Next steps

A few features we might wish to add:

[ ] Sub-tags (e.g. `figure > figure-part`) to define hierarchies of data.
[ ] Scaling large images in the UI.
[ ] Modifier tokens: array of tag-like modifiers for each tag for
    increased semantic depth (*this could be unhelpful for some
    workflows*)

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
`http://localhost:1234` using `npm run-script watch`.
A space-efficient production build can be obtained using
`npm run-script build` and copied to the webserver (assumed right now
to be at the sub-directory `image-tagger/`) on the server.
