use neon::prelude::*;
use once_cell::sync::OnceCell;
use tokio::runtime::Runtime;
use zbus::dbus_proxy;
use zbus::export::futures_util::TryFutureExt;
use zbus::Connection;

// Return a global tokio runtime or create one if it doesn't exist.
// Throws a JavaScript exception if the `Runtime` fails to create.
fn runtime<'a, C: Context<'a>>(cx: &mut C) -> NeonResult<&'static Runtime> {
    static RUNTIME: OnceCell<Runtime> = OnceCell::new();

    RUNTIME.get_or_try_init(|| Runtime::new().or_else(|err| cx.throw_error(err.to_string())))
}

#[dbus_proxy(
    interface = "org.freedesktop.systemd1.Manager",
    default_service = "org.freedesktop.systemd1",
    default_path = "/org/freedesktop/systemd1"
)]
pub trait ServiceManager {
    #[dbus_proxy(object = "Unit")]
    fn get_unit(&self, unit: &str) -> zbus::Result<Unit>;
}

#[dbus_proxy(
    default_service = "org.freedesktop.systemd1",
    interface = "org.freedesktop.systemd1.Unit"
)]
pub trait Unit {
    #[dbus_proxy(property)]
    fn active_state(&mut self) -> zbus::Result<String>;
    // TODO: add unit restart methods
}

// This is the object that will get exposed to
// the javascript API
struct System {
    connection: Connection,
}

impl System {
    fn new<'a, C>(cx: &mut C) -> NeonResult<Self>
    where
        C: Context<'a>,
    {
        runtime(cx)
            .and_then(|r| {
                r.block_on(Connection::system()).or_else(|e| {
                    cx.throw_error(format!("Failed to connect to D-Bus system socket: {}", e))
                })
            })
            .map(|connection| Self { connection })
    }
}

// Needed to be able to box the System struct
impl Finalize for System {}

/// Create a new connection to the system bus
/// this function will run synchronously on the main thread
/// and will throw if the bus is not available or the
/// connection fails
fn system(mut cx: FunctionContext) -> JsResult<JsBox<System>> {
    let system = System::new(&mut cx)?;

    Ok(cx.boxed(system))
}

/// Get the active state of a provided unit
fn unit_active_state(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let rt = runtime(&mut cx)?;
    let system = cx.argument::<JsBox<System>>(0)?;
    let unit_name = cx.argument::<JsString>(1)?.value(&mut cx);
    let channel = cx.channel();

    // We need to clone the connection because we are going to move it into
    // the spawned task. Zbus documentation reports that this is a very cheap
    // operation and it seems that this is the way to share connections
    // between threads
    // https://docs.rs/zbus/3.0.0/zbus/struct.Connection.html
    let connection = system.connection.clone();

    // It is important to be careful not to perform failable actions after
    // creating the promise to avoid an unhandled rejection.
    let (deferred, promise) = cx.promise();

    // Run operations on a background thread
    rt.spawn(async move {
        let unit = unit_name.to_owned();

        // let connection = system.to_inner(&mut cx).connection;

        // We chain the promises with `and_then` so we can get the error
        // to reject the promise in the
        // settle_with block
        let state = ServiceManagerProxy::new(&connection)
            .and_then(|manager| async move { manager.get_unit(&unit).await })
            .and_then(|mut unit| async move { unit.active_state().await })
            .await;

        // Settle the promise from the result of a closure. JavaScript exceptions
        // will be converted to a Promise rejection.
        //
        // This closure will execute on the JavaScript main thread. It should be
        // limited to converting Rust types to JavaScript values. Expensive operations
        // should be performed outside of it.
        deferred.settle_with(&channel, move |mut cx| {
            // Convert a `reqwest::Error` to a JavaScript exception
            let state = state.or_else(|err| cx.throw_error(err.to_string()))?;
            Ok(cx.string(state))
        });
    });

    Ok(promise)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("system", system)?;
    cx.export_function("unit_active_state", unit_active_state)?;
    Ok(())
}
