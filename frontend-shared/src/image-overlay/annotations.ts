import h from "@macrostrat/hyper";
import { SimpleAnnotation } from "./annotation";

import {
  useCanvasSize,
  useAnnotations,
  Annotation as IAnnotation,
} from "~/providers";

interface AnnotationsOverlayProps {
  inProgressAnnotation?: IAnnotation | null;
  // Function to render a single annotation
  renderAnnotation(d: IAnnotation, ix?: number): React.ReactNode;
  onClick?: () => void;
  children?: React.ReactChild;
}

const AnnotationsOverlay = (props: AnnotationsOverlayProps) => {
  let { onClick, children } = props;
  const annotations = useAnnotations();
  const { width, height } = useCanvasSize();
  return h("div.overlay", { style: { width, height }, onClick }, [
    annotations.map(props.renderAnnotation),
    children,
  ]);
};

AnnotationsOverlay.defaultProps = {
  renderAnnotation: (obj, index) =>
    h(SimpleAnnotation, { obj, index, key: index }),
};

export { AnnotationsOverlay };
