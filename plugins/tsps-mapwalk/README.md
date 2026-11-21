# World Map Walk

**Author: Luka.** The server plugin and companion client patch were supplied by Luka from his TSPS fork (commit `abe8043af`). The bundled route data is derived from [Skretzo's Shortest Path project](https://github.com/Skretzo/shortest-path/tree/65314c02128302402c15c730328030a78ae28f44); its BSD 2-Clause notice is included in the server bundle.

Install the server ZIP from the Plugins panel and restart the server. The ZIP does not modify your client. To show **Move here** on the world map, use Luka's compatible fork client or apply the [companion patch](tsps-mapwalk-1.0.0-client.patch) from the root of a compatible TSPS source checkout and rebuild the client:

```sh
git apply --check /path/to/tsps-mapwalk-1.0.0-client.patch
git apply /path/to/tsps-mapwalk-1.0.0-client.patch
```

Without the patched client, the server still exposes `::moveto x y [z]` and `::stopwalking`.
