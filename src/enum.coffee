UserRole = Object.freeze({
  TAG: 'tag'
  VALIDATE: 'validate'
  VIEW_TRAINING: 'view-training'
  VIEW_BBOX_RESULTS: 'view-bbox-results'
  VIEW_RESULTS: 'view-results'
  VIEW_KNOWLEDGE_BASE: 'view-knowledge-base'
})

EditMode = Object.freeze({
  NORMAL: 'normal'
  LINK: 'link'
  ADD_PART: 'add-part'
  SHIFT: 'shift'
})

AppMode = Object.freeze({
  TAGGING: 'tagging'
  RESULTS: 'results'
})

export {UserRole, EditMode, AppMode}
