// 修改圖片只需要改下方路徑；尚未放圖時會顯示 CSS 預設漸層。
// 每題 4 張背景 + 4 張選項圖片；檔案名稱可自行更改。
const questions = [
  {
    title: "最近的你，心情像哪一座森林？",
    folder: "forest",
    backgroundFolder: "forests",
    options: ["窒息濃霧", "狂亂強風", "悶熱陰天", "灑落陽光"]
  },
  {
    title: " 最近的生活節奏，讓你覺得眼前的稻浪是？",
    folder: "field",
    backgroundFolder: "field",
    options: ["乾枯的枯草", "雜亂的荒野", "緩慢地擺動", "金色的豐收"]
  },
  {
    title: "想像你的思緒飄浮在天空中，現在最像哪一種雲景？",
    folder: "sky",
    backgroundFolder: "sky",
    options: ["鉛灰色的厚雲", "快速流動的雲", "帶點薄霧的藍", "萬里無雲的淨"]
  }
];
// 提醒：Q1、Q3～Q5 題目句子是示意文案；請依 Unity 正式版本替換。
const letters = ["A", "B", "C", "D"];
const answers = Array(questions.length).fill(null);
let currentQuestion = 0;
let backgroundVersion = 0;

const $ = id => document.getElementById(id);
const optionsEl = $("options");

function backgroundPath(questionIndex, optionIndex) {
  const q = questions[questionIndex];
  const folder = q.backgroundFolder || q.folder;

  return `backgrounds/${folder}/${q.folder}-${letters[optionIndex].toLowerCase()}.png`;
}

//default path
function defaultBackgroundPath(questionIndex) {
  const q = questions[questionIndex];
  const folder = q.backgroundFolder || q.folder;

  return `backgrounds/${folder}/${q.folder}-default.png`;
}

function optionPath(questionIndex, optionIndex) {
  const q = questions[questionIndex];

  return `backgrounds/options/${q.folder}-${letters[optionIndex].toLowerCase()}.png`;
}
function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}
const BACKGROUND_FADE_MS = 650;

async function changeBackground(src, fadeDuration = BACKGROUND_FADE_MS) {
  const version = ++backgroundVersion;
  const exists = await imageExists(src);

  if (version !== backgroundVersion) return;

  const base = $("backgroundBase");
  const overlay = $("backgroundOverlay");

  const layer = document.createElement("div");
  layer.className = "background-layer";

  // 設定此次動畫時間
  layer.style.setProperty(
    "--fade-duration",
    `${fadeDuration}ms`
  );

  if (exists) {
    layer.style.backgroundImage = `url("${src}")`;
  } else {
    layer.style.backgroundImage =
      "linear-gradient(#dce9f7 0%, #eff3f5 47%, #f8e8e2 100%)";
  }
  overlay.replaceChildren();
  overlay.appendChild(layer);

  void layer.offsetWidth;
  layer.classList.add("is-visible");

  setTimeout(() => {
    if (version !== backgroundVersion) return;

    base.style.backgroundImage = layer.style.backgroundImage;
    overlay.replaceChildren();

  }, fadeDuration);
}

function renderQuestion() {
      const q = questions[currentQuestion];

  // 提前載入當前題目的背景圖片
  preloadQuestionBackgrounds(currentQuestion);
  $("questionBadge").textContent = `Q${currentQuestion + 1}`;
  $("questionTitle").textContent = q.title;
  $("progressText").textContent = `${currentQuestion + 1} / ${questions.length}`;
  $("progressFill").style.width = `${(currentQuestion + 1) / questions.length * 100}%`;
  $("backButton").disabled = currentQuestion === 0;
  $("nextButton").disabled = answers[currentQuestion] === null;
  $("nextButton").innerHTML = currentQuestion === questions.length - 1 ? '查看結果 <span aria-hidden="true">❯</span>' : '下一題 <span aria-hidden="true">❯</span>';
  optionsEl.innerHTML = "";

  q.options.forEach((text, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option" + (answers[currentQuestion] === index ? " is-selected" : "");
    button.setAttribute("aria-pressed", String(answers[currentQuestion] === index));
    button.setAttribute("aria-label", `${letters[index]}，${text}`);
    // button.innerHTML = `<span class="option-art" aria-hidden="true"></span><span class="option-label"><span class="option-letter">${letters[index]}.</span><span class="option-text"></span></span>`;
    // button.querySelector(".option-text").textContent = text;

    // 選項圖片已包含文字，因此只保留圖片容器
button.innerHTML = `
  <span class="option-art" aria-hidden="true"></span>
`;
    const art = button.querySelector(".option-art");
const src = optionPath(currentQuestion, index);

art.style.backgroundImage = `url("${src}")`;

console.log("選項圖片路徑：", src);

    button.addEventListener("click", () => {
      answers[currentQuestion] = index;
      optionsEl.querySelectorAll(".option").forEach((el, i) => {
        el.classList.toggle("is-selected", i === index);
        el.setAttribute("aria-pressed", String(i === index));
      });
      $("nextButton").disabled = false;
      changeBackground(backgroundPath(currentQuestion, index));
    });
    optionsEl.appendChild(button);
  });
    if (answers[currentQuestion] !== null) {
    changeBackground(
        backgroundPath(currentQuestion, answers[currentQuestion]),
        350
    );
    } else {
    changeBackground(
        defaultBackgroundPath(currentQuestion),
        350
    );
    }
}


