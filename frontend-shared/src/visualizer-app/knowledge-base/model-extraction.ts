import h from '@macrostrat/hyper';
import classNames from 'classnames';
import {GDDReferenceCard, APIContext} from '@macrostrat/ui-components';
import {Card, ButtonGroup, AnchorButton, FormGroup} from '@blueprintjs/core'
import {memoize} from 'underscore';
import {useContext} from 'react';
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
        content: data.header_content,
        cls: data.header_cls,
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
      // TODO: filter duplicate children on the backend
      return data.children.filter(d => d.id != data.header_id)
  }
}

const ChildExtractions = (props)=>{
  return h("div.children", props.data.map((d,i)=>{
    return h(MainExtraction, {data: d, key: i})
  }))
}

const DownloadButtons = (props: {data: APIExtraction[]})=>{
  const {data} = props
  const {baseURL} = useContext(APIContext)
  const base = baseURL.replace(":5010/api/v1", ":8081/search")

  const content = data.reduce((v,d)=>v+d.content+"\n\n", "")

  //const href = "data:application/octet-stream," + encodeURIComponent(content)
  const href = "data:text/plain," + encodeURIComponent(content)

  const table = data.find(d => d.cls == "Table")

  return h("div.download-extractions", [
    h("h4", "Extracted data"),
    h(ButtonGroup, {className: "downloads"}, [
      h(AnchorButton, {text:"OCR output", href, target: "_blank", small: true}),
      h.if(table != null)([
        h(AnchorButton, {text:"Table preview", href: base+`/preview?id=${table?.id}`, target: "_blank", small: true}),
        h(AnchorButton, {text:"Pandas dataframe", href: base+`/get_dataframe?id=${table?.id}`, small: true}),
      ])
    //h(AnchorButton, {text:"See stored object", href: base+`?id=${id}&ignore_bytes=true`, target: "_blank"})
    ])
  ])
}


const DocumentExtraction = (props: DocExtractionProps)=>{
  const {data, query} = props;
  const docid = data.pdf_name.replace(".pdf", "");

  const {searchBackend} = useAppState()
  const main = getMainExtraction(data, searchBackend)
  const children = getChildExtractions(data, searchBackend)

  return h(Card, {className: 'model-extraction'}, [
    h(GDDReferenceCard, {docid, elevation: 0}),
    h(MainExtraction, {data: main}),
    h(ChildExtractions, {data: children}),
    h(DownloadButtons, {data: children})
  ]);
}

export {DocumentExtraction};
