
    /*
    ========================================
       1. 場景與音樂資料設定

       修改這裡就可以：
       - 更換背景
       - 更換 CD 封面
       - 修改音樂名稱
       - 修改描述
       - 修改標籤
       - 更換 MP3 音樂
    ========================================
    */

    
const scenes = [
  {
    title: "海浪輕拍",
    description: "自然海浪聲，結合輕柔旋律",
    tags: ["平緩", "流動", "舒緩"],

    background: "mindful-quiz/assets/music/sea-bg.png",
    cover: "mindful-quiz/assets/music/sea-cd.png",
    audio: "mindful-quiz/assets/music/sea.mp3"
  },

  {
    title: "森林呢喃",
    description: "微風吹拂樹梢，聆聽大自然的呼吸"   ,
    tags: ["平穩", "安靜", "低刺激"],

    background: "mindful-quiz/assets/music/forest-bg.png",
    cover: "mindful-quiz/assets/music/forest-cd.png",
    audio: "mindful-quiz/assets/music/forest.mp3"
  },

  {
    title: "山間微風",
    description: "山巒間的微風，帶來平靜與安定",
    tags: ["開闊", "沉靜", "空靈"],

    background: "mindful-quiz/assets/music/mountain-bg.png",
    cover: "mindful-quiz/assets/music/mountain-cd.png",
    audio: "mindful-quiz/assets/music/mountain.mp3"
  },

  {
    title: "金色麥浪",
    description: "微風輕撫麥田，感受大地的溫柔",
    tags: ["溫暖", "明亮", "輕盈"],

    background: "mindful-quiz/assets/music/field-bg.png",
    cover: "mindful-quiz/assets/music/field-cd.png",
    audio: "mindful-quiz/assets/music/field.mp3"
  }
];


    /*
    ========================================
       2. 取得 HTML 元素
    ========================================
    */

    const audio = document.getElementById("audio");
    const cd = document.getElementById("cd");
    const background = document.getElementById("background");

    const musicTitle = document.getElementById("musicTitle");
    const musicDescription = document.getElementById("musicDescription");
    const musicTags = document.getElementById("musicTags");

    const currentTimeEl = document.getElementById("currentTime");
    const durationEl = document.getElementById("duration");
    const progress = document.getElementById("progress");

    const playBtn = document.getElementById("playBtn");
    // const prevBtn = document.getElementById("prevBtn");
    // const nextBtn = document.getElementById("nextBtn");
    const muteBtn = document.getElementById("muteBtn");

    const playIcon = document.getElementById("playIcon");
    const volumeIcon = document.getElementById("volumeIcon");

    let currentSceneIndex = 0;

    /*
    ========================================
       3. 時間格式轉換
    ========================================
    */

    function formatTime(seconds) {
      if (!Number.isFinite(seconds)) return "00:00";

      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);

      return String(minutes).padStart(2, "0")
        + ":" + String(secs).padStart(2, "0");
    }

    /*
    ========================================
       4. 載入場景
    ========================================
    */

    function loadScene(index, autoplay = false) {

      currentSceneIndex =
        (index + scenes.length) % scenes.length;

      const scene = scenes[currentSceneIndex];

      // 更新場景背景
      background.style.backgroundImage =
        `linear-gradient(
          rgba(231,220,252,.12),
          rgba(241,224,251,.26)
        ), url("${scene.background}")`;

      // 更新 CD 封面
      cd.style.backgroundImage = `url("${scene.cover}")`;

      // 更新標題與描述
      musicTitle.textContent = scene.title;
      musicDescription.textContent = scene.description;

      // 更新標籤
      musicTags.innerHTML = "";

      scene.tags.forEach(tagText => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = tagText;
        musicTags.appendChild(tag);
      });

      // 載入音檔
      audio.pause();
      audio.src = scene.audio;
      audio.load();

      currentTimeEl.textContent = "00:00";
      durationEl.textContent = "00:00";
      progress.value = 0;
      updateProgressStyle();

      cd.classList.remove("playing");
      updatePlayIcon(false);

      // 切歌時可自動播放
      if (autoplay) {
        playMusic();
      }
    }

    /*
    ========================================
       5. 播放與暫停
    ========================================
    */

    async function playMusic() {
      try {
        await audio.play();
      } catch (error) {
        console.warn("音樂播放失敗，請確認 MP3 路徑。", error);
      }
    }

    function pauseMusic() {
      audio.pause();
    }

    function togglePlay() {
      if (audio.paused) {
        playMusic();
      } else {
        pauseMusic();
      }
    }

    function updatePlayIcon(isPlaying) {

      if (isPlaying) {
        // 暫停圖示
        playIcon.innerHTML =
          '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>';
        playBtn.setAttribute("aria-label", "暫停");
      } else {
        // 播放圖示
        playIcon.innerHTML =
          '<path d="M8 5v14l11-7z"/>';
        playBtn.setAttribute("aria-label", "播放");
      }
    }

    audio.addEventListener("play", () => {
      cd.classList.add("playing");
      updatePlayIcon(true);
    });

    audio.addEventListener("pause", () => {
      cd.classList.remove("playing");
      updatePlayIcon(false);
    });

    playBtn.addEventListener("click", togglePlay);

    /*
    ========================================
       6. 上一首與下一首
    ========================================
    */

   
    /*
    ========================================
       7. 自動取得 MP3 長度
    ========================================
    */

    audio.addEventListener("loadedmetadata", () => {
      durationEl.textContent = formatTime(audio.duration);
    });

    /*
    ========================================
       8. 更新音樂進度條
    ========================================
    */

    function updateProgressStyle() {
      progress.style.setProperty(
        "--progress",
        progress.value + "%"
      );
    }

    audio.addEventListener("timeupdate", () => {

      currentTimeEl.textContent =
        formatTime(audio.currentTime);

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        progress.value =
          (audio.currentTime / audio.duration) * 100;
      }

      updateProgressStyle();
    });

    // 使用者拖曳進度條
    progress.addEventListener("input", () => {

      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      audio.currentTime =
        (Number(progress.value) / 100) * audio.duration;

      currentTimeEl.textContent =
        formatTime(audio.currentTime);

      updateProgressStyle();
    });

    
