
/*
 * Initial Baseline Recommendation
 *
 * 三題問卷：
 * Q1：壓力／焦慮 (stress)
 * Q2：低能量 (lowEnergy)
 * Q3：思緒負荷 (cognitiveLoad)
 *
 * 選項分數：
 * A = 3
 * B = 2
 * C = 1
 * D = 0
 *
 * SCENE：Rule-based Mapping（平均分配四個場景）
 * BREATHING：BaselineFit 最高分
 * Technique：BaselineFit 最高分
 */

// =====================================================
// 1. 推薦項目名稱
// =====================================================

const BASELINE_LABELS = {
  scene: {
    forest: "森林",
    seaside: "海邊",
    mountain: "山群",
    rice_field: "稻田"
  },

  breathing: {
    "478": "4-7-8 呼吸",
    box: "箱式呼吸",
    slow46: "慢呼吸 4-6",
    ratio55: "等比呼吸 5-5"
  }
};


// =====================================================
// 2. Baseline 適配表
// =====================================================

// 每個陣列依序對應：
// [stress, lowEnergy, cognitiveLoad]
//
// 已移除 sleep、bodyFatigue 兩個維度。

const BASELINE_FIT_TABLES = {

  // SCENE 原始適配表
  // 僅保留分數供分析，實際推薦使用 Rule-based Mapping
  scene: {
    forest:     [0.65, 0.85, 0.65],
    seaside:    [1.00, 0.65, 1.00],
    mountain:   [0.85, 0.40, 0.85],
    rice_field: [0.40, 1.00, 0.40]
  },

  // BREATHING 適配表
  breathing: {
    "478":  [0.65, 0.85, 0.55],
    box:    [1.00, 0.55, 1.00],
    slow46: [0.85, 1.00, 0.85],
    ratio55:[0.65, 0.75, 0.75]
  }
};


// =====================================================
// 3. 預設推薦
// =====================================================

// 當三題全部選 D 時：
// stress = 0
// lowEnergy = 0
// cognitiveLoad = 0
//
// 此時 BaselineFit 分母為 0，使用預設組合。

const BASELINE_DEFAULT_RECOMMENDATION = {
  scene: "forest",
  breathing: "ratio55",
};


// =====================================================
// 4. 驗證問卷答案
// =====================================================

function validateBaselineAnswers(answers) {

  if (!Array.isArray(answers) || answers.length !== 3) {
    throw new Error("Baseline 問卷必須包含三題答案");
  }

  for (const answer of answers) {

    if (
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer > 3
    ) {
      throw new Error(
        "答案格式錯誤：必須是 0～3 的整數"
      );
    }
  }
}


// =====================================================
// 5. 轉換 Baseline Profile
// =====================================================

// answers 格式：
// [0, 1, 2] 代表 A、B、C
//
// 正規化公式：
// Baseline_i = Qi / 3
//
// A = 3/3 = 1.000
// B = 2/3 = 0.667
// C = 1/3 = 0.333
// D = 0/3 = 0.000

function createBaselineProfile(answers) {

  validateBaselineAnswers(answers);

  return {
    stress: (3 - answers[0]) / 3,
    lowEnergy: (3 - answers[1]) / 3,
    cognitiveLoad: (3 - answers[2]) / 3
  };
}


// =====================================================
// 6. 計算 BaselineFit
// =====================================================

// 公式：
//
// BaselineFit(s) =
// Σ [Bi × Ki(s)] / Σ Bi
//
// Bi：使用者的 Baseline 負荷
// Ki(s)：候選項目在該維度的適配分數
//
// 每個候選項目都會計算一次。

function calculateBaselineFitScores(
  baselineProfile,
  fitTable
) {

  const baselineValues = [
    baselineProfile.stress,
    baselineProfile.lowEnergy,
    baselineProfile.cognitiveLoad
  ];

  const totalLoad = baselineValues.reduce(
    (sum, value) => sum + value,
    0
  );

  const scores = {};

  for (const [item, weights] of Object.entries(fitTable)) {

    // 全部負荷為零，無法計算加權平均
    if (totalLoad === 0) {
      scores[item] = null;
      continue;
    }

    let weightedSum = 0;

    for (let i = 0; i < baselineValues.length; i++) {
      weightedSum += baselineValues[i] * weights[i];
    }

    scores[item] = weightedSum / totalLoad;
  }

  return scores;
}


// =====================================================
// 7. 選擇適配分數最高的項目
// =====================================================

