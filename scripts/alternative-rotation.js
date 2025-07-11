const { Token, Tile, MeasuredTemplate } = foundry.canvas.placeables
const { TokenLayer, TilesLayer, TemplateLayer } = foundry.canvas.layers
const { HEXODDR, HEXEVENR, HEXODDQ, HEXEVENQ, SQUARE, GRIDLESS } = CONST.GRID_TYPES

const MODULE_ID = 'alternative-rotation'
const TAU = Math.PI * 2
const radToDeg = 360 / TAU
const degToRad = TAU / 360

let visualEffectsGraphics = null
let currentlyRotatedObjects = []
let timeLastRotated = performance.now()

let isSnapButtonHeld = false

function isNowRotating () {
  return currentlyRotatedObjects.length > 0
}

function isNowRotatingMultiple () {
  return currentlyRotatedObjects.length > 1
}

function shouldSnap () {
  const snapByDefault = getSetting('alt-snap-by-default')
  return isSnapButtonHeld ? !snapByDefault : snapByDefault
}

function getSetting (settingName) {
  return game.settings.get(MODULE_ID, settingName)
}

function getMousePosition () {
  return canvas.mousePosition
}

function getVisualEffectsGraphics () {
  if (visualEffectsGraphics === null || visualEffectsGraphics._geometry === null) {
    // visualEffectsGraphics._geometry will become null if the canvas changes, e.g. when moving to new scene
    visualEffectsGraphics = canvas.controls.addChild(new PIXI.Graphics())
    console.log(`Alternative Rotation | added PIXI graphics to canvas controls`)
  }
  return visualEffectsGraphics
}

/**
 * Can only multi-rotate tokens and tiles and templates (could add others in the future if needed)
 */
function controlledObjectsOnCurrentLayer () {
  switch (true) {
    case canvas.activeLayer instanceof TilesLayer:
      return canvas.tiles.controlled
    case canvas.activeLayer instanceof TokenLayer:
      return canvas.tokens.controlled
    case canvas.activeLayer instanceof TemplateLayer:
      return canvas.templates.placeables.filter(t => t.hover)
  }
  return []
}

function drawDirectionalArrow () {
  const object = currentlyRotatedObjects[0]
  const from = getCenter(object)
  const to = getMousePosition()
  const width = 5
  const color = 0xFF9829
  const alpha = 0.8
  const alphaMainArrow = shouldSnap() ? 0.3 : 0.8
  const circleRadius = 10
  const arrowCornerLength = 30
  const arrowCornerAngle = 150 * degToRad
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const arrowStart = {
    x: from.x + Math.cos(angle) * (circleRadius - width / 2 - 2),
    y: from.y + Math.sin(angle) * (circleRadius - width / 2 - 2),
  }
  const arrowCorner1 = {
    x: to.x + Math.cos(angle + arrowCornerAngle) * arrowCornerLength,
    y: to.y + Math.sin(angle + arrowCornerAngle) * arrowCornerLength,
  }
  const arrowCorner2 = {
    x: to.x + Math.cos(angle - arrowCornerAngle) * arrowCornerLength,
    y: to.y + Math.sin(angle - arrowCornerAngle) * arrowCornerLength,
  }
  getVisualEffectsGraphics().
    clear().
    lineStyle(width, color, alpha).
    drawCircle(from.x, from.y, circleRadius).
    lineStyle(width, color, alphaMainArrow).
    drawPolygon(arrowStart.x, arrowStart.y, to.x, to.y).
    drawPolygon(to.x, to.y, arrowCorner1.x, arrowCorner1.y, to.x, to.y, arrowCorner2.x, arrowCorner2.y)

  if (shouldSnap()) {
    const snappedRotation = rotationTowardsCursor(object, to) * degToRad + TAU / 4
    const secondaryArrowLength = 200
    const to2 = {
      x: from.x + Math.cos(snappedRotation) * secondaryArrowLength,
      y: from.y + Math.sin(snappedRotation) * secondaryArrowLength,
    }
    const secondArrowStart = {
      x: from.x + Math.cos(snappedRotation) * (circleRadius - width / 2 - 2),
      y: from.y + Math.sin(snappedRotation) * (circleRadius - width / 2 - 2),
    }
    const secondArrowCorner1 = {
      x: to2.x + Math.cos(snappedRotation + arrowCornerAngle) * arrowCornerLength,
      y: to2.y + Math.sin(snappedRotation + arrowCornerAngle) * arrowCornerLength,
    }
    const secondArrowCorner2 = {
      x: to2.x + Math.cos(snappedRotation - arrowCornerAngle) * arrowCornerLength,
      y: to2.y + Math.sin(snappedRotation - arrowCornerAngle) * arrowCornerLength,
    }
    getVisualEffectsGraphics().
      lineStyle(5, color, alpha).
      drawPolygon(secondArrowStart.x, secondArrowStart.y, to2.x, to2.y).
      drawPolygon(to2.x, to2.y, secondArrowCorner1.x, secondArrowCorner1.y, to2.x, to2.y, secondArrowCorner2.x,
        secondArrowCorner2.y)
  }
}

