# COSMOS visualizer

The **COSMOS** visualizer codebase consists of several applications
that build training datasets and showcase model results for
the **COSMOS** knowledge-base extraction pipeline.

# Repository structure

This repository organizes several applications that facilitate the COSMOS
data pipeline, including collecting model training data and providing searchable
interfaces over the output. These interfaces reuse common components, and the repository
is structured to maintain independence between the apps with minimal code duplication.
In **Version 2** (December 2020), this repository was reorganized as a "monorepo" with
a structure for many packages within a common workspace.

## Applications

Applications, housed in the `apps/*` directories, are all built with a common
Webpack configuration. Several apps are provided:

- `tagger-demo`: A single-page demo of the training-data collection interface, for debugging purposes
- `tagger-xdd`: A tagging application to sit atop the COSMOS deployment backed by [xDD](https://xdd.wisc.edu).
- `visualizer`: A standalone visualizer application.
- `visualizer-xdd`: A visualizer application to sit atop different "sets" of documents managed by xDD.
  This is the a key public interface for our Phase 2 ASKE work of integrating xDD and COSMOS. A running instance
  can be found [here](https://xdddev.chtc.io/set_visualizer).

Each application directory contains a `Dockerfile` allowing
that application to be built into a container. For now, each of these `Dockerfile`s
must use the root directory of this repository as their context.

Some of the applications expect or allow configuration with environment variables.
Sensible defaults are provided where possible. For local development, default values
can be overridden by setting environment variables or in a `.env` file in the application
directory. For Docker builds, these variables can be specified as build arguments. Check
the `.env.example` or `Dockerfile` in each application directory for more information.

## Shared packages

There is currently a single shared package (the `frontend-shared` directory)
in the repository. Over time, we will split this package into subsidiary packages
within the `packages` directory. Some of these will eventually be published to NPM and/or
spun off into separate repositories.

# Setup and installation

## Local development

This repository is set up for local development and Dockerized deployment. Currently,
all apps are purely frontend code, so S3 static deployments are possible as well.

1. Make sure you have at least NPM version 7 (released late 2020) on your system: we
   require its [workspace support](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
   to bundle our linked packages. You can check this by running `npm --version`, and
   update using `npm install -g npm@7` if you need to upgrade.
2. Install NPM modules in the root of this repository `npm install`
3. Run the app you are interested in, one of two ways:
   - Change to the `apps/<your-app>` directory and run `npm run dev`
   - Most apps provide a shorthand invocation from the root directory: `npm run <your-app>`
4. A [Webpack dev server](https://webpack.js.org/configuration/dev-server/) containing
   the app will be available on `localhost:8080`.

To build for deployment, run `npm install` followed by `npm build` in the
application directory. This will bundle files into the `apps/dist/<your-app>` directory.

## Docker development

`Dockerfile`s are provided for some of the apps. For now, these should be
be used in the root context of this repository, as such:
`docker build -t xdd_cosmos_tagger:latest -f apps/tagger-xdd/Dockerfile .`

Once built, containers can be run on `localhost:8080`:
`docker run -p 8080:80 xdd_cosmos_tagger:latest`.

This sequence of commands is exposed in the `Makefile` for several apps,
so you can spin up a server by using e.g. `make visualizer-xdd`.

Continuous integration is used to build Docker containers for the
xDD tagger and visualizer applications.

# Applications reference

## xDD visualier

The xDD application wraps COSMOS visualizers for all of the document
sets organized within the xDD API. Since all of the endpoint
configuration is provided by the API, it has a much simpler
configuration than the the standalone visualizer (for now).

This app is set up with continuous integration for development and deployment.
The running app can be found [here](https://xdddev.chtc.io/set_visualizer).

## Visualiser

The core visualizer application provides a searchable interface to the output of a
COSMOS pipeline. The `API_BASE_URL` should be set to a running **COSMOS** pipeline
exposing a search API.

The `API_ERROR_MESSAGE`: environment variable can be provided to forward an error
to the user in case of API outage. This disables all search functionality if set.

# Credits

This work was funded by DARPA ASKE HR00111990013.

- Visualizer: Daven Quinn, Ian Ross
- Model: Ankur Goswami, Josh McGrath, Paul Luh, and Zifan Liu
- Integration: Ian Ross
- Project lead: Theodoros Rekatsinas, Shanan Peters, and Miron Livny

# Changelog

## [2.0.0-beta] December 2020

- Add ability to control image zoom during tagging
- Add "document stack" awareness to xDD tagger application
- Add continuous integration using Github Actions
- Add xDD tagger and visualizer applications
- Move API code to `__archive` folder (now API is managed separately).
- Reorganize repository into monorepo pattern
- Start keeping changelog

# License and Acknowledgements

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
