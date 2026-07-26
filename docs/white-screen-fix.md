# White Screen Fix — iPhone Launch Crash

Resolved July 2026. The white screen on launch was caused by three separate issues introduced when Sentry and Langfuse observability were added. All three stem from libraries designed for browser/Node environments using syntax or APIs that React Native's Hermes JS engine doesn't support.

## 1. `localStorage` polyfill (`87209be`)

Langfuse's browser build calls `localStorage` at init time. React Native has no `localStorage`, so the app crashed silently on launch.

**Fix:** Added a no-op polyfill in `App.js` before `new Langfuse()` is called:

```js
if (typeof localStorage === 'undefined') {
  global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}
```

## 2. Langfuse-core Hermes syntax patch (`835576f`, `c7cb52d`)

`langfuse-core` uses a dynamic `import(/* webpackIgnore: true */ module)` syntax that Hermes cannot compile — it throws a parse error and the app never loads.

**Fix:** Patched both the CJS (`index.cjs.js`) and ESM (`index.mjs`) builds via `patch-package` to replace that call with `Promise.resolve({})`. The patched code only runs in Deno environments so the no-op is safe.

## 3. Sentry version incompatibility + source map config (`7f7c661`, `dc30be8`)

`@sentry/react-native` v8+ uses webpack magic comments that Hermes also rejects. No `sentry.properties` file was configured, which caused production EAS builds to fail on source map upload.

**Fix:** Downgraded Sentry to `~7.2.0` (Expo SDK 54 compatible) and disabled source map auto-upload in `eas.json` (`SENTRY_DISABLE_AUTO_UPLOAD=true`).

## Constraints going forward

- Keep `@sentry/react-native` at `~7.2.0` — do not upgrade until Expo SDK 54 support is confirmed for v8+.
- If `langfuse` or `langfuse-core` is upgraded, re-run `npx patch-package langfuse-core` after manually patching the new version's `index.cjs.js` and `index.mjs`.
