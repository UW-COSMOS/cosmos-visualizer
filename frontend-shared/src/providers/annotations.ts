import { useState, createContext, useContext, useCallback } from "react";
import { Annotation, AnnotationID } from "./types";
import h from "react-hyperscript";
import { useTags } from "./tags";
import chroma from "chroma-js";

interface AnnotationsCtx {
  annotations: Annotation[];
  allowSelection: boolean;
  selected: AnnotationID;
}

const AnnotationsContext = createContext<AnnotationsCtx>({
  annotations: [],
  allowSelection: false,
  selected: null,
});

type Updater = (v0: Annotation) => void;
const SelectionUpdateContext = createContext<Updater | null>(null);

interface ProviderProps {
  annotations: Annotation[];
  allowSelection?: boolean;
  children?: React.ReactChild;
}

const AnnotationsProvider = (props: ProviderProps) => {
  /**
  Provides annotations to the page,
  Also allows selecting an annotation
  */
  const { children, annotations, allowSelection } = props;

  const [selected, setSelected] = useState<AnnotationID>(null);

  const value = {
    annotations,
    allowSelection: allowSelection ?? false,
    selected: allowSelection ? selected : null,
  };

  let updateSelection = useCallback(
    (annotation: Annotation | number | null) => {
      let ix: number;
      if (typeof annotation === "number") {
        ix = annotation;
      } else {
        ix = annotations.findIndex((d) => d == annotation);
      }

      if (annotation == null) {
        setSelected(null);
        return;
      }
      setSelected(ix);
    },
    []
  );

  if (!allowSelection) updateSelection = null;

  return h(AnnotationsContext.Provider, { value }, [
    h(SelectionUpdateContext.Provider, { value: updateSelection }, children),
  ]);
};

const useAnnotations = (): Annotation[] =>
  useContext(AnnotationsContext).annotations;

const useSelectedAnnotation = (): Annotation => {
  const { annotations, selected } = useContext(AnnotationsContext);
  return annotations[selected];
};
const useSelectionUpdater = () => useContext(SelectionUpdateContext);

function useAnnotationColor(a: Annotation): chroma.Color {
  const { name, tag_id } = a;
  const tags = useTags();
  const idColor = tags.find((d) => d.tag_id === tag_id)?.color;
  const nameColor = tags.find((d) => d.name === name)?.color;
  return chroma(idColor ?? nameColor ?? "black");
}

const useAnnotationIndex = (ann: Annotation): number => {
  const { annotations, selected } = useContext(AnnotationsContext);
  /* It's most common to be testing for the selected annotation,
     so we check this first */
  if (ann == annotations[selected]) return selected;
  return annotations.findIndex((d) => ann == d);
};

export {
  AnnotationsProvider,
  AnnotationsContext,
  SelectionUpdateContext,
  useAnnotations,
  useAnnotationIndex,
  useSelectedAnnotation,
  useSelectionUpdater,
  useAnnotationColor,
};
