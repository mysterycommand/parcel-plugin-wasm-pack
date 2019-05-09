## [2.0.2](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v2.0.1...v2.0.2) (2019-05-09)


### Bug Fixes

* **WasmPackAsset:** only await after the promise is cached ([9b401d4](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/9b401d4)), closes [#20](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/20)

## [2.0.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v2.0.0...v2.0.1) (2019-05-09)


### Bug Fixes

* **WasmPackAsset:** make `isRustInstalling` a promise, assign it once and await that everywhere ([f4004f5](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/f4004f5))
* empty commit to mark the fix ([4428e5b](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/4428e5b)), closes [#20](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/20)

# [2.0.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v1.1.0...v2.0.0) (2019-05-08)


### chore

* bump major version (broke node) ([adc553b](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/adc553b)), closes [#17](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/17)


### BREAKING CHANGES

* no longer builds node target correctly

# [1.1.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v1.0.2...v1.1.0) (2019-05-07)


### Features

* **loader:** add a generic loader ([cad7343](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/cad7343))

## [1.0.2](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v1.0.1...v1.0.2) (2019-04-28)


### Bug Fixes

* **src/WasmPackAsset.js:** make the dependency lookup dynamic based on production or dev ([62e1cdb](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/62e1cdb))

## [1.0.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v1.0.0...v1.0.1) (2019-04-15)


### Bug Fixes

* **.travis.yml:** update token ([8a64162](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/8a64162))

# 1.0.0 (2019-04-14)


### Bug Fixes

* **.travis.yml:** travis init ([224acb1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/224acb1))
* **none:** just a fix commit to bump the patch version ([f5ebcbc](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/f5ebcbc))
* **package.json:** drop the current version so the first release doesn't get confused ([ff8b201](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/ff8b201))


### Features

* **plugin:** add starter classes for different asset types this thing might handle ([eefe305](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/eefe305))
* **plugin:** add the electron/node loader ([8db8902](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/8db8902))
* **src/WasmPackAsset.js:** add the release flag if we're in production, use the dev flag otherwise ([3e338d4](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/3e338d4))
