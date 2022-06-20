<template>
  <div v-if="customEditor">
    <!-- <button @click="customEditor.chain().focus().toggleAnnotation().run()" :class="{ 'is-active': customEditor.isActive('annotation') }">Toggle Annotation</button> -->

    <button
      v-for="item in classes"
      @click="customEditor.chain().focus().toggleAnnotation({ class: item }).run()"
      :class="{ 'is-active': customEditor.isActive('annotation', { class: item }) }"
      style="background-color: #c9c9ff;"
    >{{ item }}</button>

    <!-- <button @click="customEditor.chain().focus().unsetAnnotation().run()" :disabled="!customEditor.isActive('annotation')">
              Clear Annotation
    </button>-->
    <!-- <button @click="addImage">+image</button> -->

    <button
      @click="customEditor.chain().focus().toggleBlockquote().run()"
      :class="{ 'is-active': customEditor.isActive('blockquote') }"
    >quote</button>

    <button
      @click="customEditor.commands.toggleBold()"
      :class="{ 'is-active': customEditor.isActive('bold') }"
    >emphasized</button>

    <button @click="showModal = true" style="background-color: #fac9ff;">+image</button>

    <button
      @click="customEditor.chain().focus().setBlock({ class: 'caption' }).run()"
      style="background-color: #fac9ff;"
    >caption</button>

    <!-- clear formatting -->
    <button
      @click="customEditor.chain().focus().clearNodes().unsetAllMarks().run()"
      style="font-weight:bold;"
    >clear</button>

    <button
      @click="customEditor.chain().focus().deleteSelection().run()"
      style="background-color: #da1d1d;color:white"
    >del</button>

    <n-modal
      v-model:show="showModal"
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
            v-for="(item, index) in previewFileList"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onBeforeMount, ref, reactive } from 'vue';
// import type { UploadFileInfo } from 'naive-ui';
import store from '../store';
import { Editor, EditorContent } from '@tiptap/vue-3';
// import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
// import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import Annotation from '../annotation';
import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import Nodeblock from '../nodeblock';


defineProps<{ editorclass: string }>();

const classes = ['error', 'name', 'example', 'book'];
const CustomBlockquote = Blockquote.extend({
  content: 'paragraph*',
});

const showModal = ref(false);
const id = store?.state?.user?.text_id;
const previewFileList = reactive<IImageItem[]>([]); // UploadFileInfo


const customEditor = new Editor({
  content: '',
  autofocus: 'end',
  editable: true,
  extensions: [
    Document,
    Paragraph,
    Text,
    History,
    // TextStyle,
    Color,
    Placeholder.configure({
      placeholder: 'Start writing your comment...',
    }),
    Annotation.configure({
      classes,
    }),
    CustomBlockquote.configure({
      HTMLAttributes: {
        class: 'quote',
      },
    }),
    Bold.configure({
      HTMLAttributes: {
        class: 'em',
      },
    }),
    Image,
    Dropcursor,
    Nodeblock.configure({
      classes: ['caption', 'error'],
    }),
    // StarterKit,
  ],
});

onBeforeUnmount(() => {
  customEditor.destroy();
});

onBeforeMount(async () => {
  const data = await store.get(`img/${id}`);
  Object.assign(previewFileList, data.sort((a: any, b: any) => (new Date(a.created)).getTime() - (new Date(b.created)).getTime()));
});

// const addImage = () => {
//   const url = window.prompt('URL')
//   if (url) {
//     customEditor.chain().focus().setImage({ src: url }).run()
//   }
// };

interface IImageItem {
  id: string,
  user_id: number,
  text_id: number,
  filesize: number,
  created: Date,
  title: string
  meta: string,
  status: string,
  loaded: boolean,
  url: string,
  name: string
};

const selectImage = (item: IImageItem) => {
  // console.log("image", item);
  customEditor.chain().focus()
    .setImage({ src: item.url })
    .createParagraphNear()
    .insertContent(item.title)
    .setBlock({ class: 'caption' })
    .run();
  showModal.value = false;
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
  min-width: 300px;
  &.fulleditor div {
    background-color: lightyellow;
  }
  &.briefeditor div {
    background-color: #feebdd;
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
</style>
