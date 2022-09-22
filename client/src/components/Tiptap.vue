<template>
  <div v-if="customEditor">
    <!-- <button @click="customEditor.chain().focus().toggleAnnotation().run()" :class="{ 'is-active': customEditor.isActive('annotation') }">Toggle Annotation</button> -->

    <button
      v-for="item in store?.state?.user?.classes"
      @click="customEditor.chain().focus().toggleMarker({ class: item.name }).run()"
      :class="{ 'is-active': customEditor.isActive('marker', { class: item.name }), [item.name]: true }">
      {{ item.name }}
    </button>

    <!-- <button @click="customEditor.chain().focus().unsetAnnotation().run()" :disabled="!customEditor.isActive('annotation')">
              Clear Annotation
    </button>-->

    <button
      @click="customEditor.chain().focus().toggleBlockquote().run()"
      :class="{ 'is-active': customEditor.isActive('blockquote') }">
      blockquote
    </button>

    <button
      @click="customEditor.commands.toggleBold()"
      :class="{ 'is-active': customEditor.isActive('bold') }"
      style="font-weight: bold">
      emphasized
    </button>

    <!-- style="background-color: #fac9ff;" -->
    <button @click="showImagesModal = true">+image</button>

    <!-- <button
      @click="customEditor.chain().focus().setBlock({ class: 'caption' }).run()"
      style="background-color: #fac9ff;"
    >caption</button>-->

    <button @click="showSourcesModal = true" style="background-color: #ccffff">+ref</button>

    <!-- <br /> -->

    <!-- clear formatting -->
    <button @click="customEditor.chain().focus().clearNodes().unsetAllMarks().run()" style="background-color: white">
      clear
    </button>

    <button
      @click="customEditor.chain().focus().deleteSelection().run()"
      style="background-color: #da1d1d; color: white">
      del
    </button>

    <n-modal
      v-model:show="showSourcesModal"
      :style="{ 'max-width': '600px' }"
      class="custom-card"
      preset="card"
      title="Select a reference"
      :bordered="false"
      size="huge"
      :segmented="{ content: 'soft', footer: 'soft' }">
      <n-select
        clearable
        filterable
        :options="sources"
        placeholder="Bibliographic sources"
        @update:value="onSourceSelected"
        style="margin-bottom: 15px" />

      <div v-html="html" v-if="html" style="margin-bottom: 15px"></div>

      <n-space justify="space-between">
        <n-button type="info" @click="showSourcesModal = false">Cancel</n-button>
        <n-button type="success" @click="insertCitation" :disabled="!selectedSourceId">Insert</n-button>
      </n-space>
    </n-modal>

    <n-modal
      v-model:show="showImagesModal"
      :style="{ 'max-width': '600px' }"
      class="custom-card"
      preset="card"
      title="Select an image"
      :bordered="false"
      size="huge"
      :segmented="{ content: 'soft', footer: 'soft' }">
      <!-- <template #header-extra>
        Oops!
      </template>-->
      <!-- Content -->
      <n-space vertical>
        <n-input v-model:value="titleToFilter" type="text" placeholder="Filter by image title" clearable />
        <n-space>
          <template
            v-for="item in images.filter((x:any) => titleToFilter ? x.title.includes(titleToFilter) : true)"
            :key="index">
            <figure>
              <img width="100" class="selectable" :preview-disabled="true" :src="item.url" @click="selectImage(item)" />
              <figcaption class="modal-caption">
                <n-ellipsis style="max-width: 100px">{{ item.title }}</n-ellipsis>
              </figcaption>
            </figure>
          </template>
        </n-space>
      </n-space>
      <!-- <template #footer>
        Footer
      </template>-->
    </n-modal>
    <div class="editorboard">
      <editor-content :editor="customEditor" :class="editorclass" />
      <div class="counter" v-if="customEditor">
        {{ customEditor.storage.characterCount.characters() }} characters /
        {{ customEditor.storage.characterCount.words() }} words
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, reactive } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import Cite from 'citation-js';
import store from '../store';
// import type { SelectOption } from 'naive-ui';

