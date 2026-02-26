//! Lightweight shared crate for basefunc + config usable by both tauri and wasm

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub mod basefunc;
pub mod config;
pub mod logger;
use tracing::info;
// Re-export commonly used types for easier access
pub use basefunc::frame_fun::FrameFun;
pub use basefunc::protocol::FrameAnalisyic;
pub use config::xmlconfig::{QframeConfig, XmlElement};

#[cfg(feature = "wasm")]
use web_sys::console;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct FrameAnalyzer {
    region: String,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl FrameAnalyzer {
    #[wasm_bindgen(constructor)]
    pub fn new(region: &str) -> FrameAnalyzer {
        // Initialize logger for WASM
        crate::logger::init_logger();
        FrameAnalyzer {
            region: region.to_string(),
        }
    }

    /// Main frame processing function - auto-detects protocol and analyzes frame
    #[wasm_bindgen]
    pub fn process_frame(&self, frame_data: &[u8]) -> String {
        let (protocol, parsed_data) = FrameAnalisyic::process_frame(frame_data, &self.region);

        let response = serde_json::json!({
            "protocol": protocol,
            "region": self.region,
            "data": parsed_data
        });

        serde_json::to_string(&response)
            .unwrap_or_else(|e| format!("{{\"error\": \"Serialization error: {}\"}}", e))
    }

    /// Convert hex string to byte array
    #[wasm_bindgen]
    pub fn hex_to_bytes(&self, hex_string: &str) -> Result<Vec<u8>, JsValue> {
        FrameFun::get_hex_frame(hex_string).ok_or_else(|| JsValue::from_str("Invalid hex string"))
    }

    /// Convert byte array to hex string with spaces
    #[wasm_bindgen]
    pub fn bytes_to_hex(&self, data: &[u8]) -> String {
        FrameFun::get_data_str_with_space(data)
    }

    /// Convert hex string to byte array with validation
    #[wasm_bindgen]
    pub fn get_frame_array_from_str(&self, hex_str: String) -> Result<Vec<u8>, JsValue> {
        let frame_cleaned = hex_str.replace(' ', "").replace('\n', "");

        // Validate hex string
        if !frame_cleaned.chars().all(|c| c.is_ascii_hexdigit()) || frame_cleaned.len() % 2 != 0 {
            return Err(JsValue::from_str("Invalid hex string"));
        }

        // Convert hex string to bytes
        FrameFun::get_hex_frame(&frame_cleaned)
            .ok_or_else(|| JsValue::from_str("Failed to convert hex string to bytes"))
    }

    /// Get available protocols
    #[wasm_bindgen]
    pub fn get_available_protocols(&self) -> String {
        let protocols = vec!["CSG13", "CSG16", "DLT/645-2007", "moudle", "MS", "His"];
        serde_json::to_string(&protocols).unwrap_or_else(|_| "[]".to_string())
    }
}

// For Tauri/desktop usage - direct function exports
pub mod api {
    use super::*;
    use serde_json::Value;

    /// Analyze frame using the unified process_frame function
    pub fn analyze_frame(
        frame_data: &[u8],
        region: &str,
    ) -> Result<(String, Vec<Value>), Box<dyn std::error::Error>> {
        let (protocol, parsed_data) = FrameAnalisyic::process_frame(frame_data, region);
        Ok((protocol, parsed_data))
    }

    /// Convert hex string to byte array
    pub fn hex_to_bytes(hex_string: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        FrameFun::get_hex_frame(hex_string).ok_or_else(|| "Invalid hex string".into())
    }

    /// Convert byte array to hex string with spaces
    pub fn bytes_to_hex(data: &[u8]) -> String {
        FrameFun::get_data_str_with_space(data)
    }
}
