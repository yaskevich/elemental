<template>

  <div v-if="editor">
    <button @click="editor.chain().focus().toggleAnnotation().run()" :class="{ 'is-active': editor.isActive('highlight') }">Toggle Annotation</button>

    <button @click="editor.chain().focus().toggleAnnotation({ class: 'red' }).run()" :class="{ 'is-active': editor.isActive('highlight', { class: 'red' }) }">
      red
    </button>

    <button @click="editor.chain().focus().unsetAnnotation().run()" :disabled="!editor.isActive('annotation')">
      Clear Annotation
    </button>

    <editor-content :editor="editor" style="display: inline-block; text-align: left;min-width:300px;" :class="editorclass + ' annotation'" />
  </div>

</template>

<script>

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

  export default {
    components: {
      EditorContent,
    },
    props: {
      editorclass: String,
    },

    setup() {
      const editor = new Editor({
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
            multicolor: true,
          }),
          // StarterKit,
        ],
      });

      return { editor };
    },
  };

</script>

<style>

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
  .annotation p var.red {
    color: white;
    background-color: red;
    padding: 3px;
    font-style:normal;
  }

  .fulleditor div {
    background-color: lightyellow;
  }

  .briefeditor div {
    background-color: #feebdd;
  }

</style>
