// Prevents an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    como_desk_lib::run()
}