import {Component, memo} from 'react';
import h from '@macrostrat/hyper';
import classNames from 'classnames';
import {GDDReferenceCard} from '@macrostrat/ui-components';
import {basename} from 'path';
import {memoize} from 'underscore';
import styled from '@emotion/styled';

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

const getEntityType = path => // Hack to get entity type from image path
basename(path, '.png').replace(/\d+$/, "");

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

const MatchParagraph = styled.p`\
font-size: 0.8em;
padding: 0.5em 1em;\
`;

const TextMatch = function(props){
  let {query, text, entityType} = props;
  if (text == null) { return null; }
  text = sanitize(text);

  if (query == null) { return null; }
  if (query === "") { return null; }
  const ix = text.indexOf(sanitize(query));
  console.log(ix);
  const ixEnd = ix + query.length;
  let start = ix-100;
  let end = ixEnd+100;

  // Clamp endpoints
  if (start < 0) { start = 0; }
  if (end > text.length) { end = text.length; }

  const match = text.substring(ix, ixEnd);
  return h("div.match", [
    h('h2', [
      "Match ",
      h(EntityType, `(in ${entityType})`)
    ]),
    h(MatchParagraph, [
      text.substring(start, ix),
      h(MatchSpan, text.substring(ix, ixEnd)),
      text.substring(ixEnd, end)
    ])
  ]);
};

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
  const {data, query} = props
  const {bytes, content} = data

  return h('div.extracted-entity', [
    h('div.main', [
      h('div.kb-image-container', [
        h(KBImage, {bytes}),
        h(AllText, {content})
      ])
    ])
  ]);
}

const DocumentExtraction = (props: DocExtractionProps)=>{
  const {data, query} = props;
  const docid = data.pdf_name.replace(".pdf", "");

  return h('div.model-extraction', [
    h(MainExtraction, {data: data.children[0], query}),
    // target,
    // assoc,
    // h(TextMatch, {
    //   entityType: getEntityType(main_img_path),
    //   text: main_unicode,
    //   query
    // }),
    h(GDDReferenceCard, {docid})
  ]);
}

export {DocumentExtraction};
