// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../pkg/wasm-loader.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.load = load;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function isFetchable(value) {
  return value instanceof URL || typeof value === 'string' || value instanceof Request;
}

function isWasmInstance(value) {
  return value instanceof WebAssembly.Instance;
}

var canInstantiateStreaming = typeof WebAssembly.instantiateStreaming === 'function';
var streamErrorMessage = ['`WebAssembly.instantiateStreaming` failed. Assuming this is because your', 'server does not serve wasm with `application/wasm` MIME type. Falling back', 'to `WebAssembly.instantiate` which is slower. Original error:\n'].join(' ');

function instantiate(request) {
  return request.then(function (response) {
    return response.arrayBuffer();
  }).then(function (bytes) {
    return WebAssembly.instantiate(bytes, imports);
  });
}

function instantiateRequest(request, imports) {
  return canInstantiateStreaming ? WebAssembly.instantiateStreaming(request, imports).catch(function (e) {
    console.warn(streamErrorMessage, e);
    return instantiate(request);
  }) : instantiate(request);
}

function instantiateModule(_x, _x2) {
  return _instantiateModule.apply(this, arguments);
}

function _instantiateModule() {
  _instantiateModule = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(module, imports) {
    var result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return WebAssembly.instantiate(module, imports);

          case 2:
            result = _context.sent;
            return _context.abrupt("return", isWasmInstance(result) ? {
              instance: result,
              module: module
            } : result);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _instantiateModule.apply(this, arguments);
}

function load(_x3, _x4) {
  return _load.apply(this, arguments);
}

function _load() {
  _load = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(wasm, imports) {
    var _ref, instance, module;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return isFetchable(wasm) ? instantiateRequest(fetch(wasm), imports) : instantiateModule(wasm, imports);

          case 2:
            _ref = _context2.sent;
            instance = _ref.instance;
            module = _ref.module;
            load.__wbindgen_wasm_module = module;
            return _context2.abrupt("return", instance.exports);

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _load.apply(this, arguments);
}
},{}],"../pkg/packager_with_wasm_assets.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = run;
exports.default = init;
exports.__wbindgen_throw = exports.__widl_f_log_1_ = exports.__wbg_stack_558ba5917b466edd = exports.__wbg_new_59cb74e423758ede = exports.__wbg_error_4bb6c2a97407129a = exports.__wbindgen_object_drop_ref = exports.__wbindgen_string_new = void 0;

var _wasmLoader = require("./wasm-loader.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var wasm;
/**
* @returns {void}
*/

function run() {
  return wasm.run();
}

var cachedTextDecoder = new TextDecoder('utf-8');
var cachegetUint8Memory = null;

function getUint8Memory() {
  if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
    cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
  }

  return cachegetUint8Memory;
}

function getStringFromWasm(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

var heap = new Array(32);
heap.fill(undefined);
heap.push(undefined, null, true, false);
var heap_next = heap.length;

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  var idx = heap_next;
  heap_next = heap[idx];
  if (typeof heap_next !== 'number') throw new Error('corrupt heap');
  heap[idx] = obj;
  return idx;
}

function getObject(idx) {
  return heap[idx];
}

