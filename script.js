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
    title: "這幾天，你覺得你的睡眠更像哪種狀態的海面？",
    folder: "ocean",
    backgroundFolder: "ocean",
    options: ["沉入黑暗深海", "搖晃不安的浪", "靜止平淡的潮", "明亮平穩的波"]
  },
  {
    title: " 感受一下，你的身體現在背負著什麼樣的山岩？",
    folder: "mountain",
    backgroundFolder: "mountain",
    options: ["崩塌的巨石", "銳利的碎石", "沉重的土堆", "輕盈的雲煙"]
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
async function changeBackground(src) {
  const version = ++backgroundVersion;
  const exists = await imageExists(src);
  if (version !== backgroundVersion) return;
  const base = $("backgroundBase");
  const overlay = $("backgroundOverlay");
  if (!exists) {
    overlay.classList.remove("is-visible");
    base.style.backgroundImage = "";
    return;
  }
  overlay.style.backgroundImage = `url("${src}")`;
  overlay.classList.add("is-visible");
  // 動畫完成後將新圖設為底圖，讓下一次切換繼續淡入。
  setTimeout(() => {
    if (version !== backgroundVersion) return;
    base.style.backgroundImage = `url("${src}")`;
    overlay.classList.remove("is-visible");
  }, 680);
}
function renderQuestion() {
  const q = questions[currentQuestion];
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
    backgroundPath(currentQuestion, answers[currentQuestion])
  );
} else {
  changeBackground(
    defaultBackgroundPath(currentQuestion)
  );
}
}
function showResult() {
  $("quizContent").hidden = true;
  $("result").hidden = false;
  $("answerSummary").innerHTML = answers.map((a, i) =>
    `<div class="answer-row"><span>Q${i + 1} · ${questions[i].folder}</span><strong>${letters[a]}（${3 - a} 分）</strong></div>`
  ).join("");
  console.log("Initial 問卷結果：", {
    answers: answers.map(i => letters[i]),
    scores: answers.map(i => 3 - i)
  });
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
