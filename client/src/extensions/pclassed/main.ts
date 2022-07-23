import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nodeblock: {
      setBlock: (attributes?: { class: string }) => ReturnType,
    }
  }
}

export interface PclassedOptions {
  HTMLAttributes: Record<string, any>,
  classes: Array<string>,
}

export const Pclassed = Node.create<PclassedOptions>({
  name: 'pclassed',

  priority: 1000,

  addOptions() {
    return {
      classes: [''],
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'inline*',

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
      { tag: 'p' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setBlock: attributes => ({ commands }) => {
        return commands.setNode(this.name)
      },
    }
  },

})
