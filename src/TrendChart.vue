<template>
  <div class="bg-white p-6 rounded-xl shadow-lg mt-8">
    <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">📊 過去 7 天身心趨勢分析</h3>
    <div v-if="chartData.labels.length > 0" class="h-80 relative">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="text-center text-gray-500 py-10">載入資料中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// 註冊 Chart.js 核心元件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// 接收外部傳入的 7 天資料陣列
const props = defineProps({
  historicalData: {
    type: Array,
    required: true,
    default: () => [],
  },
})

// 1. 修改資料映射邏輯 (將 0 改為 null，並加上 y3 軸)
const chartData = computed(() => {
  const sortedData = [...props.historicalData].reverse()

  return {
    labels: sortedData.map((d) => d.record_date),
    datasets: [
      {
        label: '預測壓力分數 (1-5)',
        // 💡 修正：沒有資料就給 null，不要給 0，並允許跨越空值連線
        data: sortedData.map((d) => d.predicted_stress || null),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        yAxisID: 'y1',
        tension: 0.3,
        spanGaps: false,
      },
      {
        label: '睡眠時數 (小時)',
        data: sortedData.map((d) => d.sleep_hours || 0),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        yAxisID: 'y2', // 綁定到專屬的 y2 軸
        tension: 0.3,
      },
      {
        label: '運動量 (分鐘)',
        data: sortedData.map((d) => d.mvpa_minutes || 0),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        yAxisID: 'y3', // 💡 修正：移到新的 y3 軸
        borderDash: [5, 5],
        tension: 0.3,
      },
      {
        label: '主觀感受壓力 (EMA)',
        // 💡 注意：欄位名稱要改成 subjectiveStress
        data: sortedData.map((d) => d.subjectiveStress || null),
        borderColor: '#A855F7',
        backgroundColor: '#A855F7',
        yAxisID: 'y1',
        borderDash: [5, 5],
        tension: 0.3,
        spanGaps: false,
      },
    ],
  }
})

// 2. 修改圖表座標軸設定 (新增隱藏的 y3)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: { display: true },
    y1: {
      type: 'linear',
      display: true,
      position: 'left',
      min: 1,
      max: 5,
      title: { display: true, text: '壓力分數' },
    },
    y2: {
      type: 'linear',
      display: true,
      position: 'right',
      min: 0,
      max: 12, // 💡 鎖定睡眠在 0-12 小時，起伏才會明顯
      title: { display: true, text: '睡眠 (小時)' },
      grid: { drawOnChartArea: false },
    },
    y3: {
      type: 'linear',
      display: false, // 💡 隱藏 y3 軸的刻度與線條，保持畫面乾淨
      position: 'right',
      min: 0,
      suggestedMax: 100, // 讓運動量有足夠的伸展空間
    },
  },
}
</script>
