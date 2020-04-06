import h from '@macrostrat/hyper';
import {GDDReferenceCard, APIContext} from '@macrostrat/ui-components';
import {Card, ButtonGroup, AnchorButton, FormGroup} from '@blueprintjs/core'
import {useContext, useRef, useEffect, useState} from 'react';
import {useAppState, SearchBackend} from './provider'
import {format} from 'd3-format'

const fmt = format(".2f")

type ImageProps = {
  bytes: string,
  width?: number,
  height?: number
  scale?: number
}

const KBImage = (props: ImageProps)=>{
  const {bytes, scale, ...rest} = props;
  const src="data:image/png;base64," + bytes;
  const ref = useRef()
  const [sz, setSize] = useState({width: null, height: null})

  useEffect(()=>{
    ref.current.onload = ()=>{
      setSize({
        width: ref.current.naturalWidth,
        height: ref.current.naturalHeight
      })
    }
  }, [bytes, ref.current])

  const size = {
    width: sz.width*scale,
    height: sz.height*scale
  }

  return h('img', {src, ref, ...size, ...rest})
}

KBImage.defaultProps = {scale: 0.6}

type DocExtractionProps = {
  data: APIDocumentResult,
  query?: string
}

type ExtractionProps = {
  data: APIExtraction,
  query?: string
}

const MainExtraction = (props: ExtractionProps)=>{
  const {data} = props
  const {bytes, cls} = data

  let conf = ""
  if (data.base_confidence != null) {
    conf = ` (${fmt(data.base_confidence)})`
  }

  return h('div.extracted-entity', [
    h('div.main', [
      h('div.kb-image-container', [
        h(KBImage, {bytes}),
        h('p.caption', [
          h("span.type", cls),
          conf
        ])
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
      h(AnchorButton, {text:"OCR text", href, download: `${data[0].id}-ocr.txt`, target: "_blank", small: true}),
      // Right now we get the JSON object of the first child. Likely not ideal.
      h(AnchorButton, {text:"JSON object", href: base+`?id=${data[0].id}`, target: "_blank", small: true}),
      h.if(table != null)([
        h(AnchorButton, {text:"Table preview", href: base+`/preview?id=${table?.id}`, target: "_blank", small: true}),
        h(AnchorButton, {text:"Pandas dataframe", href: base+`/get_dataframe?id=${table?.id}`, small: true}),
      ])
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
    h(DownloadButtons, {data: [main, ...children]})
  ]);
}

export {DocumentExtraction};
