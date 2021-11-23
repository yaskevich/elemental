<template>

  <editor-content :editor="editor" style="display: inline-block; text-align: left;min-width:300px;" :class="editorclass" />

</template>

<script>

  import { useEditor, EditorContent } from '@tiptap/vue-3';
  // import StarterKit from '@tiptap/starter-kit'
  import Document from '@tiptap/extension-document';
  import Paragraph from '@tiptap/extension-paragraph';
  import Text from '@tiptap/extension-text';
  import History from '@tiptap/extension-history';
  import TextStyle from '@tiptap/extension-text-style';
  import Color from '@tiptap/extension-color';
  import Placeholder from '@tiptap/extension-placeholder';

  export default {
    components: {
      EditorContent,
    },
    props: {
      editorclass: String,
    },

    setup() {
      const editor = useEditor({
        content: '',
        autofocus: 'end',
        editable: true,
        extensions: [
          Document,
          Paragraph,
          Text,
          History,
          TextStyle,
          Color,
          Placeholder.configure({
            placeholder: 'Start writing your comment...',
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

  .fulleditor div{
    background-color: lightyellow;
  }

  .briefeditor div{
    background-color: #feebdd;
  }

</style>
