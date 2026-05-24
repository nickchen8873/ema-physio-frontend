<template>
  <div class="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">生理壓力監測儀表板</h2>
      </div>

      <!-- 輸入區塊 -->
      <!-- <div class="space-y-4 mb-8 p-5 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700">昨晚睡眠時數 (小時)</label>
          <input
            v-model.number="physioData.sleep_yesterday"
            type="number"
            step="0.5"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >過去7天作息不規律度 (標準差)</label
          >
          <input
            v-model.number="physioData.sleep_7d_std"
            type="number"
            step="0.1"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">昨日運動分鐘數 (MVPA)</label>
          <input
            v-model.number="physioData.mvpa_yesterday"
            type="number"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <div class="flex items-center mt-4">
          <input
            v-model="physioData.is_weekend"
            type="checkbox"
            id="weekend"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label for="weekend" class="ml-2 block text-sm text-gray-900">昨天是週末</label>
        </div>
      </div> -->

      <!-- 預測按鈕 -->
      <!-- <button
        @click="fetchPrediction"
        :disabled="isLoading"
        class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
      >
        {{ isLoading ? 'AI 分析中...' : '進行壓力預測' }}
      </button> -->

      <!-- 結果紅綠燈區塊 -->
      <div
        v-if="result !== null"
        class="mt-8 text-center p-6 rounded-lg border-2 transition-all duration-300"
        :class="statusTheme.border"
      >
        <!-- 燈號視覺 -->
        <div class="flex justify-center space-x-4 mb-4">
          <div
            class="w-12 h-12 rounded-full shadow-inner"
            :class="[
              statusTheme.light === 'red'
                ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                : 'bg-red-100',
            ]"
          ></div>
          <div
            class="w-12 h-12 rounded-full shadow-inner"
            :class="[
              statusTheme.light === 'yellow'
                ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'bg-yellow-100',
            ]"
          ></div>
          <div
            class="w-12 h-12 rounded-full shadow-inner"
            :class="[
              statusTheme.light === 'green'
                ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]'
                : 'bg-green-100',
            ]"
          ></div>
        </div>

        <!-- 分數與文字提示 -->
        <h3 class="text-3xl font-extrabold mb-2" :class="statusTheme.text">
          {{ result.predicted_stress_level }} 分
        </h3>
        <p class="text-lg font-semibold text-gray-700">{{ statusTheme.message }}</p>

        <p v-if="result.warning_flag" class="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
          ⚠️ 系統偵測到高壓風險，請注意今日的情緒調節與休息。
        </p>
      </div>
      <!-- 趨勢圖 -->
      <TrendChart v-if="validData.length > 0" :historicalData="validData" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import liff from '@line/liff'
import { supabase } from '../lib/supabase.js' // 確保路徑正確
import TrendChart from './TrendChart.vue'

// 綁定輸入的生理數據
const physioData = reactive({
  sleep_yesterday: 7,
  sleep_7d_std: 1.0,
  is_weekend: false,
  mvpa_yesterday: 30,
})

const currentLineId = ref('') // 用來存 LINE 給我們的身分證
const isLoading = ref(true)
const result = ref(null)

// 新增這行：準備一個空的響應式陣列給圖表用
const validData = ref([])

onMounted(async () => {
  try {
    // 1. 初始化 LIFF
    await liff.init({ liffId: '2009889443-OsRHQGft' })

    // 2. 確認是否在 LINE 裡面開啟，或已經網頁登入 LINE
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile()
      currentLineId.value = profile.userId
      console.log('✅ LIFF 登入成功，拿到 LINE ID:', currentLineId.value)

      // 3. 拿到 ID 後，直接去抓資料
      await fetchRealData(currentLineId.value)
    } else {
      // 如果是用外部瀏覽器打開，強制導向 LINE 登入畫面
      liff.login()
    }
  } catch (error) {
    console.error('❌ LIFF 初始化失敗:', error)
  } finally {
    isLoading.value = false
  }
})

// 登入功能
// const handleLogin = async () => {
//   loginError.value = ''

//   try {
//     // 👇 1. 直接請 Supabase 的 SDK 幫我們登入
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email: email.value,
//       password: password.value,
//     })

//     if (error) throw error
//     // 👇 2. 登入成功後，Supabase 會核發一個真實的 JWT，我們把它存進 Pinia
//     authStore.setToken(data.session.access_token)

