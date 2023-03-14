<template>
  <n-card title="Scheme" :bordered="false" class="minimal left" v-show="isLoaded">
    <template #header-extra>
      <n-button type="info" @click="saveScheme" v-if="text?.scheme?.length">Save Scheme</n-button>
    </template>
    <n-h4 prefix="bar">{{ text?.author }}. {{ text?.title }}</n-h4>
    <n-space vertical size="large">
      <n-tooltip placement="bottom" v-for="(item, index) in text?.scheme" :key="index">
        <template #trigger>
          <n-button type="success" secondary @click="renderModal(index)">
            {{ item.title }}
            <template #icon>
              <n-icon :component="item.type === 'line' ? AbcFilled : TextFormatFilled" />
            </template>
          </n-button>
        </template>
        Type: {{ item.type }}
        <br />
        ID: {{ item.id }}
      </n-tooltip>
      <n-alert v-if="!text?.scheme?.length" title="Scheme is empty" type="warning"
        >Add one or more text fields to enable fully-featured commenting workflow</n-alert
      >
      <n-button type="success" @click="renderModal()">Add new field</n-button>
    </n-space>
  </n-card>
  <n-modal
    v-model:show="showModal"
    :style="{ 'max-width': '600px' }"
    class="custom-card"
    preset="card"
    title="Edit scheme item"
    :bordered="false"
    size="huge"
    :segmented="{ content: 'soft', footer: 'soft' }">
    <n-form ref="formRef" :label-width="80" :model="field" :rules="rules">
      <n-form-item label="Set title" path="title">
        <n-input v-model:value="field.title" clearable placeholder="..." />
      </n-form-item>
      <n-form-item label="Set ID (technical property). English letters and numbers only" path="id">
        <n-input
          v-model:value="field.id"
          clearable
          placeholder="..."
          :allow-input="onlyAllowedInput"
          :disabled="field.index !== undefined" />
      </n-form-item>
      <n-form-item style="display: block" label="Select type" path="type">
        <n-radio-group v-model:value="field.type" name="types" :disabled="field.created">
          <n-radio-button value="line">
            <n-tooltip placement="bottom">
              <template #trigger>
                <n-text> <n-icon :component="AbcFilled" size="20" class="icon-style" />Line </n-text>
              </template>
              Single-line text field with no formatting
            </n-tooltip>
          </n-radio-button>
          <n-radio-button value="area" :disabled="true">
            <n-tooltip placement="bottom">
              <template #trigger>
                <n-text>
                  <n-icon :component="FormatAlignJustifyFilled" size="20" class="icon-style" />Text Area
                </n-text>
              </template>
              Multiline text field with no formatting
            </n-tooltip>
          </n-radio-button>
          <n-radio-button value="rich">
            <n-tooltip placement="bottom">
              <template #trigger>
                <n-text> <n-icon :component="TextFormatFilled" size="20" class="icon-style" />Rich Text </n-text>
              </template>
              Multiline field with rich text formatting
            </n-tooltip>
          </n-radio-button>
        </n-radio-group>
      </n-form-item>
      <n-button type="primary" @click="saveField">Save</n-button>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, onBeforeMount, reactive, toRaw } from 'vue';
import { AbcFilled, TextFormatFilled, FormatAlignJustifyFilled } from '@vicons/material';
import { useRoute } from 'vue-router';
import { FormInst, FormItemRule, useMessage } from 'naive-ui';

const message = useMessage();
const vuerouter = useRoute();

const formRef = ref<FormInst | null>(null);
const text = ref<IText>();
const isLoaded = ref(false);
const field = reactive({ type: '', title: '', id: '', index: undefined, created: false });
const showModal = ref(false);

const renderModal = (index?: number) => {
  showModal.value = true;
  if (text?.value?.scheme) {
    // console.log('index', index);
    if (index !== undefined) {
      Object.assign(field, text.value.scheme[index], { index });
      // console.log("get", field);
    } else {
      // console.log('new', text.value.scheme);
      Object.assign(field, { id: '', title: '', type: 'line', index: undefined, created: true });
      console.log(field);
    }
  }
};

const onlyAllowedInput = (value: string) => !value || /^[a-z][a-z0-9]*$/.test(value);

const rules = {
  id: {
    required: true,
    trigger: ['blur', 'input'],
    message: 'Please put a text',
  },
  title: {
    required: true,
    trigger: ['blur', 'input'],
    message: 'Please put a text',
  },
  type: {
    required: true,
    trigger: 'change',
    message: 'Please select type',
  },
};

const saveScheme = async () => {
  const { data } = await store.post('scheme', { scheme: text.value?.scheme, id: text.value?.id });
  // console.log('save', text.value?.scheme, data);
  data?.id ? message.success('Scheme is set') : message.error('Database error');
};

// const saveField = () => {
//   console.log('field', field);
//   showModal.value = false;
//   if (text?.value?.scheme?.length) {
//     if (field?.index !== undefined) {
//       Object.assign(text.value.scheme[field.index], { type: field.type, id: field.id, title: field.title });
//     } else {
//       text.value.scheme.push({ ...toRaw(field) });
//     }
//   }
// };

const saveField = async () => {
  // e.preventDefault();

  try {
    if (text.value?.scheme?.length && text.value?.scheme.map(x => x.id).includes(field.id) && !field?.index) {
      console.log(text.value.scheme, field);
      message.error('New field ID is the same with existing one');
    } else {
      await formRef.value?.validate(async errors => {
        if (!errors) {
          // message.success('Valid');
          showModal.value = false;
          if (text.value?.scheme?.length) {
            if (field?.index !== undefined) {
              Object.assign(text.value.scheme[field.index], {
                type: field.type,
                id: field.id,
                title: field.title,
                index: text.value.scheme.length,
              });
            } else {
              text.value.scheme.push({ ...toRaw(field) });
            }
            // text.value.scheme.push({ ...toRaw(field) });
            // Object.assign(field, { type: '', title: '', id: '' });
          } else if (text?.value) {
            // console.log('Scheme is empty');
            text.value.scheme = [
              {
                type: field.type,
                id: field.id,
                title: field.title,
                index: 0,
              } as ISchemeItem,
            ];
          }
        } else {
          console.log(errors);
          message.error('Not all required fields are filled!');
        }
      });
    }
  } catch (error) {
    console.log('fail');
  }
};

onBeforeMount(async () => {
  if (vuerouter.params.id) {
    const data = await store.get('texts', String(vuerouter.params.id));
    text.value = data?.shift();
    isLoaded.value = true;
  }
});
</script>

<style scoped>
.icon-style {
  vertical-align: middle;
  margin-right: 5px;
}
</style>
