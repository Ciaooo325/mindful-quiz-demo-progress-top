const CACHE_PREFIX = "mindful-offline-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const BASE = new URL("./", self.location.href);

const FILES = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "baseline-recommendation.js",
  "manifest.webmanifest",
  "result_page.html",
  "result_page.css",
  "result_page.js",
  "music_page.html",
  "music_page.css",
  "music_page.js",
  "backgrounds/ui/forest-shell.png"
];

// 題目背景
for (const [folder, name] of [
  ["field", "field"],
  ["forests", "forest"],
  ["mountain", "mountain"],
  ["ocean", "ocean"],
  ["sky", "sky"]
]) {
  for (const variant of ["a", "b", "c", "d", "default"]) {
    FILES.push(`backgrounds/${folder}/${name}-${variant}.png`);
  }
}

// 選項圖片
for (const name of ["field", "forest", "mountain", "ocean", "sky"]) {
  for (const variant of ["a", "b", "c", "d"]) {
    FILES.push(`backgrounds/options/${name}-${variant}.png`);
  }
}

// 音樂及音樂頁圖片
for (const name of ["field", "forest", "mountain", "sea"]) {
  FILES.push(
    `mindful-quiz/assets/music/${name}.mp3`,
    `mindful-quiz/assets/music/${name}-bg.png`,
    `mindful-quiz/assets/music/${name}-cd.png`
  );
}

// 結果小卡
for (const name of ["forest", "mountain", "rice_field", "seaside"]) {
  for (const side of ["front", "back"]) {
    FILES.push(`mindful-quiz/assets/results/${name}-${side}.png`);
  }
}

// 所有檔案下載成功，才算安裝完成
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(FILES.map(path => new URL(path, BASE).href))
    )
  );
});

// 僅清除這個專案的舊版快取
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names
        .filter(name =>
          name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME
        )
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

// 回應音樂的 Range 請求，支援播放及拖曳進度
async function rangeResponse(request, cached) {
  const buffer = await cached.arrayBuffer();
  const size = buffer.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(
    request.headers.get("range") || ""
  );

  const invalid = () => new Response(null, {
    status: 416,
    headers: { "Content-Range": `bytes */${size}` }
  });

  if (!match || (!match[1] && !match[2])) return invalid();

  let start;
  let end;

  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix <= 0) return invalid();
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 || start >= size || end < start
  ) {
    return invalid();
  }

  end = Math.min(end, size - 1);

  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== BASE.origin ||
    !url.pathname.startsWith(BASE.pathname)
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request.url);

    if (cached) {
      if (request.headers.has("range")) {
        return rangeResponse(request, cached);
      }
      return cached;
    }

    try {
      return await fetch(request);
    } catch {
      return new Response("此內容尚未下載，請連線後再試。", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});