function drawMultiRotationVFX () {
  const focusPoint = getMousePosition()
  const width = 4
  const color = 0xFF9829
  const circleAlpha = shouldSnap() ? 0.2 : 0.5
  const alphaMainArrows = shouldSnap() ? 0.2 : 0.8
  const otherArrowsAlpha = 0.8
  const circleRadius = 14
  // draw circle
  getVisualEffectsGraphics().
    clear().
    lineStyle(width, color, circleAlpha).
    drawCircle(focusPoint.x, focusPoint.y, circleRadius)
  const arrowLength = 18
  const arrowCornerLength = 12
  const arrowCornerAngle = 30 * degToRad
  // draw arrows entering circle:
  //   ↓
  // ->o<-
  //   ↑
  currentlyRotatedObjects.forEach(object => {
    const objCenter = getCenter(object)
    const angle = Math.atan2(objCenter.y - focusPoint.y, objCenter.x - focusPoint.x)
    const arrowStart = {
      x: focusPoint.x + Math.cos(angle) * (circleRadius + arrowLength),
      y: focusPoint.y + Math.sin(angle) * (circleRadius + arrowLength),
    }
    const to = {
      x: focusPoint.x + Math.cos(angle) * (circleRadius - width / 2 - 2),
      y: focusPoint.y + Math.sin(angle) * (circleRadius - width / 2 - 2),
    }
    const arrowCorner1 = {
      x: to.x + Math.cos(angle + arrowCornerAngle) * arrowCornerLength,
      y: to.y + Math.sin(angle + arrowCornerAngle) * arrowCornerLength,
    }
    const arrowCorner2 = {
      x: to.x + Math.cos(angle - arrowCornerAngle) * arrowCornerLength,
      y: to.y + Math.sin(angle - arrowCornerAngle) * arrowCornerLength,
    }
    getVisualEffectsGraphics().
      lineStyle(width, color, alphaMainArrows).
      drawPolygon(arrowStart.x, arrowStart.y, to.x, to.y).
      drawPolygon(to.x, to.y, arrowCorner1.x, arrowCorner1.y, to.x, to.y, arrowCorner2.x, arrowCorner2.y)

    // secondary arrows from each target
    const snappedRotation = rotationTowardsCursor(object, to) * degToRad + TAU / 4
    const secondaryArrowLength = 100
    const to2 = {
      x: objCenter.x + Math.cos(snappedRotation) * secondaryArrowLength,
      y: objCenter.y + Math.sin(snappedRotation) * secondaryArrowLength,
    }
    const secondArrowStart = {
      x: objCenter.x + Math.cos(snappedRotation) * (circleRadius - width / 2 - 2),
      y: objCenter.y + Math.sin(snappedRotation) * (circleRadius - width / 2 - 2),
    }
    const secondArrowCorner1 = {
      x: to2.x + Math.cos(snappedRotation + arrowCornerAngle + TAU / 2) * arrowCornerLength,
      y: to2.y + Math.sin(snappedRotation + arrowCornerAngle + TAU / 2) * arrowCornerLength,
    }
    const secondArrowCorner2 = {
      x: to2.x + Math.cos(snappedRotation - arrowCornerAngle + TAU / 2) * arrowCornerLength,
      y: to2.y + Math.sin(snappedRotation - arrowCornerAngle + TAU / 2) * arrowCornerLength,
    }
    getVisualEffectsGraphics().
      lineStyle(5, color, otherArrowsAlpha).
      drawPolygon(secondArrowStart.x, secondArrowStart.y, to2.x, to2.y).
      drawPolygon(to2.x, to2.y, secondArrowCorner1.x, secondArrowCorner1.y, to2.x, to2.y, secondArrowCorner2.x,
        secondArrowCorner2.y)
  })
}

