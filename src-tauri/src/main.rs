// Χωρίς παράθυρο κονσόλας στα Windows (release).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    prismaboard_lib::run()
}
