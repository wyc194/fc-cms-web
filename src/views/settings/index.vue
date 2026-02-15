<template>
  <div class="page-container">
    <div class="page-action-header">
        <div class="header-info">
          <h2 class="page-title">系统设置</h2>
          <p class="page-subtitle">配置全局站点参数、SEO 及外观展示</p>
        </div>
        <div class="page-actions">
          <el-button type="primary" icon="Check" :loading="saving" @click="handleSave">保存所有更改</el-button>
        </div>
      </div>

    <div class="page-main-scroll">
      <el-tabs v-model="activeTab" class="settings-tabs flex-auto">
        <el-tab-pane name="basic">
          <template #label>
            <div class="tab-label">
              <el-icon><Setting /></el-icon>
              <span>基本设置</span>
            </div>
          </template>
          <el-card shadow="never" class="settings-card">
            <el-form 
              ref="basicFormRef" 
              :model="settings" 
              :rules="rules" 
              label-position="top" 
              class="settings-form"
              v-loading="loading"
            >
              <el-form-item label="站点名称" prop="name">
                <el-input v-model="settings.name" placeholder="请输入站点名称" />
              </el-form-item>
              <el-form-item label="作者名称">
                <el-input v-model="settings.webInfo.authorName" placeholder="文章默认显示的作者名称" />
              </el-form-item>
              <el-form-item label="站点公告">
                <el-input v-model="settings.webInfo.announcement" placeholder="显示在侧边栏的公告内容" />
              </el-form-item>
              <el-form-item label="站点描述" prop="webInfo.description">
                <el-input v-model="settings.webInfo.description" type="textarea" :rows="3" placeholder="简要描述您的站点" />
              </el-form-item>
              <el-form-item label="关于我">
                <el-input 
                  v-model="settings.webInfo.aboutMe" 
                  type="textarea" 
                  :rows="6" 
                  placeholder="关于我的详细介绍，支持 HTML 标签" 
                />
                <div class="input-tip">支持 HTML 标签，可用于自定义个人介绍样式</div>
              </el-form-item>
              <el-form-item label="版权信息">
                <el-input v-model="settings.webInfo.copyright" placeholder="例如：&copy;2024 By wyc" />
              </el-form-item>
              <el-form-item label="ICP 备案号">
                <el-input v-model="settings.webInfo.icp" placeholder="例如：豫ICP备XXXXXXXX号" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane name="appearance">
          <template #label>
            <div class="tab-label">
              <el-icon><Brush /></el-icon>
              <span>外观设置</span>
            </div>
          </template>
          <el-card shadow="never" class="settings-card">
            <el-form :model="settings" label-position="top" class="settings-form">
              <el-form-item label="主题模式">
                <el-radio-group v-model="settings.webInfo.theme" class="theme-radios">
                  <el-radio-button label="light">简约亮色</el-radio-button>
                  <el-radio-button label="dark">极客暗色</el-radio-button>
                  <el-radio-button label="auto">跟随系统</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <div class="upload-grid">
                <el-form-item label="网站 Favicon">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'favicon')"
                  >
                    <div v-if="settings.webInfo.favicon" class="upload-preview">
                      <img :src="settings.webInfo.favicon" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.favicon)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.favicon = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">建议 32x32px 且不可超过100k，ICO/PNG</div>
                </el-form-item>
                <el-form-item label="网站 Logo">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'logo')"
                  >
                    <div v-if="settings.webInfo.logo" class="upload-preview">
                      <img :src="settings.webInfo.logo" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.logo)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.logo = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">建议 108x108px 且不超过200K，PNG/JPG</div>
                </el-form-item>
                <el-form-item label="首页背景图">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'indexImg')"
                  >
                    <div v-if="settings.webInfo.indexImg" class="upload-preview">
                      <img :src="settings.webInfo.indexImg" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.indexImg)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.indexImg = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">建议 1920x1080px 且不超过2M，PNG/JPG</div>
                </el-form-item>

                <el-form-item label="通用 404 图">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'notFoundImg')"
                  >
                    <div v-if="settings.webInfo.notFoundImg" class="upload-preview">
                      <img :src="settings.webInfo.notFoundImg" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.notFoundImg)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.notFoundImg = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">建议 650x340px 且不超过100K，PNG/JPG/GIF</div>
                </el-form-item>

                <el-form-item label="Loading 图">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'loadingImg')"
                  >
                    <div v-if="settings.webInfo.loadingImg" class="upload-preview">
                      <img :src="settings.webInfo.loadingImg" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.loadingImg)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.loadingImg = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">建议 400x400px 且不超过100K，GIF</div>
                </el-form-item>

                <el-form-item label="微信收款码">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'wxRewardImg')"
                  >
                    <div v-if="settings.webInfo.wxRewardImg" class="upload-preview">
                      <img :src="settings.webInfo.wxRewardImg" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.wxRewardImg)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.wxRewardImg = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">用于打赏功能，建议 1200x1800px，PNG/JPG/JFIF</div>
                </el-form-item>

                <el-form-item label="支付宝收款码">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    list-type="picture-card"
                    :limit="1"
                    class="uploader-box"
                    :show-file-list="false"
                    :on-change="(file: UploadFile) => handleImageChange(file, 'aliRewardImg')"
                  >
                    <div v-if="settings.webInfo.aliRewardImg" class="upload-preview">
                      <img :src="settings.webInfo.aliRewardImg" class="uploaded-image" />
                      <div class="upload-actions" @click.stop>
                        <span class="action-item" @click="handlePreview(settings.webInfo.aliRewardImg)">
                          <el-icon><ZoomIn /></el-icon>
                        </span>
                        <span class="action-item delete" @click="settings.webInfo.aliRewardImg = ''">
                          <el-icon><Delete /></el-icon>
                        </span>
                      </div>
                    </div>
                    <el-icon v-else><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">用于打赏功能，建议 1200x1800px，PNG/JPG/JFIF</div>
                </el-form-item>
              </div>

              <el-image-viewer
                v-if="previewVisible"
                :url-list="[previewUrl]"
                @close="previewVisible = false"
              />
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane name="seo">
          <template #label>
            <div class="tab-label">
              <el-icon><Search /></el-icon>
              <span>SEO 设置</span>
            </div>
          </template>
          <el-card shadow="never" class="settings-card">
            <el-form :model="settings" label-position="top" class="settings-form">
              <el-form-item label="首页标题 (SEO Title)" prop="webInfo.title">
                <el-input v-model="settings.webInfo.title" placeholder="搜索结果中显示的标题" />
              </el-form-item>
              <el-form-item label="关键词 (Keywords)">
                <el-input v-model="settings.webInfo.keywords" placeholder="多个关键词请用英文逗号分隔" />
              </el-form-item>
              <el-form-item label="高级选项">
                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">自动生成 Sitemap</div>
                    <div class="option-desc">启用后将每天自动更新站点地图以利于收录</div>
                  </div>
                  <el-switch v-model="settings.webInfo.generateSitemap" />
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane name="social">
          <template #label>
            <div class="tab-label">
              <el-icon><Share /></el-icon>
              <span>社交媒体</span>
            </div>
          </template>
          <el-card shadow="never" class="settings-card">
            <el-form :model="settings.socialInfo" label-position="top" class="settings-form">
              <el-form-item label="GitHub 地址">
                <el-input v-model="settings.socialInfo.github" placeholder="https://github.com/yourname" />
              </el-form-item>
              <el-form-item label="联系邮箱">
                <el-input v-model="settings.socialInfo.email" placeholder="yourname@example.com" />
              </el-form-item>
              <el-form-item label="微信 (ID/二维码链接)">
                <el-input v-model="settings.socialInfo.wechat" placeholder="微信 ID 或二维码图片链接" />
              </el-form-item>
              <el-form-item label="QQ 号码">
                <el-input v-model="settings.socialInfo.qq" placeholder="您的 QQ 号码" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane name="code">
          <template #label>
            <div class="tab-label">
              <el-icon><Connection /></el-icon>
              <span>代码注入</span>
            </div>
          </template>
          <el-card shadow="never" class="settings-card">
            <div class="code-editor-container">
              <div class="code-section">
                <div class="section-header">
                  <span class="title">自定义 CSS</span>
                  <span class="desc">将注入到页面 &lt;head&gt; 标签中</span>
                </div>
                <el-input
                  v-model="settings.customCode.css"
                  type="textarea"
                  :rows="10"
                  placeholder="/* 输入您的自定义 CSS 代码 */"
                  class="code-input"
                  @input="highlightCode"
                />
                <div class="code-preview" v-if="settings.customCode.css">
                  <pre><code class="language-css">{{ settings.customCode.css }}</code></pre>
                </div>
              </div>
              <div class="code-section">
                <div class="section-header">
                  <span class="title">自定义 JavaScript</span>
                  <span class="desc">将注入到页面 &lt;body&gt; 底部</span>
                </div>
                <el-input
                  v-model="settings.customCode.js"
                  type="textarea"
                  :rows="10"
                  placeholder="// 输入您的自定义 JS 代码"
                  class="code-input"
                  @input="highlightCode"
                />
                <div class="code-preview" v-if="settings.customCode.js">
                  <pre><code class="language-js">{{ settings.customCode.js }}</code></pre>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane name="links">
          <template #label>
            <div class="tab-label">
              <el-icon><Link /></el-icon>
              <span>友情链接</span>
            </div>
          </template>
          <el-card shadow="never" class="settings-card">
            <div class="links-manager">
              <div class="manager-header">
                <el-button type="primary" plain icon="Plus" @click="addCategory">新增链接分类</el-button>
                <span class="tip">拖拽分类或链接可进行排序</span>
              </div>
              
              <draggable 
                v-model="settings.links" 
                item-key="category"
                handle=".category-handle"
                class="category-list"
              >
                <template #item="{ element: group, index: gIdx }">
                  <div class="category-item">
                    <div class="category-header">
                      <el-icon class="category-handle"><Rank /></el-icon>
                      <el-input v-model="group.category" placeholder="分类名称" class="category-name-input" />
                      <div class="header-actions">
                        <el-button type="primary" link icon="Plus" @click="addLink(group)">添加链接</el-button>
                        <el-button type="danger" link icon="Delete" @click="removeCategory(gIdx)">删除分类</el-button>
                      </div>
                    </div>
                    
                    <draggable 
                      v-model="group.items" 
                      item-key="url"
                      handle=".link-handle"
                      class="link-list"
                    >
                      <template #item="{ element: link, index: lIdx }">
                        <div class="link-row">
                          <el-icon class="link-handle"><Rank /></el-icon>
                          <el-input v-model="link.name" placeholder="名称" style="width: 150px" />
                          <el-input v-model="link.url" placeholder="链接 (URL)" style="flex: 1" />
                          <el-input v-model="link.desc" placeholder="描述" style="flex: 1" />
                          <el-button type="danger" link icon="Delete" @click="removeLink(group, lIdx)"></el-button>
                        </div>
                      </template>
                    </draggable>
                    <div v-if="group.items.length === 0" class="empty-links">暂无链接，点击“添加链接”开始</div>
                  </div>
                </template>
              </draggable>
              <div v-if="settings.links.length === 0" class="empty-state">
                <el-empty description="暂无友情链接配置" />
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { Plus, Setting, Brush, Search, Check, Share, Connection, Link, Delete, Rank, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps, UploadFile } from 'element-plus'
import { tenantApi } from '@/api/tenant'
import { mediaApi } from '@/api/media'
import type { Tenant, LinkItem } from '@/api/types'
import draggable from 'vuedraggable'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'

