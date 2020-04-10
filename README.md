# COSMOS visualizer

The **COSMOS** visualizer codebase consists of several applications
that build training datasets and showcase model results for
the **COSMOS** knowledge-base extraction pipeline.
Separate apps for *Tagging*, *validation*, and *knowledge-base visualization*
are included.

## Setup and installation

The *Validation* and *Visualization* apps can be run using the following steps:

### Docker development

1. Pull submodules: `git submodule update --init`
2. Copy the `.env.example` file to `.env` and modify the values to your setup.
   A running **COSMOS** pipeline exposing a search API must be specified here.
3.  Run the script `bin/run-frontend [--production] <validation|visualizer>`.
    This will spin up `docker-compose` for either the `validation` or `visualizer`
    apps, using the correct settings for production if that flag is specified, or
    enabling continuous rebuilding for frontend development if not.
    Note: as of April 1, 2020, development mode with code reloading is broken in
    Docker. Use local development strategy.

### Local development

1. Pull submodules: `git submodule update --init`
2. Move to frontend directory: `cd frontend-shared`
3. Copy the `local-env.example.sh` file to `local-env.sh` and modify
   the values to your setup. A running **COSMOS** pipeline
   exposing a search API must be specified here.
4. Install NPM modules: `npm install`
5. Run webpack bundler and dev server: `./run-local <validation|visualizer>`  
   (`npm run dev` is aliased to `./run-local visualizer`).
6. The frontend will be available on `localhost:8080`.

Make sure to test a production bundle in Docker (`bin/run-frontend --production visualizer`)
before pushing code. We should probably set up CI for this command specifically.

## Tagging application

The *Tagging* application is relatively complex due to its
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

````
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
````

### API Routes

#### /image/:image_id  
**Methods**: `GET`  
**Description**: Return or create annotations. The `image_id` parameter can be replaced with `next` to get a random image for annotation or `validate` to get a random image for validation.  
**Parameters**:
  + `validated` : Boolean : when used with `validate`, returns only images that have or have not already been validated

#### /image/:image_id/tags  
**Methods**: `GET`, `POST`  
**Description**: Return or create annotations.


#### /tags/:tag_id?  
**Methods**: `GET`  
**Description**: Get available tags and their descriptions. All tags can be retrieved by passing `all` as the `tag_id`


#### /people/:person_id?
**Methods**: `GET`, `POST`  
**Description**: Return users.  

## Credits

This work was funded by DARPA ASKE HR00111990013.

- Visualizer: Daven Quinn, Ian Ross
- Model: Ankur Goswami, Josh McGrath, Paul Luh, and Zifan Liu
- Integration: Ian Ross
- Project lead: Theodoros Rekatsinas, Shanan Peters, and Miron Livny

## License and Acknowledgements
All development work supported by DAPRA ASKE HR00111990013 and UW-Madison.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this repo except in compliance with the License.
You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
