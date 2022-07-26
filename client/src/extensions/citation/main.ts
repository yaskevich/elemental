import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import Component from './Component.vue';

export interface CitationOptions {
    inline: boolean,
    HTMLAttributes: Record<string, any>,
    sources: Array<IBib>,
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
    group() { return this.options.inline ? 'inline' : 'block'; },

    // defaultOptions: {
    //     inline: true,
    //     HTMLAttributes: {},
    // },

    addOptions() {
        return {
            inline: true,
            HTMLAttributes: {},
            sources: []
        }
    },

    addAttributes() { return { id: { default: null, }, } },

    parseHTML() { return [{ tag: 'cite', }] },

    // renderText 
    renderHTML({ HTMLAttributes, node }) {
        // console.log(node);
        // [{"type":"text","text":" конец цитаты "}
        return ['cite', mergeAttributes(({...HTMLAttributes, content: "kek"}))]
    },

    addNodeView() { return VueNodeViewRenderer(Component) },

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
