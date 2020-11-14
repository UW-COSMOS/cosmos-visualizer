import h from "@macrostrat/hyper";
import { InlineNavbar } from "~/util";
import { DarkModeButton } from "@macrostrat/ui-components";

export function Navbar(props) {
  const { children } = props;
  return h(InlineNavbar, null, [
    children,
    h(DarkModeButton, { minimal: true }),
  ]);
}
