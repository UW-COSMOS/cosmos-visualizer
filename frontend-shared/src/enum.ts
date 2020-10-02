const UserRole = Object.freeze({
  TAG: "tag",
  VALIDATE: "validate",
  // This should maybe be deprecated?
  VIEW_TRAINING: "view-training",
});

const EditMode = Object.freeze({
  ADD_PART: "add-part",
  NORMAL: "normal",
  SHIFT: "shift",
  LINK: "link",
});

enum AppMode {
  // Mode for training data
  ANNOTATION = "annotation",
  // Mode for results
  PREDICTION = "prediction",
}

export { UserRole, EditMode, AppMode };
