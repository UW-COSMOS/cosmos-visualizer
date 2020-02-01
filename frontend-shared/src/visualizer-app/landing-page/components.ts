/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import styled from '@emotion/styled';
import {LinkButton} from '@macrostrat/ui-components';

const InfoButton_ = function(props){
  let {index, to, title, children, ...rest} = props;
  if (index != null) {
    index = h('span.index', `${index}. `);
  }
  return h(LinkButton, {to, large: true, ...rest}, [
    h('h3', [
      index,
      title
    ]),
    h('p', children)
  ]);
};

const InfoButton = styled(InfoButton_)`\
.bp3-button-text {
  display: block;
  text-align: left;
  width: 100%;
}
h3 {
  color: #444;
  margin-bottom: 0.5em;
  margin-top: 0.5em;
}
span.index {
  color: #888;
}
p {
  font-size 0.9em;
  color: #666;
}\
`;

export {InfoButton};
