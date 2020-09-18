import { libWrapper } from './libwrapper-shim.js'

const MODULE_ID = 'alternative-rotation'

function getSetting (settingName) {
  return game.settings.get(MODULE_ID, settingName)
}

function isDoingDrag (mouseInteractionManager) {
  const obj = mouseInteractionManager.object
  return !mouseInteractionManager._dragRight && (obj instanceof Token || obj instanceof Tile)
}

let isNowRotating = false

function _handleDragStart_Override (_handleDragStart, event) {
  // Wrap unless shift+leftpress on a tile or token
  if (!isDoingDrag(this) || !event.data.originalEvent.shiftKey) {
    // Call wrapped function
    return _handleDragStart.bind(this)(event)
  }
  console.log('alternative rotation starts')
  isNowRotating = true
}

function _handleMouseOut_Override (_handleMouseOut, event) {
  // special case: when user shift-drags from a deselected token
  // (here `this` is the canvas, so we need to get the token/tile's mouse interaction manager)
  const mim = event.currentTarget.mouseInteractionManager
  const obj = mim ? mim.object : null
  // lots of checks because handleMouseOut can be called by anyone at any point
  if (
    mim && isDoingDrag(mim) && !isNowRotating
    && event.data.originalEvent.shiftKey && event.data.originalEvent.buttons === 1
    && game.activeTool === 'select'
    && (game.user.isGM || (!game.paused && (obj.actor && obj.actor.hasPerm(game.user, 'OWNER'))))
  ) {
    console.log('alternative rotation starts (from deselected token)')
    isNowRotating = true
    mim.state = this.states.DRAG
    // activating drag events so that _handleDragMove_Override will be called from now on
    mim._activateDragEvents()
  }
  // calling wrapper function either way
  return _handleMouseOut.bind(this)(event)
}

function _handleDragMove_Override (_handleDragMove, event) {
  if (!isDoingDrag(this) || !isNowRotating) {
    // Call wrapped function
    return _handleDragMove.bind(this)(event)
  }
  // If user let go of shift while rotating
  if (!event.data.originalEvent.shiftKey) {
    console.log('user let go of shift; ignoring it for now')
  }
  console.log('alternative rotation continues')
}

function _handleDragDrop_Override (_handleDragDrop, event) {
  if (!isDoingDrag(this) || !isNowRotating) {
    // Call wrapped function
    return _handleDragDrop.bind(this)(event)
  }
  console.log('alternative rotation ends')
  this.state = this.states.DROP
}

function _handleDragCancel_Override (_handleDragCancel, event) {
  if (!isDoingDrag(this) || !isNowRotating) {
    // Call wrapped function
    return _handleDragCancel.bind(this)(event)
  }
  console.log('alternative rotation canceled (maybe after end)')
  isNowRotating = false
  this.state = this.states.HOVER
}

Hooks.once('setup', function () {
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragStart', _handleDragStart_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragMove', _handleDragMove_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragDrop', _handleDragDrop_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragCancel', _handleDragCancel_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleMouseOut', _handleMouseOut_Override, 'MIXED')
  console.log(`Alternative Rotation | initialized`)
})
