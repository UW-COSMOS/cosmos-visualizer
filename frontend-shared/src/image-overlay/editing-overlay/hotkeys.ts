import h from "@macrostrat/hyper";
import { Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core";
import { Annotation } from "~/providers";
import { PureComponent } from "react";
import { EditorContext } from "../context";

interface Props {
  editingRect: Annotation;
  children?: React.ReactNode;
  onShiftKeyDown(): void;
  onToggleSelect(): void;
  onDeleteAnnotation(): void;
}

class EditorHotkeys extends PureComponent<Props> {
  static contextType = EditorContext;
  render() {
    return h("div.hotkeys-target", null, this.props.children);
  }

  renderHotkeys() {
    const { onDeleteAnnotation, onShiftKeyDown, onToggleSelect } = this.props;
    const { actions } = this.context;
    return h(Hotkeys, [
      h(Hotkey, {
        label: "Delete rectangle",
        combo: "backspace",
        global: true,
        preventDefault: true,
        stopPropagation: true,
        onKeyDown: onDeleteAnnotation,
      }),
      h(Hotkey, {
        global: true,
        combo: "l",
        label: "Toggle select",
        onKeyDown: onToggleSelect,
        //prevent typing "O" in omnibar input
        preventDefault: true,
      }),
      h(Hotkey, {
        label: "Expose secondary commands",
        combo: "shift",
        global: true,
        onKeyDown: onShiftKeyDown,
      }),
    ]);
  }
}

const AnnotationsEditorHotkeys = HotkeysTarget(EditorHotkeys);

export { AnnotationsEditorHotkeys };
