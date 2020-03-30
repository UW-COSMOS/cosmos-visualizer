import h from '@macrostrat/hyper';
import classNames from 'classnames';
import {GDDReferenceCard} from '@macrostrat/ui-components';
import {memoize} from 'underscore';
import styled from '@emotion/styled';
import {useAppState, SearchBackend} from './provider'

type ImageProps = {
  bytes: string,
  width?: number,
  height?: number
}

const KBImage = (props: ImageProps)=>{
  const {bytes, ...rest} = props;
  const src="data:image/png;base64," + bytes;
  return h('img', {src, ...rest});
}

const KBCode = (props)=>{
  const {path, entityType, unicode, ...rest} = props;
  return h('div', {style: {'font-family': 'monospace'}}, unicode);
}

const KBExtraction = (props: KBExtractionProps)=>{
  const {unicode, path, className, title, entityType, ...rest} = props;
  className = classNames(className, "extracted-entity");

  return h('div', {className}, [
    h('div.main', [
      h('div.kb-image-container', [
        h('h2', [
          entityType
        ]),
        entityType === "code" ?
          h(KBCode, {path, entityType, unicode, ...rest})
        :
          h(KBImage, {path, entityType, ...rest})
      ])
    ])
  ]);
}

const sanitize = memoize(t => t.toLowerCase());

const MatchSpan = styled.span`\
display: inline-block;
background-color: dodgerblue;
border-radius: 2px;
padding: 1px 2px;
color: white;\
`;

const EntityType = styled.span`\
font-style: italic;
color: #888;
font-weight: 400;\
`;

type DocExtractionProps = {
  data: APIDocumentResult,
  query?: string
}

const DocumentExtractionA = (props: DocExtractionProps)=>{

  let main_img_path = null;
  let main_unicode = null;


  let assoc = null;
  if (assoc_img_path != null) {
    main_img_path = assoc_img_path;
    main_unicode;
    assoc = h(KBExtraction, {
      title: "Associated entity",
      path: assoc_img_path,
      unicode: assoc_unicode
    });
  }

  // Don't assume existence of target
  let target = null;
  if (target_img_path != null) {
    main_img_path = target_img_path;
    main_unicode = target_unicode;
    target = h(KBExtraction, {
      title: "Extracted entity",
      className: 'target',
      path: target_img_path,
      unicode: target_unicode
    });
  }

  // TODO: handle the new format here.
  if (bytes != null) {
    main_img_path = 'page ' + page_num + ' of docid ' + _id.replace('.pdf', '');
    entityType = this.props['class'];
    main_unicode = content;
    assoc = h(KBExtraction, {
      title: "Extracted thing",
      bytes,
      unicode: content,
      path: _id,
      entityType
    });
  }

  if (full_content != null) {
    main_img_path = 'line ' + line_number + ' of file ' + filename;
    main_unicode = full_content;
    entityType = this.props['class'];
    assoc = h(KBExtraction, {
      title: "Extracted thing",
      unicode: content,
      path: _id,
      entityType
    });
  }

  // We don't have a result unless either main or target are defined
  if (main_img_path == null) { return null; }
}

type ExtractionProps = {
  data: APIExtraction,
  query?: string
}

const AllText = ({content})=>{
  return h("p.text", content)
}


const MainExtraction = (props: ExtractionProps)=>{
  const {data} = props
  const {bytes, content} = data

  return h('div.extracted-entity', [
    h('div.main', [
      h('div.kb-image-container', [
        h(KBImage, {bytes}),
        //h(AllText, {content})
      ])
    ])
  ]);
}

function getMainExtraction(data: APIDocumentResult, backend: SearchBackend): APIExtraction {
  switch (backend) {
    case SearchBackend.ElasticSearch:
      return data.children[0]
    case SearchBackend.Anserini:
      return {
        content: data.content,
        bytes: data.header_bytes,
        id: data.header_id,
        page_number: null
      }
  }
}

function getChildExtractions(data: APIDocumentResult, backend: SearchBackend): APIExtraction[] {
  switch (backend) {
    case SearchBackend.ElasticSearch:
      return []
    case SearchBackend.Anserini:
      return data.children
  }
}

const ChildExtractions = (props)=>{
  return h("div.children", props.data.map((d,i)=>{
    return h(MainExtraction, {data: d, key: i})
  }))
}


const DocumentExtraction = (props: DocExtractionProps)=>{
  const {data, query} = props;
  const docid = data.pdf_name.replace(".pdf", "");

  const {searchBackend} = useAppState()
  const main = getMainExtraction(data, searchBackend)
  const children = getChildExtractions(data, searchBackend)

  return h('div.model-extraction', [
    h(MainExtraction, {data: main}),
    h(ChildExtractions, {data: children}),
    h(GDDReferenceCard, {docid})
  ]);
}

export {DocumentExtraction};
