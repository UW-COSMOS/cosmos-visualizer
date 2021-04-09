import { APIProvider, createAPIContext } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";

export const Word2VecAPIContext = createAPIContext();

export function Word2VecAPIProvider(props) {
  return h(APIProvider, { context: Word2VecAPIContext, ...props });
}
