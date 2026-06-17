use tauri::Manager;
use std::sync::Mutex;

// ── State ──

struct AppState {
    penetration_enabled: bool,
}

// ── Commands ──

#[tauri::command]
fn start_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_penetration(state: tauri::State<'_, Mutex<AppState>>) -> Result<bool, String> {
    let mut app_state = state.lock().map_err(|e| e.to_string())?;
    app_state.penetration_enabled = !app_state.penetration_enabled;
    Ok(app_state.penetration_enabled)
}

#[tauri::command]
fn config_get() -> Result<serde_json::Value, String> {
    let config_path = get_config_path();
    match std::fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string()),
        Err(_) => Ok(serde_json::json!({})),
    }
}

#[tauri::command]
fn config_get_path() -> String {
    get_config_path()
}

#[tauri::command]
fn config_save(config: serde_json::Value) -> Result<(), String> {
    let config_path = get_config_path();
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&config_path, content).map_err(|e| e.to_string())
}

fn get_config_path() -> String {
    // In dev mode, read from project root
    if cfg!(debug_assertions) {
        let mut path = std::env::current_dir().unwrap_or_default();
        path.push("config");
        path.push("config.json");
        path.to_string_lossy().to_string()
    } else {
        // In production, bundled with the app
        let mut path = std::env::current_exe().unwrap_or_default();
        path.pop(); // remove exe name
        path.push("..");
        path.push("config");
        path.push("config.json");
        path.to_string_lossy().to_string()
    }
}

// ── Tray ──

fn create_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

    let show = MenuItem::with_id(app, "show", "显示", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "隐藏", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &hide, &separator, &quit])?;

    TrayIconBuilder::new()
        .icon_as_template(true)
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

// ── App Entry ──

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(AppState {
            penetration_enabled: false,
        }))
        .setup(|app| {
            create_tray(app)?;

            // Position window on right side of screen
            if let Some(window) = app.get_webview_window("main") {
                if let Some(monitor) = window.current_monitor().ok().flatten() {
                    let size = monitor.size();
                    let _ = window.set_position(tauri::Position::Physical(
                        tauri::PhysicalPosition::new(
                            (size.width as i32 - 420).max(0),
                            (size.height as i32 / 2 - 300).max(0),
                        ),
                    ));
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_drag,
            toggle_penetration,
            config_get,
            config_get_path,
            config_save,
        ])
        .run(tauri::generate_context!())
        .expect("error while running jarvisgirl-desktop");
}
