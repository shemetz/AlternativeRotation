# Changelog
All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

##  [1.3.2] - 2021-12-13
- Fixed compatibility with Foundry v9.232

##  [1.3.1] - 2021-08-23
- Changed libWrapper to a real dependency instead of shimming it, because by now Foundry should handle dependencies well
- Bug fix ([#10](https://github.com/itamarcu/AlternativeRotation/issues/10)) - weird bug happened when deleting measured templates and turning with Ctrl and clicking canvas
- Bug fix ([#11](https://github.com/itamarcu/AlternativeRotation/issues/11)) - console warnings were shown when running with PF2E system

## [1.2.3] - 2021-05-29
- Improved visual effect of multiple rotation ([demo](metadata/multiple_rotation_demo_2.gif))
- Fixed compatibility with Foundry v0.8.5
- Added license and changelog
- (1.2.2) Bug fix ([#7](https://github.com/itamarcu/AlternativeRotation/issues/7)) - visual arrows relied on a value that was not always initialized
- (1.2.3) Bug fix ([#8](https://github.com/itamarcu/AlternativeRotation/issues/8)) - things broke when trying to render the visual effect in different scenes

## [1.1.0] - 2020-12-19
- Added "Fast Preview" setting

## [1.0.1] - 2020-12-05
- Added multiple rotation feature (shift-dragging in an empty area while selecting multiple things)
- Fixed most leftover bugs

## 0.3.1 - 2020-09-18
- Created the module, with initial feature set

## See also: [Unreleased]

[Unreleased]: https://github.com/itamarcu/AlternativeRotation/compare/1.3.2...HEAD
[1.0.1]: https://github.com/itamarcu/AlternativeRotation/compare/0.3.1...1.0.1
[1.1.0]: https://github.com/itamarcu/AlternativeRotation/compare/1.0.1...1.1.0
[1.2.3]: https://github.com/itamarcu/AlternativeRotation/compare/1.1.0...1.2.3
[1.3.1]: https://github.com/itamarcu/AlternativeRotation/compare/1.2.3...1.3.1
[1.3.2]: https://github.com/itamarcu/AlternativeRotation/compare/1.3.1...1.3.2
