import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'element-plus/dist/index.css'
import './assets/main.css'
// 按需注册：显式导入项目实际用到的图标（扫描全部模板所得）。
// 保留全局注册是因为存在字符串动态引用（如 :is="'CaretTop'"、prefix-icon="Search"），编译期分析不到
import {
  ArrowDown, ArrowLeft, ArrowRight, Bell, Box, Brush, Calendar, Camera,
  CaretBottom, CaretTop, ChatLineRound, Check, Close, Collection, CollectionTag,
  Connection, CopyDocument, Delete, Document, DocumentCopy, Download, Edit,
  EditPen, Expand, FolderOpened, Fold, Grid, Headset, InfoFilled, Link, List,
  Lock, MagicStick, Menu, Message, Monitor, MoreFilled, OfficeBuilding, Picture,
  PictureFilled, Pointer, Plus, QuestionFilled, Rank, Refresh, RefreshLeft,
  Search, Setting, Share, Sort, Timer, Upload, User, View, VideoCamera, ZoomIn
} from '@element-plus/icons-vue'

const app = createApp(App)

// 按需注册图标（56 个，替代原全量注册 300+）
const icons = {
  ArrowDown, ArrowLeft, ArrowRight, Bell, Box, Brush, Calendar, Camera,
  CaretBottom, CaretTop, ChatLineRound, Check, Close, Collection, CollectionTag,
  Connection, CopyDocument, Delete, Document, DocumentCopy, Download, Edit,
  EditPen, Expand, FolderOpened, Fold, Grid, Headset, InfoFilled, Link, List,
  Lock, MagicStick, Menu, Message, Monitor, MoreFilled, OfficeBuilding, Picture,
  PictureFilled, Pointer, Plus, QuestionFilled, Rank, Refresh, RefreshLeft,
  Search, Setting, Share, Sort, Timer, Upload, User, View, VideoCamera, ZoomIn
}
for (const [name, component] of Object.entries(icons)) {
  app.component(name, component)
}

app.use(store)
app.use(router)

app.mount('#app')
