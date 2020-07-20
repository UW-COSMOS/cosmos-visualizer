import {Component} from 'react';
import h from 'react-hyperscript';

import {BrowserRouter as Router, Route, Redirect, Switch} from 'react-router-dom';

import {APIActions} from '@macrostrat/ui-components'
import {APIContext} from '../api';
import {AppMode, UserRole} from '../enum';
import {LoginForm} from './login-form';
import {TaggingPage} from './page-interface';
import {AppRouter, permalinkRouteTemplate} from '~/shared/router'

// /annotation/{stack_id}/page/{image_id}

class TaggingApplication extends Component {
  static contextType = APIContext;
  constructor(props){
    super(props);
    this.setupPeople = this.setupPeople.bind(this);
    this.setPerson = this.setPerson.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.renderLoginForm = this.renderLoginForm.bind(this);
    this.render = this.render.bind(this);

    this.state = {
      people: null,
      person: null
    };
  }

  allRequiredOptionsAreSet = (role)=>{
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

  renderUI = ({match, role}) => {

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
    if (this.context == null) return null
    return h(AppRouter, {
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

  setupPeople = (d)=>{
    return this.setState({people: d});
  }

  setPerson = (person)=>{
    this.setState({person});
    return localStorage.setItem('person', JSON.stringify(person));
  }

  componentDidMount = ()=> {
    const {get} = APIActions(this.context);
    get("/people/all").then(this.setupPeople);

    const p = localStorage.getItem('person');
    if (p == null) { return; }
    return this.setState({person: JSON.parse(p)});
  }
}

export {TaggingApplication};
