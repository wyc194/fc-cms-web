<template>
  <div class="page-container">
    <div class="page-action-header">
        <div class="header-info">
          <h2 class="page-title">分类与标签</h2>
          <p class="page-subtitle">组织和归类您的文章，让内容结构更清晰</p>
        </div>
        <div class="page-actions">
          <el-button type="primary" icon="Plus" @click="handleAdd">新增{{ activeTab === 'categories' ? '分类' : '标签' }}</el-button>
        </div>
      </div>

    <div class="page-main-scroll">
      <el-card shadow="never" class="table-card flex-auto" v-loading="loading">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="文章分类" name="categories">
            <el-table 
              :data="categories" 
              style="width: 100%" 
              height="100%"
              class="custom-table" 
              v-loading="loading"
              row-key="id"
              :tree-props="{ children: 'children' }"
            >
              <template #empty>
                <el-empty description="暂无分类" :image-size="80" />
              </template>
              <el-table-column prop="name" label="分类名称" min-width="150">
                <template #default="{ row }">
                  <div class="category-name-cell">
                    <el-icon class="category-icon"><FolderOpened /></el-icon>
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="articleCount" label="文章数" width="120" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.articleCount > 0 ? 'primary' : 'info'" round>
                    {{ row.articleCount || 0 }} 篇文章
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="240" align="right" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" :icon="Plus" @click="handleAddSub(row)">添加子分类</el-button>
                  <el-divider direction="vertical" />
                  <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                  <el-divider direction="vertical" />
                  <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          
          <el-tab-pane label="标签管理" name="tags">
            <div class="tag-cloud-container">
              <div class="tag-cloud-header">
                <el-icon class="mr-8"><CollectionTag /></el-icon>
                <span class="tag-count">共 {{ tags.length }} 个标签</span>
              </div>
              <div class="tag-list">
                <transition-group name="list">
                  <el-tag
                    v-for="tag in tags"
                    :key="tag.id"
                    class="tag-item"
                    closable
                    :type="getRandomTagType()"
                    effect="light"
                    @close="handleTagDelete(tag)"
                  >
                    {{ tag.name }} ({{ tag.articleCount || 0 }})
                  </el-tag>
                </transition-group>
                
                <div class="new-tag-wrapper">
                  <el-input
                    v-if="inputVisible"
                    ref="InputRef"
                    v-model="inputValue"
                    class="new-tag-input"
                    size="default"
                    placeholder="输入标签名..."
                    @keyup.enter="handleInputConfirm"
                    @blur="handleInputConfirm"
                  />
                  <el-button v-else class="button-new-tag" size="default" icon="Plus" @click="showInput">
                    添加新标签
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
    <!-- 新增/编辑分类弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="(isEdit ? '编辑' : '新增') + (activeTab === 'categories' ? '分类' : '标签')" 
      width="440px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <el-form 
        ref="formRef"
        :model="categoryForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="上级分类" prop="parentId" v-if="activeTab === 'categories'">
          <el-cascader
            v-model="categoryForm.parentId"
            :options="parentCategoryOptions"
            :props="{ 
              value: 'id', 
              label: 'name', 
              children: 'children',
              emitPath: false,
              checkStrictly: true
            }"
            placeholder="请选择上级分类（不选默认为顶级）"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="categoryForm.description" type="textarea" placeholder="请输入分类描述" />
        </el-form-item>
        <el-form-item label="排序权重" prop="weight">
          <el-input-number v-model="categoryForm.weight" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="confirmAdd">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, FolderOpened, CollectionTag } from '@element-plus/icons-vue'
import { categoryApi, tagApi } from '@/api/category'
import type { Category, Tag } from '@/api/types'

const activeTab = ref('categories')
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

// 计算上级分类选项，排除当前分类及其子分类
const parentCategoryOptions = computed(() => {
  const filterSelf = (list: Category[]): Category[] => {
    return list
      .filter(item => item.id !== categoryForm.id)
      .map(item => ({
        ...item,
        children: item.children ? filterSelf(item.children) : []
      }))
  }
  return [{ id: 0, name: '无（顶级分类）' }, ...filterSelf(categories.value)]
})

const categoryForm = reactive<Partial<Category>>({
  id: undefined,
  parentId: 0,
  name: '',
  description: '',
  weight: 0
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await categoryApi.getCategoryTree()
  } catch (error) {
    ElMessage.error('获取分类失败')
  } finally {
    loading.value = false
  }
}

