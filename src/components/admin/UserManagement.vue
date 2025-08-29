<template>
  <div class="space-y-6">
    <!-- Header with Add User Button -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium text-gray-900">User Management</h3>
        <p class="mt-1 text-sm text-gray-500">
          Manage system users and their roles
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-green-500"
      >
        <UserPlusIcon class="h-4 w-4 mr-2" />
        Add User
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by name or email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            v-model="filters.role"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="fetchUsers"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-4"></div>
        <p class="text-gray-500">Loading users...</p>
      </div>

      <div v-else-if="error" class="p-8">
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>
      </div>

      <div v-else-if="users.length === 0" class="p-8 text-center text-gray-500">
        No users found
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user._id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-garden-green-100 flex items-center justify-center">
                      <UserIcon class="h-5 w-5 text-garden-green-600" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'No name' }}
                    </div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                ]">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                  user.isActive 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                ]">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  @click="editUser(user)"
                  class="text-garden-green-600 hover:text-garden-green-900"
                >
                  Edit
                </button>
                <button
                  @click="confirmDeleteUser(user)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              @click="nextPage"
              :disabled="pagination.page >= pagination.pages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="pagination.page <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  @click="nextPage"
                  :disabled="pagination.page >= pagination.pages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showCreateModal || editingUser" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ editingUser ? 'Edit User' : 'Create User' }}
          </h3>
          
          <form @submit.prevent="submitUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                v-model="userForm.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              />
            </div>
            
            <div v-if="!editingUser">
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                v-model="userForm.password"
                type="password"
                required
                minlength="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                v-model="userForm.firstName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                v-model="userForm.lastName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                v-model="userForm.role"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div v-if="editingUser">
              <label class="flex items-center">
                <input
                  v-model="userForm.isActive"
                  type="checkbox"
                  class="mr-2 text-garden-green-600 focus:ring-garden-green-500"
                />
                <span class="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>

            <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {{ modalError }}
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="cancelModal"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 disabled:opacity-50"
              >
                {{ submitting ? 'Saving...' : (editingUser ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="userToDelete" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
          <p class="text-sm text-gray-500 mb-6">
            Are you sure you want to delete {{ userToDelete.email }}? This action cannot be undone.
          </p>
          
          <div class="flex justify-center space-x-3">
            <button
              @click="userToDelete = null"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="deleteUser"
              :disabled="deleting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { UserIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

interface User {
  _id: string
  email: string
  role: 'admin' | 'user'
  firstName?: string
  lastName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const editingUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)
const submitting = ref(false)
const deleting = ref(false)
const modalError = ref('')

const filters = reactive({
  search: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

const userForm = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'user' as 'admin' | 'user',
  isActive: true
})

const resetForm = () => {
  userForm.email = ''
  userForm.password = ''
  userForm.firstName = ''
  userForm.lastName = ''
  userForm.role = 'user'
  userForm.isActive = true
  modalError.value = ''
}

const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString()
    })
    
    if (filters.search) params.append('search', filters.search)
    if (filters.role) params.append('role', filters.role)

    const response = await fetch(`/.netlify/functions/admin-users?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch users')
    }
    
    users.value = data.data.users
    Object.assign(pagination, data.data.pagination)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch users'
  } finally {
    loading.value = false
  }
}

const submitUser = async () => {
  submitting.value = true
  modalError.value = ''
  
  try {
    const url = editingUser.value 
      ? `/.netlify/functions/admin-users?id=${editingUser.value._id}`
      : '/.netlify/functions/admin-users'
    
    const method = editingUser.value ? 'PUT' : 'POST'
    
    const body = { ...userForm }
    if (editingUser.value) {
      delete body.password // Don't send password for updates
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save user')
    }
    
    await fetchUsers()
    cancelModal()
  } catch (err) {
    modalError.value = err instanceof Error ? err.message : 'Failed to save user'
  } finally {
    submitting.value = false
  }
}

const editUser = (user: User) => {
  editingUser.value = user
  userForm.email = user.email
  userForm.firstName = user.firstName || ''
  userForm.lastName = user.lastName || ''
  userForm.role = user.role
  userForm.isActive = user.isActive
}

const confirmDeleteUser = (user: User) => {
  userToDelete.value = user
}

const deleteUser = async () => {
  if (!userToDelete.value) return
  
  deleting.value = true
  
  try {
    const response = await fetch(`/.netlify/functions/admin-users?id=${userToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete user')
    }
    
    await fetchUsers()
    userToDelete.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete user'
  } finally {
    deleting.value = false
  }
}

const cancelModal = () => {
  showCreateModal.value = false
  editingUser.value = null
  resetForm()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const nextPage = () => {
  if (pagination.page < pagination.pages) {
    pagination.page++
    fetchUsers()
  }
}

const previousPage = () => {
  if (pagination.page > 1) {
    pagination.page--
    fetchUsers()
  }
}

onMounted(fetchUsers)
</script>