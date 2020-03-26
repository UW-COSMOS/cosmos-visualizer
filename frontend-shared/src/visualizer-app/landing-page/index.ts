import h from 'react-hyperscript';
import styled from '@emotion/styled';
import {APIResultView} from '@macrostrat/ui-components';
import {ButtonGroup} from '@blueprintjs/core';

import {InfoButton} from '~/shared/ui';
import {InlineNavbar} from '~/util';
import Credits from './credits.md';

const InsetText = styled.div`\
padding: 0 0.2em;\
`;

const LargeInsetText = styled(InsetText)`
font-size: 1.2em;
`;

const CreditsText = styled(InsetText)`\
margin-top: 2em;
color: #888;
font-size: 0.8em;
ul {
  padding-left: 1em;
}\
`;

const ModelInfo = styled.div`\
span.res {
  font-style: italic;
}\
`;

const Res = function({data, id}){
  let val = "–";
  if (data != null) {
    val = data[id];
  }
  return h('span.res', [
    h('span.value', val),
    ` ${id}`
  ]);
};

const ModelInfoBox = function() {
  let res;
  return res = h(APIResultView, {
    route: "/model/info",
    params: {stack_id: "default"},
    placeholder: null
  }, (data)=> {
    const R = ({id}) => h(Res, {data, id});
    return h(ModelInfo, [
      h('p', [
        "This instance of ",
        h('b', "COSMOS Visualizer"),
        " exposes a knowledge base covering ",
        h(R, {id: 'documents'}),
        " (",
        h(R, {id: 'pages'}),
        ")",
        " assembled by the ",
        h('b', "COSMOS"),
        " pipeline. ",
        "Several interfaces to the extractions and knowledge base are accessible below:"
      ])
    ]);
});
};


const LandingPageBase = (props)=> {
  const {children} = props
  return h('div', {className: 'results-landing-page'}, [
    h(InlineNavbar, {subtitle: "Model results"}),
    h('div.actions', [
      h(ButtonGroup, {vertical: true}, children)
    ]),
    h(CreditsText, [
      h('div', {dangerouslySetInnerHTML: {__html: Credits}})
    ])
  ]);
}

const ResultsLandingPage = (props)=>{
  return h(LandingPageBase, [
    props.children,
    h(InfoButton, {
      title: "Searchable knowledge base",
      to: "/knowledge-base"
    }, `Knowledge base extracted from documents and
        searchable based on contextual information.`
    )
  ])
}

export {LandingPageBase, ResultsLandingPage, InfoButton};