function getCenter (object) {
  if (object instanceof Token) return object.center
  if (object instanceof Tile) return object.center
  if (object instanceof MeasuredTemplate) return object.center
  throw Error('shouldn\'t call getCenter() on other stuff')
}

/**
 * Returns result in degrees
 */
function rotationTowardsCursor (object, cursor) {
  const obj = getCenter(object)
  const target = Math.atan2(cursor.y - obj.y, cursor.x - obj.x) + TAU * 3 / 4 // down = 0
  const degrees = target * radToDeg
  let dBig
  switch (canvas.grid.type) {
    case HEXODDR:
    case HEXEVENR:
    case HEXODDQ:
    case HEXEVENQ:
      dBig = 60
      break
    case SQUARE:
      dBig = 45
      break
    case GRIDLESS:
      dBig = 15
      break
    default:
      console.warn(`Alternative Rotation | unknown grid type ${canvas.grid.type}, using default value of 45`)
      dBig = 45
      break
  }
  const dSmall = getSetting('smooth-rotation') ? 0.1 : 5
  const snap = shouldSnap() ? dBig : dSmall
  const offset = [HEXODDR, HEXEVENR].includes(canvas.grid.type) ? 30 : 0
  return (Math.round((degrees - offset) / snap) * snap + offset) % 360
}

const updateRotationsWithMesh = () => {
  const now = performance.now()
  const fastPreviewEnabled = getSetting('fast-preview')
  const skippingRotationDueToHighFrequency = (now - timeLastRotated) < 1000 / getSetting('rotation-update-frequency')
  const cursorPosition = getMousePosition()
  if (isNowRotatingMultiple()) {
    drawMultiRotationVFX(cursorPosition)
  } else {
    drawDirectionalArrow()
  }
  const updates = currentlyRotatedObjects.map(object => {
    const targetRotation = rotationTowardsCursor(object, cursorPosition)
    if (fastPreviewEnabled && !object.document.lockRotation) {
      // fast preview:  rotate image of token/tile in client, which feels very fast
      object.mesh.rotation = targetRotation * degToRad
      return null
    }
    if (object.document.rotation === targetRotation) return null
    return { _id: object.id, rotation: object._updateRotation({ angle: targetRotation }) }
  }).filter(u => u !== null)
  if (skippingRotationDueToHighFrequency) return
  if (updates.length > 0 && !fastPreviewEnabled) {
    const documentName = currentlyRotatedObjects[0].document.documentName
    timeLastRotated = performance.now()
    canvas.scene.updateEmbeddedDocuments(documentName, updates)
  }
}

/**
 * Right now on foundry templates cannot be controlled and only one can be hovered at a time, so we always rotate a single one.
 */
const updateTemplateRotation = () => {
  const now = performance.now()
  const skippingRotationDueToHighFrequency = (now - timeLastRotated) < 1000 / getSetting('rotation-update-frequency')
  // draw arrow
  drawDirectionalArrow()
  if (skippingRotationDueToHighFrequency) return
  const object = currentlyRotatedObjects[0]
  // Continue rotation
  const cursorPosition = getMousePosition()
  let targetRotation = rotationTowardsCursor(object, cursorPosition)
  // templates don't use rotation, they use direction, 90 degrees away
  targetRotation = (targetRotation + 90) % 360
  if (object.document.direction !== targetRotation) {
    // rotate data of template (no preview).  will be sent to remote server (and other players), but lag
    timeLastRotated = performance.now()
    object.document.update({ direction: targetRotation })
  }
}

const updatePlaceableRotations = () => {
  if (canvas.activeLayer instanceof TemplateLayer)
    updateTemplateRotation()
  else
    updateRotationsWithMesh()
}

function onMouseMoveAR () {
  if (isNowRotating()) {
    updatePlaceableRotations()
  }
}

