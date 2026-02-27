use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "desktop")]
use std::fs::File;
#[cfg(feature = "desktop")]
use std::io::Read;
#[cfg(feature = "desktop")]
use std::path::Path;

#[derive(Debug, Deserialize, Serialize)]
struct MainConfig {
    oad_list: Vec<OadItem>,
}

#[derive(Debug, Deserialize, Serialize)]
struct OadItem {
    master_oad: String,
    name: String,
    #[serde(rename = "file")]
    file_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ListItem {
    pub v_oad: String,
    pub item_07: String,
    pub start_pos: u32,
    pub len_07: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SubConfig {
    #[serde(flatten)]
    pub lists: HashMap<String, Vec<ListItem>>,
}

#[derive(Debug)]
pub struct CompleteConfig {
    main_config: MainConfig,
    sub_configs: HashMap<String, SubConfig>,
}

impl CompleteConfig {
    #[cfg(feature = "desktop")]
    fn new(config_path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let main_config = Self::load_main_config(config_path)?;
        let mut sub_configs = HashMap::new();

        let base_path = config_path.parent().unwrap_or_else(|| Path::new(""));

        for oad_item in &main_config.oad_list {
            let file_path = oad_item.file_path.trim_start_matches("!inc ");
            let full_path = base_path.join(file_path);

            let sub_config = Self::load_sub_config(&full_path, &oad_item.name)?;
            sub_configs.insert(oad_item.master_oad.clone(), sub_config);
        }

        Ok(CompleteConfig {
            main_config,
            sub_configs,
        })
    }

    #[cfg(not(feature = "desktop"))]
    fn new_from_strs(main_yaml: &str, sub_yaml_map: &HashMap<String, String>) -> Result<Self, Box<dyn std::error::Error>> {
        let main_config: MainConfig = serde_yaml::from_str(main_yaml)?;
        let mut sub_configs = HashMap::new();
        for oad_item in &main_config.oad_list {
            let _file_path = oad_item.file_path.trim_start_matches("!inc ");
            // use name to lookup
            if let Some(sub_yaml) = sub_yaml_map.get(&oad_item.name) {
                let sub_config: SubConfig = serde_yaml::from_str(sub_yaml)?;
                sub_configs.insert(oad_item.master_oad.clone(), sub_config);
            }
        }
        Ok(CompleteConfig { main_config, sub_configs })
    }

    #[cfg(feature = "desktop")]
    fn load_main_config(path: &Path) -> Result<MainConfig, Box<dyn std::error::Error>> {
        let mut file = File::open(path)?; // 使用 File::open
        let mut content = String::new();

        file.read_to_string(&mut content)?; // 读取文件内容
        let config: MainConfig = serde_yaml::from_str(&content)?; // 解析 YAML
        Ok(config)
    }

    #[cfg(feature = "desktop")]
    fn load_sub_config(
        path: &Path,
        list_name: &str,
    ) -> Result<SubConfig, Box<dyn std::error::Error>> {
        let mut file = File::open(path)?; // 使用 File::open
        let mut content = String::new();

        file.read_to_string(&mut content)?; // 读取文件内容
        let config: SubConfig = serde_yaml::from_str(&content)?;
        Ok(config)
    }

    fn get_config_by_master_oad(&self, master_oad: &str) -> Option<&SubConfig> {
        let master_oad_lower = master_oad.to_lowercase();
        self.sub_configs.iter().find_map(|(key, config)| {
            if key.to_lowercase() == master_oad_lower {
                Some(config)
            } else {
                None
            }
        })
    }
}

#[cfg(feature = "desktop")]
lazy_static! {
    static ref TASK_OAD_CONFIG: CompleteConfig = {
        match CompleteConfig::new(Path::new("./resources/taskoadconfig/oad_list.yml")) {
            Ok(config) => config,
            Err(e) => {
                eprintln!("{}", e);
                panic!("读取配置文件失败")
            }
        }
    };
}

#[cfg(not(feature = "desktop"))]
use std::sync::RwLock;
#[cfg(not(feature = "desktop"))]
lazy_static! {
    static ref TASK_OAD_CONFIG: RwLock<Option<CompleteConfig>> = RwLock::new(None);
}

#[cfg(not(feature = "desktop"))]
pub fn init_task_oad_from_strs(main_yaml: &str, sub_yaml_map: &HashMap<String, String>) -> Result<(), Box<dyn std::error::Error>> {
    let cfg = CompleteConfig::new_from_strs(main_yaml, sub_yaml_map)?;
    let mut guard = TASK_OAD_CONFIG.write().unwrap();
    *guard = Some(cfg);
    Ok(())
}

pub struct TaskOadConfigManager;

impl TaskOadConfigManager {
    pub fn get_voad(master_oad: &str, v_oad: &str) -> Option<ListItem> {
        #[cfg(feature = "desktop")]
        {
            let config = TASK_OAD_CONFIG.get_config_by_master_oad(master_oad);
            if config.is_none() {
                eprintln!("找不到对应的配置列表: {}", master_oad);
                return None;
            }
            let config = config.unwrap();
            for (list_name, items) in &config.lists {
                for item in items {
                    if item.v_oad.to_lowercase() == v_oad.to_lowercase() {
                        return Some(item.clone());
                    }
                }
            }
            None
        }
        #[cfg(not(feature = "desktop"))]
        {
            let guard = TASK_OAD_CONFIG.read().unwrap();
            if guard.is_none() {
                eprintln!("TASK_OAD_CONFIG not initialized");
                return None;
            }
            let cfg = guard.as_ref().unwrap();
            let config = cfg.get_config_by_master_oad(master_oad);
            if config.is_none() {
                eprintln!("找不到对应的配置列表: {}", master_oad);
                return None;
            }
            for (_list_name, items) in &config.unwrap().lists {
                for item in items {
                    if item.v_oad.to_lowercase() == v_oad.to_lowercase() {
                        return Some(item.clone());
                    }
                }
            }
            None
        }
    }
}
