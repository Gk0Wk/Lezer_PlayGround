import {
    createApp
} from 'vue';
import App from './App.vue';
import installElementPlus from './plugins/element';
import CodeMirror from './codemirror-editor/index';

const app = createApp(App).use(CodeMirror);
installElementPlus(app);
app.mount('#app');
