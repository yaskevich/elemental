import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import Component from './Component.vue'

export interface CitationOptions {
    inline: boolean,
    HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        citation: {
            setCitation: (attributes?: { id: number }) => ReturnType,
        }
    }
}

export const Citation = Node.create<CitationOptions>({
    name: 'citation',
    draggable: true,
    atom: true,
    inline: true,
    //   inline() {
    //     return this.options.inline
    //   },
    group() {
        return this.options.inline ? 'inline' : 'block';
    },

    addOptions() {
        return {
            inline: true,
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            id: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'cite',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        // console.log(HTMLAttributes);
        return ['cite', mergeAttributes(HTMLAttributes)]
    },

    addNodeView() {
        return VueNodeViewRenderer(Component);
    },

    addCommands() {
        return {
            setCitation: attributes => ({ chain }) => {
                return chain().insertContent({
                    type: this.name,
                    attrs: attributes,
                }).run();
            },
        }
    }
})