package com.cicada.posbilling.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.cicada.posbilling.data.local.PosDatabase
import com.cicada.posbilling.data.model.BillEntity
import com.cicada.posbilling.data.model.CartItem
import com.cicada.posbilling.data.model.CustomerEntity
import com.cicada.posbilling.data.model.ProductEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

data class ShopSettings(
    val shopName: String = "Green Valley Kirana & General Store",
    val shopPhone: String = "+91 98765 43210",
    val currencySymbol: String = "₹",
    val darkTheme: Boolean = false
)

class PosViewModel(application: Application) : AndroidViewModel(application) {
    private val db = PosDatabase.getDatabase(application)
    private val productDao = db.productDao()
    private val customerDao = db.customerDao()
    private val billDao = db.billDao()

    val products: StateFlow<List<ProductEntity>> = productDao.getAllProducts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val customers: StateFlow<List<CustomerEntity>> = customerDao.getAllCustomers()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val bills: StateFlow<List<BillEntity>> = billDao.getAllBills()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _cart = MutableStateFlow<List<CartItem>>(emptyList())
    val cart: StateFlow<List<CartItem>> = _cart.asStateFlow()

    private val _settings = MutableStateFlow(ShopSettings())
    val settings: StateFlow<ShopSettings> = _settings.asStateFlow()

    fun toggleTheme() {
        _settings.value = _settings.value.copy(darkTheme = !_settings.value.darkTheme)
    }

    fun updateSettings(name: String, phone: String, currency: String) {
        _settings.value = _settings.value.copy(shopName = name, shopPhone = phone, currencySymbol = currency)
    }

    fun addToCart(product: ProductEntity, qty: Int = 1) {
        val current = _cart.value.toMutableList()
        val index = current.indexOfFirst { it.product.id == product.id }
        if (index >= 0) {
            val existing = current[index]
            current[index] = existing.copy(qty = existing.qty + qty)
        } else {
            current.add(CartItem(product, qty))
        }
        _cart.value = current
    }

    fun updateCartQty(productId: String, newQty: Int) {
        if (newQty <= 0) {
            removeFromCart(productId)
            return
        }
        _cart.value = _cart.value.map {
            if (it.product.id == productId) it.copy(qty = newQty) else it
        }
    }

    fun removeFromCart(productId: String) {
        _cart.value = _cart.value.filter { it.product.id != productId }
    }

    fun clearCart() {
        _cart.value = emptyList()
    }

    fun addProduct(name: String, barcode: String?, sellPrice: Double, costPrice: Double, stock: Int, threshold: Int = 5) {
        viewModelScope.launch {
            val product = ProductEntity(
                id = UUID.randomUUID().toString(),
                name = name,
                barcode = barcode?.takeIf { it.isNotBlank() },
                sellingPrice = sellPrice,
                costPrice = costPrice,
                stock = stock,
                lowStockThreshold = threshold
            )
            productDao.insertProduct(product)
        }
    }

    fun deleteProduct(product: ProductEntity) {
        viewModelScope.launch {
            productDao.deleteProduct(product)
        }
    }

    fun addCustomer(name: String, phone: String) {
        viewModelScope.launch {
            val customer = CustomerEntity(
                id = UUID.randomUUID().toString(),
                name = name,
                phone = phone
            )
            customerDao.insertCustomer(customer)
        }
    }

    fun deleteCustomer(customer: CustomerEntity) {
        viewModelScope.launch {
            customerDao.deleteCustomer(customer)
        }
    }

    fun onBarcodeScanned(code: String, onFound: (ProductEntity) -> Unit, onNotFound: (String) -> Unit) {
        viewModelScope.launch {
            val product = productDao.getProductByBarcode(code.trim())
            if (product != null) {
                addToCart(product, 1)
                onFound(product)
            } else {
                onNotFound(code.trim())
            }
        }
    }

    fun checkout(customerId: String?, customerName: String?, paymentMode: String, onComplete: (BillEntity) -> Unit) {
        val currentCart = _cart.value
        if (currentCart.isEmpty()) return

        val total = currentCart.sumOf { it.subtotal }
        val dateTag = SimpleDateFormat("yyMMdd-HHmm", Locale.getDefault()).format(Date())
        val billNum = "INV-$dateTag"
        val summary = currentCart.joinToString(", ") { "${it.product.name} x${it.qty}" }

        val bill = BillEntity(
            id = UUID.randomUUID().toString(),
            billNumber = billNum,
            customerId = customerId,
            customerName = customerName ?: "Walk-in Customer",
            totalAmount = total,
            paymentMode = paymentMode,
            itemsSummary = summary
        )

        viewModelScope.launch {
            billDao.insertBill(bill)
            currentCart.forEach { item ->
                productDao.deductStock(item.product.id, item.qty)
            }
            clearCart()
            onComplete(bill)
        }
    }
}
