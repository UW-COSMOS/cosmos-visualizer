import { Position, Toaster } from "@blueprintjs/core";
// This should be refactored to use ui-components toaster,
// and UI components should be configurable to use a specific
// toaster if defined.

const AppToaster = Toaster.create({
    className: "main-toaster",
    position: Position.TOP,
});

export {AppToaster};
