//! Lightweight shared crate for basefunc + config usable by both tauri and wasm

use std::collections::HashMap;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub mod basefunc;
pub mod config;
pub mod logger;
// Re-export commonly used types for easier access
pub use basefunc::frame_fun::FrameFun;
pub use basefunc::protocol::FrameAnalisyic;
pub use config::oadmapconfig::TaskOadConfigManager;
pub use config::xmlconfig::{ProtocolConfigManager, QframeConfig, XmlElement};

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct FrameAnalyzer {
    // Remove region field since it's passed per call
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl FrameAnalyzer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> FrameAnalyzer {
        // Initialize logger for WASM
        crate::logger::init_logger();
        TaskOadConfigManager::default();
        FrameAnalyzer {
            // No region field to initialize
        }
    }

    /// Main frame processing function - auto-detects protocol and analyzes frame
    #[wasm_bindgen]
    pub fn process_frame(&self, frame_data: &[u8], region: &str) -> String {
        let (protocol, parsed_data) = FrameAnalisyic::process_frame(frame_data, region);

        let response = serde_json::json!({
            "protocol": protocol,
            "region": region,
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
        let protocols = vec!["CSG13", "CSG16", "DLT/645-2007", "moudle", "MS"];
        serde_json::to_string(&protocols).unwrap_or_else(|_| "[]".to_string())
    }

    #[wasm_bindgen]
    pub fn update_protocol_config(&self, protocol: String, content: String) -> Result<(), JsValue> {
        ProtocolConfigManager::update_protocol_xmlconfig(&protocol, &content)
            .map_err(|e| JsValue::from_str(&format!("Failed to update config: {}", e)))
    }

    #[wasm_bindgen]
    pub fn reset_protocol_config(&self, protocol: String) -> Result<(), JsValue> {
        ProtocolConfigManager::reset_protocol_xmlconfig(&protocol)
            .map_err(|e| JsValue::from_str(&format!("Failed to reset config: {}", e)))
    }

    #[wasm_bindgen]
    pub fn init_oad_map(&self, main_yaml: &str, sub_yaml_map_json: &str) -> Result<(), JsValue> {
        // Parse JSON string to HashMap
        let sub_yaml_map: HashMap<String, String> = serde_json::from_str(sub_yaml_map_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse sub_yaml_map JSON: {}", e)))?;

        TaskOadConfigManager::init(main_yaml, &sub_yaml_map)
            .map_err(|e| JsValue::from_str(&format!("Failed to initialize OAD map: {}", e)))
    }

    #[wasm_bindgen]
    pub fn parse_item_data(
        &self,
        item: String,
        input: String,
        protocol: String,
        region: String,
    ) -> Result<JsValue, String> {
        // 检查输入参数
        if item.is_empty() {
            return Err("数据标识不能为空".to_string());
        }
        if input.is_empty() {
            return Err("数据内容不能为空".to_string());
        }
        if protocol.is_empty() {
            return Err("协议类型不能为空".to_string());
        }
        if region.is_empty() {
            return Err("区域不能为空".to_string());
        }

        // 清理输入数据
        let item = item.trim().to_uppercase();
        let input = input.trim();
        let protocol = protocol.trim();
        let region = region.trim();

        // 验证数据标识格式
        if !item.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err("数据标识必须是有效的16进制字符串".to_string());
        }

        // 验证数据内容格式
        if !input.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err("数据内容必须是有效的16进制字符串".to_string());
        }

        let dir = Some(1);
        let mut sub_result = Vec::new();

        // 将数据标识和数据内容转换为字节数组
        let itemdata = FrameFun::get_frame_list_from_str(&item);
        let data_segment = FrameFun::get_frame_list_from_str(&input);

        // 获取数据项配置
        let mut data_item_elem =
            match ProtocolConfigManager::get_config_xml(&item, &protocol, &region, dir) {
                Some(elem) => elem,
                None => return Err(format!("未找到数据标识[{}]的配置信息", item)),
            };

        // 处理数据项配置
        let sub_length = match data_item_elem.get_child_text("length") {
            Some(length_str) => match length_str.parse::<usize>() {
                Ok(length) => length,
                Err(_) => data_segment.len(),
            },
            None => data_segment.len(),
        };

        // 检查数据长度
        if sub_length > data_segment.len() {
            return Err(format!(
                "数据长度({})超过实际数据长度({})",
                sub_length,
                data_segment.len()
            ));
        }

        let sub_datament = &data_segment[..sub_length];

        // 更新数据项配置
        data_item_elem.update_value("length", sub_length.to_string());

        // 解析数据
        let item_data = FrameAnalisyic::prase_data(
            &mut data_item_elem,
            &protocol,
            &region,
            &data_segment,
            0,
            dir,
        );

        // 获取数据项名称
        let name = data_item_elem.get_child_text("name").unwrap_or_default();
        let dis_data_identifier = format!("数据标识编码：[{}]-{}", item, name);

        // 构建结果字符串
        let result_str = format!("数据标识[{}]数据内容：", item);
        let description = format!(
            "{}{}",
            result_str,
            FrameFun::get_data_str(&data_segment, false, true, false)
        );

        // 添加数据标识信息
        FrameFun::add_data(
            &mut sub_result,
            "数据标识编码DI".to_string(),
            FrameFun::get_data_str_reverser_with_space(&itemdata),
            dis_data_identifier,
            vec![0, 0],
            None,
            None,
        );

        // 添加数据内容信息
        FrameFun::add_data(
            &mut sub_result,
            "数据标识内容".to_string(),
            FrameFun::get_data_str_with_space(sub_datament),
            description,
            vec![0, 0],
            Some(item_data),
            None,
        );

        let response = serde_json::json!({
            "protocol": protocol,
            "region": region,
            "success": true,
            "data": sub_result
        });

        let json_string = serde_json::to_string(&response)
            .unwrap_or_else(|e| format!("{{\"error\": \"Serialization error: {}\"}}", e));

        Ok(JsValue::from_str(&json_string))
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
