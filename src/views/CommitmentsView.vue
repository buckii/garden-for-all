<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg">
          <div class="bg-white">
            <!-- Admin Navigation -->
            <div class="border-b border-gray-200">
              <!-- Desktop Grouped Navigation -->
              <div class="hidden sm:flex items-center justify-between px-6 py-4">
                <div class="flex space-x-8">
                  <!-- Configuration Group -->
                  <div class="relative" @mouseenter="showConfigDropdown = true" @mouseleave="showConfigDropdown = false">
                    <button class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Configuration
                      <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <div v-if="showConfigDropdown" class="absolute z-10 top-full w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div class="py-1">
                        <router-link to="/admin/categories" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Categories
                        </router-link>
                        <router-link to="/admin/produce-types" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Produce Types
                        </router-link>
                        <router-link to="/admin/harvest-locations" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Harvest Locations
                        </router-link>
                      </div>
                    </div>
                  </div>

                  <!-- Data Management Group -->
                  <div class="relative" @mouseenter="showDataDropdown = true" @mouseleave="showDataDropdown = false">
                    <button class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors bg-garden-green-100 text-garden-green-700">
                      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      Data Management
                      <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <div v-if="showDataDropdown" class="absolute z-10 top-full w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div class="py-1">
                        <router-link to="/admin/food-pantries" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Food Pantries
                        </router-link>
                        <router-link to="/admin/commitments" class="block w-full text-left px-4 py-2 text-sm bg-garden-green-50 text-garden-green-700">
                          Commitments
                        </router-link>
                        <router-link to="/admin/harvest-entries" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Harvest Entries
                        </router-link>
                        <router-link to="/admin/orders" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Orders
                        </router-link>
                      </div>
                    </div>
                  </div>

                  <!-- User Management -->
                  <router-link to="/admin?tab=users" class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                    Users
                  </router-link>

                  <!-- Export -->
                  <router-link to="/admin?tab=export" class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export Data
                  </router-link>
                </div>
              </div>
              
              <!-- Mobile Navigation -->
              <div class="sm:hidden px-4 py-2">
                <select
                  v-model="mobileNavSelection"
                  @change="handleMobileNavChange"
                  class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-garden-green-500 focus:outline-none focus:ring-garden-green-500"
                >
                  <optgroup label="Configuration">
                    <option value="/admin?tab=categories">Categories</option>
                    <option value="/admin?tab=types">Produce Types</option>
                    <option value="/admin?tab=locations">Harvest Locations</option>
                  </optgroup>
                  <optgroup label="Data Management">
                    <option value="/admin?tab=pantries">Food Pantries</option>
                    <option value="/commitments" selected>Commitments</option>
                    <option value="/admin?tab=entries">Harvest Entries</option>
                    <option value="/admin?tab=orders">Orders</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="/admin?tab=users">Users</option>
                    <option value="/admin?tab=export">Export Data</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <!-- Page Title -->
            <div class="px-6 py-4 border-b border-gray-200">
              <h1 class="text-2xl font-bold text-gray-900">Commitments</h1>
              <p class="text-gray-600 text-sm mt-1">Manage weekly produce commitments for food pantries</p>
            </div>

            <!-- Content Area -->
            <div class="p-6">
              <!-- Error State -->
              <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {{ error }}
              </div>

              <!-- Success Message -->
              <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                {{ successMessage }}
              </div>

              <!-- Content -->
              <div class="space-y-6">
                <!-- Filters and Actions -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div class="flex flex-col sm:flex-row gap-4">
                      <!-- Pantry Filter -->
                      <select v-model="selectedPantryId" @change="fetchCommitments"
                        class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                        <option value="">All Pantries</option>
                        <option v-for="pantry in pantries" :key="pantry._id" :value="pantry._id">
                          {{ pantry.name }}
                        </option>
                      </select>

                      <!-- Date Range Filter -->
                      <input v-model="filterStartDate" type="date" placeholder="Start date"
                        class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                      <input v-model="filterEndDate" type="date" placeholder="End date"
                        class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                      <button @click="fetchCommitments" 
                        class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700">
                        Filter
                      </button>
                    </div>

                    <button @click="showCreateForm = !showCreateForm" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      {{ showCreateForm ? 'Cancel' : 'New Commitment' }}
                    </button>
                  </div>
                </div>

                <!-- Create Commitment Form -->
                <div v-if="showCreateForm" class="bg-white border rounded-lg p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Commitment</h3>
                  
                  <form @submit.prevent="createCommitment" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Pantry Selection -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Food Pantry</label>
                        <select v-model="commitmentForm.pantryId" required
                          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                          <option value="">Select a pantry</option>
                          <option v-for="pantry in pantries" :key="pantry._id" :value="pantry._id">
                            {{ pantry.name }}
                          </option>
                        </select>
                      </div>

                      <!-- Weekly Weight -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Weekly Weight (lbs)</label>
                        <input v-model.number="commitmentForm.weeklyWeightLbs" type="number" step="0.01" min="0" required
                          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Start Date -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Start Date (Monday)</label>
                        <input v-model="commitmentForm.startDate" type="date" required
                          @blur="validateMonday('startDate')"
                          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                        <p v-if="startDateError" class="text-red-600 text-sm mt-1">{{ startDateError }}</p>
                      </div>

                      <!-- End Date -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">End Date (Monday)</label>
                        <input v-model="commitmentForm.endDate" type="date" required
                          @blur="validateMonday('endDate')"
                          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                        <p v-if="endDateError" class="text-red-600 text-sm mt-1">{{ endDateError }}</p>
                      </div>
                    </div>

                    <!-- Commitment Type -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Commitment Type</label>
                      <div class="space-y-2">
                        <label class="flex items-center">
                          <input v-model="commitmentForm.commitmentType" type="radio" value="total"
                            class="text-garden-green-600 focus:ring-garden-green-500">
                          <span class="ml-2">Total Weight (any produce)</span>
                        </label>
                        <label class="flex items-center">
                          <input v-model="commitmentForm.commitmentType" type="radio" value="category"
                            class="text-garden-green-600 focus:ring-garden-green-500">
                          <span class="ml-2">Specific Category</span>
                        </label>
                        <label class="flex items-center">
                          <input v-model="commitmentForm.commitmentType" type="radio" value="produce_type"
                            class="text-garden-green-600 focus:ring-garden-green-500">
                          <span class="ml-2">Specific Product</span>
                        </label>
                      </div>
                    </div>

                    <!-- Category Selection -->
                    <div v-if="commitmentForm.commitmentType === 'category'">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
                      <select v-model="commitmentForm.categoryId" required
                        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                        <option value="">Select a category</option>
                        <option v-for="category in categories" :key="category._id" :value="category._id">
                          {{ category.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Product Selection -->
                    <div v-if="commitmentForm.commitmentType === 'produce_type'">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                      <select v-model="commitmentForm.produceTypeId" required
                        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                        <option value="">Select a product</option>
                        <option v-for="product in produceTypes" :key="product._id" :value="product._id">
                          {{ product.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Notes -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                      <textarea v-model="commitmentForm.notes" rows="3"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500"></textarea>
                    </div>

                    <div class="flex justify-end space-x-4">
                      <button type="button" @click="showCreateForm = false"
                        class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancel
                      </button>
                      <button type="submit" :disabled="!isFormValid || formSubmitting"
                        class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50">
                        {{ formSubmitting ? 'Creating...' : 'Create Commitment' }}
                      </button>
                    </div>
                  </form>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="flex justify-center py-6">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
                </div>

                <!-- Commitments List -->
                <div v-else-if="commitments.length > 0" class="bg-white border rounded-lg overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">
                      Weekly Commitments ({{ commitments.length }})
                    </h3>
                  </div>
                  
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pantry</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product/Category</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weight (lbs)</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="commitment in commitments" :key="commitment._id" class="hover:bg-gray-50">
                          <td class="px-4 py-2 text-sm">{{ formatDate(commitment.weekStartDate) }}</td>
                          <td class="px-4 py-2 text-sm">{{ commitment.pantryId?.name || 'Unknown' }}</td>
                          <td class="px-4 py-2 text-sm">
                            <span class="capitalize">{{ commitment.commitmentType.replace('_', ' ') }}</span>
                          </td>
                          <td class="px-4 py-2 text-sm">
                            <span v-if="commitment.commitmentType === 'total'" class="text-gray-500">Any produce</span>
                            <span v-else-if="commitment.commitmentType === 'category'">
                              {{ commitment.categoryId?.name || 'Unknown Category' }}
                            </span>
                            <span v-else-if="commitment.commitmentType === 'produce_type'">
                              {{ commitment.produceTypeId?.name || 'Unknown Product' }}
                            </span>
                          </td>
                          <td class="px-4 py-2 text-sm font-medium">{{ commitment.weeklyWeightLbs }}</td>
                          <td class="px-4 py-2 text-sm">
                            <button @click="editCommitment(commitment)"
                              class="text-blue-600 hover:text-blue-900 mr-3">
                              Edit
                            </button>
                            <button @click="deleteCommitment(commitment._id)"
                              class="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- No Results -->
                <div v-else-if="!loading" class="bg-white border rounded-lg p-6 text-center">
                  <p class="text-gray-500">
                    {{ selectedPantryId ? 'No commitments found for the selected pantry and date range.' : 'No commitments found for the selected date range.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-4 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-900">Edit Commitment</h3>
          <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="updateCommitment" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Week Start Date</label>
              <input v-model="editForm.weekStartDate" type="date" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Weekly Weight (lbs)</label>
              <input v-model.number="editForm.weeklyWeightLbs" type="number" step="0.01" min="0" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea v-model="editForm.notes" rows="3"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500"></textarea>
          </div>

          <div class="flex justify-end space-x-4">
            <button type="button" @click="showEditModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="formSubmitting"
              class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50">
              {{ formSubmitting ? 'Updating...' : 'Update Commitment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';

interface Pantry {
  _id: string;
  name: string;
  county: string;
}

interface Category {
  _id: string;
  name: string;
}

interface ProduceType {
  _id: string;
  name: string;
  categoryId: string;
}

interface Commitment {
  _id: string;
  pantryId: Pantry;
  weekStartDate: string;
  commitmentType: 'total' | 'category' | 'produce_type';
  categoryId?: Category;
  produceTypeId?: ProduceType;
  weeklyWeightLbs: number;
  notes?: string;
  isActive: boolean;
}

const route = useRoute();
const router = useRouter();

// Navigation
const showConfigDropdown = ref(false);
const showDataDropdown = ref(false);
const mobileNavSelection = ref('/commitments');

// Data
const commitments = ref<Commitment[]>([]);
const pantries = ref<Pantry[]>([]);
const categories = ref<Category[]>([]);
const produceTypes = ref<ProduceType[]>([]);
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const formSubmitting = ref(false);

// Form states
const showCreateForm = ref(false);
const showEditModal = ref(false);

// Filters
const selectedPantryId = ref('');
const filterStartDate = ref('');
const filterEndDate = ref('');

// Forms
const commitmentForm = ref({
  pantryId: '',
  commitmentType: 'total' as 'total' | 'category' | 'produce_type',
  categoryId: '',
  produceTypeId: '',
  startDate: '',
  endDate: '',
  weeklyWeightLbs: 0,
  notes: ''
});

const editForm = ref({
  _id: '',
  weekStartDate: '',
  weeklyWeightLbs: 0,
  notes: ''
});

// Validation
const startDateError = ref('');
const endDateError = ref('');

// Initialize filters from route params and localStorage
onMounted(async () => {
  await fetchInitialData();
  
  // Set filters from route params or localStorage
  if (route.query.pantryId) {
    selectedPantryId.value = route.query.pantryId as string;
  }
  
  if (route.query.startDate && route.query.endDate) {
    filterStartDate.value = route.query.startDate as string;
    filterEndDate.value = route.query.endDate as string;
  } else {
    // Default to current calendar year
    const currentYear = new Date().getFullYear();
    filterStartDate.value = `${currentYear}-01-01`;
    filterEndDate.value = `${currentYear}-12-31`;
    
    // Save to localStorage
    localStorage.setItem('commitmentFilterDates', JSON.stringify({
      startDate: filterStartDate.value,
      endDate: filterEndDate.value
    }));
  }

  // Load saved commitment type
  const savedCommitmentType = localStorage.getItem('commitmentType');
  if (savedCommitmentType) {
    commitmentForm.value.commitmentType = savedCommitmentType as any;
  }

  await fetchCommitments();
});

// Load saved dates from localStorage
const savedDates = localStorage.getItem('commitmentFilterDates');
if (savedDates) {
  const dates = JSON.parse(savedDates);
  if (!route.query.startDate && !route.query.endDate) {
    filterStartDate.value = dates.startDate || filterStartDate.value;
    filterEndDate.value = dates.endDate || filterEndDate.value;
  }
}

// Watch for changes to save dates and commitment type
watch([filterStartDate, filterEndDate], () => {
  localStorage.setItem('commitmentFilterDates', JSON.stringify({
    startDate: filterStartDate.value,
    endDate: filterEndDate.value
  }));
});

watch(() => commitmentForm.value.commitmentType, (newType) => {
  localStorage.setItem('commitmentType', newType);
});

// Computed properties
const isFormValid = computed(() => {
  return commitmentForm.value.pantryId &&
         commitmentForm.value.startDate &&
         commitmentForm.value.endDate &&
         commitmentForm.value.weeklyWeightLbs > 0 &&
         !startDateError.value &&
         !endDateError.value &&
         (commitmentForm.value.commitmentType === 'total' ||
          (commitmentForm.value.commitmentType === 'category' && commitmentForm.value.categoryId) ||
          (commitmentForm.value.commitmentType === 'produce_type' && commitmentForm.value.produceTypeId));
});

// Methods
const fetchInitialData = async () => {
  try {
    const [pantriesRes, categoriesRes, produceTypesRes] = await Promise.all([
      fetch('/api/admin-food-pantries'),
      fetch('/api/admin-categories'),
      fetch('/api/admin-produce-types')
    ]);

    if (pantriesRes.ok) pantries.value = (await pantriesRes.json()).data;
    if (categoriesRes.ok) categories.value = (await categoriesRes.json()).data;
    if (produceTypesRes.ok) produceTypes.value = (await produceTypesRes.json()).data;
  } catch (err) {
    error.value = 'Failed to load initial data';
  }
};

const fetchCommitments = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const params = new URLSearchParams();
    
    // Only add pantryId if a specific pantry is selected
    if (selectedPantryId.value) {
      params.append('pantryId', selectedPantryId.value);
    }
    
    // Always add date filters
    if (filterStartDate.value) {
      params.append('startDate', filterStartDate.value);
    }
    if (filterEndDate.value) {
      params.append('endDate', filterEndDate.value);
    }
    
    const response = await fetch(`/api/commitments?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      commitments.value = data.data || [];
    } else {
      const errorData = await response.json();
      error.value = errorData.error || 'Failed to fetch commitments';
    }
  } catch (err) {
    error.value = 'Network error while fetching commitments';
  } finally {
    loading.value = false;
  }
};

const validateMonday = (field: 'startDate' | 'endDate') => {
  const dateValue = commitmentForm.value[field];
  if (!dateValue) return;

  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();

  if (field === 'startDate') {
    startDateError.value = '';
  } else {
    endDateError.value = '';
  }

  // Auto-adjust to Monday of same week
  if (dayOfWeek !== 1) {
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayDate = new Date(year, month - 1, day - daysToSubtract);
    commitmentForm.value[field] = mondayDate.toISOString().split('T')[0];
  }
};

const createCommitment = async () => {
  if (!isFormValid.value) return;

  formSubmitting.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    const response = await fetch('/api/commitments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(commitmentForm.value)
    });

    if (response.ok) {
      const data = await response.json();
      successMessage.value = data.message || 'Commitment created successfully';
      
      // Reset form
      Object.assign(commitmentForm.value, {
        pantryId: selectedPantryId.value, // Keep pantry selected
        commitmentType: commitmentForm.value.commitmentType, // Keep type
        categoryId: '',
        produceTypeId: '',
        startDate: '',
        endDate: '',
        weeklyWeightLbs: 0,
        notes: ''
      });
      
      showCreateForm.value = false;
      await fetchCommitments();
    } else {
      const errorData = await response.json();
      error.value = errorData.error || 'Failed to create commitment';
    }
  } catch (err) {
    error.value = 'Network error while creating commitment';
  } finally {
    formSubmitting.value = false;
  }
};

const editCommitment = (commitment: Commitment) => {
  editForm.value = {
    _id: commitment._id,
    weekStartDate: commitment.weekStartDate.split('T')[0],
    weeklyWeightLbs: commitment.weeklyWeightLbs,
    notes: commitment.notes || ''
  };
  showEditModal.value = true;
};

const updateCommitment = async () => {
  formSubmitting.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    const response = await fetch(`/api/commitments?id=${editForm.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        weekStartDate: editForm.value.weekStartDate,
        weeklyWeightLbs: editForm.value.weeklyWeightLbs,
        notes: editForm.value.notes
      })
    });

    if (response.ok) {
      successMessage.value = 'Commitment updated successfully';
      showEditModal.value = false;
      await fetchCommitments();
    } else {
      const errorData = await response.json();
      error.value = errorData.error || 'Failed to update commitment';
    }
  } catch (err) {
    error.value = 'Network error while updating commitment';
  } finally {
    formSubmitting.value = false;
  }
};

const deleteCommitment = async (id: string) => {
  if (!confirm('Are you sure you want to delete this commitment?')) return;

  try {
    const response = await fetch(`/api/commitments?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (response.ok) {
      successMessage.value = 'Commitment deleted successfully';
      await fetchCommitments();
    } else {
      const errorData = await response.json();
      error.value = errorData.error || 'Failed to delete commitment';
    }
  } catch (err) {
    error.value = 'Network error while deleting commitment';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const handleMobileNavChange = () => {
  if (mobileNavSelection.value) {
    router.push(mobileNavSelection.value);
  }
};

// Clear messages after 5 seconds
watch([successMessage, error], () => {
  if (successMessage.value || error.value) {
    setTimeout(() => {
      successMessage.value = '';
      error.value = '';
    }, 5000);
  }
});
</script>