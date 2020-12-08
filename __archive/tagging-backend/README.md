# COSMOS tagging application

A **PostgreSQL**-backed user interface for producing training data for the
COSMOS pipeline. The _Tagging_ application is relatively complex due to its
data-storage requirements. The application includes several components:

- A **PostgreSQL** database server that contains training data and model extractions.
- A **node express**-based API that bridges the data store and user interface.
- A frontend **React** app.
- A **Python**-based importer to move structured model output into the extractions database.

Each of these components can be built as a separate **Docker** container and orchestrated
with **docker-compose**. The entire assemblage can be run with `docker-compose up`. This is
the preferred way to set up, develop, and run this software.

### Running for production

The production implementation of the visualizer pulls images from Dockerhub instead of
building them locally. Run this version on a set of documents
by setting the `PIPELINE_OUTPUT` environment variable to the path to the output to visualize, and then running
`docker-compose -f docker-compose_prod.yml` in the root directory of this repository.

### Running for development

Debug mode enables hot-reloading of the API and compilation of frontend javascript code.

To start, make sure you have the latest version of all submodules with `git submodule update --init`.
Data should be added to the `_data/output-from-pipeline` directory by default. The **PostgreSQL**
cluster will be initialized in the `_data/pg-cluster` directory.

A debug wrapper script, `bin/run-debug`, wraps `docker-compose` to provide the appropriate `DEBUG=1` environment
variable for hot-reloading and local development. The development server will then be accessible at `http://localhost:5002`.

### File structure

The `PIPELINE_OUTPUT` data directory of each model output collection
should maintain a the following format:

```
_data/output_from_pipeline
├── html
│   ├── img     <knowledge-base
│   │   │        extraction images>
│   │   ├── 5512feb1e1382394b500c4e7.pdf_1
│   │   ├── 55684840e1382382d70cf603.pdf_8
│   │   └── 55684840e1382382d70cf603.pdf_9
│   └── merged
├── html_out
│   ├── equations
│   ├── html
│   └── words
├── output.csv
├── tables.csv
├── figures.csv
├── images      <page-level images>
└── xml         <xml extractions>
```

### API Routes

#### /image/:image_id

**Methods**: `GET`  
**Description**: Return or create annotations. The `image_id` parameter can be replaced with `next` to get a random image for annotation or `validate` to get a random image for validation.  
**Parameters**:

- `validated` : Boolean : when used with `validate`, returns only images that have or have not already been validated

#### /image/:image_id/tags

**Methods**: `GET`, `POST`  
**Description**: Return or create annotations.

#### /tags/:tag_id?

**Methods**: `GET`  
**Description**: Get available tags and their descriptions. All tags can be retrieved by passing `all` as the `tag_id`

#### /people/:person_id?

**Methods**: `GET`, `POST`  
**Description**: Return users.
