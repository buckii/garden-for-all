<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 font-poppins">Create New Order</h1>
        <p class="text-gray-600 mt-2">Pack and prepare an order for delivery to a food pantry</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <div v-if="success" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">{{ success }}</p>
          </div>
        </div>
      </div>

      <!-- Mobile Cart Button -->
      <div class="lg:hidden fixed bottom-4 right-4 z-50">
        <button @click="showMobileCart = !showMobileCart" 
          class="bg-gray-900 text-white rounded-full p-4 shadow-lg hover:bg-gray-800 transition-colors relative">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9m-9-6h9m0 0v6a1 1 0 01-1 1H8a1 1 0 01-1-1v-6z"></path>
          </svg>
          <span v-if="form.products.length > 0" 
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {{ form.products.length }}
          </span>
        </button>
      </div>

      <!-- Mobile Cart Slide-out -->
      <div v-if="showMobileCart" 
        class="lg:hidden fixed inset-0 z-40 overflow-hidden"
        @click="showMobileCart = false">
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform" 
          @click.stop>
          <div class="p-4 border-b">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">Order Items</h3>
              <button @click="showMobileCart = false" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-auto p-4">
            <!-- Mobile Product List with editing -->
            <div v-if="form.products.length > 0" class="space-y-3 mb-6">
              <div v-for="(product, index) in form.products" :key="index"
                class="p-3 bg-gray-50 rounded-lg">
                <div class="space-y-3">
                  <!-- Product Selection -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Product</label>
                    <select v-model="product.produceTypeId" required
                      class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-garden-green-500 focus:border-garden-green-500">
                      <option value="">Select product...</option>
                      <option v-for="produceType in produceTypes" :key="produceType.id || produceType._id"
                        :value="produceType.id || produceType._id">
                        {{ produceType.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Weight and Remove -->
                  <div class="flex gap-2">
                    <div class="flex-1">
                      <label class="block text-xs font-medium text-gray-700 mb-1">Weight (lbs)</label>
                      <input type="number" v-model.number="product.weight" step="0.1" min="0" required
                        class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-garden-green-500 focus:border-garden-green-500">
                    </div>
                    <div class="flex items-end">
                      <button type="button" @click="removeProduct(index)"
                        class="px-2 py-1 text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p class="text-sm">No items in order</p>
            </div>

            <!-- Mobile Order Summary -->
            <div v-if="form.products.length > 0" class="border-t pt-4 space-y-3 mb-6">
              <div class="flex justify-between">
                <span class="text-gray-600">Total Weight:</span>
                <span class="font-semibold">{{ totalWeight.toFixed(1) }} lbs</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Product Types:</span>
                <span class="font-semibold">{{ totalProducts }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Estimated Value:</span>
                <span class="font-semibold">${{ estimatedValue.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Mobile Submit Buttons -->
            <div class="space-y-3">
              <button @click="submitOrder" :disabled="loading || form.products.length === 0"
                class="w-full px-4 py-3 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <span v-if="loading">Creating Order...</span>
                <span v-else>Create Order</span>
              </button>
              <router-link to="/dashboard"
                class="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center">
                Cancel
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="lg:flex lg:gap-8">
        <!-- Main Content -->
        <div class="lg:w-2/3">
          <form @submit.prevent="submitOrder" class="space-y-6">
        <!-- Order Details Card -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Harvest Location -->
            <div class="md:col-span-2">
              <label for="harvestLocation" class="block text-sm font-medium text-gray-700 mb-2">Harvest Location</label>
              <select id="harvestLocation" v-model="form.harvestLocationId" required
                @change="onHarvestLocationChange"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Select a harvest location...</option>
                <option v-for="location in harvestLocations" :key="location.id || location._id" :value="location.id || location._id">
                  {{ location.name }}
                </option>
              </select>
            </div>

            <!-- Pantry Selection -->
            <div>
              <label for="pantry" class="block text-sm font-medium text-gray-700 mb-2">Food Pantry</label>
              <select id="pantry" v-model="form.pantryId" required
                @change="onPantryChange"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Select a pantry...</option>
                <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
                  {{ pantry.name }}
                </option>
              </select>
            </div>

            <!-- Order Type -->
            <div>
              <label for="orderType" class="block text-sm font-medium text-gray-700 mb-2">Delivery/Pickup</label>
              <select id="orderType" v-model="form.orderType" required
                @change="onOrderTypeChange"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>

            <!-- Date -->
            <div>
              <label for="deliveryDate" class="block text-sm font-medium text-gray-700 mb-2">{{ dateLabel }}</label>
              <input type="date" id="deliveryDate" v-model="form.deliveryDate" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Time -->
            <div>
              <label for="pickupTime" class="block text-sm font-medium text-gray-700 mb-2">{{ timeLabel }}</label>
              <input type="time" id="pickupTime" v-model="form.pickupTime"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Packer Name -->
            <div>
              <label for="packerName" class="block text-sm font-medium text-gray-700 mb-2">Packer Name</label>
              <input type="text" id="packerName" v-model="form.packerName" required placeholder="Enter packer's name"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
          </div>

          <!-- Notes -->
          <div class="mt-6">
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea id="notes" v-model="form.notes" rows="3" placeholder="Additional notes or special instructions..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500 resize-none"></textarea>
          </div>
        </div>

        <!-- Weekly Commitment Section -->
        <div v-if="form.pantryId && weeklyCommitments.length > 0" class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">This Week's Commitments for {{ selectedPantryName }}</h2>
          
          <div v-if="commitmentsWithInventory.length > 0 || commitmentsWithoutInventory.length > 0" class="space-y-3">
            <!-- Commitments with inventory (original format) -->
            <div v-for="commitment in commitmentsWithInventory" :key="commitment._id" 
              class="flex items-center justify-between p-4 bg-garden-green-50 rounded-lg">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{{ commitment.produceTypeId?.name || 'Category: ' + commitment.categoryId?.name }}</h3>
                <div class="flex items-center space-x-4 mt-1">
                  <p class="text-sm text-gray-600">{{ commitment.weeklyWeightLbs }} lbs committed</p>
                  <span class="text-gray-300">•</span>
                  <p class="text-sm text-green-600">
                    {{ commitment.harvestedWeight.toFixed(1) }} lbs available in inventory
                  </p>
                </div>
                <!-- Progress bar -->
                <div class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 bg-green-500 rounded-full transition-all duration-300" 
                         :style="{ width: `${Math.min((commitment.harvestedWeight / commitment.weeklyWeightLbs) * 100, 100)}%` }">
                    </div>
                  </div>
                  <p class="text-xs text-green-600 mt-1">
                    {{ ((commitment.harvestedWeight / commitment.weeklyWeightLbs) * 100).toFixed(0) }}% of commitment available
                  </p>
                </div>
              </div>
              
              <div class="ml-4">
                <button type="button" @click="addCommitmentToOrder(commitment)"
                        class="px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
                  Add to Order
                </button>
              </div>
            </div>

            <!-- Commitments without inventory -->
            <div v-for="commitment in commitmentsWithoutInventory" :key="commitment._id" 
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{{ commitment.produceTypeId?.name || 'Category: ' + commitment.categoryId?.name }}</h3>
                <div class="flex items-center space-x-4 mt-1">
                  <p class="text-sm text-gray-600">{{ commitment.weeklyWeightLbs }} lbs committed</p>
                  <span class="text-gray-300">•</span>
                  <p class="text-sm text-amber-600">
                    {{ commitment.harvestedWeight.toFixed(1) }} lbs available in inventory
                  </p>
                </div>
                <!-- Progress bar -->
                <div class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 bg-red-500 rounded-full transition-all duration-300" 
                         :style="{ width: `${Math.min((commitment.harvestedWeight / commitment.weeklyWeightLbs) * 100, 100)}%` }">
                    </div>
                  </div>
                  <p class="text-xs text-red-600 mt-1">
                    {{ ((commitment.harvestedWeight / commitment.weeklyWeightLbs) * 100).toFixed(0) }}% of commitment fulfilled
                  </p>
                  
                  <!-- Show shortage info -->
                  <p class="text-xs text-red-500 mt-1">
                    {{ (commitment.weeklyWeightLbs - commitment.harvestedWeight).toFixed(1) }}lbs still needed
                  </p>
                </div>
              </div>
              
              <div class="ml-4">
                <div class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                  No Inventory
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p class="text-sm">All weekly commitments have been added to your order</p>
          </div>
        </div>

        <!-- Available Inventory Section -->
        <div v-if="availableInventory.length > 0" class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Available Inventory</h2>
          <p class="text-gray-600 mb-4">Items harvested but not yet allocated to orders</p>
          
          <div v-if="filteredAvailableInventory.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div v-for="item in filteredAvailableInventory" :key="item.produceType?.name" 
              class="p-3 border border-gray-200 rounded-lg hover:border-garden-green-300 transition-colors">
              <h3 class="font-medium text-gray-900">{{ item.produceType?.name }}</h3>
              <p class="text-sm text-gray-600">{{ item.totalWeight.toFixed(1) }} lbs available</p>
              <p class="text-xs text-gray-500">{{ item.entries.length }} harvest{{ item.entries.length !== 1 ? 's' : '' }}</p>
              <button type="button" @click="quickAddFromInventory(item)"
                class="mt-2 w-full px-3 py-1 text-sm bg-garden-green-600 text-white rounded hover:bg-garden-green-700 transition-colors">
                Quick Add
              </button>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p class="text-sm">All available inventory items have been added to your order</p>
          </div>
        </div>

        <!-- Add Other Product Section -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Other Products</h2>
              <p class="text-gray-600 text-sm mt-1">Add products not shown in commitments or available inventory</p>
            </div>
            <button type="button" @click="addProduct"
              class="px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
              Add Other Product
            </button>
          </div>
        </div>
          </form>
        </div>

        <!-- Cart Sidebar (Desktop) -->
        <div class="hidden lg:block lg:w-1/3">
          <div class="sticky top-6">
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <!-- Product List with editing -->
              <div v-if="form.products.length > 0" class="space-y-3 mb-6">
                <div v-for="(product, index) in form.products" :key="index"
                  class="p-3 bg-gray-50 rounded-lg">
                  <div class="space-y-3">
                    <!-- Product Selection -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Product</label>
                      <select v-model="product.produceTypeId" required
                        class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-garden-green-500 focus:border-garden-green-500">
                        <option value="">Select product...</option>
                        <option v-for="produceType in produceTypes" :key="produceType.id || produceType._id"
                          :value="produceType.id || produceType._id">
                          {{ produceType.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Weight and Remove -->
                    <div class="flex gap-2">
                      <div class="flex-1">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Weight (lbs)</label>
                        <input type="number" v-model.number="product.weight" step="0.1" min="0" required
                          class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-garden-green-500 focus:border-garden-green-500">
                      </div>
                      <div class="flex items-end">
                        <button type="button" @click="removeProduct(index)"
                          class="px-2 py-1 text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8 text-gray-500">
                <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="text-sm">No items in order</p>
              </div>

              <!-- Order Summary -->
              <div v-if="form.products.length > 0" class="border-t pt-4 space-y-3 mb-6">
                <div class="flex justify-between">
                  <span class="text-gray-600">Total Weight:</span>
                  <span class="font-semibold">{{ totalWeight.toFixed(1) }} lbs</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Product Types:</span>
                  <span class="font-semibold">{{ totalProducts }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Estimated Value:</span>
                  <span class="font-semibold">${{ estimatedValue.toFixed(2) }}</span>
                </div>
              </div>

              <!-- Submit Buttons -->
              <div class="space-y-3">
                <button @click="submitOrder" :disabled="loading || form.products.length === 0"
                  class="w-full px-4 py-3 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <span v-if="loading">Creating Order...</span>
                  <span v-else>Create Order</span>
                </button>
                <router-link to="/dashboard"
                  class="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  Cancel
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Confirmation Modal -->
    <div v-if="showConfirmationModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeConfirmationModal"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="text-center">
            <!-- Success Icon -->
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <!-- Title -->
            <h3 class="text-lg font-medium text-gray-900 mb-2">Order Created Successfully!</h3>
            
            <!-- Order Summary -->
            <div v-if="createdOrder" class="text-left bg-gray-50 rounded-lg p-4 mb-4">
              <h4 class="font-medium text-gray-900 mb-2">Order Summary:</h4>
              <div class="space-y-1 text-sm text-gray-600">
                <p><span class="font-medium">Pantry:</span> {{ createdOrder.pantryId?.name }}</p>
                <p><span class="font-medium">Delivery Date:</span> {{ formatDate(createdOrder.deliveryDate) }}</p>
                <p><span class="font-medium">Packer:</span> {{ createdOrder.packerName }}</p>
                <p><span class="font-medium">Total Weight:</span> {{ createdOrder.totalWeight?.toFixed(1) }} lbs</p>
                <p><span class="font-medium">Total Value:</span> ${{ createdOrder.totalValue?.toFixed(2) }}</p>
                <p><span class="font-medium">Items:</span> {{ createdOrder.products?.length }} product types</p>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex space-x-3">
              <button @click="closeConfirmationModal"
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
              <button @click="createAnotherOrder"
                class="flex-1 px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
                Create Another Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Form data
const form = ref({
  harvestLocationId: '',
  pantryId: '',
  deliveryDate: '',
  pickupTime: '',
  packerName: '',
  orderType: 'delivery',
  notes: '',
  products: [] as Array<{
    produceTypeId: string
    weight: number
  }>
})

// Data
const pantries = ref<any[]>([])
const produceTypes = ref<any[]>([])
const harvestLocations = ref<any[]>([])
const weeklyHarvests = ref<any[]>([])
const weeklyCommitments = ref<any[]>([])
const availableInventory = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const showMobileCart = ref(false)
const showConfirmationModal = ref(false)
const createdOrder = ref<any>(null)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Computed properties
const dateLabel = computed(() => {
  return form.value.orderType === 'delivery' ? 'Delivery Date' : 'Pickup Date'
})

const timeLabel = computed(() => {
  return form.value.orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time'
})

const selectedPantryName = computed(() => {
  const pantry = pantries.value.find(p => (p.id || p._id) === form.value.pantryId)
  return pantry?.name || ''
})

const selectedHarvestLocationName = computed(() => {
  const location = harvestLocations.value.find(l => (l.id || l._id) === form.value.harvestLocationId)
  return location?.name || ''
})

const totalWeight = computed(() => {
  return form.value.products.reduce((sum, product) => sum + (product.weight || 0), 0)
})

const totalProducts = computed(() => {
  return form.value.products.length
})

const estimatedValue = computed(() => {
  return form.value.products.reduce((sum, product) => {
    const produceType = produceTypes.value.find(pt => (pt.id || pt._id) === product.produceTypeId)
    const pricePerLb = produceType?.pricePerLb || 0
    return sum + (product.weight * pricePerLb)
  }, 0)
})

// Get produce type IDs that are already in the cart
const cartProduceTypeIds = computed(() => {
  return form.value.products.map(product => product.produceTypeId).filter(Boolean)
})

// Get produce type names that are already in the cart for filtering inventory
const cartProduceTypeNames = computed(() => {
  return form.value.products.map(product => {
    const produceType = produceTypes.value.find(pt => (pt.id || pt._id) === product.produceTypeId)
    return produceType?.name
  }).filter(Boolean)
})

// Separate commitments with and without inventory, filtered by cart contents
const commitmentsWithInventory = computed(() => {
  return weeklyCommitments.value.filter(commitment => {
    const produceTypeId = commitment.produceTypeId?._id || commitment.produceTypeId?.id
    return commitment.harvestedWeight > 0 && !cartProduceTypeIds.value.includes(produceTypeId)
  })
})

const commitmentsWithoutInventory = computed(() => {
  return weeklyCommitments.value.filter(commitment => {
    const produceTypeId = commitment.produceTypeId?._id || commitment.produceTypeId?.id
    return commitment.harvestedWeight <= 0 && !cartProduceTypeIds.value.includes(produceTypeId)
  })
})

// Filter available inventory to exclude items already in cart
const filteredAvailableInventory = computed(() => {
  return availableInventory.value.filter(item => {
    const itemName = item.produceType?.name || item.produceType
    return !cartProduceTypeNames.value.includes(itemName)
  })
})

// Helper function to get product name
const getProductName = (produceTypeId: string) => {
  const produceType = produceTypes.value.find(pt => (pt.id || pt._id) === produceTypeId)
  return produceType?.name || 'Unknown Product'
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Modal functions
const closeConfirmationModal = () => {
  showConfirmationModal.value = false
  createdOrder.value = null
  // Reload the page to reset the form
  window.location.reload()
}

const createAnotherOrder = () => {
  showConfirmationModal.value = false
  createdOrder.value = null
  
  // Reset form
  form.value = {
    harvestLocationId: '',
    pantryId: '',
    deliveryDate: '',
    pickupTime: '',
    packerName: '',
    orderType: 'delivery',
    notes: '',
    products: []
  }
  
  // Clear dependent data
  weeklyCommitments.value = []
  availableInventory.value = []
  
  // Set default date
  setDefaultDate()
}

// Methods
const addProduct = () => {
  form.value.products.push({
    produceTypeId: '',
    weight: 0
  })
}

const removeProduct = (index: number) => {
  form.value.products.splice(index, 1)
}

const quickAddProduct = (harvest: any) => {
  const existingIndex = form.value.products.findIndex(p => p.produceTypeId === (harvest.produceType?.id || harvest.produceType?._id))

  if (existingIndex >= 0) {
    // Update existing product
    form.value.products[existingIndex].weight += 1
  } else {
    // Add new product
    form.value.products.push({
      produceTypeId: harvest.produceType?.id || harvest.produceType?._id,
      weight: 1
    })
  }
}

const quickAddFromInventory = (item: any) => {
  // Need to find the actual produceTypeId from the available produceTypes
  // The item structure is item.produceType.name, not item.produceType
  const itemName = item.produceType?.name || item.produceType
  const produceType = produceTypes.value.find(pt => pt.name === itemName)
  const produceTypeId = produceType?.id || produceType?._id
  
  if (!produceTypeId) {
    console.error('Could not find produce type for:', itemName)
    return
  }

  const existingIndex = form.value.products.findIndex(p => p.produceTypeId === produceTypeId)

  if (existingIndex >= 0) {
    // Update existing product by adding the available weight
    form.value.products[existingIndex].weight += item.totalWeight
  } else {
    // Add new product with the total available weight
    form.value.products.push({
      produceTypeId: produceTypeId,
      weight: item.totalWeight
    })
  }
}

const addCommitmentToOrder = (commitment: any) => {
  const produceTypeId = commitment.produceTypeId?._id || commitment.produceTypeId?.id
  if (!produceTypeId) return

  // Use minimum of available inventory and committed amount
  const availableWeight = commitment.harvestedWeight || 0
  const committedWeight = commitment.weeklyWeightLbs || 0
  const weightToAdd = Math.min(availableWeight, committedWeight)

  const existingIndex = form.value.products.findIndex(p => p.produceTypeId === produceTypeId)

  if (existingIndex >= 0) {
    // Update existing product with minimum available/committed weight
    form.value.products[existingIndex].weight = weightToAdd
  } else {
    // Add new product with minimum available/committed weight
    form.value.products.push({
      produceTypeId: produceTypeId,
      weight: weightToAdd
    })
  }
}


// Change handlers
const onHarvestLocationChange = () => {
  if (form.value.harvestLocationId) {
    fetchAvailableInventory()
  } else {
    availableInventory.value = []
  }
}

const onPantryChange = () => {
  if (form.value.pantryId) {
    fetchWeeklyCommitments()
  } else {
    weeklyCommitments.value = []
  }
}

const onOrderTypeChange = () => {
  // Labels will update automatically via computed properties
}

const fetchPantries = async () => {
  try {
    const response = await fetch(`${API_BASE}/admin-food-pantries`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    pantries.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch pantries:', err)
  }
}

const fetchProduceTypes = async () => {
  try {
    const response = await fetch(`${API_BASE}/produce-types-list`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    produceTypes.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch produce types:', err)
  }
}

const fetchHarvestLocations = async () => {
  try {
    const response = await fetch(`${API_BASE}/harvest-locations`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    harvestLocations.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch harvest locations:', err)
  }
}

const fetchWeeklyCommitments = async () => {
  if (!form.value.pantryId) {
    weeklyCommitments.value = []
    return
  }

  try {
    // Get current Monday
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const mondayStr = monday.toISOString().split('T')[0]

    // Fetch both commitments and available inventory
    const [commitmentsResponse, inventoryResponse] = await Promise.all([
      fetch(`${API_BASE}/commitments?pantryId=${form.value.pantryId}&startDate=${mondayStr}&endDate=${mondayStr}`, {
        headers: getAuthHeader()
      }),
      fetch(`${API_BASE}/available-inventory?days=14`, {
        headers: getAuthHeader()
      })
    ])

    const commitmentsResult = await commitmentsResponse.json()
    const inventoryResult = await inventoryResponse.json()
    
    const commitments = commitmentsResult.data || []
    const inventoryItems = inventoryResult.data?.items || []

    // Create a map of available inventory by produce type name
    const availableInventoryMap = new Map()
    inventoryItems.forEach(item => {
      const produceTypeName = item.produceType
      availableInventoryMap.set(produceTypeName, item.totalWeight)
    })

    // Enhance commitments with available inventory data
    weeklyCommitments.value = commitments.map(commitment => {
      const produceTypeName = commitment.produceTypeId?.name || commitment.categoryId?.name
      const availableWeight = availableInventoryMap.get(produceTypeName) || 0
      
      return {
        ...commitment,
        harvestedWeight: availableWeight // Rename this to be more accurate: availableWeight
      }
    })

    // Also populate availableInventory for the non-commitment inventory section
    // Transform inventory data to match expected format
    const grouped = new Map()
    
    inventoryItems.forEach((item: any) => {
      const key = item.produceType
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          produceType: {
            name: item.produceType,
            unitType: 'pounds',
            conversionFactor: 1
          },
          totalWeight: 0,
          entries: [],
          daysOld: item.daysOld
        })
      }
      
      const group = grouped.get(key)
      group.totalWeight += item.totalWeight
      
      // Add entry details for each pantry
      item.pantries.forEach((pantry: any) => {
        group.entries.push({
          harvestDate: item.harvestDate,
          weight: pantry.weight,
          pantryName: pantry.name,
          daysOld: item.daysOld
        })
      })
    })
    
    // Convert to array and sort by available weight
    availableInventory.value = Array.from(grouped.values())
      .filter(item => item.totalWeight > 0.1) // Only show meaningful amounts
      .sort((a, b) => b.totalWeight - a.totalWeight)

  } catch (err) {
    console.error('Failed to fetch weekly commitments:', err)
    weeklyCommitments.value = []
    availableInventory.value = []
  }
}

const fetchAvailableInventory = async () => {
  try {
    // Fetch available inventory using the dedicated endpoint
    const params = new URLSearchParams({
      days: '14' // Get inventory for last 14 days
    })
    
    const response = await fetch(`${API_BASE}/available-inventory?${params}`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        availableInventory.value = []
        return
      }
      throw new Error('Failed to fetch available inventory')
    }
    
    const result = await response.json()
    const inventoryItems = result.data?.items || []
    
    // Transform inventory data to match expected format for the order form
    const grouped = new Map()
    
    inventoryItems.forEach((item: any) => {
      const key = item.produceType
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          produceType: {
            name: item.produceType,
            unitType: 'pounds',
            conversionFactor: 1
          },
          totalWeight: 0,
          entries: [],
          daysOld: item.daysOld
        })
      }
      
      const group = grouped.get(key)
      group.totalWeight += item.totalWeight
      
      // Add entry details for each pantry
      item.pantries.forEach((pantry: any) => {
        group.entries.push({
          harvestDate: item.harvestDate,
          weight: pantry.weight,
          pantryName: pantry.name,
          daysOld: item.daysOld
        })
      })
    })
    
    // Convert to array and sort by available weight
    availableInventory.value = Array.from(grouped.values())
      .filter(item => item.totalWeight > 0.1) // Only show meaningful amounts
      .sort((a, b) => b.totalWeight - a.totalWeight)

  } catch (err) {
    console.error('Failed to fetch available inventory:', err)
    availableInventory.value = []
  }
}

const fetchWeeklyHarvests = async () => {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const response = await fetch(`${API_BASE}/harvest-list?limit=1000`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    const entries = result.data?.entries || result.data || []

    // Filter to this week and group by produce type
    const thisWeekEntries = entries.filter((entry: any) => {
      const harvestDate = new Date(entry.harvestDate || entry.harvest_date)
      return harvestDate >= oneWeekAgo
    })

    const grouped = new Map()
    thisWeekEntries.forEach((entry: any) => {
      const produceTypeId = entry.produceTypeId || entry.produce_type_id
      const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))

      if (!grouped.has(produceTypeId)) {
        grouped.set(produceTypeId, {
          produceType: entry.produceType,
          totalWeight: 0,
          entries: []
        })
      }

      const group = grouped.get(produceTypeId)
      group.totalWeight += weight
      group.entries.push(entry)
    })

    weeklyHarvests.value = Array.from(grouped.values())
      .filter(harvest => harvest.totalWeight > 0)
      .sort((a, b) => b.totalWeight - a.totalWeight)
  } catch (err) {
    console.error('Failed to fetch weekly harvests:', err)
  }
}

const submitOrder = async () => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    const orderData = {
      harvestLocationId: form.value.harvestLocationId,
      pantryId: form.value.pantryId,
      deliveryDate: form.value.deliveryDate,
      pickupTime: form.value.pickupTime,
      packerName: form.value.packerName,
      orderType: form.value.orderType,
      notes: form.value.notes,
      products: form.value.products.filter(p => p.produceTypeId && p.weight > 0),
      status: 'ready',
      createdAt: new Date().toISOString()
    }

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      throw new Error('Failed to create order')
    }

    const result = await response.json()
    createdOrder.value = result.data
    showConfirmationModal.value = true

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create order'
  } finally {
    loading.value = false
  }
}

// Set default delivery date to tomorrow
const setDefaultDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.value.deliveryDate = tomorrow.toISOString().split('T')[0]
}

onMounted(async () => {
  setDefaultDate()
  await Promise.all([
    fetchPantries(),
    fetchProduceTypes(),
    fetchHarvestLocations(),
    fetchWeeklyHarvests()
  ])
})
</script>