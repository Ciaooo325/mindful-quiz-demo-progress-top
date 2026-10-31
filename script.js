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

  // 1. 確認三題皆已作答
  if (answers.some(answer => answer === null)) {
    return;
  }

  // 2. 計算 Baseline 推薦結果
  const result = calculateBaselineRecommendation(answers);

  const {
    baselineProfile,
    recommendation,
    scores,
    isDefault
  } = result;

  // 3. 切換到結果頁面
  $("quizContent").hidden = true;
  $("result").hidden = false;

  // 4. 三題對應的 Baseline 維度
  const dimensionNames = [
    "壓力／焦慮",
    "低能量",
    "思緒負荷"
  ];

  // 5. 顯示三題答案
  const answerHTML = answers.map((answer, index) => `
    <div class="answer-row">
      <span>Q${index + 1} · ${dimensionNames[index]}</span>
      <strong>
        ${letters[answer]}（${3 - answer} 分）
      </strong>
    </div>
  `).join("");

  // 6. 顯示推薦結果
  const recommendationHTML = `
    <h3>你的個人化推薦結果</h3>

    <div class="answer-row">
      <span>冥想場景 SCENE</span>
      <strong>
        ${BASELINE_LABELS.scene[recommendation.scene]}
      </strong>
    </div>

    <div class="answer-row">
      <span>呼吸方式 BREATHING</span>
      <strong>
        ${BASELINE_LABELS.breathing[recommendation.breathing]}
      </strong>
    </div>

    ${isDefault
      ? "<p>目前三個維度皆為零，採用預設推薦。</p>"
      : ""}
  `;

  // 7. 將結果顯示在網頁
  $("answerSummary").innerHTML =
    answerHTML + recommendationHTML;

  // 8. 整理推薦結果 JSON
  const resultData = {
    baselineProfile,
    current_recommendation: recommendation
  };

  // 9. Console 輸出
  console.log("問卷答案：", answers);
  console.log("Baseline Profile：", baselineProfile);
  console.log("推薦結果：", recommendation);
  console.log("完整 JSON：", resultData);
  console.log("候選項目分數：", scores);
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


function recommendSceneBalanced(answers) {
  // answers: [Q1, Q2, Q3]
  // A=0, B=1, C=2, D=3

  const [stress, lowEnergy, cognitiveLoad] = answers;

  if (answers.some(a => a === null || a === undefined)) {
    throw new Error("請先完成三題問卷");
  }

  // Q3：思緒負荷較高
  if (cognitiveLoad <= 1) {

    // Q1：壓力較高 → 海邊
    if (stress <= 1) {
      return "seaside";
    }

    // Q1：壓力較低 → 山群
    return "mountain";
  }

  // Q3：思緒負荷較低
  // Q2：低能量較高 → 稻田
  if (lowEnergy <= 1) {
    return "rice_field";
  }

  // Q2：低能量較低 → 森林
  return "forest";
}
