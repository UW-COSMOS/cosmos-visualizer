import h from "@macrostrat/hyper";
import { useAPIResult } from "@macrostrat/ui-components";
import { AnnotationLinks } from "./annotation-links";
import { AnnotationsOverlay } from "./annotations";
import { AnnotationsProvider } from "../providers";

function AnnotationsAndLinks() {
  return h([h(AnnotationsOverlay), h(AnnotationLinks)]);
}

function StaticImageOverlay({ tagRoute }) {
  // Get editing actions into the props
  const annotations = useAPIResult(tagRoute) ?? [];
  return h(
    AnnotationsProvider,
    { allowSelection: false, annotations },
    h(AnnotationsAndLinks)
  );
}

export { StaticImageOverlay, AnnotationsAndLinks };
