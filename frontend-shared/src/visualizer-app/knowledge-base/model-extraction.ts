import h from '@macrostrat/hyper';
import {GeoDeepDiveSwatch, APIContext} from '@macrostrat/ui-components';
import {Card, ButtonGroup, AnchorButton} from '@blueprintjs/core'
import {useContext} from 'react';
import useImageSize from '@use-hooks/image-size'
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
  const [width, height] = useImageSize(src)

  const size = {
    width: width*scale,
    height: height*scale
  }

  return h('img', {src, ...size, ...rest})
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
  if (data == null) return null
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

  // Find the first table
  const table = data.find(d => d.cls == "Table")

  return h("div.download-extractions", [
    h("h4", "Extracted data"),
    h(ButtonGroup, {className: "downloads"}, [
      h(AnchorButton, {text:"OCR text", href, download: `${data[0].id}-ocr.txt`, target: "_blank", small: true}),
      // Right now we get the JSON object of the first child. Likely not ideal.
      h(AnchorButton, {text:"JSON object", href: base+`?id=${data[0].id}`, target: "_blank", small: true}),
      h.if(table != null)([
        h(AnchorButton, {text:"Table preview", href: base+`/preview?id=${table?.id}`, target: "_blank", small: true}),
        h(AnchorButton, {text:"Pandas dataframe", href: base+`/get_dataframe?id=${table?.id}`, small: true})
      ])
    ])
  ])
}


const DocumentExtraction = (props: DocExtractionProps)=>{
  const {data} = props;

  const {bibjson} = data
  const main = data.header?.id != null ? data.header : null
  // Get all children (enforce non-overlap with header)
  const children = data.children.filter(d => d.id != data.header?.id)
  const allExtractions = [main, ...children].filter(d => d != null)

  return h(Card, {className: 'model-extraction'}, [
    h(GeoDeepDiveSwatch, bibjson),
    h(MainExtraction, {data: main}),
    h(ChildExtractions, {data: children}),
    h(DownloadButtons, {data: allExtractions})
  ]);
}

export {DocumentExtraction};
