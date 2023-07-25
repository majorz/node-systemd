use futures_lite::future;
use neon::prelude::*;
use zbus::dbus_proxy;
use zbus::export::futures_util::TryFutureExt;
use zbus::Connection;

#[dbus_proxy(
    interface = "org.freedesktop.systemd1.Manager",
    default_service = "org.freedesktop.systemd1",
    default_path = "/org/freedesktop/systemd1"
)]
pub trait SystemdManager {
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
        let result = future::block_on(async { Connection::system().await });

        result
            .map(|connection| Self { connection })
            .or_else(|e| cx.throw_error(e.to_string()))
    }
}

// Needed to be able to box the System struct
impl Finalize for System {}

fn system(mut cx: FunctionContext) -> JsResult<JsBox<System>> {
    let system = System::new(&mut cx)?;

    Ok(cx.boxed(system))
}

fn unit_active_state(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let system = cx.argument::<JsBox<System>>(0)?;
    let unit = cx.argument::<JsString>(1)?.value(&mut cx);
    let channel = cx.channel();

    let conn = system.connection.clone();

    // It is important to be careful not to perform failable actions after
    // creating the promise to avoid an unhandled rejection.
    let (deferred, promise) = cx.promise();

    // This task will block the JavaScript main thread.
    future::block_on(async move {
        // let manager = SystemdManagerProxy::new(&conn).and_then(|manager| manager.get_unit(&unit));
        // let mut unit = manager.get_unit(&unit).await.unwrap();
        // let state = unit.active_state().await;
        let unit = unit.to_owned();

        // We chain the promises with `and_then` so we can get the error
        // to reject the promise in the
        // settle_with block
        let state = SystemdManagerProxy::new(&conn)
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