function completeRotation () {
  getVisualEffectsGraphics().clear()
  const cursorPosition = getMousePosition()
  let animate = !getSetting('fast-preview')
  let updates
  if (canvas.activeLayer instanceof TemplateLayer) {
    updates = currentlyRotatedObjects.map(object => {
      const angle = rotationTowardsCursor(object, cursorPosition)
      // templates don't use rotation, they use direction, 90 degrees away
      const direction = object._updateRotation({ angle: angle + 90 })
      return { _id: object.id, direction }
    })
    animate = false // templates don't animate when they rotate
  } else {
    updates = currentlyRotatedObjects.map(object => {
      const angle = rotationTowardsCursor(object, cursorPosition)
      const rotation = object._updateRotation({ angle })
      return { _id: object.id, rotation }
    })
  }
  if (updates.length > 0) {
    const documentName = currentlyRotatedObjects[0].document.documentName
    canvas.scene.updateEmbeddedDocuments(documentName, updates, { animate })
  }
  currentlyRotatedObjects = []
}

const onRotateButtonDown = () => {
  const { CONTROL } = foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS
  if (game.keybindings.get(MODULE_ID, 'alternative-rotation')[0].key === 'KeyR' &&
    game.keyboard.isModifierActive(CONTROL)) {
    // exception for Ctrl+R -- don't even start rotating, because the browser will refresh the page, it'll look awkward
    return
  }
  const controlled = controlledObjectsOnCurrentLayer()
  if (controlled.length === 0) {
    return
  }
  currentlyRotatedObjects = controlled
  updatePlaceableRotations()
}

const onRotateButtonUp = () => {
  if (isNowRotating()) {
    completeRotation()
  }
}

const onSnapButtonDown = () => {
  isSnapButtonHeld = true
  if (currentlyRotatedObjects.length >= 2) {
    drawMultiRotationVFX(getMousePosition())
  } else if (currentlyRotatedObjects.length === 1) {
    drawDirectionalArrow()
  }
}

const onSnapButtonUp = () => {
  isSnapButtonHeld = false
  if (currentlyRotatedObjects.length >= 2) {
    drawMultiRotationVFX(getMousePosition())
  } else if (currentlyRotatedObjects.length === 1) {
    drawDirectionalArrow()
  }
}

Hooks.once('init', function () {
  game.settings.register(MODULE_ID, 'alt-snap-by-default', {
    name: 'Snap to grid directions by default',
    hint: 'If true, rotation will snap to 45°/60° by default unless you hold the "alternative Rotation (snap)" key modifier, inverting its behavior.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
  })
  game.settings.register(MODULE_ID, 'smooth-rotation', {
    name: 'Smooth rotation',
    hint: 'If true, will reduce soft snapping from 5-degree increments to 0.1 degree increments.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
  })
  game.settings.register(MODULE_ID, 'fast-preview', {
    name: 'Fast Preview',
    hint: 'If true, there will be no lag when rotating, but other players won\'t see the change until you let go.',
    scope: 'client',
    config: true,
    default: true,
    type: Boolean,
  })
  game.settings.register(MODULE_ID, 'rotation-update-frequency', {
    name: 'Rotation update frequency',
    hint: 'Only applies if Fast Preview is disabled.  Default 60 (times per second). Increase this for smoother' +
      ' yet possibly laggier rotation.',
    scope: 'client',
    config: true,
    default: 60,
    type: Number,
  })
})

Hooks.once('setup', function () {
  const { SHIFT, ALT, CONTROL } = foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS
  game.keybindings.register(MODULE_ID, 'alternative-rotation', {
    name: 'Alternative Rotation',
    hint: 'Hold this key while having token(s) selected to make the token(s) turn towards the cursor.' +
      ' Hold Shift to snap to grid directions (45°/60°).',
    editable: [
      {
        key: 'KeyO',
      },
    ],
    reservedModifiers: [SHIFT, ALT, CONTROL],
    onDown: () => { onRotateButtonDown() },
    onUp: () => { onRotateButtonUp() },
  })
  game.keybindings.register(MODULE_ID, 'alternative-rotation-snap', {
    name: 'Alternative Rotation (snap)',
    hint: 'Hold this modifier key while using Alternative Rotation to snap to grid directions (45°/60°).',
    editable: [
      {
        key: 'ShiftLeft',
      },
      {
        key: 'ShiftRight',
      },
    ],
    onDown: () => { onSnapButtonDown() },
    onUp: () => { { onSnapButtonUp() } },
  })
  console.log(`Alternative Rotation | initialized`)
})

Hooks.once('canvasInit', function () {
  getVisualEffectsGraphics()
})

Hooks.on('canvasReady', function () {
  canvas.stage.on('mousemove', onMouseMoveAR)
})
