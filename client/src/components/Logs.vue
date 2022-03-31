<template>
  <!-- <n-page-header subtitle="Review logs" @back="handleBack" style="max-width:600px;margin: 0 auto;padding-left: 1rem;"> -->
  <n-page-header subtitle="Review logs" style="max-width:600px;margin: 0 auto;padding-left: 1rem;">
    <n-grid :cols="3">
      <n-gi>
User
      </n-gi>
      <n-gi>
Event
      </n-gi>
      <n-gi>
Result      </n-gi>

    </n-grid>
    <template #title>
      <a
        href="https://anyway.fm/"
        style="text-decoration: none; color: inherit"
      >
        Logs
      </a>
    </template>
    <template #header>
    </template>
    <template #avatar>
      <n-avatar
        src="favicon.ico"
      />
    </template>
    <template #extra>
      <!-- <n-space>
        <n-button>Refresh</n-button>
        <n-dropdown :options="options" placement="bottom-start">
          <n-button :bordered="false" style="padding: 0 4px">
            ···
          </n-button>
        </n-dropdown>
      </n-space> -->
    </template>
    <template #footer>
      <!-- As of April 3, 2021 -->
    </template>
  </n-page-header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useMessage } from 'naive-ui'

export default defineComponent({
  setup () {
    const message = useMessage()
    return {
      // handleBack () {
      //   message.info('[onBack]')
      // },
      options: [
        {
          label: 'More episodes',
          key: '1'
        },
        {
          label: 'More episodes',
          key: '2'
        },
        {
          label: 'More episodes',
          key: '3'
        }
      ]
    }
  }
})
</script>
