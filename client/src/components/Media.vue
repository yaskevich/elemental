<template>
  <div class="minimal left">
    <div v-if="isLoaded">
      <div v-if="!store?.state?.user?.text_id">
        <n-alert title="No text" type="warning">Select specific text before (at Home screen)</n-alert>
      </div>
      <n-card title="Media management" :bordered="false" v-else>
        <template #header-extra v-if="store.hasRights()">
          <n-upload ref="uploadRef" :action="`/api/upload/${id}`" :headers="headers" @remove="handleRemoval"
            @finish="imageLoaded" @download="handleDownload" @before-upload="beforeUpload" :is-error-state="checkError"
            :show-download-button="true" :default-file-list="previewFileList" :show-file-list="false">
            <n-button type="success">Upload</n-button>
          </n-upload></template>
        <n-space vertical>
          <!-- <n-modal v-model:show="showModal" preset="card" style="width: 600px" title="A Cool Picture">
            <img :src="previewImageUrl" style="width: 100%" />
          </n-modal> -->
          <!-- {{ loadedFiles }} -->
          <n-card v-for="(img, index) in previewFileList">
            <n-row>
              <n-col :span="10">
                <n-image width="100" :src="img?.url" :lazy="true" />
              </n-col>
              <n-col :span="14">
                <n-space vertical>
                  <n-space justify="end">
                    <template v-if="store.hasRights()">
                      <n-button text style="font-size: 1.5rem" @click="editable = index" v-if="editable !== index">
                        <n-icon :component="EditFilled" />
                      </n-button>
                      <n-button text @click="handleRemoval(img, index)" style="font-size: 1.5rem">
                        <n-icon :component="DeleteFilled" color="#ab1f3f" />
                      </n-button>
                    </template>
                    <n-button text style="font-size: 1.5rem" @click="handleDownload(img)">
                      <n-icon :component="InfoFilled" color="#1060c9" />
                    </n-button>
                  </n-space>
                  <n-space justify="end">
                    <n-text>{{ img.title }}</n-text>
                  </n-space>
                </n-space>
              </n-col>
            </n-row>
            <n-row>
              <n-input-group v-if="editable === index">
                <n-input v-model:value="img.title" type="text" placeholder="Image Title..." autosize
                  @blur="saveImageTitle(img)" @keyup.enter="editable = undefined" />
                <n-button type="primary" ghost @click="saveImageTitle(img)"> Save </n-button>
              </n-input-group>
            </n-row>
          </n-card>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h } from 'vue';
import store from '../store';
// import { ArchiveFilled as ArchiveIcon } from '@vicons/material';
import type { UploadInst, UploadFileInfo, MessageType } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { RouterLink } from 'vue-router';
import { EditFilled, DeleteFilled, InfoFilled } from '@vicons/material';
// import { useRoute } from 'vue-router';
// const vuerouter = useRoute();
// const id = vuerouter.params.id || 1;
const id = store?.state?.user?.text_id;
const isLoaded = ref(false);
const showModal = ref(false);
const uploadRef = ref<UploadInst | null>(null);
const previewImageUrl = ref('');
const loadedFiles = reactive({} as { [key: string]: string });
const headers = { Authorization: 'Bearer ' + store.state.token };
const previewFileList = reactive<CustomFileInfo[]>([]);
const message = useMessage();
const editable = ref<number | undefined>();

// const handlePreview = (file: UploadFileInfo, x) => {
//     const { url } = file;
//     console.log("file", file);
//     previewImageUrl.value = url as string;
//     showModal.value = true;
// };

const saveImageTitle = async (file: CustomFileInfo) => {
  editable.value = undefined;
  const filename = file.fullPath ? loadedFiles[file.id] : file.id;
  const { data } = await store.post('rename', { file: { id: filename, title: file.title } });
  if (data?.id !== filename) {
    message.warning('Image renaming failed!');
  }
  // console.log('rename', data);
};

const imageLoaded = (options: { file: CustomFileInfo; event?: Event }) => {
  // console.log("options", options, previewFileList);
  // console.log('loaded', options.file);

  if (options?.file?.status === 'finished') {
    const path = (options?.event?.target as XMLHttpRequest)?.responseText;
    const url = `/api/images/${id}/${path}`;
    // console.log('path/url', path, url);
    previewFileList.unshift({ ...options.file, url, title: options.file.name.split('.').slice(0, -1).join('.') });
    loadedFiles[options.file.id] = path;
  }

  return;
};

const renderCommentsList = (data: any, msgType: MessageType, isDelete?: boolean) => {
  const links = data.map((x: any) =>
    h(RouterLink, { to: '/comment/' + x.id, style: 'display:block;', class: 'msglink' }, { default: () => x.title })
  );
  const container = h('div', {}, [h('span', {}, `There are comments containing this image (${data.length})`)]);
  const warnMsg = isDelete ? 'Remove the images from comments before deleting this image.' : '';
  const vnode = h('div', {}, data.length ? [container, links, warnMsg] : ['This image is not bound to a comment']);
  message.create(() => vnode, { duration: 5000, closable: true, type: msgType });
};

// const handleRemoval = async (upInfo: { file: CustomFileInfo; fileList: Array<CustomFileInfo> }) => {
const handleRemoval = async (file: CustomFileInfo, index: number) => {
  const filename = file.fullPath ? loadedFiles[file.id] : file.id;
  // console.log(upInfo);
  // console.log(filename, index);

  const { data } = await store.post('unload', { id: id, file: filename });
  // console.log("result", data);
  if (Boolean(data?.errno || data?.error)) {
    if (data?.comments?.length) {
      // message.warning(`Image is bound to comments! Total: ${data.comments.length}`)
      renderCommentsList(data.comments, 'error', true);
    } else {
      message.warning('Image removal failed!');
    }
    return false;
  } else {
    previewFileList.splice(index, 1);
    // delete previewFileList[index];
  }
  return true;
};

const handleDownload = async (file: CustomFileInfo) => {
  const filename = file.fullPath ? loadedFiles[file.id] : file.id;
  const data = await store.get('check/img', filename, { text: id });
  // console.log("file", filename, data);
  // console.log(previewFileList);
  renderCommentsList(data, 'info');
  return false;
};

const handleError = async (upInfo: { file: CustomFileInfo; event?: ProgressEvent }) => {
  // console.log("error: file", upInfo.file, upInfo.event);
  // console.log("error", loadedFiles, previewFileList);
  return false;
};

const checkError = (xhr: XMLHttpRequest) => {
  // console.log("XHR result", xhr, xhr.status);
  if (xhr.status === 200) {
    return false;
  } else if (xhr.status === 409) {
    message.error('File already exists!');
  } else if (xhr.status === 413) {
    message.error('File size exceeds limit!');
  } else {
    message.error(`Unknown error! ${xhr.status} ${xhr.statusText}`);
  }
  return true;
};

const beforeUpload = (data: { file: CustomFileInfo; fileList: CustomFileInfo[] }) => {
  if (!['image/png', 'image/jpeg'].includes(String(data.file.file?.type))) {
    message.error('Only uploading pictures is allowed!');
    return false;
  }
  return true;
};

onBeforeMount(async () => {
  // console.log("token", store.state.token);
  // Object.assign(headers, { Authorization: "Bearer " + store.state.token });
  if (id) {
    const data = await store.get(`img/${id}`);
    Object.assign(
      previewFileList,
      data.sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())
    );
  }
  isLoaded.value = true;
});
</script>
