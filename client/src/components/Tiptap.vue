<template>
  <div v-if="customEditor">
    <!-- <button @click="customEditor.chain().focus().toggleAnnotation().run()" :class="{ 'is-active': customEditor.isActive('annotation') }">Toggle Annotation</button> -->

    <button
      v-for="item in spanclasses"
      @click="customEditor.chain().focus().toggleAnnotation({ class: item }).run()"
      :class="{ 'is-active': customEditor.isActive('annotation', { class: item }) }"
      style="background-color: #c9c9ff;"
    >{{ item }}</button>

    <!-- <button @click="customEditor.chain().focus().unsetAnnotation().run()" :disabled="!customEditor.isActive('annotation')">
              Clear Annotation
    </button>-->

    <button
      @click="customEditor.chain().focus().toggleBlockquote().run()"
      :class="{ 'is-active': customEditor.isActive('blockquote') }"
    >quote</button>

    <button
      @click="customEditor.commands.toggleBold()"
      :class="{ 'is-active': customEditor.isActive('bold') }"
      style="font-weight:bold;"
    >emphasized</button>

    <button @click="showImagesModal = true" style="background-color: #fac9ff;">+image</button>

    <button
      @click="customEditor.chain().focus().setBlock({ class: 'caption' }).run()"
      style="background-color: #fac9ff;"
    >caption</button>

    <button @click="showSourcesModal = true" style="background-color: #CCFFFF;">+ref</button>

    <br />

    <!-- clear formatting -->
    <button
      @click="customEditor.chain().focus().clearNodes().unsetAllMarks().run()"
      style="background-color:white"
    >clear</button>

    <button
      @click="customEditor.chain().focus().deleteSelection().run()"
      style="background-color: #da1d1d;color:white"
    >del</button>

    <n-modal
      v-model:show="showSourcesModal"
      :style="{ 'max-width': '600px' }"
      class="custom-card"
      preset="card"
      title="Select a reference"
      :bordered="false"
      size="huge"
      :segmented="{ content: 'soft', footer: 'soft' }"
    >
      <n-select
        clearable
        filterable
        :options="sources"
        placeholder="Bibliographic sources"
        @update:value="onSourceSelected"
        style="margin-bottom: 15px;"
      />

      <div v-html="html" v-if="html" style="margin-bottom: 15px;"></div>

      <n-space justify="space-between">
        <n-button type="info" @click="showSourcesModal = false;">Cancel</n-button>
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
      :segmented="{ content: 'soft', footer: 'soft' }"
    >
      <!-- <template #header-extra>
        Oops!
      </template>-->
      <!-- Content -->
      <n-image-group>
        <n-space>
          <n-image
            v-for="(item, index) in images"
            :key="index"
            width="100"
            class="selectable"
            :preview-disabled="true"
            :src="item.url"
            @click="selectImage(item)"
          />
        </n-space>
      </n-image-group>
      <!-- <template #footer>
        Footer
      </template>-->
    </n-modal>
    <div>
      <editor-content :editor="customEditor" :class="`${editorclass} annotation`" />
      <div
        class="counter"
        v-if="customEditor"
      >{{ customEditor.storage.characterCount.characters() }} characters / {{ customEditor.storage.characterCount.words() }} words</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, reactive } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import Cite from 'citation-js';
import store from '../store';
// import type { SelectOption } from 'naive-ui';

const props = defineProps<{ editorclass: string, sources: any, images: any, content: any }>();

const showImagesModal = ref(false);
const showSourcesModal = ref(false);
const html = ref('');
const selectedSourceId = ref<number>();
const spanclasses = store.customTiptapClasses.span;

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
    html.value = (new Cite(option?.bibtex)).format('bibliography', { format: 'html', template: 'apa', lang: option.lang });
    selectedSourceId.value = option.id;
  }
};

const insertCitation = () => {
  showSourcesModal.value = false;
  customEditor.chain().focus().setCitation({ id: selectedSourceId.value as number }).run();
}

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
  // console.log("image", item);
  customEditor.chain().focus()
    .setImage({ src: item.url })
    .createParagraphNear()
    .insertContent(item.title)
    .setBlock({ class: 'caption' })
    .run();
  showImagesModal.value = false;
};

defineExpose({ handle: customEditor });

</script>

<style scoped lang="scss">
:deep(.ProseMirror) {
  min-height: 200px;
  > * + * {
    margin-top: 0.75em;
  }

  img {
    max-width: 90%;
    max-height: 200px;
    padding: 10px;

    &.ProseMirror-selectednode {
      outline: 3px solid #68cef8;
    }
  }

  blockquote.quote {
    background-color: lightgray;
  }
  p {
    padding: 2px 10px 2px 10px;
  }
  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  p.caption {
    color: white;
    background-color: orange;
    font-weight: bold;
    margin-top: -15px;
  }

  p var {
    border-radius: 1px;
    padding: 2px 2px 2px 2px;
    font-style: normal;

    &.error {
      color: black;
      background-color: yellow;
      font-family: monospace;
      border: 1px solid red;
    }

    &.name {
      color: red;
      background-color: pink;
    }

    &.example {
      color: white;
      // background-color: #f6f8fa;
      background-color: #748393;
    }

    &.book {
      color: black;
      background-color: orange;
      font-size: 90%;
      border: 1 px dashed pink;
      font-style: italic;
    }
  }
}

:deep(.annotation) {
  display: inline-block;
  text-align: left;
  min-width: 100%;
  &.even div {
    background-color: #feebdd;
  }
  &.odd div {
    background-color: lightyellow;
  }
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
</style>
