const { Token, Tile } = foundry.canvas.placeables
const { TokenLayer, TilesLayer } = foundry.canvas.layers

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

function isSnapRotationButtonHeld () {
  return isSnapButtonHeld
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
 * Can only multi-rotate tokens and tiles (could add others in the future if needed)
 */
function controlledObjectsOnCurrentLayer () {
  switch (true) {
    case canvas.activeLayer instanceof TilesLayer:
      return canvas.tiles.controlled
    case canvas.activeLayer instanceof TokenLayer:
      return canvas.tokens.controlled
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
  const alphaMainArrow = isSnapRotationButtonHeld() ? 0.3 : 0.8
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

  if (isSnapRotationButtonHeld()) {
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
  const circleAlpha = isSnapRotationButtonHeld() ? 0.2 : 0.5
  const alphaMainArrows = isSnapRotationButtonHeld() ? 0.2 : 0.8
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
  controlledObjectsOnCurrentLayer().forEach(object => {
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
  if (object instanceof Tile) return {
    x: object.x + object.width / 2,
    y: object.y + object.height / 2,
  }
  throw Error('shouldn\'t call getCenter() on other stuff')
}

/**
 * Returns result in degrees
 */
function rotationTowardsCursor (object, cursor) {
  const obj = getCenter(object)
  const target = Math.atan2(cursor.y - obj.y, cursor.x - obj.x) + TAU * 3 / 4 // down = 0
  const degrees = target * radToDeg
  const dBig = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 60 : 45
  const dSmall = getSetting('smooth-rotation') ? 0.1 : 5
  const snap = isSnapRotationButtonHeld() ? dBig : dSmall
  return Math.round(degrees / snap) * snap
}

const updateTokenRotations = () => {
  const now = performance.now()
  const shouldSkipRotation = !getSetting('fast-preview') && (now - timeLastRotated) < 1000 /
    getSetting('rotation-update-frequency')
  if (isNowRotatingMultiple()) {
    drawMultiRotationVFX(getMousePosition())
    if (shouldSkipRotation) return
    const updates = controlledObjectsOnCurrentLayer().map(object => {
      const angle = rotationTowardsCursor(object, getMousePosition())
      if (object.document.rotation === angle) return
      if (getSetting('fast-preview')) {
        // fast preview:  rotate image of token/tile in client, which feels very fast
        object.mesh.rotation = angle * degToRad
        return
      }
      let update = { _id: object.id }
      const rotation = object._updateRotation({ angle })
      foundry.utils.mergeObject(update, { rotation })
      return update
    }).filter(u => u !== null)
    if (updates.length > 0 && !getSetting('fast-preview')) {
      const documentName = controlledObjectsOnCurrentLayer()[0].document.documentName
      timeLastRotated = performance.now()
      canvas.scene.updateEmbeddedDocuments(documentName, updates)
    }
  } else {
    // draw arrow
    drawDirectionalArrow()
    if (shouldSkipRotation) return
    const object = currentlyRotatedObjects[0]
    // Continue rotation
    const cursor = getMousePosition()
    const targetRotation = rotationTowardsCursor(object, cursor)
    if (object.document.rotation === targetRotation) return
    if (getSetting('fast-preview')) {
      // fast preview:  rotate image of token/tile in client, which feels very fast
      object.mesh.rotation = targetRotation * degToRad
    } else {
      // not fast preview:  rotate data of token/tile.  will be sent to remote server (and other players), but lag
      timeLastRotated = performance.now()
      object.document.update({ rotation: targetRotation })
    }
  }
}

function onMouseMoveAR () {
  if (isNowRotating()) {
    updateTokenRotations()
  }
}

function completeRotation () {
  getVisualEffectsGraphics().clear()
  const animate = !getSetting('fast-preview')
  const updates = currentlyRotatedObjects.map(object => {
    let update = { _id: object.id }
    const angle = rotationTowardsCursor(object, getMousePosition())
    const rotation = object._updateRotation({ angle })
    foundry.utils.mergeObject(update, { rotation })
    return update
  })
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
  updateTokenRotations()
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
  game.settings.register(MODULE_ID, 'smooth-rotation', {
    name: 'Smooth rotation',
    hint: 'Disable snapping to 5-degree increments when using the module.',
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
        key: 'KeyR',
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