const activeTab = ref('basic')
const loading = ref(false)
const saving = ref(false)
const basicFormRef = ref<FormInstance>()

// 图片预览
const previewVisible = ref(false)
const previewUrl = ref('')
const handlePreview = (url: string) => {
  previewUrl.value = url
  previewVisible.value = true
}

// 图片上传处理
const handleImageChange = async (file: UploadFile, type: 'favicon' | 'logo' | 'indexImg' | 'notFoundImg' | 'loadingImg' | 'wxRewardImg' | 'aliRewardImg') => {
  if (!file.raw) return

  // 校验格式
  const isImage = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/gif', 'image/jfif'].includes(file.raw.type)
  const isJfif = file.raw.name.toLowerCase().endsWith('.jfif')
  
  if (!isImage && !isJfif) {
    ElMessage.error('上传图片只能是 JPG/PNG/SVG/ICO/GIF/JFIF 格式!')
    return
  }

  // 校验大小
  let isLtLimit = true
  if (type === 'favicon') {
    isLtLimit = file.raw.size / 1024 < 100
    if (!isLtLimit) ElMessage.error('Favicon 大小不能超过 100KB!')
  } else if (type === 'logo') {
    isLtLimit = file.raw.size / 1024 < 200
    if (!isLtLimit) ElMessage.error('Logo 大小不能超过 200KB!')
  } else if (type === 'indexImg') {
    isLtLimit = file.raw.size / 1024 / 1024 < 2
    if (!isLtLimit) ElMessage.error('首页背景图大小不能超过 2MB!')
  } else if (type === 'notFoundImg') {
    isLtLimit = file.raw.size / 1024 < 100
    if (!isLtLimit) ElMessage.error('通用 404 图大小不能超过 100KB!')
  } else if (type === 'loadingImg') {
    isLtLimit = file.raw.size / 1024 < 100
    if (!isLtLimit) ElMessage.error('Loading 图大小不能超过 100KB!')
  } else if (type === 'wxRewardImg' || type === 'aliRewardImg') {
    isLtLimit = file.raw.size / 1024 < 200
    if (!isLtLimit) ElMessage.error('收款码图片大小不能超过 200KB!')
  }
    
  if (!isLtLimit) return

  try {
    const res = await mediaApi.uploadMedia(file.raw)
    if (type === 'favicon') {
      settings.webInfo.favicon = res.url
    } else if (type === 'logo') {
      settings.webInfo.logo = res.url
    } else if (type === 'indexImg') {
      settings.webInfo.indexImg = res.url
    } else if (type === 'notFoundImg') {
      settings.webInfo.notFoundImg = res.url
    } else if (type === 'loadingImg') {
      settings.webInfo.loadingImg = res.url
    } else if (type === 'wxRewardImg') {
      settings.webInfo.wxRewardImg = res.url
    } else if (type === 'aliRewardImg') {
      settings.webInfo.aliRewardImg = res.url
    }
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

const settings = reactive({
  id: undefined as number | undefined,
  name: '',
  webInfo: {
    title: '',
    description: '',
    keywords: '',
    authorName: '',
    announcement: '',
    aboutMe: '',
    logo: '',
    favicon: '',
    indexImg: '',
    notFoundImg: '',
    loadingImg: '',
    wxRewardImg: '',
    aliRewardImg: '',
    copyright: '',
    icp: '',
    theme: 'light',
    generateSitemap: true
  },
  socialInfo: {
    github: '',
    email: '',
    wechat: '',
    qq: ''
  },
  customCode: {
    css: '',
    js: ''
  },
  links: [] as { category: string, items: LinkItem[] }[]
})

onMounted(async () => {
  loading.value = true
  try {
    const config = await tenantApi.getCurrentConfig()
    if (config) {
      settings.id = config.id
      settings.name = config.name || ''
      
      if (config.webInfo) {
        settings.webInfo = {
          ...settings.webInfo,
          ...config.webInfo
        }
      }
      
      if (config.socialInfo) {
        settings.socialInfo = {
          ...settings.socialInfo,
          ...config.socialInfo
        }
      }
      
      if (config.customCode) {
        settings.customCode = {
          ...settings.customCode,
          ...config.customCode
        }
      }
      
      if (config.links) {
        settings.links = Object.entries(config.links).map(([category, items]) => ({
          category,
          items: [...items]
        }))
      }
      
      nextTick(() => {
        highlightCode()
      })
    }
  } catch (error) {
    ElMessage.error('获取设置失败')
  } finally {
    loading.value = false
  }
})

const highlightCode = () => {
  Prism.highlightAll()
}

// 链接管理逻辑
const addCategory = () => {
  settings.links.push({ category: '新分类', items: [] })
}

const removeCategory = (index: number) => {
  ElMessageBox.confirm('确定要删除该分类及其所有链接吗？', '提示', {
    type: 'warning'
  }).then(() => {
    settings.links.splice(index, 1)
  })
}

const addLink = (group: { category: string, items: LinkItem[] }) => {
  group.items.push({
    name: '新链接',
    url: 'https://',
    desc: ''
  })
}

const removeLink = (group: { category: string, items: LinkItem[] }, linkIndex: number) => {
  group.items.splice(linkIndex, 1)
}

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入站点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  'webInfo.description': [
    { required: true, message: '请输入站点描述', trigger: 'blur' }
  ],
  'webInfo.title': [
    { required: true, message: '请输入 SEO 标题', trigger: 'blur' }
  ]
})

