# COSMOS visualizer

The **COSMOS** visualizer is the main application that stores and visualizes
training and model-result data for the **COSMOS** knowledge-base extraction
pipeline. It constitutes the backing data store and API powering the
[**COSMOS** visualizer frontend](https://github.com/UW-COSMOS/cosmos-visualizer-frontend),
a set of web-based UI components.

The visualizer includes several components:

- A **PostgreSQL** database server that contains training data and model extractions
- A **node express**-based API that bridges the data store and user interface
- The visualizer frontend (packaged as a submodule)
- A set of **python** scripts to import structured model output into the extractions database.

## Setup

First install dependencies  
````
npm install
````

Next, you will need to create an API key used for authenticated requests. Start
by copying the template file to a new file  
````
cp api_key.js.example api_key.js
````

Add a unique string to `api_key.js`. The recommended method is to create a UUID
using the following command:  
````
node -e "const uuidv4 = require('uuid/v4'); console.log(uuidv4());"
````

`image-tagger-api` uses an SQLite database to store image metadata and annotations
and must be set up before running. The setup script expects a directory of documents
where each sub-folder is the name of the document, and each contains a folder named
`png` that contains images in the format `page_<page_no>.png`

````
my_documents
  documentA
    png
      page_1.png
      page_2.png
  documentB
    png
      page_1.png
      page_2.png
````

Run the setup script, pointing it at the folder of documents. It takes two parameters:
1) the name of the directory, and optionally 2) a name for this import of documents, which
defaults to the name of the directory if omitted:

````
node setup.js my_documents import1
````

This will create `annotations.sqlite` and import the metadata of those documents


## Running

````
npm start
````


## Routes

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
**Description**: Return or create users.  
**Parameters**:  
  + `key` : String : required when creating a new user
