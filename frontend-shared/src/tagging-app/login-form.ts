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

import {Select} from '@blueprintjs/select';
import {MenuItem, Button, ButtonGroup} from '@blueprintjs/core';
import {InfoButton} from '~/shared/ui';

import {InlineNavbar} from '../util';
import {UserRole} from '../enum';

const ModeButton = ({mode, ...rest}) => h(InfoButton, {to: `/action/${mode}`, ...rest});

const RoleContainer = styled.div`
display: flex;
flex-direction: row;
.user-select {
  flex-grow: 1;
  margin-right: 0.2em;
}
`;

const RoleControl = ({person, people, setPerson, ...props}) => h(RoleContainer, props, [
  h(Select, {
    className: 'user-select',
    items: people,
    itemPredicate(query, item){
      return item.name.toLowerCase().includes(query.toLowerCase());
    },
    itemRenderer(t, {handleClick}){
      return h(MenuItem, {
        key: t.person_id,
        onClick: handleClick,
        text: t.name
      });
    },
    onItemSelect: setPerson
  }, [
    h(Button, {
      text: (person != null) ? person.name : "Select a user",
      fill: true,
      large: true,
      rightIcon: "double-caret-vertical"
    })
  ]),
  h(Button, {
    icon: 'cross',
    large: true,
    disabled: (person == null),
    onClick: () => {
      return setPerson(null);
    }
  })
]);

class LoginForm extends Component {
  static initClass() {
    this.defaultProps = {
      setRole() {},
      setPerson() {}
    };
  }

  renderModeControl() {
    const {setRole, person} = this.props;
    if (person == null) { return null; }
  }

  render() {
    const {people, person, setPerson} = this.props;

    return h('div.login-form', [
      h(InlineNavbar, {subtitle: "Image tagger"}),
      h("h3", "User"),
      h(RoleControl, {people, person, setPerson}),
      h('h3', "Action"),
      h('div.actions', [
        h(ButtonGroup, {
          vertical: true
        }, [
          h(ModeButton, {
            mode: UserRole.VIEW_TRAINING,
            title: "View training data"
          }, "View previously tagged images"),
          h(ModeButton, {
            mode: UserRole.TAG,
            title: "Tag",
            disabled: (person == null) || !person.tagger
          }, "Create training data on untagged images"),
          h(ModeButton, {
            mode: UserRole.VALIDATE,
            title: "Validate",
            disabled: (person == null) || !person.validator
          }, "Validate already-existing tags")
        ])
      ])
    ]);
  }
}
LoginForm.initClass();

export {LoginForm};
