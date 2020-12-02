import "~/shared/_init";
import { render } from "react-dom";
import h from "@macrostrat/hyper";
import { ImageOverlay } from "~/image-overlay";
import { ScaledImagePanel } from "~/page-interface/scaled-image";
import { TagListProvider, AnnotationEditorProvider } from "~/providers";
import tags from "./tag-list";
import image from "../page-images/quinn_ehlmann_2019-05.png";

function ImageContainer() {
  return h(
    ScaledImagePanel,
    {
      image,
      urlForImage(im) {
        // The simplest possible Image URL
        return im;
      },
    },
    h(ImageOverlay)
  );
}

function App() {
  // Nest a bunch of providers

  return h(
    TagListProvider,
    { tags },
    h(
      AnnotationEditorProvider,
      {
        initialAnnotations: [],
      },
      h(ImageContainer, {
        editingEnabled: true,
        image,
      })
    )
  );
}

const el = document.createElement("div");
document.body.appendChild(el);
render(h(App), el);
