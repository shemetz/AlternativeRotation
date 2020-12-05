# [Alternative Rotation](https://foundryvtt.com/packages/alternative-rotation/)

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/itamarcu/AlternativeRotation?style=for-the-badge) 
![GitHub Releases](https://img.shields.io/github/downloads/itamarcu/AlternativeRotation/latest/total?style=for-the-badge) 
![GitHub All Releases](https://img.shields.io/github/downloads/itamarcu/AlternativeRotation/total?style=for-the-badge&label=Downloads+total)  

Allows rotating tokens and tiles by dragging in a direction and releasing.

To install, browse for it in the module browser, or [directly copy the manifest link for the latest release](https://github.com/itamarcu/AlternativeRotation/releases/latest/download/module.json).

![thumbnail](github_media/thumbnail.png)

# Gifs

![simple_rotation_demo](github_media/simple_rotation_demo.gif)

![multiple_rotation_demo](github_media/multiple_rotation_demo.gif)

![full_rotation_demo](github_media/full_rotation_demo.gif)

# Features

This module adds a new way of rotating tiles and tokens: shift+dragging towards the intended direction. This is in 
addition to the default methods of rotation a token in Foundry - shift+scrolling while hovering over it, and shift+arrows
when selecting it. 

Hold the Shift key and drag with the left mouse button away from a token. The token will rotate to face the cursor, 
settling when you let go of the mouse button. The token will update its position with every movement - so if you're the
GM and you're rotating an enemy to face the players, they will see it smoothly.

You can also hold Shift while dragging in an empty spot while having multiple tiles/tokens selected; this will make all
selected tiles/tokens turn to face your cursor, until you release the mouse button.  

By holding Shift+Ctrl, rotation will snap to the grid directions (same directions you'd snap to when doing the default 
"fast rotation" in Foundry; 45° or 60°). With Shift only, rotation will snap to 5 degrees, though you can completely
disable even this snapping in the settings ("Smooth rotation").

Rotation will assume that the bottom of the token image is its "front"; the token looks down when viewing its image.
This is the most common standard for token images.