const fetchTags = async () => {
  loading.value = true
  try {
    tags.value = await tagApi.getTags()
  } catch (error) {
    ElMessage.error('获取标签失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
  fetchTags()
})

const inputVisible = ref(false)
const inputValue = ref('')
const InputRef = ref()

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    InputRef.value?.focus()
  })
}

const handleInputConfirm = async () => {
  if (inputValue.value) {
    if (tags.value.some(t => t.name === inputValue.value)) {
      ElMessage.warning('标签已存在')
    } else {
      try {
        await tagApi.saveTag({ name: inputValue.value })
        await fetchTags()
        ElMessage.success('标签添加成功')
      } catch (error) {
        ElMessage.error('添加标签失败')
      }
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

const handleTagDelete = (tag: Tag) => {
  ElMessageBox.confirm(`确定要删除标签 "${tag.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await tagApi.deleteTag(tag.id)
      await fetchTags()
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除标签失败')
    }
  })
}

const getRandomTagType = () => {
  const types = ['', 'success', 'info', 'warning', 'danger']
  return types[Math.floor(Math.random() * types.length)] as any
}

const handleEdit = (row: Category) => {
  isEdit.value = true
  Object.assign(categoryForm, {
    id: row.id,
    parentId: row.parentId || 0,
    name: row.name,
    description: row.description,
    weight: row.weight
  })
  dialogVisible.value = true
}

const handleDelete = (row: Category) => {
  ElMessageBox.confirm(`确定要删除分类 "${row.name}" 吗？该操作不可恢复。`, '危险操作', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    buttonSize: 'default'
  }).then(async () => {
    loading.value = true
    try {
      await categoryApi.deleteCategory(row.id)
      await fetchCategories()
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败')
    } finally {
      loading.value = false
    }
  })
}

const confirmAdd = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await categoryApi.saveCategory(categoryForm)
        ElMessage.success(isEdit.value ? '分类更新成功' : '分类添加成功')
        await fetchCategories()
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleAdd = () => {
  if (activeTab.value === 'categories') {
    isEdit.value = false
    Object.assign(categoryForm, {
      id: undefined,
      parentId: 0,
      name: '',
      description: '',
      weight: 0
    })
    dialogVisible.value = true
  } else {
    showInput()
  }
}

const handleAddSub = (row: Category) => {
  isEdit.value = false
  Object.assign(categoryForm, {
    id: undefined,
    parentId: row.id,
    name: '',
    description: '',
    weight: 0
  })
  dialogVisible.value = true
}
</script>

<style scoped>
.table-card {
  min-height: 400px;
}

.custom-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #f1f5f9;
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 600;
  height: 48px;
  line-height: 48px;
  color: #64748b;
  transition: all 0.3s;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
}

/* 树形表格展开图标与内容布局优化 */
.custom-table :deep(.el-table__expand-icon) {
  margin-right: 3px; /* 保持按钮与内容的间隔 */
  color: #94a3b8;
  font-size: 16px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: 3px; /* 微调对齐 */
}

.custom-table :deep(.el-icon) {
  font-size: 16px;
}

.custom-table :deep(.el-table__expand-icon--expanded) {
  transform: rotate(90deg);
  color: var(--el-color-primary);
}

/* 占位符宽度，确保无子分类时内容对齐 */
.custom-table :deep(.el-table__placeholder) {
  width: 24px; 
}

/* 子分类行背景色 */
.custom-table :deep(.el-table__row--level-1) {
  background-color: #f8fafc;
}

.category-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  vertical-align: middle;
}

.category-icon {
  color: var(--el-color-primary);
  font-size: 16px;
  opacity: 0.8;
}

.tag-cloud-container {
  padding: 12px;
}

.tag-cloud-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 14px;
}

.mr-8 {
  margin-right: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.tag-item {
  padding: 10px 16px;
  height: auto;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.tag-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: currentColor;
}

.new-tag-wrapper {
  display: inline-block;
}

.new-tag-input {
  width: 160px;
}

.new-tag-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

.button-new-tag {
  border-style: dashed;
  border-radius: 10px;
  height: 42px;
  padding: 0 20px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s;
}

.button-new-tag:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.custom-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.custom-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.custom-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

:deep(.custom-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.custom-dialog .el-form-item__label) {
  font-weight: 600;
  color: #475569;
}

/* 列表过渡动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
