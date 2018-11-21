# image-tagger-api

Providers for https://github.com/UW-Macrostrat/image-tagger

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

#### /image/:image_id/tags
**Methods**: `GET`, `POST`  
**Description**: Return or annotations. To get a random set of tags for validating,
pass `validate` in place of an `image_id`


#### /people/:person_id?
**Methods**: `GET`, `POST`  
**Description**: Return or create users  
