use tracing::{error, info, warn};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "wasm")]
use web_sys::console;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn warn(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

#[cfg(feature = "wasm")]
pub fn init_logger() {
    // 设置 panic hook
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    // 初始化 tracing-wasm，这样 info!, warn!, error! 等宏就能直接输出到浏览器控制台
    tracing_wasm::set_as_global_default();
}

#[cfg(not(feature = "wasm"))]
pub fn init_logger() {
    // 非WASM环境的日志初始化（如果需要的话）
    // 这里可以初始化其他的 tracing subscriber
}