//     fetchRealData() // 登入成功後，立刻拉取資料
//   } catch (error) {
//     loginError.value = '登入失敗，請檢查帳號密碼'
//   }
// }

// 登出功能
// const handleLogout = () => {
//   authStore.logout()

//   // 👇 加上這段：手動將畫面狀態打回原形
//   validData.value = []
//   physioData.sleep_yesterday = 0
//   physioData.mvpa_yesterday = 0
//   physioData.sleep_7d_std = 0
// }

const fetchRealData = async (lineId) => {
  try {
    // 1. 抓生理資料 (直接用 participant_id 過濾)
    const { data: physioData } = await supabase
      .from('daily_physiology')
      .select('*')
      .eq('participant_id', lineId)
      .order('record_date', { ascending: false })
      .limit(7)

    // 2. 抓 EMA 資料 (用 line_user_id 過濾)
    const { data: emaData } = await supabase
      .from('ema_logs')
      .select('recorded_at, mood_score')
      .eq('line_user_id', lineId)
      .order('recorded_at', { ascending: false })
      .limit(50)

    // if (physioError) throw physioError
    if (!physioData || physioData.length === 0) return

    // 💡 核心計算：先算出這 7 天的睡眠標準差，因為 FastAPI 預測需要這個特徵
    const sleepArr = physioData.filter((p) => p.sleep_hours !== null).map((p) => p.sleep_hours)
    let currentStd = 0
    if (sleepArr.length > 1) {
      const mean = sleepArr.reduce((a, b) => a + b) / sleepArr.length
      const variance = sleepArr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sleepArr.length
      currentStd = Number(Math.sqrt(variance).toFixed(2))
    }

    // 💡 MVP 自動補齊防線：巡覽每一天，發現沒有壓力分數就現場找 FastAPI 要
    for (const p of physioData) {
      if (p.predicted_stress === null || p.predicted_stress === undefined) {
        console.log(`⚠️ 發現 ${p.record_date} 缺少預測分數，正在啟動動態補算...`)

        try {
          const yestDate = new Date(p.record_date)
          const isWeekendVal = yestDate.getDay() === 0 || yestDate.getDay() === 6 ? 1 : 0

          // 呼叫你的 FastAPI 隧道網址
          const res = await fetch('https://ema-physio-backend.onrender.com/api/predict-stress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sleep_yesterday: p.sleep_hours || 0,
              sleep_7d_std: currentStd,
              is_weekend: isWeekendVal,
              mvpa_yesterday: p.mvpa_minutes || 0,
              line_user_id: lineId,
            }),
          })

          const resData = await res.json()
          if (resData.status === 'success') {
            const newScore = resData.data.predicted_stress_level
            p.predicted_stress = newScore // 同步更新本地變數，讓圖表有線

            // 順手更新回 Supabase，下次進來就不用再重複計算
            await supabase
              .from('daily_physiology')
              .update({ predicted_stress: newScore })
              .eq('id', p.id)

            console.log(`✅ ${p.record_date} 分數已成功補齊並同步回資料庫:`, newScore)
          }
        } catch (apiErr) {
          console.error(`❌ ${p.record_date} 補算失敗:`, apiErr)
        }
      }
    }

    // 4. 資料合併與按日平均 (日曆基準版)
    // 💡 4-1. 強制產生「包含今天」的過去 7 天日期陣列 (這就是 X 軸的鐵軌)
    const dateLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i)) // 從 6 天前一路推算到今天
      return d.toLocaleDateString('en-CA') // 產出 YYYY-MM-DD
    }).reverse()

    // 💡 4-2. 拿著這 7 天的鐵軌，去對應資料庫的車廂
    const merged = dateLabels.map((targetDate) => {
      // 找找看這一天有沒有生理資料 (沒找到就給一個只帶日期的空物件)
      const p = physioData.find((row) => row.record_date === targetDate) || {
        record_date: targetDate,
      }

      // 找找看這一天有沒有 EMA 心情資料
      const dailyEmas = emaData.filter((e) => {
        const eDate = new Date(e.recorded_at).toLocaleDateString('en-CA')
        return eDate === targetDate
      })

      let subjectiveStress = null
      if (dailyEmas.length > 0) {
        const avgMood = dailyEmas.reduce((a, b) => a + (b.mood_score || 0), 0) / dailyEmas.length

        // 套用動態區間映射公式 (依你之前的設定，例如 40~100)
        const minMood = 40
        const maxMood = 100
        const clampedMood = Math.max(minMood, Math.min(maxMood, avgMood))
        subjectiveStress = Number(
          (5 - ((clampedMood - minMood) / (maxMood - minMood)) * 4).toFixed(1),
        )
      }

      return {
        ...p,
        record_date: targetDate, // 確保這個物件一定有日期，圖表才畫得出來 X 軸
        subjectiveStress: subjectiveStress, // 紫線 (落後指標)

        // 💡 關鍵防護：如果今天還沒填寫資料，確保回傳 null 而不是 undefined，讓圖表完美斷點
        predicted_stress: p.predicted_stress ?? null, // 紅線 (預測指標)
        sleep_hours: p.sleep_hours ?? null, // 藍線 (領先指標)
        mvpa_minutes: p.mvpa_minutes ?? null, // 綠線 (領先指標)
      }
    })

    // 餵給圖表
    validData.value = merged

    // 把要交給紅線的 7 天預測分數獨立印出來看
    const redLineData = validData.value.map((d) => d.predicted_stress)
    console.log('🚨 準備畫紅線的資料:', redLineData)

    // 💡 新增安全防護：確定陣列裡面真的有資料，才去讀取「昨天」的數值
    if (merged.length > 0) {
      const yesterday = merged[0]
      physioData.sleep_yesterday = yesterday.sleep_hours || 0
      physioData.mvpa_yesterday = yesterday.mvpa_minutes || 0

      // ... (標準差計算邏輯保持不變) ...

      console.log('✅ 跨系統資料整合完成 (LIFF 版)', merged)
    } else {
      console.warn('⚠️ 抓不到資料：這個 LINE 帳號目前沒有任何生理紀錄。')
      // 資料為空時的防呆預設值
      physioData.sleep_yesterday = 0
      physioData.mvpa_yesterday = 0
      physioData.sleep_7d_std = 0
      physioData.ema_7d_avg = 0
    }
  } catch (error) {
    console.error('拉取資料庫失敗:', error)
  }
}

