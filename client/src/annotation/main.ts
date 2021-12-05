import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core'

export interface AnnotationOptions {
  HTMLAttributes: Record<string, any>,
  classes: Array<string>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      /**
       * Set an annotation mark
       */
      setAnnotation: (attributes?: { class: string }) => ReturnType,
      /**
       * Toggle an annotation mark
       */
      toggleAnnotation: (attributes?: { class: string }) => ReturnType,
      /**
       * Unset an annotation mark
       */
      unsetAnnotation: () => ReturnType,
    }
  }
}

// export const inputRegex = /(?:^|\s)((?:==)((?:[^~]+))(?:==))$/
// export const pasteRegex = /(?:^|\s)((?:==)((?:[^~]+))(?:==))/g

export const Annotation = Mark.create<AnnotationOptions>({
  name: 'annotation',

  addOptions() {
    return {
      classes: [''],
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    // console.log("available annotation classes", this.options.classes);
    return {
      "class": {
        default: this.options.classes[0],
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return {}
          }

          return {
            'class': attributes.class,
            'title': attributes.class,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'var',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['var', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setAnnotation: attributes => ({ commands }) => {
        console.log("set attrs", attributes);
        return commands.setMark(this.name, attributes)
      },
      toggleAnnotation: attributes => ({ commands }) => {
        console.log("toggle attrs", attributes);
        return commands.toggleMark(this.name, attributes)
      },
      unsetAnnotation: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  // addKeyboardShortcuts() {
  //   return {
  //     'Mod-Shift-h': () => this.editor.commands.toggleAnnotation(),
  //   }
  // },

  // addInputRules() {
  //   return [
  //     markInputRule({
  //       find: inputRegex,
  //       type: this.type,
  //     }),
  //   ]
  // },
  //
  // addPasteRules() {
  //   return [
  //     markPasteRule({
  //       find: pasteRegex,
  //       type: this.type,
  //     }),
  //   ]
  // },
})