const props = defineProps<{ editorclass: string; sources: any; images: any; content: any }>();

const showImagesModal = ref(false);
const showSourcesModal = ref(false);
const html = ref('');
const selectedSourceId = ref<number>();
const titleToFilter = ref('');

const customEditor = new Editor({
  content: '',
  autofocus: 'end',
  editable: true,
  extensions: store.getExtensions(props.sources),
  // onUpdate({ editor }) {
  //   // The content has changed.
  //   console.log("TT changed!");
  // },
  onCreate({ editor }) {
    // The editor is ready.
    // console.log("TT ready", editor, props);
    if (props.content) {
      editor.commands.setContent(props.content, false);
    }
  },
  // onDestroy() {
  //   // The editor is being destroyed.
  //   console.log("TT bye");
  // },
});

const onSourceSelected = (index: number, option: IBib) => {
  // console.log(index, option);
  if (index !== null) {
    html.value = new Cite(option?.bibtex).format('bibliography', {
      format: 'html',
      template: 'apa',
      lang: option.lang,
    });
    selectedSourceId.value = option.id;
  }
};

const insertCitation = () => {
  showSourcesModal.value = false;
  customEditor
    .chain()
    .focus()
    .setCitation({ id: selectedSourceId.value as number })
    .run();
};

onBeforeUnmount(() => {
  // console.log("TT component unmount");
  customEditor.destroy();
});

// onBeforeMount(async () => {
// isLoaded.value = true;
// });

// const addImage = () => {
//   const url = window.prompt('URL')
//   if (url) {
//     customEditor.chain().focus().setImage({ src: url }).run()
//   }
// };

const selectImage = (item: IImageItem) => {
  const title = item.title || '';
  customEditor.chain().focus().setFigure({ src: item.url, caption: title }).run();
  // customEditor.chain().focus()
  //   .setImage({ src: item.url, alt: item.title, title: item.title })
  //   .createParagraphNear()
  //   .insertContent(item.title)
  //   .setBlock({ class: 'caption' })
  //   .run();
  showImagesModal.value = false;
};

defineExpose({ handle: customEditor });
</script>

<style scoped lang="scss">
:deep(.ProseMirror) {
  min-height: 200px;
  padding: 0.75em;
  &:focus {
    outline: none;
  }
  /*  > * + * {
    margin-top: 0.75em;
  }
*/
  margin-bottom: 0.5em;

  img {
    display: block;
    /*
    max-width: 90%;
    max-height: 200px;
    padding: 10px;*/
    max-width: min(100%, 25rem);
    height: auto;
    border-radius: 0.5rem;
  }

  :deep(img.ProseMirror-selectednode) {
    outline: 3px solid #68cef8;
  }
  /*
  img {
    max-width: 90%;
    max-height: 200px;
    padding: 10px;


  }
  */
  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  p {
    margin: auto;
  }
}

:deep(div.even > div.ProseMirror) {
  /* border: 5px dashed orange; */
  // background-color: rgba(255, 166, 0, 0.125);

  &.ProseMirror-focused {
    background-color: white;
    border: 5px dashed #18a058;
  }
  /* background-color: #feebdd; */
}
:deep(div.odd > div.ProseMirror) {
  // background-color: rgba(124, 124, 177, 0.189);

  &.ProseMirror-focused {
    background-color: white;
    border: 5px dashed #1060c9;
    // rgb(124, 124, 177);
  }
}
:deep(.editorboard) {
  display: inline-block;
  text-align: left;
  min-width: 100%;
  margin-top: 0.5em;
}
.selectable {
  border: 3px solid gray;
  cursor: grab;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.2);
    position: relative;
    z-index: 1000;
  }
}
.counter {
  color: #868e96;
  margin-top: -1rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  text-align: center;
}

button {
  margin-right: 1px;
}

:deep(.csl-entry) {
  padding: 0.5rem;
  background: rgba(171, 196, 207, 0.745);
  border-radius: 3px;
  margin-bottom: 1rem;
}

.modal-caption {
  border: none;
  margin-top: -15px;
  font-size: 0.75rem;
}
</style>