// 呼叫 FastAPI 進行預測
const fetchPrediction = async () => {
  isLoading.value = true
  result.value = null

  try {
    const response = await fetch('https://tiny-mice-laugh.loca.lt/api/predict-stress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 💡 加入這行，Bypass localtunnel 的瀏覽器警告防護
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        sleep_yesterday: physioData.sleep_yesterday,
        sleep_7d_std: physioData.sleep_7d_std,
        // API 需要整數 0 或 1
        is_weekend: physioData.is_weekend ? 1 : 0,
        mvpa_yesterday: physioData.mvpa_yesterday,
        line_user_id: currentLineId.value, // 💡 在這裡把 LINE ID 傳給後端
      }),
    })

    // 專門捕捉 JWT 過期或無效的狀況
    if (response.status === 401) {
      console.warn('通行證已過期或無效，請重新登入')
      return
    }

    if (!response.ok) throw new Error('API 請求失敗')

    const data = await response.json()
    if (data.status === 'success') {
      result.value = data.data
    }
  } catch (error) {
    console.error('API 請求失敗:', error)
    alert('無法連線至預測伺服器，請確認後端已啟動。')
  } finally {
    isLoading.value = false
  }
}

// 動態計算紅綠燈主題與文案
const statusTheme = computed(() => {
  if (!result.value) return {}

  const score = result.value.predicted_stress_level
  const isWarning = result.value.warning_flag

  // 紅燈區 (超過警示閥值，由後端決定)
  if (isWarning) {
    return {
      light: 'red',
      border: 'border-red-400 bg-red-50',
      text: 'text-red-600',
      message: '高壓狀態！作息需要立刻介入',
    }
  }
  // 黃燈區 (2.5 ~ 閥值區間)
  else if (score >= 2.5) {
    return {
      light: 'yellow',
      border: 'border-yellow-400 bg-yellow-50',
      text: 'text-yellow-600',
      message: '壓力累積中，建議安排適度放鬆',
    }
  }
  // 綠燈區 (< 2.5)
  else {
    return {
      light: 'green',
      border: 'border-green-400 bg-green-50',
      text: 'text-green-600',
      message: '狀態良好！請保持規律作息',
    }
  }
})
</script>
