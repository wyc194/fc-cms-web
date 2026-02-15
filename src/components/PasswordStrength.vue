<template>
  <div class="password-strength">
    <div class="strength-bar">
      <div 
        v-for="i in 4" 
        :key="i" 
        class="strength-segment"
        :class="[strength >= i ? 'active' : '', strength >= i ? strengthClass : '']"
      ></div>
    </div>
    <div class="strength-text" :class="strengthClass">
      {{ strengthText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  password: String
}>()

const strength = computed(() => {
  const pwd = props.password
  if (!pwd) return 0
  
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd as string) && /[a-z]/.test(pwd as string)) score++
  if (/[0-9]/.test(pwd as string)) score++
  if (/[@$!%*#?&]/.test(pwd as string)) score++
  
  return score
})

const strengthText = computed(() => {
  const texts = ['', '弱', '中', '强', '极强']
  return texts[strength.value]
})

const strengthClass = computed(() => {
  const classes = ['', 'strength-weak', 'strength-medium', 'strength-strong', 'strength-very-strong']
  return classes[strength.value]
})
</script>

<style scoped>
.password-strength {
  margin-top: 8px;
  width: 100%;
}

.strength-bar {
  display: flex;
  gap: 4px;
  height: 4px;
  margin-bottom: 4px;
}

.strength-segment {
  flex: 1;
  background-color: #ebedf0;
  border-radius: 2px;
  transition: all 0.3s;
}

.strength-segment.active.strength-weak { background-color: #f56c6c; }
.strength-segment.active.strength-medium { background-color: #e6a23c; }
.strength-segment.active.strength-strong { background-color: #67c23a; }
.strength-segment.active.strength-very-strong { background-color: #13ce66; }

.strength-text {
  font-size: 12px;
  text-align: right;
}

.strength-weak { color: #f56c6c; }
.strength-medium { color: #e6a23c; }
.strength-strong { color: #67c23a; }
.strength-very-strong { color: #13ce66; }
</style>
