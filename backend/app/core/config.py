import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from dotenv import load_dotenv


@dataclass
class OllamaConfig:
    base_url: str = "http://127.0.0.1:11434"
    default_model: str = ""
    temperature: float = 0.7
    max_tokens: int = 1024


@dataclass
class CreativityConfig:
    default_level: int = 3
    web_search: bool = False


@dataclass
class AppConfig:
    data_dir: str = "data"
    log_level: str = "INFO"
    ollama: OllamaConfig = field(default_factory=OllamaConfig)
    creativity: CreativityConfig = field(default_factory=CreativityConfig)


CONFIG_PATH = Path("config.yaml")
load_dotenv()


def _read_yaml(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _apply_env(config: AppConfig) -> AppConfig:
    config.ollama.base_url = os.getenv("OLLAMA_BASE_URL", config.ollama.base_url)
    config.ollama.default_model = os.getenv("OLLAMA_DEFAULT_MODEL", config.ollama.default_model)
    return config


def load_config() -> AppConfig:
    raw = _read_yaml(CONFIG_PATH)
    config = AppConfig()

    app_raw = raw.get("app", {})
    config.data_dir = app_raw.get("data_dir", config.data_dir)
    config.log_level = app_raw.get("log_level", config.log_level)

    ollama_raw = raw.get("ollama", {})
    config.ollama.base_url = ollama_raw.get("base_url", config.ollama.base_url)
    config.ollama.default_model = ollama_raw.get("default_model", config.ollama.default_model)
    config.ollama.temperature = float(ollama_raw.get("temperature", config.ollama.temperature))
    config.ollama.max_tokens = int(ollama_raw.get("max_tokens", config.ollama.max_tokens))

    creativity_raw = raw.get("creativity", {})
    config.creativity.default_level = int(
        creativity_raw.get("default_level", config.creativity.default_level)
    )
    config.creativity.web_search = bool(
        creativity_raw.get("web_search", config.creativity.web_search)
    )

    config = _apply_env(config)

    data_dir = Path(config.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "logs").mkdir(parents=True, exist_ok=True)

    return config


APP_CONFIG = load_config()


def config_to_dict(config: AppConfig) -> dict:
    return {
        "app": {
            "data_dir": config.data_dir,
            "log_level": config.log_level,
        },
        "ollama": {
            "base_url": config.ollama.base_url,
            "default_model": config.ollama.default_model,
            "temperature": config.ollama.temperature,
            "max_tokens": config.ollama.max_tokens,
        },
        "creativity": {
            "default_level": config.creativity.default_level,
            "web_search": config.creativity.web_search,
        },
    }


def save_config(config: AppConfig) -> None:
    payload = config_to_dict(config)
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        yaml.safe_dump(payload, f, sort_keys=False)


def update_config_from_dict(payload: dict) -> AppConfig:
    ollama_raw = payload.get("ollama", {})
    APP_CONFIG.ollama.base_url = ollama_raw.get("base_url", APP_CONFIG.ollama.base_url)
    APP_CONFIG.ollama.default_model = ollama_raw.get("default_model", APP_CONFIG.ollama.default_model)
    APP_CONFIG.ollama.temperature = float(ollama_raw.get("temperature", APP_CONFIG.ollama.temperature))
    APP_CONFIG.ollama.max_tokens = int(ollama_raw.get("max_tokens", APP_CONFIG.ollama.max_tokens))

    creativity_raw = payload.get("creativity", {})
    APP_CONFIG.creativity.default_level = int(
        creativity_raw.get("default_level", APP_CONFIG.creativity.default_level)
    )
    APP_CONFIG.creativity.web_search = bool(
        creativity_raw.get("web_search", APP_CONFIG.creativity.web_search)
    )

    save_config(APP_CONFIG)
    return APP_CONFIG
