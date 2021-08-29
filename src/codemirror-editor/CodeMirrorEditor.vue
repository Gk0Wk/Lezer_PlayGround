<template>
    <textarea id="gk0wk-codemirror-editor-template" />
</template>

<script >
import { defineComponent, onMounted, watch } from "vue"; //, defineProps, defineEmit

import CodeMirrorLib from "codemirror/lib/codemirror";
// base style
import "codemirror/lib/codemirror.css";

//

import "codemirror/addon/display/placeholder";
import "codemirror/addon/merge/merge.js";

// active-line.js
import "codemirror/addon/selection/active-line.js";
// styleSelectedText
import "codemirror/addon/selection/mark-selection.js";
// hint
import "codemirror/addon/hint/sql-hint";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint.js";
// highlightSelectionMatches
import "codemirror/addon/scroll/annotatescrollbar.js";
import "codemirror/addon/search/matchesonscrollbar.js";
import "codemirror/addon/search/searchcursor.js";
import "codemirror/addon/search/match-highlighter.js";
// keyMap
import "codemirror/mode/clike/clike.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/comment/comment.js";
import "codemirror/addon/dialog/dialog.js";
import "codemirror/addon/dialog/dialog.css";
import "codemirror/addon/search/search.js";
import "codemirror/keymap/sublime.js";
// keyMap
import "codemirror/keymap/emacs.js";
// foldGutter
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/fold/brace-fold.js";
import "codemirror/addon/fold/comment-fold.js";
import "codemirror/addon/fold/foldcode.js";
import "codemirror/addon/fold/foldgutter.js";
import "codemirror/addon/fold/indent-fold.js";
import "codemirror/addon/fold/markdown-fold.js";
import "codemirror/addon/fold/xml-fold.js";
// autoCloseTags
import "codemirror/addon/edit/closetag.js";
// closebrackets
import "codemirror/addon/edit/closebrackets.js";

const CodeMirror = window.CodeMirror || CodeMirrorLib;

// pollfill
if (typeof Object.assign != "function") {
    Object.defineProperty(Object, "assign", {
        value(target) {
            if (target == null) {
                throw new TypeError(
                    "Cannot convert undefined or null to object"
                );
            }
            const to = Object(target);
            for (let index = 1; index < arguments.length; index++) {
                const nextSource = arguments[index];
                if (nextSource != null) {
                    for (const nextKey in nextSource) {
                        if (
                            Object.prototype.hasOwnProperty.call(
                                nextSource,
                                nextKey
                            )
                        ) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true,
    });
}

var nextEditorId = 1;
export default defineComponent({
    name: "codemirror-editor",
    props: {
        id: String,
        modelValue: String,
        options: Object,
    },
    setup(props, { emit }) {
        var editor = null,
            codeEditor = null;

        onMounted(() => {
            // 绑定区域
            editor = document.getElementById(
                "gk0wk-codemirror-editor-template"
            );
            // 保证页面内多个编辑器不冲突
            editor.id = `codemirror-editor-${nextEditorId++}`;
            editor.value = props.modelValue;
            // 初始化CodeMirror
            codeEditor = CodeMirror.fromTextArea(editor, props.options);
            // props.modelValue 与编辑器文本双向绑定
            codeEditor.setValue(props.modelValue);
            codeEditor.on("change", (code) =>
                emit("update:modelValue", code.getValue())
            );
            // 初始化完成
            emit("ready", codeEditor);
        });

        watch(
            props.options,
            (val) => {
                val.forEach((key, value) => {
                    if (codeEditor.getOption(key) !== value)
                        codeEditor.setOption(key, value);
                });
            },
            { deep: true }
        );
    },
});
</script>

<style>
.CodeMirror {
    width: 100%;
    height: 100%;
}
</style>
