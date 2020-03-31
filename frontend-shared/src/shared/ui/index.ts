import h from 'react-hyperscript';
import styled from '@emotion/styled';
import classNames from 'classnames'
import {LinkButton} from '@macrostrat/ui-components';
import {Collapse, Card} from '@blueprintjs/core'

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

const CollapseCard = (props)=> {
  const {isOpen, className, children, ...rest} = props
  return h(Collapse, {isOpen}, [
    h(Card, {
      elevation: 1,
      className: classNames(className, 'mui-collapse-card'),
      ...rest
    }, [
      h("div.inner", children)
    ])
  ])
}

export {InfoButton, CollapseCard};
