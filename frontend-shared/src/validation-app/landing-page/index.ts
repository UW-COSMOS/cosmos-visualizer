/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
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

const LargeInsetText = styled(InsetText)`\
font-size: 1.2em;\
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
  }, data=> {
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


class ResultsLandingPage extends Component {
  static initClass() {
    this.defaultProps = {
      setRole() {}
    };
  }

  render() {
    const {setRole} = this.props;
    const selectRole = role=> () => {
      console.log(`Selected role ${role}`);
      return setRole(role);
    };

    return h('div', {className: 'results-landing-page'}, [
      h(InlineNavbar, {subtitle: "Model results"}),
      h('div.actions', [
        h(ButtonGroup, {vertical: true}, [
          h(InfoButton, {
            to: "/view-extractions",
            index: 1,
            title: "Page-level extractions"
          }, `Regions of interest extracted and classified \
for further knowledge-base processing.`
          ),
          // h InfoButton, {
          //   to: "/view-results"
          //   index: 2
          //   title: "Model entity extractions",
          // }, "Model entities (equations, constituent variables defined in text,
          //     and semantically linked explanatory phrases) shown at a page level."
          h(InfoButton, {
            index: 2,
            title: "Searchable knowledge base",
            to: "/knowledge-base"
          }, `Knowledge base of equations, figures, and tables extracted from page-level \
information and searchable based on contextual information linked by the model.`
          )
        ])
      ]),
      h(CreditsText, [
        h('div', {dangerouslySetInnerHTML: {__html: Credits}})
      ])
    ]);
  }
}
ResultsLandingPage.initClass();

export {ResultsLandingPage};