const handleSave = async () => {
  if (activeTab.value === 'basic' && basicFormRef.value) {
    await basicFormRef.value.validate((valid) => {
      if (valid) {
        saveSettings()
      }
    })
  } else {
    saveSettings()
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    // 转换为后端需要的 Record<string, LinkItem[]> 格式
    const linksMap: Record<string, LinkItem[]> = {}
    settings.links.forEach(group => {
      if (group.category) {
        linksMap[group.category] = group.items
      }
    })

    const data: Partial<Tenant> = {
      id: settings.id,
      name: settings.name,
      webInfo: settings.webInfo,
      socialInfo: settings.socialInfo,
      customCode: settings.customCode,
      links: linksMap
    }
    await tenantApi.updateCurrentConfig(data)
    ElMessage.success('设置保存成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-tabs {
  background: #fff;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 0 16px;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
  padding: 0 24px;
  height: 48px;
}

:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-card {
  flex: 1;
  border: none;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.settings-card :deep(.el-card__body) {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.settings-form {
  max-width: 800px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
  padding-bottom: 8px;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 8px;
}

.uploader-box :deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.upload-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.upload-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-preview:hover .upload-actions {
  opacity: 1;
}

.action-item {
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.action-item:hover {
  color: var(--el-color-primary);
}

.action-item.delete:hover {
  color: var(--el-color-danger);
}

.upload-tip, .input-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

/* 代码编辑器样式 */
.code-editor-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.code-section .section-header {
  margin-bottom: 12px;
}

.code-section .title {
  display: block;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.code-section .desc {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.code-input :deep(.el-textarea__inner) {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  background-color: #f8fafc;
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid #e2e8f0;
}

.code-preview {
  margin-top: 12px;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  max-height: 300px;
  overflow: auto;
}

.code-preview pre {
  margin: 0;
  padding: 16px;
}

.code-preview code {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 13px;
}

/* 链接管理样式 */
.links-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.manager-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.manager-header .tip {
  font-size: 12px;
  color: #94a3b8;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.category-handle {
  cursor: move;
  color: #94a3b8;
}

.category-name-input {
  width: 200px;
}

.category-name-input :deep(.el-input__inner) {
  font-weight: 600;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.link-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.link-row:hover {
  background-color: #f1f5f9;
}

.link-handle {
  cursor: move;
  color: #cbd5e1;
}

.empty-links {
  padding: 32px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  background-color: #fcfdfe;
}

.empty-state {
  padding: 64px 0;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  width: 100%;
}

.option-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.option-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.theme-radios {
  display: flex;
  gap: 12px;
}

:deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
}

:deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-color: var(--el-color-primary) !important;
}
</style>
