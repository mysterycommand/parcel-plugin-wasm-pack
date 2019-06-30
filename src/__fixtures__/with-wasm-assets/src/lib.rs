extern crate wasm_bindgen;
extern crate web_sys;

mod utils;

use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn run() {
    utils::set_panic_hook();
    console::log_1(&JsValue::from_str("run"));
}
