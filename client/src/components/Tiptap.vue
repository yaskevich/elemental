<template>

  <div v-if="customEditor">

    <!-- <button @click="customEditor.chain().focus().toggleAnnotation().run()" :class="{ 'is-active': customEditor.isActive('annotation') }">Toggle Annotation</button> -->

    <button v-for="item in classes"
            @click="customEditor.chain().focus().toggleAnnotation({ class: item }).run()"
            :class="{ 'is-active': customEditor.isActive('annotation', { class: item }) }"
            style="background-color: #c9c9ff;">
              {{item}}
          </button>

    <!-- <button @click="customEditor.chain().focus().unsetAnnotation().run()" :disabled="!customEditor.isActive('annotation')">
              Clear Annotation
          </button> -->
    <!-- <button @click="addImage">+image</button> -->
    <button @click="showModal = true">+image</button>
    

    <button @click="customEditor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': customEditor.isActive('blockquote') }">
            quote
          </button>

    <button @click="customEditor.commands.toggleBold()" :class="{ 'is-active': customEditor.isActive('bold') }">
            emphasized
          </button>

    <button @click="customEditor.chain().focus().clearNodes().unsetAllMarks().run()">clear formatting</button>

    <button @click="customEditor.chain().focus().deleteSelection().run()" style="background-color: #da1d1d;color:white">del</button>
   

    <n-modal
      v-model:show="showModal"
      :style="{'max-width': '600px'}"
      class="custom-card"
      preset="card"
      title="Select an image"
      :bordered="false"
      size="huge"
      :segmented="{content: 'soft', footer: 'soft'}"
      >
      <!-- <template #header-extra>
        Oops!
      </template> -->
      <!-- Content -->
      <n-image-group>
        <n-space>
          <n-image v-for="(item, index) in previewFileList" :key="index"
            width="100"
            class="selectable"
            :preview-disabled="true"
            :src="item.url"
            @click="selectImage(item.url as string)"/>
         </n-space>
      </n-image-group>
      <!-- <template #footer>
        Footer
      </template> -->
    </n-modal>
    <editor-content :editor="customEditor" :class="`${editorclass} annotation`" />

  </div>

</template>

<script setup lang="ts">
  import { onBeforeUnmount, onBeforeMount, ref, reactive } from 'vue';
  import type { UploadFileInfo } from 'naive-ui';
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

  defineProps<{ editorclass: string }>();

  const classes = ['error', 'name', 'example', 'book'];
  const CustomBlockquote = Blockquote.extend({
    content: 'paragraph*',
  });

  const showModal = ref(false);
  const id = store?.state?.user?.text_id;
  const previewFileList = reactive<UploadFileInfo[]>([]);


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
      // StarterKit,
    ],
  });

  onBeforeUnmount(() => {
    customEditor.destroy();
  });

  onBeforeMount(async() => {
    const data = await store.get(`img/${id}`);
    Object.assign(previewFileList, data.sort((a:any,b:any) => (new Date(a.stats.mtime)).getTime() - (new Date(b.stats.mtime)).getTime() ));
  });

  const addImage = () => {
    const url = window.prompt('URL')
    if (url) {
      customEditor.chain().focus().setImage({ src: url }).run()
    }
  };

  const selectImage = (url:string) => {
    // console.log("image", url);
    customEditor.chain().focus().setImage({ src: url }).run();
    showModal.value = false;
  };

  defineExpose({handle: customEditor });

</script>

<style lang="scss">
  .ProseMirror {
    > * + * {
      margin-top: 0.75em;
    }

    img {
      max-width: 100%;
      height: auto;

      &.ProseMirror-selectednode {
        outline: 3px solid #68CEF8;
      }
    }
  }

  .ProseMirror p {
    margin: 1em 0;
    padding: 15px;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  .annotation {
    display: inline-block;
    text-align: left;
    min-width: 300px;

    blockquote.quote {
      background-color: lightgray;
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

  .fulleditor div {
    background-color: lightyellow;
  }

  .briefeditor div {
    background-color: #feebdd;
  }

  .selectable{
    border: 3px solid gray;
    cursor: grab;
    transition: all .2s ease-in-out;
  }

  .selectable:hover {
    transform: scale(1.2);
    position: relative;
    z-index: 1000;
  }
</style>
