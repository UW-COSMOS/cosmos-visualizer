import h from "react-hyperscript"; //@macrostrat/hyper';
import { SimpleAnnotation, Annotation, LockedAnnotation } from "./annotation";

import { EditMode } from "../enum";
import { AnnotationActions } from "~/providers/annotation-editor";
import {
  useCanvasSize,
  useAnnotations,
  useSelectedAnnotation,
  useSelectionUpdater,
  Annotation as IAnnotation,
  Tag as ITag,
} from "~/providers";

interface AnnotationsOverlayProps {
  inProgressAnnotation?: IAnnotation | null;
  actions?: AnnotationActions;
  lockedTags?: Set<string>;
  toggleSelect?: () => void;
  onSelectAnnotation?: (ix: number) => () => void;
  // Function to render a single annotation
  renderAnnotation(d: IAnnotation, ix?: number): React.ReactNode;
  onClick?: () => void;
  tags?: ITag[];
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
  renderAnnotation: (obj, ix) => h(SimpleAnnotation, { obj, ix, key: ix }),
};

export { AnnotationsOverlay };
