## [6.0.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v6.0.0...v6.0.1) (2020-06-06)


### Bug Fixes

* empty 'fix' commit to bump the patch version ([e3451d6](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/e3451d6075a6c906305b056a8bb1e72b1f3c75ba))

# [6.0.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v5.0.1...v6.0.0) (2020-06-05)


### chore

* updating the initPath may be a breaking change ([56a84ad](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/56a84ad950f5fb5dd2944d7ef377413642370556))


### BREAKING CHANGES

* initPath is updated

## [5.0.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v5.0.0...v5.0.1) (2019-11-29)


### Bug Fixes

* fix commit to bump patch version ([c844473](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/c8444732fcbebb31a9be38bf8ef7f6fb62c7ffaa))

# [5.0.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v4.1.2...v5.0.0) (2019-11-01)


### chore

* bump engine ([3eaafd4](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/3eaafd4))


### BREAKING CHANGES

* node 12

## [4.1.2](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v4.1.1...v4.1.2) (2019-09-18)


### Bug Fixes

* **helpers.js:** use a regexp with the global flag to replace all instances in a path ([1906179](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/1906179))

## [4.1.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v4.1.0...v4.1.1) (2019-07-21)


### Bug Fixes

* **browser-wasm-loader.js:** instantiate also needs imports (duh!) ([6de9f52](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/6de9f52))

# [4.1.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v4.0.1...v4.1.0) (2019-07-18)


### Bug Fixes

* **yarn.lock(s):** update transitive dependency on lodash to hopefully fix the security warning ([3cd56d2](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/3cd56d2))


### Features

* **WasmPackAsset:** pick out the wasm module import with a regexp (it should work with or without t ([c3f14ca](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/c3f14ca))

## [4.0.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v4.0.0...v4.0.1) (2019-07-02)


### Bug Fixes

* **package:** add loaders package.json's files key, 4.0.0 is broken ([8d444ea](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/8d444ea)), closes [#61](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/61)

# [4.0.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v3.1.0...v4.0.0) (2019-06-30)


### Features

* **examples/multiple:** updates examples/multiple to include the necessary babel config, preset and ([f2f99fb](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/f2f99fb))
* **examples/single:** add a .browserslistrc that specifies the latest version of Chrome and doesn't ([42944a1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/42944a1))
* **WasmPackAsset:** run wasm-pack with --target bundler, and write our own loader based on the parc ([8c42ed8](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/8c42ed8)), closes [#17](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/17)


### BREAKING CHANGES

* **WasmPackAsset:** adds our own loaders which use async functions and may require the babel transform
runtime depending on target browsers/node versions

# [3.1.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v3.0.4...v3.1.0) (2019-06-29)


### Bug Fixes

* fix [#18](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/18) ... it works! ([6da6c82](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/6da6c82))


### Features

* **examples:** an example using multiple rust/wasm-pack assets in a single bundle (lots of duplicai ([c53a506](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/c53a506))

## [3.0.4](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v3.0.3...v3.0.4) (2019-06-27)


### Bug Fixes

* **WasmPackAsset:** god strings are terrible ([2455507](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/2455507))

## [3.0.3](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v3.0.2...v3.0.3) (2019-06-27)


### Bug Fixes

* **WasmPackAsset:** replace 'import.meta.url' with an error saying that the module arg is required f ([ece0ac4](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/ece0ac4)), closes [#54](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/54)

## [3.0.2](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v3.0.1...v3.0.2) (2019-05-30)


### Bug Fixes

* **build:** be less strict about package managers, and Node versions ([b0d6502](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/b0d6502)), closes [#32](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/32)

## [3.0.1](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v3.0.0...v3.0.1) (2019-05-23)


### Bug Fixes

* **package.json:** just an empty commit to mark the "fix" for semver ([a64b5b6](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/a64b5b6)), closes [#30](https://github.com/mysterycommand/parcel-plugin-wasm-pack/issues/30)

# [3.0.0](https://github.com/mysterycommand/parcel-plugin-wasm-pack/compare/v2.0.2...v3.0.0) (2019-05-22)


### Code Refactoring

* **WasmPackAsset:** export `exports` not `__exports` ... technically bad JS but it works ([fecc5df](https://github.com/mysterycommand/parcel-plugin-wasm-pack/commit/fecc5df))


### BREAKING CHANGES

* **WasmPackAsset:** anything that mistakenly relied on stuff in `__exports` won't get that any more

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