// 同一個場景的音樂循環播放
audio.loop = true;


    /*
    ========================================
       10. 靜音功能
    ========================================
    */

    muteBtn.addEventListener("click", () => {

      audio.muted = !audio.muted;

      if (audio.muted) {

        volumeIcon.innerHTML =
          '<path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3 3.5-3.5-1.4-1.4-3.5 3.5-3.5-3.5-1.4 1.4 3.5 3.5-3.5 3.5 1.4 1.4 3.5-3.5 3.5 3.5 1.4-1.4z"/>';

        muteBtn.setAttribute("aria-label", "取消靜音");

      } else {

        volumeIcon.innerHTML =
          '<path d="M3 9v6h4l5 4V5L7 9H3zm12.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 15.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/>';

        muteBtn.setAttribute("aria-label", "靜音");
      }
    });

    /*
    ========================================
       11. 對外提供切換場景功能

       例如：
       switchScene("forest");
       switchScene("sea");
    ========================================
    */

    function switchScene(sceneName) {

      const sceneMap = {
        sea: 0,
        forest: 1,
        mountain: 2,
        field: 3
      };

      if (sceneMap[sceneName] !== undefined) {
        loadScene(sceneMap[sceneName], false);
      }
    }


/*
========================================
根據 Baseline 推薦載入音樂場景
========================================
*/


/* ========================================
   根據 QR Code 或 Baseline 載入場景
======================================== */

// 四個場景與 scenes 陣列的對應
const sceneIndexMap = {
  seaside: 0,
  forest: 1,
  mountain: 2,
  rice_field: 3
};

// 1. 取得網址參數
// 例如：music_page.html?scene=seaside
const urlParams = new URLSearchParams(
  window.location.search
);

const sceneFromURL = urlParams.get("scene");

// 2. 取得問卷推薦場景
const sceneFromQuiz = sessionStorage.getItem(
  "mindfulSelectedScene"
);

// 3. 優先使用網址指定的場景
const recommendedScene =
  Object.hasOwn(sceneIndexMap, sceneFromURL)
    ? sceneFromURL
    : sceneFromQuiz;

// 4. 取得對應場景索引
const initialSceneIndex =
  sceneIndexMap[recommendedScene] ?? 0;

console.log("網址指定場景：", sceneFromURL);
console.log("問卷推薦場景：", sceneFromQuiz);
console.log("實際載入場景：", recommendedScene);


// 先載入推薦的場景
loadScene(initialSceneIndex, false);

// 取得目前推薦場景的圖片
const currentScene = scenes[initialSceneIndex];

// 預先載入圖片
function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve(true);
    img.onerror = () => {
      console.warn("圖片載入失敗：", src);
      resolve(false);
    };

    img.src = src;
  });
}

// 等待音樂可以播放
function waitForAudioReady() {
  return new Promise(resolve => {

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve(true);
      return;
    }

    const cleanup = () => {
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onError);
    };

    const onReady = () => {
      cleanup();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      resolve(false);
    };

    audio.addEventListener("canplay", onReady);
    audio.addEventListener("error", onError);

    // 避免事件已發生時一直等待
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      cleanup();
      resolve(true);
    }
  });
}

// 圖片及音樂準備完成後，嘗試自動播放
async function initializeMusicPlayer() {

  const [backgroundReady, coverReady, audioReady] =
    await Promise.all([
      preloadImage(currentScene.background),
      preloadImage(currentScene.cover),
      waitForAudioReady()
    ]);

  if (!backgroundReady || !coverReady) {
    console.warn("部分場景圖片無法載入，請檢查路徑。");
    return;
  }

  if (!audioReady) {
    console.warn("音樂無法載入，請檢查 MP3。");
    return;
  }

  // 嘗試自動播放
  await playMusic();

  // 若被瀏覽器擋下，播放器會保持暫停，
  // 使用者仍可自行按下播放鍵。
}

initializeMusicPlayer();


console.log("目前推薦場景：", recommendedScene);

