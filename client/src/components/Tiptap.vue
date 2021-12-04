<template>

  <div v-if="editor">

    <button @click="editor.chain().focus().toggleAnnotation().run()" :class="{ 'is-active': editor.isActive('annotation') }">Toggle Annotation</button>

    <button v-for="item in classes"
            @click="editor.chain().focus().toggleAnnotation({ class: item }).run()"
            :class="{ 'is-active': editor.isActive('annotation', { class: item }) }"
            style="background-color: #c9c9ff;">
        {{item}}
    </button>

    <button @click="editor.chain().focus().unsetAnnotation().run()"  :disabled="!editor.isActive('annotation')">
        Clear Annotation
    </button>

    <editor-content :editor="editor" :class="`${editorclass} annotation`"/>

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
      const classes = ['error', 'name', 'example', 'book'];

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
            classes,
          }),
          // StarterKit,
        ],
      });

      return { editor, classes };
    },
  };

</script>

<style lang="scss">

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
    min-width:300px;

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

</style>
