<template>
    <input
        type="file"
        id="files"
        ref="refFile"
        style="display: none"
        v-on:change="onFileChoosen"
    />
    <el-container
        class="root-container"
        @mousemove="resize2 && onResize2($event)"
    >
        <el-header class="root-header">
            <h2 style="color: #fcfcfc">Lezer Plauground (by Gk0Wk)</h2>
            <a
                class="github-link"
                href="https://github.com/Gk0Wk/CodeMirror-Mode-TiddlyWiki5"
                target="_blank"
            >
                <img
                    src="./assets/GitHub-Mark-Light-64px.png"
                    style="height: 28px; width: 28px; margin-right: 8px"
                    alt="GitHubIcon"
                />
                <div>Fork me on GitHub</div>
            </a>
        </el-header>
        <el-container
            class="playground-editor-container"
            @mousemove="resize1 && onResize1($event)"
            id="resize2_top"
        >
            <el-main class="test-editor-container" id="resize1_left">
                <CodeMirrorEditor
                    v-model="testCode"
                    :options="testCMOptions"
                    @ready="onTestEditorReady"
                />
            </el-main>
            <el-main
                id="split-bar1"
                @mousedown="resize1 = true"
                @mouseup="resize1 = false"
            ></el-main>
            <el-main class="grammar-editor-container" id="resize1_right">
                <div class="grammar-editor-menubar">
                    <el-tooltip
                        class="item"
                        effect="dark"
                        content="Learn how to use"
                        placement="left"
                    >
                        <el-button
                            icon="el-icon-question"
                            circle
                            @click="helpDialogVisible = true"
                        ></el-button>
                    </el-tooltip>
                    <el-tooltip
                        class="item"
                        effect="dark"
                        content="Upload grammar file"
                        placement="left"
                    >
                        <el-button
                            icon="el-icon-upload"
                            circle
                            title="Upload grammar file"
                            @click="onUploadButtonClick"
                        ></el-button>
                    </el-tooltip>
                    <el-tooltip
                        class="item"
                        effect="dark"
                        content="Complie the grammar"
                        placement="left"
                    >
                        <el-button
                            icon="el-icon-refresh"
                            circle
                            :disabled="!grammarCode"
                            title="Complie the grammar"
                            @click="onCompile"
                        ></el-button>
                    </el-tooltip>
                    <el-tooltip
                        class="item"
                        effect="dark"
                        content="Download compiled parser"
                        placement="left"
                    >
                        <el-button
                            icon="el-icon-download"
                            circle
                            :disabled="!grammarCode"
                            title="Download compiled parser"
                            @click="onDownload"
                        ></el-button>
                    </el-tooltip>
                </div>
                <CodeMirrorEditor
                    v-model="grammarCode"
                    :options="grammarCMOptions"
                    @ready="onGrammarEditorReady"
                />
            </el-main>
        </el-container>
        <el-main
            id="split-bar2"
            style="flex-grow: 0 !important"
            @mousedown="resize2 = true"
            @mouseup="resize2 = false"
        ></el-main>
        <el-main
            class="test-result-container"
            id="resize2_bottom"
            style="flex-grow: 0 !important"
        >
            <el-tree
                :data="parseTree"
                node-key="id"
                empty-text="Empty"
                :props="defaultProps"
                class="parse-tree-table"
                lazy
                :load="loadParseNode"
            >
                <template #default="{ node, data }">
                    <span class="custom-tree-node">
                        <span class="node-label">{{ node.label }}</span>
                        <span>
                            {{ data.text }}
                        </span>
                    </span>
                </template>
            </el-tree>
        </el-main>
    </el-container>
    <el-dialog title="How to use" v-model="helpDialogVisible" width="30%">
        <span>Not finished</span>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="helpDialogVisible = false"
                    >OK, I known</el-button
                >
            </span>
        </template>
    </el-dialog>
</template>

<script>
import "codemirror/theme/ayu-dark.css";
import "codemirror/theme/juejin.css";
import "codemirror/mode/javascript/javascript.js";
import { loadString, download } from "./components/local_io";
import { buildParser, buildParserFile } from "lezer-generator/dist/index.es";
import { lezer } from "lezer-generator/dist/rollup-plugin-lezer.es";

const rollup = require("rollup");
import virtual from "@rollup/plugin-virtual";
async function packJS(jsText, onReady) {
    var rollupBundle = await rollup.rollup({
        input: "parse",
        plugins: [virtual({ parse: jsText }), lezer()],
    });
    const { output } = await rollupBundle.generate({
        format: "umd",
        name: "parse",
    });
    onReady(output);
}

// DSL
var counter = 0;
function treeVisitor(cursor) {
    var nodes = [];
    do {
        nodes.push({
            id: counter++,
            label: cursor.name,
            from: cursor.from,
            to: cursor.to,
            children: cursor.firstChild() ? treeVisitor(cursor) : undefined,
        });
    } while (cursor.nextSibling());
    return cursor.parent() ? nodes : nodes[0];
}