function showResult() {

  // 1. 確認三題皆已完成
  if (answers.some(answer => answer === null)) {
    console.warn("問卷尚未完成");
    return;
  }

  // 2. 呼叫 Baseline 推薦演算法
  const result = calculateBaselineRecommendation(answers);

  // 3. 取得計算結果
  const {
    baselineProfile,
    recommendation,
    scores,
    isDefault
  } = result;

  // 4. 整理需要傳到小卡頁面的資料
  const resultData = {
    answers: [...answers],
    baselineProfile,
    recommendation,
    scores,
    isDefault
  };

  // 5. 儲存推薦結果
  sessionStorage.setItem(
    "mindfulQuizRecommendation",
    JSON.stringify(resultData)
  );

  // 6. 同步儲存推薦場景
  // 之後音樂播放器也會使用這個值
  sessionStorage.setItem(
    "mindfulSelectedScene",
    recommendation.scene
  );

  // 7. Console 測試資訊
  console.log("問卷答案：", answers);
  console.log("Baseline Profile：", baselineProfile);
  console.log("推薦場景：", recommendation.scene);
  console.log("推薦呼吸：", recommendation.breathing);
  console.log("完整結果：", resultData);

  // 8. 前往推薦小卡頁面
  window.location.href = "result_page.html";
}



$("nextButton").addEventListener("click", () => {
  if (answers[currentQuestion] === null) return;
  if (currentQuestion === questions.length - 1) showResult();
  else { currentQuestion++; renderQuestion(); window.scrollTo(0, 0); }
});
$("backButton").addEventListener("click", () => {
  if (currentQuestion > 0) { currentQuestion--; renderQuestion(); window.scrollTo(0, 0); }
});
$("restartButton").addEventListener("click", () => {
  answers.fill(null); currentQuestion = 0;
  $("result").hidden = true; $("quizContent").hidden = false;
  renderQuestion();
});
renderQuestion();

function preloadQuestionBackgrounds(questionIndex) {
  // 預載預設背景
  const defaultImg = new Image();
  defaultImg.src = defaultBackgroundPath(questionIndex);

  // 預載 A、B、C、D 四張背景
  for (let i = 0; i < 4; i++) {
    const img = new Image();
    img.src = backgroundPath(questionIndex, i);
  }
}


// function recommendSceneBalanced(answers) {
//   // answers: [Q1, Q2, Q3]
//   // A=0, B=1, C=2, D=3

//   const [stress, lowEnergy, cognitiveLoad] = answers;

//   if (answers.some(a => a === null || a === undefined)) {
//     throw new Error("請先完成三題問卷");
//   }

//   // Q3：思緒負荷較高
//   if (cognitiveLoad <= 1) {

//     // Q1：壓力較高 → 海邊
//     if (stress <= 1) {
//       return "seaside";
//     }

//     // Q1：壓力較低 → 山群
//     return "mountain";
//   }

//   // Q3：思緒負荷較低
//   // Q2：低能量較高 → 稻田
//   if (lowEnergy <= 1) {
//     return "rice_field";
//   }

//   // Q2：低能量較低 → 森林
//   return "forest";
// }




