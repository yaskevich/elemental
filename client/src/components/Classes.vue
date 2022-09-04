<template>
    <n-card title="Annotation Classes" :bordered="false" class="minimal left">
        <!-- <template #header-extra>
            <n-button type="info" @click="editClass()">New</n-button>
        </template>-->
        <n-space vertical>
            <div
                v-for="(item, index) in store.state.user?.classes"
                style="text-align: center;"
                :key="index"
            >
                <n-grid cols="1 400:12" x-gap="45" :collapsed-rows="1">
                    <n-gi span="10">
                        <div :style="item.css" class="class-preview">{{ item.name }}</div>
                    </n-gi>
                    <n-gi>
                        <n-button size="large" @click="editClass(index)">Edit</n-button>
                    </n-gi>
                </n-grid>
            </div>
        </n-space>
        <n-modal
            v-model:show="showModal"
            :style="{ 'max-width': '600px' }"
            class="custom-card"
            preset="card"
            title="Set style for the annotation class"
            :bordered="false"
            size="huge"
            :segmented="{ content: 'soft', footer: 'soft' }"
        >
            <n-form>
                <!-- <n-input
                    v-model:value="currentClass.name"
                    type="text"
                    placeholder="Class Name"
                    style="text-align:center;"
                    autofocus
                ></n-input>-->
                <n-form-item label="Text color">
                    <n-color-picker
                        v-model:value="currentClass.css.color"
                        :show-alpha="true"
                        :swatches="['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']"
                    />
                </n-form-item>
                <n-form-item label="Background color">
                    <n-color-picker
                        v-model:value="currentClass.css['background-color']"
                        :show-alpha="true"
                        :swatches="['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']"
                    />
                </n-form-item>
                <n-space justify="space-between">
                    <n-form-item :label="cssFlag.label" v-for="cssFlag in cssFlags">
                        <n-switch
                            :default-value="currentClass.css[cssFlag.prop] === cssFlag.value"
                            :checked-value="true"
                            :unchecked-value="false"
                            @update:value="handleSwitch($event, cssFlag.prop, cssFlag.value)"
                        />
                    </n-form-item>
                </n-space>
            </n-form>
            <n-space vertical>
                <n-card title="Preview" size="small">
                    <div :style="currentClass.css" class="class-preview">{{ currentClass.name }}</div>
                </n-card>
                <n-space justify="space-between">
                    <n-button type="info" @click="showModal = false;">Cancel</n-button>
                    <n-button type="success" @click="saveClass">Save</n-button>
                </n-space>
            </n-space>
            <!-- {{ currentClass }} -->
        </n-modal>
    </n-card>
    <!-- {{ store.state.user?.classes }} -->
</template>

<script setup lang="ts">
import store from '../store';
import { ref, reactive, toRaw, } from 'vue';

const currentClass = reactive<IAnnotationClass>({ name: '', css: {} });
const itemNum = ref<undefined | number>(undefined);
const showModal = ref(false);
// const previewer = ref<HTMLDivElement>();

const cssFlags = [
    { label: "Bold", prop: "font-weight", value: "bold" },
    { label: "Monospace", prop: "font-familty", value: "monospace" },
    { label: "Underline", prop: "text-decoration", value: "underline" },
];

const editClass = (num: number) => {
    showModal.value = true;
    itemNum.value = num;
    Object.assign(currentClass, toRaw(store.state.user?.classes?.[num]));
};

const saveClass = async () => {
    if (itemNum.value !== undefined && store?.state?.user?.classes?.[itemNum.value]) {
        // unref
        Object.assign(store.state.user.classes[itemNum.value], toRaw(currentClass));
        // console.log(currentClass.css);
        const { data } = await store.post('classes', currentClass);
        console.log(data);
        store.setCustomCSS();
    }
    showModal.value = false;
};

const handleSwitch = (status: boolean, cssName: string, cssValue: string) => {
    console.log(status, cssName, cssValue);
    // set them to null instead of delet (https://github.com/vuejs/core/issues/5322)
    currentClass.css[cssName] = status ? cssValue : null;
};

</script>

<style scoped>
.class-preview {
    font-size: 1.5rem;
    text-align: center;
}
</style>
