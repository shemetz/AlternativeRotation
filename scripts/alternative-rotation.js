import { libWrapper } from './libwrapper-shim.js'

const MODULE_ID = 'alternative-rotation'

function getSetting (settingName) {
  return game.settings.get(MODULE_ID, settingName)
}

function isDragButtonHeld () {
  return game.keyboard._downKeys.has('Shift')
}

function isDragSnapButtonHeld () {
  return game.keyboard._downKeys.has('Control')
}

function isDoingDrag (mouseInteractionManager) {
  const obj = mouseInteractionManager.object
  return !mouseInteractionManager._dragRight && (obj instanceof Token || obj instanceof Tile)
}

let drawnArrow = null

function drawDirectionalArrow (from, to) {
  const width = isDragSnapButtonHeld() ? 8 : 5
  const color = 0xFF9829
  const alpha = 0.8
  const circleRadius = 10
  const arrowCornerLength = 30
  const arrowCornerAngle = 150 * degToRad
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const arrowStart = {
    x: from.x + Math.cos(angle) * circleRadius,
    y: from.y + Math.sin(angle) * circleRadius,
  }
  const arrowCorner1 = {
    x: to.x + Math.cos(angle + arrowCornerAngle) * arrowCornerLength,
    y: to.y + Math.sin(angle + arrowCornerAngle) * arrowCornerLength,
  }
  const arrowCorner2 = {
    x: to.x + Math.cos(angle - arrowCornerAngle) * arrowCornerLength,
    y: to.y + Math.sin(angle - arrowCornerAngle) * arrowCornerLength,
  }
  // drawing using the canvas selection rectangle, yes, it's a hack
  drawnArrow = canvas.controls.select.clear()
    .lineStyle(width, color, alpha) // width, color, alpha
    .drawCircle(from.x, from.y, circleRadius)
    .drawPolygon(arrowStart.x, arrowStart.y, to.x, to.y)
    .drawPolygon(to.x, to.y, arrowCorner1.x, arrowCorner1.y, to.x, to.y, arrowCorner2.x, arrowCorner2.y)
}

/**
 * Returns result in degrees
 */
function rotationTowardsCursor (object, cursor) {
  const obj = object instanceof Token ? object.center : {
    // Tile doesn't have a center() field :(
    x: object.data.x + object.tile.img.width / 2,
    y: object.data.y + object.tile.img.height / 2
  }
  const target = Math.atan2(cursor.y - obj.y, cursor.x - obj.x) + Math.PI * 3 / 2 // down = 0
  const degrees = target * radToDeg
  const dBig = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 60 : 45
  const dSmall = getSetting('smooth-rotation') ? 0.1 : 5
  const snap = isDragSnapButtonHeld() ? dBig : dSmall
  return Math.round(degrees / snap) * snap
}

const radToDeg = 180 / Math.PI
const degToRad = Math.PI / 180

let isNowRotating = false

function _handleDragStart_Override (_handleDragStart, event) {
  // Wrap unless shift+leftpress on a tile or token
  if (!isDoingDrag(this) || !isDragButtonHeld()) {
    // Call wrapped function
    return _handleDragStart.bind(this)(event)
  }
  // Start drag rotation
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
    && isDragButtonHeld() && event.data.originalEvent.buttons === 1
    && game.activeTool === 'select'
    && (game.user.isGM || (!game.paused && (obj.actor && obj.actor.hasPerm(game.user, 'OWNER'))))
  ) {
    // Start drag rotation
    isNowRotating = true
    mim.state = this.states.DRAG
    // activating drag events so that _handleDragMove_Override will be called from now on
    mim._activateDragEvents()
  }
  // calling wrapper function either way
  return _handleMouseOut.bind(this)(event)
}

function _onDragLeftStart_Override (_onDragLeftStart, event) {
  const oe = event.data.originalEvent
  if (
    oe.ctrlKey && oe.shiftKey && this.activeLayer.name === 'TokenLayer'
  ) {
    // do nothing; preventing the ctrl+drag ruler shortcut
    return
  }
  return _onDragLeftStart.bind(this)(event)
}

function _handleDragMove_Override (_handleDragMove, event) {
  if (!isDoingDrag(this) || !isNowRotating) {
    // Call wrapped function
    return _handleDragMove.bind(this)(event)
  }
  // If user let go of shift while rotating
  if (!isDragButtonHeld()) {
    console.log('user let go of shift; ignoring it for now')
  }
  // Continue drag rotation, showing preview
  const object = this.object
  const cursor = event.data.destination
  const targetRotation = rotationTowardsCursor(object, cursor)
  const img = this.object instanceof Token ? object.icon : object.img  // TODO tile for sure
  // TODO animation
  img.rotation = targetRotation * degToRad
  // draw arrow
  const start = object.center
  drawDirectionalArrow(start, cursor)
}

function _handleDragDrop_Override (_handleDragDrop, event) {
  if (!isDoingDrag(this) || !isNowRotating) {
    // Call wrapped function
    return _handleDragDrop.bind(this)(event)
  }
  // Complete drag rotation
  const object = this.object
  const targetRotation = rotationTowardsCursor(object, event.data.destination)
  // TODO animation handling
  object.rotate(targetRotation)
  this.state = this.states.DROP
}

function _handleDragCancel_Override (_handleDragCancel, event) {
  if (!isDoingDrag(this) || !isNowRotating) {
    // Call wrapped function
    return _handleDragCancel.bind(this)(event)
  }
  isNowRotating = false
  if (this.state === this.states.DRAG) {
    // Cancel drag rotation
    const object = this.object
    // reset rotation to match data
    // TODO animation
    if (object instanceof Token)
      object.icon.rotation = object.data.rotation
    else
      object.img.rotation = object.data.rotation // TODO tile
  }
  if (drawnArrow) {
    drawnArrow.clear()
    drawnArrow = null
  }
  this.state = this.states.HOVER
}

Hooks.once('init', function () {
  game.settings.register(MODULE_ID, 'smooth-rotation', {
    name: 'Smooth rotation',
    hint: 'Disable snapping to 5-degree increments when using the module.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
  })
})

Hooks.once('setup', function () {
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragStart', _handleDragStart_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragMove', _handleDragMove_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragDrop', _handleDragDrop_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleDragCancel', _handleDragCancel_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'MouseInteractionManager.prototype._handleMouseOut', _handleMouseOut_Override, 'MIXED')
  libWrapper.register(MODULE_ID, 'Canvas.prototype._onDragLeftStart', _onDragLeftStart_Override, 'MIXED')
  console.log(`Alternative Rotation | initialized`)
})
