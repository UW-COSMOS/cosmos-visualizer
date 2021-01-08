import h from "@macrostrat/hyper";
import { createSettingsContext } from "@macrostrat/ui-components";
import { Popover, Button, FormGroup, Slider } from "@blueprintjs/core";
import "./settings.styl";

interface PageSettings {
  zoom: number;
}

const [
  PageSettingsProvider,
  usePageSettings,
  useSettingsUpdater,
] = createSettingsContext<PageSettings>({
  zoom: 1,
});

function ZoomControl(props) {
  const { zoom } = usePageSettings();
  const update = useSettingsUpdater();
  return h(FormGroup, { label: "Zoom" }, [
    h(Slider, {
      min: 0,
      max: 1,
      value: zoom,
      labelValues: [0, 1],
      stepSize: 0.01,
      labelRenderer(value) {
        if (value == 0) return "Min";
        if (value == 1) return "Max";
      },
      onChange(val) {
        update({ zoom: { $set: val } });
      },
    }),
  ]);
}

function SettingsPopover(props) {
  return h(Popover, [
    h(Button, { icon: "settings" }),
    h("div.settings-panel", [h("h4", "Settings"), h(ZoomControl)]),
  ]);
}

export { SettingsPopover, PageSettingsProvider, usePageSettings };
