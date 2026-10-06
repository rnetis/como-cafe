mod lan_server;

use axum::extract::ws::Message;
use lan_server::{serve_lan, Clients};
use serde::Serialize;
use tokio::sync::{oneshot, Mutex};

/// What the webview needs to draw the LAN panel: is the shelf on, where can a
/// phone reach it, and how many phones are connected right now.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanInfo {
    pub running: bool,
    pub port: Option<u16>,
    pub clients: usize,
    pub urls: Vec<String>,
}

struct RunningServer {
    port: u16,
    shutdown: oneshot::Sender<()>,
    handle: tauri::async_runtime::JoinHandle<()>,
}

#[derive(Default)]
pub struct AppState {
    server: Mutex<Option<RunningServer>>,
    clients: Clients,
}

const DEFAULT_PORT: u16 = 8787;

/// Private-interface URLs a phone on the café wifi can actually reach.
fn lan_urls(port: u16) -> Vec<String> {
    let mut urls: Vec<String> = Vec::new();
    if let Ok(interfaces) = local_ip_address::list_afinet_netifas() {
        for (_name, ip) in interfaces {
            if !ip.is_ipv4() {
                continue;
            }
            let addr = ip.to_string();
            let octet_172 = addr
                .strip_prefix("172.")
                .and_then(|rest| rest.split('.').next())
                .and_then(|value| value.parse::<u8>().ok());
            let is_private = addr.starts_with("192.168.")
                || addr.starts_with("10.")
                || addr.starts_with("127.")
                || octet_172.map(|octet| (16..=31).contains(&octet)).unwrap_or(false);
            if is_private {
                let url = format!("http://{addr}:{port}");
                if !urls.contains(&url) {
                    urls.push(url);
                }
            }
        }
    }
    urls
}

async fn info(state: &AppState, running: Option<u16>) -> LanInfo {
    let clients = state.clients.lock().await.len();
    LanInfo {
        running: running.is_some(),
        port: running,
        clients,
        urls: running.map(lan_urls).unwrap_or_default(),
    }
}

/// Turn the shelf on: bind the LAN port, serve the SPA, accept phone sockets.
#[tauri::command]
async fn lan_start_server(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    port: Option<u16>,
) -> Result<LanInfo, String> {
    let inner = state.inner();
    {
        let server = inner.server.lock().await;
        if let Some(running) = server.as_ref() {
            // Already serving — report the port actually bound, not the request.
            return Ok(info(inner, Some(running.port)).await);
        }
    }
    let clients = inner.clients.clone();
    let requested = port.unwrap_or(DEFAULT_PORT);
    let (addr, shutdown, handle) =
        serve_lan(app, clients, requested).await.map_err(|error| error.to_string())?;
    let bound = addr.port();
    *inner.server.lock().await = Some(RunningServer {
        port: bound,
        shutdown,
        handle,
    });
    Ok(info(inner, Some(bound)).await)
}

/// Turn the shelf off; client sockets drop and phones reconnect when it returns.
#[tauri::command]
async fn lan_stop_server(state: tauri::State<'_, AppState>) -> Result<LanInfo, String> {
    let inner = state.inner();
    let running = inner.server.lock().await.take();
    if let Some(running) = running {
        let _ = running.shutdown.send(());
        running.handle.abort();
    }
    inner.clients.lock().await.clear();
    Ok(info(inner, None).await)
}

#[tauri::command]
async fn lan_status(state: tauri::State<'_, AppState>) -> Result<LanInfo, String> {
    let inner = state.inner();
    let port = { inner.server.lock().await.as_ref().map(|server| server.port) };
    Ok(info(inner, port).await)
}

/// Push one serialized LAN message to every connected phone/tablet.
#[tauri::command]
async fn lan_broadcast(
    state: tauri::State<'_, AppState>,
    message: String,
) -> Result<usize, String> {
    let clients = state.clients.lock().await;
    let mut sent = 0usize;
    for sender in clients.values() {
        if sender.send(Message::text(message.clone())).is_ok() {
            sent += 1;
        }
    }
    Ok(sent)
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            lan_start_server,
            lan_stop_server,
            lan_status,
            lan_broadcast
        ])
        .run(tauri::generate_context!())
        .expect("COMO Desk failed to start");
}
