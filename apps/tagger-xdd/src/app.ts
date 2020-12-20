import { Component } from "react";
import h from "react-hyperscript";

import { Route, Redirect } from "react-router-dom";
import { useStoredState, useAPIResult } from "@macrostrat/ui-components";
import { StackProvider } from "~/providers";
import { APIContext } from "~/api";
import { AppMode, UserRole } from "~/enum";
import { LoginForm } from "./login-form";
import { TaggingPage } from "./page-interface";
import { AppRouter, permalinkRouteTemplate } from "~/shared/router";
import { useParams } from "react-router-dom";

// /annotation/{stack_id}/page/{image_id}

function allRequiredOptionsAreSet(person, role) {
  console.log(person);
  if (role == null) {
    return false;
  }
  // Doesn't matter what privileges we have to view tags
  if (role === UserRole.VIEW_TRAINING) {
    return true;
  }
  // We should have a person if another option is required
  if (person == null) {
    return false;
  }
  if (role === UserRole.TAG) {
    return person.tagger;
  }
  if (role === UserRole.VALIDATE) {
    return person.validator;
  }
  return false;
}

function TaggingInterface(props) {
  const { person } = props;
  // Go to specific image by default, if set
  let navigationEnabled, subtitleText;
  const { role: newRole, imageId, stackId } = useParams();
  if (person == null) return null;

  // Allow role to be overridden by programmatically
  // set one (to support permalinks)
  const role = props.role ?? newRole;

  if (!allRequiredOptionsAreSet(person, role)) {
    return h(Redirect, { to: "/" });
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

  if (role === UserRole.TAG && id != null) {
    extraSaveData = { tagger: id };
    subtitleText = "Tag";
  }
  if (role === UserRole.VIEW_TRAINING) {
    editingEnabled = false;
    nextImageEndpoint = "/image/validate";
    allowSaveWithoutChanges = false;
    subtitleText = "View training data";
  } else if (role === UserRole.VALIDATE && id != null) {
    extraSaveData = { validator: id };
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
    ...props,
  });
}

interface XDDTaggerState {
  person: string | null;
  stack: string;
}

function TaggingApplication(props) {
  const { publicURL = "/" } = props;
  const stacks = ["mars", "xdd-covid-19"];
  const [state, setState] = useStoredState<XDDTaggerState>("xdd-tagger-state", {
    stack: stacks[0],
    person: null,
  });
  const people = useAPIResult("/people/all", null, { context: APIContext });
  const permalinkRoute = "/page/:stackId/:imageId";

  const { person, stack } = state;

  const setPerson = (person) => setState({ ...state, person });
  const setStack = (stack) => setState({ ...state, stack });

  return h(
    StackProvider,
    { stack },
    h(
      AppRouter,
      {
        basename: publicURL,
        routeTemplate: permalinkRoute,
        appMode: AppMode.ANNOTATION,
      },
      [
        h(Route, {
          path: "/",
          exact: true,
          render() {
            return h(LoginForm, {
              person,
              people,
              stack,
              stacks,
              setPerson,
              setStack,
            });
          },
        }),
        h(Route, {
          // This should be included from the context, but
          // this is complicated from the react-router side
          path: permalinkRoute,
          render: (props) => {
            const role = UserRole.VIEW_TRAINING;
            return h(TaggingInterface, { role, person });
          },
        }),
        h(Route, {
          path: "/action/:role",
          render() {
            return h(TaggingInterface, { person });
          },
        }),
        h(Route, {
          render() {
            return h("div", [
              h("p", "Page not found"),
              h("p", null, h("a", { href: "/" }, "Go home")),
            ]);
          },
        }),
      ]
    )
  );
}

export { TaggingApplication };
