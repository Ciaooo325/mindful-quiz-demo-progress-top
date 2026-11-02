
const RESULT_STORAGE_KEY = "mindfulQuizRecommendation";

// ===== 四個場景的小卡與 CD 圖片 =====

const CARD_CONFIG = {
  seaside: {
    name: "海邊",
    front: "mindful-quiz/assets/results/seaside-front.png",
    back: "mindful-quiz/assets/results/seaside-back.png",
    cover: "mindful-quiz/assets/music/sea-cd.png"
  },

  forest: {
    name: "森林",
    front: "mindful-quiz/assets/results/forest-front.png",
    back: "mindful-quiz/assets/results/forest-back.png",
    cover: "mindful-quiz/assets/music/forest-cd.png"
  },

  mountain: {
    name: "山群",
    front: "mindful-quiz/assets/results/mountain-front.png",
    back: "mindful-quiz/assets/results/mountain-back.png",
    cover: "mindful-quiz/assets/music/mountain-cd.png"
  },

  rice_field: {
    name: "稻田",
    front: "mindful-quiz/assets/results/rice_field-front.png",
    back: "mindful-quiz/assets/results/rice_field-back.png",
    cover: "mindful-quiz/assets/music/field-cd.png"
  }
};

// ===== 呼吸方式文字 =====

const BREATHING_LABELS = {
  "478": "4-7-8 呼吸",
  box: "箱式呼吸 4-4-4-4",
  slow46: "慢呼吸 4-6",
  ratio55: "等比呼吸 5-5"
};

// ===== 讀取問卷推薦結果 =====

const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);

let stored = null;

try {
  stored = raw ? JSON.parse(raw) : null;
} catch (error) {
  console.warn("推薦資料格式有誤", error);
}

// 沒有問卷資料時，顯示海邊示範
const recommendation = stored?.recommendation ?? {
  scene: "seaside",
  breathing: "box"
};

const scene = Object.hasOwn(
  CARD_CONFIG,
  recommendation.scene
)
  ? recommendation.scene
  : "seaside";

const config = CARD_CONFIG[scene];

let isBack = false;

// ===== 取得 HTML 元素 =====

const card = document.getElementById("resultCard");
const cardImage = document.getElementById("cardImage");

const musicEntry = document.getElementById("musicEntry");
const miniCdDisc = document.getElementById("miniCdDisc");

const flipButton = document.getElementById("flipCard");
const openMusicButton = document.getElementById("openMusic");

const recommendationText =
  document.getElementById("recommendationText");

// ===== 顯示推薦資訊 =====

recommendationText.textContent =
  `推薦場景：${config.name}｜呼吸方式：${
    BREATHING_LABELS[recommendation.breathing] || "舒緩呼吸"
  }`;

// ===== 設定 CD 封面 =====

miniCdDisc.style.backgroundImage =
  `url("${config.cover}")`;

// ===== 顯示小卡正反面 =====

function renderCard() {

  cardImage.src = isBack ? config.back : config.front;

  cardImage.alt =
    `${config.name}心境小卡${isBack ? "背面" : "正面"}`;

  // 只有背面顯示 CD
  musicEntry.hidden = !isBack;

  // 只有背面顯示下方聆聽音樂按鈕
  openMusicButton.hidden = !isBack;

  flipButton.textContent = isBack
    ? "← 翻回小卡正面"
    : "翻到小卡背面 →";
}

// ===== 翻面 =====

function flipCard() {
  isBack = !isBack;
  renderCard();
}

card.addEventListener("click", flipCard);

flipButton.addEventListener("click", flipCard);

// ===== 前往對應音樂播放器 =====

function openRecommendedMusic() {

  // 儲存 Baseline 推薦場景
  sessionStorage.setItem(
    "mindfulSelectedScene",
    scene
  );

  // 開啟完整音樂播放器
  window.location.href = "music_page.html";
}

// 點擊小卡 CD
musicEntry.addEventListener("click", event => {
  event.stopPropagation();
  openRecommendedMusic();
});

// 點擊下方聆聽音樂按鈕
openMusicButton.addEventListener(
  "click",
  openRecommendedMusic
);

// ===== 返回問卷 =====

document
  .getElementById("backToQuiz")
  .addEventListener("click", () => {
    window.location.href = "index.html";
  });

// ===== 圖片錯誤處理 =====

cardImage.addEventListener("error", () => {
  console.warn("找不到小卡圖片：", cardImage.src);
});

// ===== 初始化 =====

renderCard();
