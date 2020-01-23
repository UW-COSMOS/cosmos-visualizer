/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createContext} from 'react';
import h from 'react-hyperscript';
import {Dialog, Button, ButtonGroup,
        Intent, Alignment, Text, Icon,
        Classes, Callout } from "@blueprintjs/core";

class InfoDialog extends Component {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.renderAdmonition = this.renderAdmonition.bind(this);
    this.renderInstructions = this.renderInstructions.bind(this);
    this.renderActions = this.renderActions.bind(this);
    super(...args);
  }

  render() {
    return h(Dialog, {...this.props}, [
      h('div', {className: Classes.DIALOG_BODY}, [
        h('h3.bp3-heading', "COSMOS Image Tagger"),
        h('h4', "Usage info"),
        this.renderAdmonition(),
        this.renderInstructions(),
        h('h4', 'Credits'),
        h('ul', [
          h('li', "Frontend: Daven Quinn"),
          h('li', "Backend: Ian Ross, Daven Quinn, John Czaplewski")
        ])
      ]),
      this.renderActions()
    ]);
  }
  renderAdmonition() {
    const {editingEnabled} = this.props;
    if (editingEnabled) { return null; }
    return h(Callout, {title: "Saving disabled", intent: Intent.WARNING}, (
      "The application has been initialized for viewing only"
    ));
  }

  renderInstructions() {
    return h('div.instructions', [
      h('ul.bp3-text', [
        h('li', "Click + drag to create item."),
        h('li', "Click existing item to adjust.")
      ])
    ]);
  }

  renderActions() {
    return h('div', {className: Classes.DIALOG_FOOTER}, [
      h(Button, {
        onClick: this.props.displayKeyboardShortcuts
      }, "Display keyboard shortcuts")
    ]);
  }
}

export {InfoDialog};