export default {
    name: "App",
    components: {},
    data() {
        return {
            testCode: '{"key": "value"}',
            testCMOptions: {
                tabSize: 4,
                lineNumbers: true,
                line: true,
                mode: "text/plain",
                theme: "ayu-dark",
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets: true,
            },
            grammarCode: "",
            grammarCMOptions: {
                tabSize: 4,
                lineNumbers: true,
                line: true,
                mode: "text/plain",
                theme: "juejin",
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets: false,
            },
            grammarEditor: null,
            resize1: false,
            resize2: false,
            helpDialogVisible: false,
            parser: null,
            defaultProps: {
                children: "children",
                label: "label",
                text: "text",
                isLeaf: "isLeaf",
            },
            parseTree: [],
        };
    },
    methods: {
        onTestEditorReady(editor) {
            editor.on("change", (code, event) => {
                if (
                    event.origin === "+input" &&
                    event.text[0].trim() === "" &&
                    event.text[1] === ""
                )
                    return;
                if (event.origin === "+delete" && event.removed[0] === "")
                    return;
                code.showHint({
                    completeSingle: false,
                });
            });
            editor.on("change", () => {
                this.updateParseTree(this.testCode);
            });
        },
        onGrammarEditorReady(editor) {
            this.grammarEditor = editor;
        },
        onResize1(event) {
            var widthPercent = (event.clientX / window.innerWidth) * 100;
            document.getElementById(
                "resize1_left"
            ).style.width = `calc(${widthPercent}% - 3px)`;
            document.getElementById("resize1_right").style.width = `calc(${
                100 - widthPercent
            }% - 3px)`;
        },
        onResize2(event) {
            var heightPercent =
                ((event.clientY - 57) / (window.innerHeight - 60)) * 100;
            document.getElementById(
                "resize2_top"
            ).style.height = `calc(${heightPercent}% - ${
                0.3 * heightPercent + 3
            }px)`;
            document.getElementById("resize2_bottom").style.height = `calc(${
                100 - heightPercent
            }% - ${0.3 * (100 - heightPercent) + 3}px)`;
        },
        onUploadButtonClick() {
            document.getElementById("files").click();
        },
        onFileChoosen(event) {
            loadString(event, (text) => {
                this.grammarEditor.setValue(text);
            });
        },
        onCompile() {
            this.parser = buildParser(this.grammarCode, {});
            this.updateParseTree(this.testCode);
        },
        onDownload() {
            var tp = new Promise((resolve) => {
                const result = buildParserFile(this.grammarCode, {
                    moduleStyle: "es",
                });
                resolve(result);
            });
            tp.then((result) => {
                packJS(result.parser, (output) =>
                    download(output[0].code, "parser.js", "text/javascript")
                );
            });
            tp.then((result) => {
                packJS(result.terms, (output) =>
                    download(output[0].code, "terms.js", "text/javascript")
                );
            });
        },
        updateParseTree(text) {
            if (this.parser) {
                counter = 0;
                this.parseTree = [
                    treeVisitor(this.parser.parse(text).cursor()),
                ];
            }
        },
        loadParseNode(node, resolve) {
            if (node.loading && node.data.children) {
                node.isLeaf = false;
                node.data.children.forEach((child) => {
                    if (!child.text)
                        child.text = this.testCode.substring(
                            child.from,
                            child.to
                        );
                });
                resolve(node.data.children);
            } else {
                node.isLeaf = true;
                resolve([]);
            }
            node.childNodes.forEach((child) => {
                child.isLeaf = !child.data.children;
            });
        },
    },
};
</script>

<style lang="scss">
body {
    margin: 0;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    height: 100vh;
    width: 100vw;
}

.root-container {
    height: 100%;
    width: 100%;
    background: #292a30;
}

.root-header {
    background: #1e1f20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 0 !important;
}

.test-editor-container {
    background: #ccc;
    width: calc(50% - 3px);
    padding: 0 !important;
}

.grammar-editor-container {
    width: calc(50% - 3px);
    padding: 0 !important;
}

#split-bar1 {
    width: 6px;
    background: #7f8c99;
    padding: 0 !important;
    cursor: ew-resize;
    transition: 0.35s;
    &:hover,
    &:focus {
        background: #ffa245;
    }
}

.playground-editor-container {
    flex-grow: 0 !important;
    height: calc(60% - 33px);
}

.test-result-container {
    flex-grow: 0 !important;
    height: calc(40% - 33px);
}

#split-bar2 {
    flex-grow: 0 !important;
    height: 6px;
    background: #7f8c99;
    padding: 0 !important;
    cursor: ns-resize;
    transition: 0.35s;
    &:hover,
    &:focus {
        background: #ffa245;
    }
}

.github-link {
    color: white;
    display: flex;
    align-items: center;
    text-decoration: none;
    height: 100%;
    padding: 0 20px;
    transition: 0.35s;
    &:hover,
    &:focus {
        filter: invert(100%);
        background: rgba(0, 0, 0, 1);
    }
}

.grammar-editor-menubar {
    position: absolute;
    top: 60px;
    right: 0;
    z-index: 10;
    pointer-events: none;
    padding: 0 10px;
    display: flex;
    flex-direction: column;
}

.grammar-editor-menubar .el-button {
    pointer-events: auto;
    margin-left: 10px;
    margin-top: 10px;
    opacity: 0.6;
    transition: 0.35s;
    &:hover,
    &:focus {
        opacity: 1;
    }
}

.test-result-container {
    padding: 0 !important;
}

.parse-tree-table {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7) !important;
}

.el-tree-node:focus > .el-tree-node__content {
    background-color: #075ec2 !important;
}

.el-tree-node__content {
    background: #292a30;
    transition: 0.15s;
    &:active,
    &:hover,
    &:focus {
        background: #0973eb !important;
    }
}

.node-label {
    font-weight: bold;
    color: #fff;
    margin-right: 8px;
}
</style>
