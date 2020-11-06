# COSMOS visualizer frontend

The **COSMOS** visualizer frontend is a set of user interface components
that implement tagging and results-viewing functionality to support the
**COSMOS** knowledge-base extraction pipeline. The goal is to create a set
of user-interface components to enable training of the model and interaction
with its output.

The web components are built using [React](https://reactjs.org)
and [Typescript](https://typescriptlang.org), with standard
user-interface primitives provided by [Blueprint.js](https://blueprintjs.com)
and [the Macrostrat project](https://github.com/UW-Macrostrat/ui-components)

## Running

This repository houses three user interfaces, which can be run independently
using the commands in the `bin/` folder.

## Image tagging

Image-Tagger is a basic web UI that allows the definition of rectangular
tagged areas on images for an arbitrary list of object categories. It is designed
for both rapid, distributed generation of training data for machine learning models
and viewing of model classification results.

Rectangular areas were sufficient for initial tagging of
parts of a scientific paper (figures, tables, etc.). However, the ability
to define multi-rectangular tags was added to allow the tagging and
representation of textual entities split over multiple lines, or tokenized
into individual words. In addition, the interface supports tagging relationships between
entities.

Unlike similar tools, Image-Tagger is open-source, client-side software,
decoupled from its backend (although it works best with
the [**COSMOS visualizer**](https://github.com/UW-COSMOS/cosmos-visualizer).

## Results viewer

The **COSMOS** results viewer [**DEMO**](http://birdnest.geology.wisc.edu/cosmos/)
exposes page- and token-level model extractions from the
**COSMOS** pipeline for introspection. It also implements knowledge-base
search functionality over the extracted model results.
The viewer is built on the same UI components as the Image-Tagger
interface and requires a similar API backend to
function.

## API interface

The visualizer frontend is a client-side application that requires
specification of a base API route on initialization; this API can be
implemented in any way. Image-Tagger requires a simple API interface:

- `/image [GET]`: returns the URL of the next image to tag, and
  its natural size `{url, width, height}`
- `/tags [GET]`: array of possible tags as `{id,name?,description?, color?}` objects. If `name` is not provided, it will be guessed
  from the `id`. If `color` isn't given, an arbitrary color will
  be assigned.

- `/image/<id>/tags [GET]`: currently set tags for an image
- `image/<id>/tags [POST]`: set tags on an image, as
  an array of `{x,y,width,height,tag: tag.id}` objects

The model results viewer requires a similar API, with
additional routes for phrases and variables. This part of
the UI code is more tightly coupled to the API included
with the [**COSMOS visualizer**](https://github.com/UW-COSMOS/cosmos-visualizer)
backend.

## Options settable from environment variables

Environment variables can be used to set several variables that might
change with different locations of the server.

- `PUBLIC_URL`: the URL basename the app will be served from (defaults to`/`)
- `API_BASE_URL`: the URL path for [`cosmos-visualizer`](https://github.com/UW-COSMOS/cosmos-visualizer) or a parallel API
- `IMAGE_BASE_URL`: the URL path beneath which images are stored

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

This entire build process can be automated by building the `Dockerfile`
in the main repository. Running with the environment variable
`DEBUG=1` will build the UI with watch mode enabled.

## Credits

This work was funded by DARPA ASKE HR00111990013.
User-interface developed by [Daven Quinn](https://davenquinn.com).
