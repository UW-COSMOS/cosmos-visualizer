import h from '@macrostrat/hyper';
import classNames from 'classnames';
import {memoize} from 'underscore';
import styled from '@emotion/styled';

type ImageProps = {
  bytes: string,
  width?: number,
  height?: number
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

export {TextMatch}