// 同分時，依照適配表的欄位順序選擇。
// 使用浮點數容差，避免計算誤差影響同分判定。

function selectHighestScore(scores) {

  let bestItem = null;
  let bestScore = -Infinity;

  const EPSILON = 1e-10;

  for (const [item, score] of Object.entries(scores)) {

    if (score === null) {
      continue;
    }

    if (score > bestScore + EPSILON) {
      bestItem = item;
      bestScore = score;
    }
  }

  return bestItem;
}


// =====================================================
// 8. SCENE：Rule-based Mapping
// =====================================================

// 64 種答案平均分配至四個場景：
//
// 海邊：16 種
// 山群：16 種
// 稻田：16 種
// 森林：16 種
//
// 判斷依據：
//
// Q3 思緒負荷 A/B：
//   Q1 壓力 A/B → 海邊
//   Q1 壓力 C/D → 山群
//
// Q3 思緒負荷 C/D：
//   Q2 低能量 A/B → 稻田
//   Q2 低能量 C/D → 森林

function recommendSceneBalanced(answers) {

  validateBaselineAnswers(answers);

  const [stress, lowEnergy, cognitiveLoad] = answers;

  // 思緒負荷較高
  if (cognitiveLoad <= 1) {

    // 壓力較高
    if (stress <= 1) {
      return "seaside";
    }

    // 壓力較低
    return "mountain";
  }

  // 思緒負荷較低
  if (lowEnergy <= 1) {
    return "rice_field";
  }

  return "forest";
}


// =====================================================
// 9. 主要推薦函式
// =====================================================

// 輸入：
// answers = [0, 1, 2]
//
// 輸出：
// {
//   baselineProfile: {...},
//   recommendation: {
//     scene: "...",
//     breathing: "...",
//     technique: "..."
//   },
//   scores: {...},
//   isDefault: false
// }

function calculateBaselineRecommendation(answers) {

  // Step 1：驗證答案
  validateBaselineAnswers(answers);

  // Step 2：建立 Baseline Profile
  const baselineProfile = createBaselineProfile(answers);

  // Step 3：判斷是否全部選 D
  const isDefault = answers.every(
    answer => answer === 3
  );

  // Step 4：計算全部候選項目的 BaselineFit
  const scores = {

    scene: calculateBaselineFitScores(
      baselineProfile,
      BASELINE_FIT_TABLES.scene
    ),

    breathing: calculateBaselineFitScores(
      baselineProfile,
      BASELINE_FIT_TABLES.breathing
    ),
  };

  // Step 5：產生推薦
  let recommendation;

  if (isDefault) {

    // 全部選 D → 預設推薦
    recommendation = {
      ...BASELINE_DEFAULT_RECOMMENDATION
    };

  } else {

    // SCENE：平均分配規則
    const scene = recommendSceneBalanced(answers);

    // BREATHING：取 BaselineFit 最高分
    const breathing = selectHighestScore(
      scores.breathing
    );

    recommendation = {
      scene,
      breathing
    };
  }

  // Step 6：回傳推薦結果
  return {
    baselineProfile,
    recommendation,
    scores,
    isDefault
  };
}


// =====================================================
// 10. 測試全部 64 種答案
// =====================================================

// 這個函式不會自動執行。
// 可在瀏覽器 Console 手動呼叫：
// testBaselineRecommendations()

function testBaselineRecommendations() {

  const sceneCounts = {
    forest: 0,
    seaside: 0,
    mountain: 0,
    rice_field: 0
  };

  const combinations = new Set();
  const results = [];

  const letters = ["A", "B", "C", "D"];

  for (let q1 = 0; q1 < 4; q1++) {
    for (let q2 = 0; q2 < 4; q2++) {
      for (let q3 = 0; q3 < 4; q3++) {

        const answers = [q1, q2, q3];

        const result =
          calculateBaselineRecommendation(answers);

        const {
          scene,
          breathing,
        } = result.recommendation;

        sceneCounts[scene]++;

        const combinationKey = [
          scene,
          breathing,
        ].join("|");

        combinations.add(combinationKey);

        results.push({
          answers: answers.map(
            index => letters[index]
          ).join(""),

          scene,
          breathing,
        });
      }
    }
  }

  console.log("SCENE 分配結果：");
  console.table(sceneCounts);

  console.log(
    "不同推薦組合數量：",
    combinations.size
  );

  console.table(results);

  return {
    sceneCounts,
    uniqueRecommendationCount: combinations.size,
    results
  };
}
