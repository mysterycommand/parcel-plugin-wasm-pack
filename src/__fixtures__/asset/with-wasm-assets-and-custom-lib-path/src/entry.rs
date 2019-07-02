extern crate wasm_bindgen;
extern crate web_sys;

use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn run() {
    console::log_1(&JsValue::from_str("run"));
}
