## 2.3.1 - 2025-07-04
- Fixed "locked rotation" tokens from having their visual rotation changed while fast preview is on (fix #27)

## 2.3.0 - 2025-06-20
- Added the ability to rotate templates (#21)
- Added "Snap to grid directions by default" setting
- Changed default key from R to O, because R is now a default keybinding (to toggle the waypoint ruler)
 
## 2.2.8 - 2025-06-20
- Fixed snap on hex row grids (#24), thanks @FolkvangrForgent!
 
## 2.2.7 - 2025-06-20
- Added exception to avoid "rotating" on Ctrl+R
 
## 2.2.6 - 2025-06-20
- Updated to use V13 namespaces

## 2.2.5 - 2025-01-03
- Improved github workflow automation

## 2.2.4 - 2024-06-22
- Marked compatibility with V12

## 2.2.3 - 2023-06-14
- Fixed compatibility with V11

## 2.2.2 - 2023-05-12
- Fixed tiles not rotating (#19)

## 2.2.1 - 2023-05-11
- Fixed scene-switching bug that prevented the visual arrow from re-rendering (#18)

## 2.2.0 - 2022-08-06
- V10 compatibility
- Removed libWrapper as dependency (it wasn't necessary)

## 2.1.2 - 2022-01-28
- Fixed tile rotation previews ([#16](https://github.com/shemetz/AlternativeRotation/issues/16))

## 2.1.1 - 2022-01-08
- Fixed key configuration bug ([#13](https://github.com/shemetz/AlternativeRotation/issues/13))
- Fixed console errors thrown when pressing key without anything selected ([#14](https://github.com/shemetz/AlternativeRotation/issues/14))
- Added setting for specifying rotation frequency ([#4]((https://github.com/shemetz/AlternativeRotation/pull/4))), thanks @hhu94! 

## 2.0.0 - 2022-01-08
- Refactored - now uses keybindings, default R with Shift modifier to snap
- Changed behavior to require a controlled token (or multiple), with button press rotating instead of mouse drag
- Changed UI to show more arrows (especially when holding Shift to snap)
- Fixed compatibility with Foundry v9

## 1.3.2 - 2021-12-13
- Fixed compatibility with Foundry v9.232

## 1.3.1 - 2021-08-23
- Changed libWrapper to a real dependency instead of shimming it, because by now Foundry should handle dependencies well
- Bug fix ([#10](https://github.com/shemetz/AlternativeRotation/issues/10)) - weird bug happened when deleting measured templates and turning with Ctrl and clicking canvas
- Bug fix ([#11](https://github.com/shemetz/AlternativeRotation/issues/11)) - console warnings were shown when running with PF2E system

## 1.2.3 - 2021-05-29
- Improved visual effect of multiple rotation ([demo](metadata/multiple_rotation_demo_2.gif))
- Fixed compatibility with Foundry v0.8.5
- Added license and changelog
- (1.2.2) Bug fix ([#7](https://github.com/shemetz/AlternativeRotation/issues/7)) - visual arrows relied on a value that was not always initialized
- (1.2.3) Bug fix ([#8](https://github.com/shemetz/AlternativeRotation/issues/8)) - things broke when trying to render the visual effect in different scenes

## 1.1.0 - 2020-12-19
- Added "Fast Preview" setting

## 1.0.1 - 2020-12-05
- Added multiple rotation feature (shift-dragging in an empty area while selecting multiple things)
- Fixed most leftover bugs

## 0.3.1 - 2020-09-18
- Created the module, with initial feature set
