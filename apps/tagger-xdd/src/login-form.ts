import h from "@macrostrat/hyper";
import styled from "@emotion/styled";
import classNames from "classnames";

import { Select } from "@blueprintjs/select";
import { MenuItem, Button, ButtonGroup, Intent } from "@blueprintjs/core";
import { InfoButton } from "~/shared/ui";

import { InlineNavbar } from "~/util";
import { UserRole } from "~/enum";

const ModeButton = ({ mode, ...rest }) =>
  h(InfoButton, { to: `/action/${mode}`, ...rest });

const RoleContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 300px;
  .select-control {
    flex-grow: 1;
    margin-right: 0.2em;
  }
  .select-control .bp3-button {
    width: 100%;
  }
  .bp3-popover-target {
    display: block;
  }
`;

interface NullableSelectProps<T> {
  item: T;
  items: T[];
  setItem(item: T): void;
  itemText?(item: T): string;
  itemKey?(item: T): any;
  className?: string;
  placeholder?: string;
}

function NullableSelectControl<T>({
  item,
  items,
  setItem,
  itemText = (item) => item,
  itemKey = (item) => item,
  placeholder = "Select an item",
  className,
  ...props
}: NullableSelectProps<T>) {
  /** A nullable select control based on BlueprintJS */
  if (items == null) return null;
  return h(RoleContainer, props, [
    h(
      Select,
      {
        className: classNames("select-control", className),
        items,
        itemPredicate(query, item: T) {
          return itemText(item).toLowerCase().includes(query.toLowerCase());
        },
        itemRenderer(t: T, { handleClick }) {
          return h(MenuItem, {
            key: itemKey(t),
            onClick: handleClick,
            text: itemText(t),
          });
        },
        onItemSelect: setItem,
      },
      [
        h(Button, {
          text: item != null ? itemText(item) : placeholder,
          fill: true,
          large: true,
          rightIcon: "double-caret-vertical",
        }),
      ]
    ),
    h(Button, {
      icon: "cross",
      large: true,
      minimal: true,
      disabled: item == null,
      intent: Intent.DANGER,
      onClick: () => {
        return setItem(null);
      },
    }),
  ]);
}

const RoleControl = ({ person, people, setPerson, ...props }) => {
  return h(NullableSelectControl, {
    item: person,
    items: people,
    setItem: setPerson,
    placeholder: "Select a person",
    itemText(person) {
      return person.name;
    },
    itemKey(person) {
      return person.person_id;
    },
  });
};

const StackControl = ({ stack, stacks, setStack, ...props }) => {
  return h(NullableSelectControl, {
    item: stack,
    items: stacks,
    setItem: setStack,
    placeholder: "Select a stack",
  });
};

function LoginForm(props) {
  const { people, person, setPerson, setStack, stacks, stack } = props;

  return h("div.login-form", [
    h(InlineNavbar, { subtitle: "Image tagger" }),
    h("h3", "Stack"),
    h(StackControl, { stacks, stack, setStack }),
    h("h3", "User"),
    h(RoleControl, { people, person, setPerson }),
    h("h3", "Action"),
    h("div.actions", [
      h(
        ButtonGroup,
        {
          vertical: true,
        },
        [
          h(
            ModeButton,
            {
              mode: UserRole.VIEW_TRAINING,
              title: "View training data",
              disabled: stack == null,
            },
            "View previously tagged images"
          ),
          h(
            ModeButton,
            {
              mode: UserRole.TAG,
              title: "Tag",
              disabled: person == null || !person.tagger || stack == null,
            },
            "Create training data on untagged images"
          ),
          h(
            ModeButton,
            {
              mode: UserRole.VALIDATE,
              title: "Validate",
              disabled: person == null || !person.validator || stack == null,
            },
            "Validate already-existing tags"
          ),
        ]
      ),
    ]),
  ]);
}

export { LoginForm };
