import h from 'react-hyperscript';
import styled from '@emotion/styled';

import {Link, withRouter} from 'react-router-dom';
import {Navbar, INavbarProps} from '@blueprintjs/core';
import {LinkButton} from '@macrostrat/ui-components';

const PageHeader = function(props){
  let {children, title, subtitle} = props;
  if (title == null) { title = 'COSMOS'; }
  return h(Navbar.Group, [
    h(Navbar.Heading, null,  (
      h('a', {href: '/'}, [
        h('h1', title)
      ])
    )
    ),
    h(Navbar.Heading, {className: 'subtitle'}, subtitle),
    children
  ]);
};

const PermalinkButton = withRouter(function(props){
  const {permalinkRoute, image, match} = props;
  const {params: {imageId, stackId}} = match;
  if (image == null) { return null; }
  const {image_id, stack_id} = image;
  let text = "Permalink";
  let disabled = false;

  if ((image_id === imageId) && (stack_id === stackId)) {
    // We are at the permalink right now
    disabled = true;
    text = [h('span', [text, " to image "]), h('code', image_id)];
  }
  return h(LinkButton, {
    icon: 'bookmark',
    to: `${permalinkRoute}/${stack_id}/${image_id}`,
    disabled,
    text
  });});

type NavProps = React.PropsWithChildren<{subtitle: string & INavbarProps}>
const _ = ({subtitle, children, ...rest}: NavProps) => h(Navbar, {...rest}, [
  h(PageHeader, {subtitle}),
  children
]);

const InlineNavbar = styled(_)`\
border-radius: 4px;
margin-bottom: 1em;
margin-top: 1em;\
`;

export {PageHeader, PermalinkButton, InlineNavbar};
