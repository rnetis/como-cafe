use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use futures_util::{SinkExt, StreamExt};
use include_dir::{include_dir, Dir};
use tauri::Emitter;
use tokio::sync::{mpsc, oneshot, Mutex};

/// The static SPA bundle produced by `npm run build:tauri` — the exact files
/// the desktop window renders, served verbatim to phones on the LAN.
static DIST: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../.vercel/output/static");

/// Connected phones/tablets: id → the send half of its socket.
pub type Clients = Arc<Mutex<HashMap<u64, mpsc::UnboundedSender<Message>>>>;

static NEXT_CLIENT_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Clone)]
struct LanState {
    app: tauri::AppHandle,
    clients: Clients,
}

pub type ServerHandle = (
    SocketAddr,
    oneshot::Sender<()>,
    tauri::async_runtime::JoinHandle<()>,
);

/// Bind `0.0.0.0:port` (any interface, so the café wifi can reach it) and serve
/// the SPA plus the WebSocket endpoint the phone clients dial.
pub async fn serve_lan(
    app: tauri::AppHandle,
    clients: Clients,
    port: u16,
) -> std::io::Result<ServerHandle> {
    let router = Router::new()
        .route("/ws", get(ws_handler))
        .fallback(static_handler)
        .with_state(LanState {
            app: app.clone(),
            clients: clients.clone(),
        });

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port)).await?;
    let addr = listener.local_addr()?;
    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    let handle = tauri::async_runtime::spawn(async move {
        let _ = axum::serve(listener, router)
            .with_graceful_shutdown(async move {
                let _ = shutdown_rx.await;
            })
            .await;
    });
    Ok((addr, shutdown_tx, handle))
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<LanState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

/// One phone/tablet. Socket traffic is relayed to the webview (`lan-message`)
/// and whatever the webview broadcasts (`lan_broadcast`) flows back here — the
/// Rust side stays a dumb, reliable relay and all desk logic lives in TypeScript.
async fn handle_socket(socket: WebSocket, state: LanState) {
    let id = NEXT_CLIENT_ID.fetch_add(1, Ordering::Relaxed);
    let (mut sink, mut stream) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let clients_count = {
        let mut clients = state.clients.lock().await;
        clients.insert(id, tx);
        clients.len()
    };
    let _ = state.app.emit("lan-clients", clients_count);

    let forwarder = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if sink.send(message).await.is_err() {
                break;
            }
        }
        let _ = sink.close().await;
    });

    while let Some(incoming) = stream.next().await {
        match incoming {
            Ok(Message::Text(text)) => {
                let _ = state.app.emit("lan-message", text.to_string());
            }
            Ok(Message::Binary(bytes)) => {
                let _ = state
                    .app
                    .emit("lan-message", String::from_utf8_lossy(&bytes).to_string());
            }
            Ok(_) => {}
            Err(_) => break,
        }
    }

    let remaining = {
        let mut clients = state.clients.lock().await;
        clients.remove(&id);
        clients.len()
    };
    let _ = state.app.emit("lan-clients", remaining);
    forwarder.abort();
}

/// Serve the embedded bundle. Unknown extensionless paths fall back to the SPA
/// shell (the desk is a single route), so a phone opening the root works.
async fn static_handler(uri: axum::http::Uri) -> Response {
    let requested = uri.path().trim_start_matches('/');
    let requested = if requested.is_empty() {
        "index.html"
    } else {
        requested
    };
    let (file, served_path) = match DIST.get_file(requested) {
        Some(file) => (Some(file), requested),
        None => (DIST.get_file("index.html"), "index.html"),
    };
    let Some(file) = file else {
        return (StatusCode::NOT_FOUND, "not found").into_response();
    };
    let mime = mime_guess::from_path(served_path).first_or_octet_stream();
    let mut response = Response::new(axum::body::Body::from(file.contents().to_vec()));
    response
        .headers_mut()
        .insert(header::CONTENT_TYPE, HeaderValue::from_str(mime.as_ref()).unwrap_or_else(|_| HeaderValue::from_static("application/octet-stream")));
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("no-cache"),
    );
    response
}
