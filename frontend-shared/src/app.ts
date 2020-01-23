/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
import h from 'react-hyperscript';

import {BrowserRouter as Router, Route, Redirect, Switch, useContext} from 'react-router-dom';

import {APIContext} from './api';
import {AppMode, UserRole} from './enum';
import {LoginForm} from './login-form';
import {ResultsLandingPage} from './landing-page';
import {KnowledgeBaseFilterView} from './knowledge-base';
import {ResultsPage} from './results-page';
import {TaggingPage} from './tagging-page';
import {
  PermalinkProvider,
  PermalinkSwitch,
  PermalinkContext,
  permalinkRouteTemplate
} from './permalinks';

// /annotation/{stack_id}/page/{image_id}


const MainRouter = ({appMode, basename, ...rest}) => h(PermalinkProvider, {appMode}, (
  h('div.app-main', null, (
    h(Router, {basename}, (
      h(Switch, rest)
    ))
  ))
)
);

class TaggingApplication extends Component {
  static initClass() {
    this.contextType = APIContext;
  }
  constructor(props){
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.allRequiredOptionsAreSet = this.allRequiredOptionsAreSet.bind(this);
    this.renderUI = this.renderUI.bind(this);
    this.renderLoginForm = this.renderLoginForm.bind(this);
    this.setupPeople = this.setupPeople.bind(this);
    this.setPerson = this.setPerson.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    super(props);
    this.state = {
      people: null,
      person: null
    };
  }

  allRequiredOptionsAreSet(role){
    const {person} = this.state;
    if (role == null) { return false; }
    // Doesn't matter what privileges we have to view tags
    if (role === UserRole.VIEW_TRAINING) { return true; }
    // We should have a person if another option is required
    if (person == null) { return false; }
    if (role === UserRole.TAG) {
      return person.tagger;
    }
    if (role === UserRole.VALIDATE) {
      return person.validator;
    }
    return false;
  }

  renderUI({match, role}){

    // Go to specific image by default, if set
    let navigationEnabled, subtitleText;
    const {params: {role: newRole, imageId, stackId}} = match;
    const {person} = this.state;
    // Allow role to be overridden by programmatically
    // set one (to support permalinks)
    if (role == null) { role = newRole; }

    if (!this.allRequiredOptionsAreSet(role)) {
      return h(Redirect, {to: '/'});
    }

    const imageRoute = "/image";

    let id = null;
    if (person != null) {
      id = person.person_id;
    }
    let extraSaveData = null;
    let nextImageEndpoint = "/image/next";
    let allowSaveWithoutChanges = false;
    let editingEnabled = true;

    if ((role === UserRole.TAG) && (id != null)) {
      extraSaveData = {tagger: id};
      subtitleText = "Tag";
    }
    if (role === UserRole.VIEW_TRAINING) {
      editingEnabled = false;
      nextImageEndpoint = "/image/validate";
      allowSaveWithoutChanges = false;
      subtitleText = "View training data";
    } else if ((role === UserRole.VALIDATE) && (id != null)) {
      extraSaveData = {validator: id};
      nextImageEndpoint = "/image/validate";
      // Tags can be validated even when unchanged
      allowSaveWithoutChanges = true;
      subtitleText = "Validate";
    }

    // This is a hack to disable "NEXT" for now
    // on permalinked images
    navigationEnabled;
    if (imageId != null) {
      navigationEnabled = false;
    }

    console.log(`Setting up UI with role ${role}`);
    console.log(`Image id: ${imageId}`);

    return h(TaggingPage, {
      imageRoute,
      // This way of tracking stack ID is pretty dumb, potentia
      stack_id: stackId,
      extraSaveData,
      navigationEnabled,
      nextImageEndpoint,
      initialImage: imageId,
      allowSaveWithoutChanges,
      editingEnabled,
      subtitleText,
      ...this.props
    });
  }

  renderLoginForm() {
    const {person, people} = this.state;
    if (people == null) { return null; }
    return h(LoginForm, {
      person, people,
      setPerson: this.setPerson
    });
  }

  render() {
    const {publicURL} = this.props;
    return h(MainRouter, {
      basename: publicURL,
      appMode: AppMode.ANNOTATION
    }, [
      h(Route, {
        path: '/',
        exact: true,
        render: this.renderLoginForm
      }),
      h(Route, {
        // This should be included from the context, but
        // this is complicated from the react-router side
        path: permalinkRouteTemplate(AppMode.ANNOTATION),
        render: props=> {
          const role = UserRole.VIEW_TRAINING;
          return this.renderUI({role, ...props});
        }
      }),
      h(Route, {path: '/action/:role', render: this.renderUI})
    ]);
  }

  setupPeople(d){
    return this.setState({people: d});
  }

  setPerson(person){
    this.setState({person});
    return localStorage.setItem('person', JSON.stringify(person));
  }

  componentDidMount() {
    this.context.get("/people/all")
    .then(this.setupPeople);

    const p = localStorage.getItem('person');
    if (p == null) { return; }
    return this.setState({person: JSON.parse(p)});
  }
}
TaggingApplication.initClass();

const ViewerPage = ({match, ...rest})=> {
  // Go to specific image by default, if set
  const {params: {imageId}} = match;

  // This is a hack to disable "NEXT" for now
  // on permalinked images
  if ((imageId != null) && (rest.navigationEnabled == null)) {
    rest.navigationEnabled = false;
  }

  return h(TaggingPage, {
    initialImage: imageId,
    allowSaveWithoutChanges: false,
    editingEnabled: false,
    ...rest
  });
};

const ViewResults = ({match, ...rest})=> {
  // Go to specific image by default, if set
  const {params: {imageId}} = match;

  // This is a hack to disable "NEXT" for now
  // on permalinked images
  if ((imageId != null) && (rest.navigationEnabled == null)) {
    rest.navigationEnabled = false;
  }

  return h(ResultsPage, {
    imageRoute: '/image',
    subtitleText: "View results",
    nextImageEndpoint: '/image/next_eqn_prediction',
    ...match
  });
};

class App extends Component {
  static initClass() {
    this.contextType = APIContext;
    this.defaultProps = {
      appMode: AppMode.PREDICTION
    };
  }
  render() {
    const {publicURL, appMode} = this.props;
    return h(MainRouter, {basename: publicURL, appMode}, [
      h(Route, {
        path: '/',
        exact: true,
        component: ResultsLandingPage
      }),
      h(Route, {
        path: permalinkRouteTemplate(appMode),
        render: props=> {
          return h(ViewerPage, {
            permalinkRoute: "/training/page",
            nextImageEndpoint: "/image/validate",
            subtitleText: "View training data",
            ...props
          });
        }
      }),
      // This is probably deprecated
      h(Route, {
        path: '/view-extractions/:imageId?',
        render: props=> {
          return h(ViewerPage, {
            nextImageEndpoint: "/image/next_prediction",
            subtitleText: "View extractions",
            ...props
          });
        }
      }),
      // h PermalinkRoute, {
      //   component: ViewResults
      // }
      h(Route, {
        path: '/knowledge-base',
        component: KnowledgeBaseFilterView
      })
    ]);
  }
}
App.initClass();

export {App, TaggingApplication};