function dropObject(idx) {
  if (idx < 36) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function takeObject(idx) {
  var ret = getObject(idx);
  dropObject(idx);
  return ret;
}

var WASM_VECTOR_LEN = 0;
var cachedTextEncoder = new TextEncoder('utf-8');
var passStringToWasm;

if (typeof cachedTextEncoder.encodeInto === 'function') {
  passStringToWasm = function passStringToWasm(arg) {
    if (typeof arg !== 'string') throw new Error('expected a string argument');
    var size = arg.length;

    var ptr = wasm.__wbindgen_malloc(size);

    var offset = 0;
    {
      var mem = getUint8Memory();

      for (; offset < arg.length; offset++) {
        var code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
      }
    }

    if (offset !== arg.length) {
      arg = arg.slice(offset);
      ptr = wasm.__wbindgen_realloc(ptr, size, size = offset + arg.length * 3);
      var view = getUint8Memory().subarray(ptr + offset, ptr + size);
      var ret = cachedTextEncoder.encodeInto(arg, view);
      if (ret.read != arg.length) throw new Error('failed to pass whole string');
      offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
  };
} else {
  passStringToWasm = function passStringToWasm(arg) {
    if (typeof arg !== 'string') throw new Error('expected a string argument');
    var size = arg.length;

    var ptr = wasm.__wbindgen_malloc(size);

    var offset = 0;
    {
      var mem = getUint8Memory();

      for (; offset < arg.length; offset++) {
        var code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
      }
    }

    if (offset !== arg.length) {
      var buf = cachedTextEncoder.encode(arg.slice(offset));
      ptr = wasm.__wbindgen_realloc(ptr, size, size = offset + buf.length);
      getUint8Memory().set(buf, ptr + offset);
      offset += buf.length;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
  };
}

var cachegetUint32Memory = null;

function getUint32Memory() {
  if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
    cachegetUint32Memory = new Uint32Array(wasm.memory.buffer);
  }

  return cachegetUint32Memory;
}

var __wbindgen_string_new = function __wbindgen_string_new(arg0, arg1) {
  var varg0 = getStringFromWasm(arg0, arg1);

  try {
    return addHeapObject(varg0);
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__wbindgen_string_new = __wbindgen_string_new;

var __wbindgen_object_drop_ref = function __wbindgen_object_drop_ref(arg0) {
  try {
    takeObject(arg0);
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__wbindgen_object_drop_ref = __wbindgen_object_drop_ref;

var __wbg_error_4bb6c2a97407129a = function __wbg_error_4bb6c2a97407129a(arg0, arg1) {
  var varg0 = getStringFromWasm(arg0, arg1);
  varg0 = varg0.slice();

  wasm.__wbindgen_free(arg0, arg1 * 1);

  try {
    console.error(varg0);
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__wbg_error_4bb6c2a97407129a = __wbg_error_4bb6c2a97407129a;

var __wbg_new_59cb74e423758ede = function __wbg_new_59cb74e423758ede() {
  try {
    return addHeapObject(new Error());
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__wbg_new_59cb74e423758ede = __wbg_new_59cb74e423758ede;

var __wbg_stack_558ba5917b466edd = function __wbg_stack_558ba5917b466edd(ret, arg0) {
  try {
    var retptr = passStringToWasm(getObject(arg0).stack);
    var retlen = WASM_VECTOR_LEN;
    var mem = getUint32Memory();
    mem[ret / 4] = retptr;
    mem[ret / 4 + 1] = retlen;
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__wbg_stack_558ba5917b466edd = __wbg_stack_558ba5917b466edd;

var __widl_f_log_1_ = function __widl_f_log_1_(arg0) {
  try {
    console.log(getObject(arg0));
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__widl_f_log_1_ = __widl_f_log_1_;

var __wbindgen_throw = function __wbindgen_throw(arg0, arg1) {
  var varg0 = getStringFromWasm(arg0, arg1);

  try {
    throw new Error(varg0);
  } catch (e) {
    var error = function () {
      try {
        return e instanceof Error ? "".concat(e.message, "\n\nStack:\n").concat(e.stack) : e.toString();
      } catch (_) {
        return "<failed to stringify thrown value>";
      }
    }();

    console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
    throw e;
  }
};

exports.__wbindgen_throw = __wbindgen_throw;

function init(wasmUrl) {
  return (0, _wasmLoader.load)(wasmUrl, _defineProperty({}, './packager_with_wasm_assets.js', {
    __wbindgen_string_new: __wbindgen_string_new,
    __wbindgen_object_drop_ref: __wbindgen_object_drop_ref,
    __wbg_error_4bb6c2a97407129a: __wbg_error_4bb6c2a97407129a,
    __wbg_new_59cb74e423758ede: __wbg_new_59cb74e423758ede,
    __wbg_stack_558ba5917b466edd: __wbg_stack_558ba5917b466edd,
    __widl_f_log_1_: __widl_f_log_1_,
    __wbindgen_throw: __wbindgen_throw
  })).then(function (wasmExports) {
    wasm = wasmExports;
    return {
      run: run
    };
  });
}
},{"./wasm-loader.js":"../pkg/wasm-loader.js"}],"../pkg/packager_with_wasm_assets_bg.wasm":[function(require,module,exports) {
module.exports = "/packager_with_wasm_assets_bg.28b32056.wasm";
},{}],"lib.rs":[function(require,module,exports) {
"use strict";

var _packager_with_wasm_assets = _interopRequireDefault(require("../pkg/packager_with_wasm_assets.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (0, _packager_with_wasm_assets.default)(require('../pkg/packager_with_wasm_assets_bg.wasm'));
},{"../pkg/wasm-loader.js":"../pkg/wasm-loader.js","../pkg/packager_with_wasm_assets.js":"../pkg/packager_with_wasm_assets.js","../pkg/packager_with_wasm_assets_bg.wasm":"../pkg/packager_with_wasm_assets_bg.wasm"}],"entry.js":[function(require,module,exports) {
"use strict";

var _lib = require("./lib.rs");

(0, _lib.run)();
},{"./lib.rs":"lib.rs"}],0:[function(require,module,exports) {
function cacheReplace(id, mod) {
  // replace the entry in the cache with the loaded wasm module
  module.bundle.cache[id] = null;
  module.bundle.register(id, mod);
}

Promise.all([
  require("./lib.rs").then(wasm => cacheReplace("lib.rs", wasm))
]).then(() => {
  require("./entry.js");
});

},{"./lib.rs":"lib.rs","./entry.js":"entry.js"}]},{},[0], null)