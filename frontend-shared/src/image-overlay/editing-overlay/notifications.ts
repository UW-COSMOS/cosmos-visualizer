import { useContext } from "react";
import h from "react-hyperscript";
import { EditorContext } from "../context";
import { EditMode } from "~/enum";
import { Card, Button, Intent } from "@blueprintjs/core";
import classNames from "classnames";

import "./main.styl";

const ModeNotificationMessages = {
  [EditMode.ADD_PART]: "Add part",
  [EditMode.LINK]: "Add link",
};

const ModeNotification = (props) => {
  const { mode } = props;
  const { actions, editModes, shiftKey } = useContext(EditorContext);
  if (!editModes.has(mode)) {
    return null;
  }
  const message = ModeNotificationMessages[mode];
  const onClick = (event) => {
    event.stopPropagation();
    return actions.setMode(mode, false);
  };

  let deleteButton = null;
  if (!shiftKey) {
    deleteButton = h(Button, {
      minimal: true,
      icon: "cross",
      intent: Intent.DANGER,
      onClick,
    });
  }

  const className = classNames("edit-mode", mode);
  return h(Card, { className, icon: null }, [
    h("span.mode", "Mode"),
    h("span.message", message),
    deleteButton,
  ]);
};

function ModalNotifications() {
  return h("div.notifications", [
    h(ModeNotification, { mode: EditMode.ADD_PART }),
    h(ModeNotification, { mode: EditMode.LINK }),
  ]);
}

export { ModalNotifications };
