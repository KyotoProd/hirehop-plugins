# HireHop plugins

Small plugins for the [HireHop](https://hirehop.com) equipment rental web app.

## kyoto-inverted-qr.js

HireHop's camera scanner (Scanning page) does not read QR codes printed white on black.
While the built-in camera scanner is running, this plugin inverts frames from the same video,
decodes them, and hands any result to HireHop's own scan handler. It does nothing on other pages,
stores nothing and sends nothing anywhere.

Install: HireHop > Settings > Company settings > Plugins > Add plugin, using a URL pinned to a commit.
Use the full 40-character commit ID: jsDelivr stores those permanently and they can never change,
whereas a shortened ID is treated like a branch and re-checked against GitHub.

    https://cdn.jsdelivr.net/gh/KyotoProd/hirehop-plugins@<full commit ID>/kyoto-inverted-qr.js

## kyoto-view.js

A per-device tidy-up layer. A small "Kyoto view" switch (bottom-left) turns it on or off for that browser only.
On: fewer menu entries, quick actions on the home page (prep / scan out / scan in with a list of upcoming jobs),
scan and carnet shortcuts on the job page, and larger controls plus a clear result banner on the Scanning page.
It only hides, restyles and adds shortcuts; anything that changes data goes through HireHop's own functions.

Not affiliated with HireHop.
